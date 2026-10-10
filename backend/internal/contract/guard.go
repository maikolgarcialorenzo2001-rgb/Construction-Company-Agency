// Package contract loads contracts/openapi.yaml and validates HTTP requests and
// responses against it. It is the guard behind the api-conformance tests; the
// contract is read-only and is never copied or embedded (design D3).
package contract

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers"
	"github.com/getkin/kin-openapi/routers/gorillamux"
)

// fileName is the contract file name under contracts/ at the repository root.
const fileName = "openapi.yaml"

// maxWalkUp bounds the directory walk used to resolve the default contract path.
const maxWalkUp = 8

// ResolvePath returns the contract path. A non-empty CONTRACT_PATH wins;
// otherwise the repository contracts/openapi.yaml is located by walking up to
// maxWalkUp levels from this source file (design D3).
func ResolvePath() (string, error) {
	if override := os.Getenv("CONTRACT_PATH"); override != "" {
		return override, nil
	}

	_, source, _, ok := runtime.Caller(0)
	if !ok {
		return "", errors.New("contract: cannot determine the source directory")
	}

	dir := filepath.Dir(source)
	for i := 0; i < maxWalkUp; i++ {
		candidate := filepath.Join(dir, "contracts", fileName)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", fmt.Errorf("contract: could not locate contracts/%s walking up from %s", fileName, filepath.Dir(source))
}

// Guard validates HTTP traffic against a loaded OpenAPI document.
type Guard struct {
	doc    *openapi3.T
	router routers.Router
}

// Load reads and validates the OpenAPI document at path and builds the route
// matcher used to resolve incoming requests.
func Load(path string) (*Guard, error) {
	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = false

	doc, err := loader.LoadFromFile(path)
	if err != nil {
		return nil, fmt.Errorf("contract: load %s: %w", path, err)
	}
	if err := doc.Validate(loader.Context); err != nil {
		return nil, fmt.Errorf("contract: validate %s: %w", path, err)
	}

	// The contract declares a production server URL, but tests drive the router
	// in-process with path-only requests. Clearing the in-memory servers makes
	// gorillamux match any host and scheme; schema and status validation are
	// unaffected and the contract file is never modified.
	doc.Servers = nil

	router, err := gorillamux.NewRouter(doc)
	if err != nil {
		return nil, fmt.Errorf("contract: build router: %w", err)
	}

	return &Guard{doc: doc, router: router}, nil
}

// Validate checks the request (with its buffered body) and the response against
// the contract and returns the first violation. Authentication is not enforced:
// the goal is schema and status conformance.
func (g *Guard) Validate(req *http.Request, body []byte, resp *http.Response) error {
	route, pathParams, err := g.router.FindRoute(req)
	if err != nil {
		return fmt.Errorf("contract: no route for %s %s: %w", req.Method, req.URL.Path, err)
	}

	opts := &openapi3filter.Options{
		AuthenticationFunc: openapi3filter.NoopAuthenticationFunc,
	}

	reqInput := &openapi3filter.RequestValidationInput{
		Request:    req,
		PathParams: pathParams,
		Route:      route,
		Options:    opts,
	}
	if body != nil {
		// Gin consumes the request body while binding; replay the buffered copy.
		reqInput.Request.Body = io.NopCloser(bytes.NewReader(body))
		reqInput.Request.ContentLength = int64(len(body))
	}
	if err := openapi3filter.ValidateRequest(context.Background(), reqInput); err != nil {
		return fmt.Errorf("contract: request invalid: %w", err)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("contract: read response body: %w", err)
	}
	if err := resp.Body.Close(); err != nil {
		return fmt.Errorf("contract: close response body: %w", err)
	}

	respInput := (&openapi3filter.ResponseValidationInput{
		RequestValidationInput: reqInput,
		Status:                 resp.StatusCode,
		Header:                 resp.Header,
		Options:                opts,
	}).SetBodyBytes(respBody)

	if err := openapi3filter.ValidateResponse(context.Background(), respInput); err != nil {
		return fmt.Errorf("contract: response invalid: %w", err)
	}
	return nil
}

// ValidateHTTP is the test-facing wrapper that fails the test on a violation.
func (g *Guard) ValidateHTTP(t testing.TB, req *http.Request, body []byte, resp *http.Response) {
	t.Helper()
	if err := g.Validate(req, body, resp); err != nil {
		t.Fatalf("contract violation: %v", err)
	}
}
