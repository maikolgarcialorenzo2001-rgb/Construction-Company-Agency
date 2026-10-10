package httpapi_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"cca/backend/internal/contract"
)

// loadGuard resolves and loads the real contracts/openapi.yaml.
func loadGuard(t *testing.T) *contract.Guard {
	t.Helper()

	path, err := contract.ResolvePath()
	if err != nil {
		t.Fatalf("ResolvePath() error = %v", err)
	}
	g, err := contract.Load(path)
	if err != nil {
		t.Fatalf("Load(%q) error = %v", path, err)
	}
	return g
}

// serveValidate fires a request at the router and validates both the request
// and the response against the contract.
func serveValidate(t *testing.T, g *contract.Guard, r http.Handler, method, path, body, bearer string) *httptest.ResponseRecorder {
	t.Helper()

	var raw []byte
	var reader io.Reader
	if body != "" {
		raw = []byte(body)
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

	g.ValidateHTTP(t, req, raw, rec.Result())
	return rec
}

func TestAuthContract_Register(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)

	rec := serveValidate(t, g, r, http.MethodPost, "/auth/register",
		`{"email":"ana@demo.test","password":"s3cret","role":"worker"}`, "")
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAuthContract_RegisterRoleNotAllowed(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)

	rec := serveValidate(t, g, r, http.MethodPost, "/auth/register",
		`{"email":"root@demo.test","password":"s3cret","role":"admin"}`, "")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAuthContract_RegisterDuplicateEmail(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)
	payload := `{"email":"ana@demo.test","password":"s3cret","role":"worker"}`

	if rec := serveValidate(t, g, r, http.MethodPost, "/auth/register", payload, ""); rec.Code != http.StatusCreated {
		t.Fatalf("first register status = %d, want 201 (body=%s)", rec.Code, rec.Body.String())
	}

	rec := serveValidate(t, g, r, http.MethodPost, "/auth/register", payload, "")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("second register status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAuthContract_Login(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)
	registerWorker(t, r, "ana@demo.test")

	rec := serveValidate(t, g, r, http.MethodPost, "/auth/login",
		`{"email":"ana@demo.test","password":"s3cret"}`, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAuthContract_LoginInvalidCredentials(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)
	registerWorker(t, r, "ana@demo.test")

	rec := serveValidate(t, g, r, http.MethodPost, "/auth/login",
		`{"email":"ana@demo.test","password":"wrong"}`, "")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAuthContract_Me(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)
	token := registerWorker(t, r, "ana@demo.test")

	rec := serveValidate(t, g, r, http.MethodGet, "/auth/me", "", token)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestAuthContract_MeNotAuthenticated(t *testing.T) {
	r := newAuthRouter()
	g := loadGuard(t)

	rec := serveValidate(t, g, r, http.MethodGet, "/auth/me", "", "")
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
}
