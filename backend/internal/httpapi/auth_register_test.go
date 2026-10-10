package httpapi_test

import (
	"net/http"
	"testing"
)

func TestRegister_201(t *testing.T) {
	r := newAuthRouter()

	rec := doJSON(r, http.MethodPost, "/auth/register", `{"email":"ana@demo.test","password":"s3cret","role":"worker"}`, "")

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body=%s)", rec.Code, rec.Body.String())
	}
	body := decode(t, rec)
	if len(body) != 2 {
		t.Errorf("response has %d fields %v, want exactly userId and token", len(body), body)
	}
	if s, _ := body["userId"].(string); s == "" {
		t.Errorf("userId = %v, want a non-empty string", body["userId"])
	}
	if s, _ := body["token"].(string); s == "" {
		t.Errorf("token = %v, want a non-empty token", body["token"])
	}
}

func TestRegister_AdminRejected400(t *testing.T) {
	r := newAuthRouter()

	rec := doJSON(r, http.MethodPost, "/auth/register", `{"email":"root@demo.test","password":"s3cret","role":"admin"}`, "")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
	body := decode(t, rec)
	if body["code"] != "role_not_allowed" {
		t.Errorf("code = %v, want role_not_allowed", body["code"])
	}
	if body["message"] != "Rol no permitido para el registro" {
		t.Errorf("message = %v, want the es-AR copy", body["message"])
	}
}

func TestRegister_DuplicateEmail400(t *testing.T) {
	r := newAuthRouter()
	payload := `{"email":"ana@demo.test","password":"s3cret","role":"worker"}`

	if rec := doJSON(r, http.MethodPost, "/auth/register", payload, ""); rec.Code != http.StatusCreated {
		t.Fatalf("first register status = %d, want 201 (body=%s)", rec.Code, rec.Body.String())
	}

	rec := doJSON(r, http.MethodPost, "/auth/register", payload, "")
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("second register status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "email_already_exists" {
		t.Errorf("code = %v, want email_already_exists", body["code"])
	}
}

func TestRegister_MalformedJSON400(t *testing.T) {
	r := newAuthRouter()

	rec := doJSON(r, http.MethodPost, "/auth/register", `{"email":`, "")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "invalid_request" {
		t.Errorf("code = %v, want invalid_request", body["code"])
	}
}
