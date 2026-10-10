package httpapi_test

import (
	"net/http"
	"testing"
)

func TestMe_200(t *testing.T) {
	r := newAuthRouter()
	token := registerWorker(t, r, "ana@demo.test")

	rec := doJSON(r, http.MethodGet, "/auth/me", "", token)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%s)", rec.Code, rec.Body.String())
	}
	body := decode(t, rec)
	if len(body) != 3 {
		t.Errorf("response has %d fields %v, want exactly userId, email and role", len(body), body)
	}
	if s, _ := body["userId"].(string); s == "" {
		t.Errorf("userId = %v, want a non-empty string", body["userId"])
	}
	if body["email"] != "ana@demo.test" {
		t.Errorf("email = %v, want ana@demo.test", body["email"])
	}
	if body["role"] != "worker" {
		t.Errorf("role = %v, want worker", body["role"])
	}
}

func TestMe_NoToken401(t *testing.T) {
	r := newAuthRouter()

	rec := doJSON(r, http.MethodGet, "/auth/me", "", "")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "not_authenticated" {
		t.Errorf("code = %v, want not_authenticated", body["code"])
	}
}

func TestMe_BadToken401(t *testing.T) {
	r := newAuthRouter()

	rec := doJSON(r, http.MethodGet, "/auth/me", "", "not-a-real-jwt")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "not_authenticated" {
		t.Errorf("code = %v, want not_authenticated", body["code"])
	}
}
