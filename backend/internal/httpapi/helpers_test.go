package httpapi_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/auth"
	"cca/backend/internal/httpapi"
	"cca/backend/internal/service"
	"cca/backend/internal/store/memory"
)

const testSecret = "test-secret"

// newAuthRouter wires the real auth service over an in-memory store with an
// HS256 issuer and the real bcrypt hasher (cost 10).
func newAuthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	issuer := auth.NewJWT(testSecret, time.Hour)
	svc := service.NewAuth(memory.NewUserStore(), issuer, auth.Bcrypt{})
	return httpapi.NewRouter(httpapi.Deps{Auth: svc, Tokens: issuer})
}

// doJSON fires a request with an optional JSON body and optional bearer token.
func doJSON(r http.Handler, method, path, body, bearer string) *httptest.ResponseRecorder {
	var reader io.Reader
	if body != "" {
		reader = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, path, reader)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

// decode unmarshals a JSON object response body.
func decode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("response body is not a JSON object: %v (body=%s)", err, rec.Body.String())
	}
	return out
}

// registerWorker registers a worker through the router and returns its token.
func registerWorker(t *testing.T, r http.Handler, email string) string {
	t.Helper()
	payload := `{"email":"` + email + `","password":"s3cret","role":"worker"}`
	rec := doJSON(r, http.MethodPost, "/auth/register", payload, "")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register %s status = %d, want 201 (body=%s)", email, rec.Code, rec.Body.String())
	}
	token, _ := decode(t, rec)["token"].(string)
	if token == "" {
		t.Fatalf("register %s returned an empty token", email)
	}
	return token
}
