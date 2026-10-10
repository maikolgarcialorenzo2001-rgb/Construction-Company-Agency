package httpapi_test

import (
	"net/http"
	"testing"
)

func TestLogin_200(t *testing.T) {
	r := newAuthRouter()
	registerWorker(t, r, "ana@demo.test")

	rec := doJSON(r, http.MethodPost, "/auth/login", `{"email":"ana@demo.test","password":"s3cret"}`, "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%s)", rec.Code, rec.Body.String())
	}
	body := decode(t, rec)
	if len(body) != 2 {
		t.Errorf("response has %d fields %v, want exactly token and role", len(body), body)
	}
	if s, _ := body["token"].(string); s == "" {
		t.Errorf("token = %v, want a non-empty token", body["token"])
	}
	if body["role"] != "worker" {
		t.Errorf("role = %v, want worker", body["role"])
	}
}

func TestLogin_WrongPassword401(t *testing.T) {
	r := newAuthRouter()
	registerWorker(t, r, "ana@demo.test")

	rec := doJSON(r, http.MethodPost, "/auth/login", `{"email":"ana@demo.test","password":"wrong"}`, "")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
	body := decode(t, rec)
	if body["code"] != "invalid_credentials" {
		t.Errorf("code = %v, want invalid_credentials", body["code"])
	}
	if body["message"] != "Credenciales inválidas" {
		t.Errorf("message = %v, want the es-AR copy", body["message"])
	}
}

func TestLogin_UnknownEmail401(t *testing.T) {
	r := newAuthRouter()

	rec := doJSON(r, http.MethodPost, "/auth/login", `{"email":"nadie@demo.test","password":"whatever"}`, "")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "invalid_credentials" {
		t.Errorf("code = %v, want invalid_credentials", body["code"])
	}
}

func TestLogin_ExtraFieldsRejected400(t *testing.T) {
	r := newAuthRouter()
	registerWorker(t, r, "ana@demo.test")

	rec := doJSON(r, http.MethodPost, "/auth/login", `{"email":"ana@demo.test","password":"s3cret","admin":true}`, "")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "invalid_request" {
		t.Errorf("code = %v, want invalid_request", body["code"])
	}
}
