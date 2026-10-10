package contract_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"cca/backend/internal/contract"
)

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

// TestGuard_LoadsAndValidatesContract is the OpenAPI 3.1 spike (design D8): the
// real contracts/openapi.yaml must load and pass document validation.
func TestGuard_LoadsAndValidatesContract(t *testing.T) {
	g := loadGuard(t)
	if g == nil {
		t.Fatal("Load() returned a nil guard")
	}
}

func TestGuard_RejectsMutatedResponse(t *testing.T) {
	g := loadGuard(t)

	// A getMe response missing the required `email` field violates the contract.
	badResp := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(strings.NewReader(`{"userId":"u1","role":"worker"}`)),
	}
	if err := g.Validate(meRequest(), nil, badResp); err == nil {
		t.Fatal("Validate() accepted a response missing the required email field")
	}

	// The same guard accepts a conforming body, so the rejection above is about
	// the schema, not a blanket failure.
	goodResp := &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(strings.NewReader(`{"userId":"u1","email":"ana@demo.test","role":"worker"}`)),
	}
	if err := g.Validate(meRequest(), nil, goodResp); err != nil {
		t.Fatalf("Validate() rejected a conforming response: %v", err)
	}
}

func meRequest() *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer ignored")
	return req
}

func TestResolvePath_EnvOverrideWins(t *testing.T) {
	override := filepath.Join(t.TempDir(), "openapi.yaml")
	if err := os.WriteFile(override, []byte("openapi: 3.1.0\n"), 0o600); err != nil {
		t.Fatalf("write override: %v", err)
	}
	t.Setenv("CONTRACT_PATH", override)

	got, err := contract.ResolvePath()
	if err != nil {
		t.Fatalf("ResolvePath() error = %v", err)
	}
	if got != override {
		t.Errorf("ResolvePath() = %q, want the override %q", got, override)
	}
}

func TestResolvePath_DefaultsToRepoContract(t *testing.T) {
	t.Setenv("CONTRACT_PATH", "")

	got, err := contract.ResolvePath()
	if err != nil {
		t.Fatalf("ResolvePath() error = %v", err)
	}
	if filepath.Base(filepath.Dir(got)) != "contracts" || filepath.Base(got) != "openapi.yaml" {
		t.Errorf("ResolvePath() = %q, want a path under contracts/openapi.yaml", got)
	}
	if _, err := os.Stat(got); err != nil {
		t.Errorf("ResolvePath() = %q is not readable: %v", got, err)
	}
}
