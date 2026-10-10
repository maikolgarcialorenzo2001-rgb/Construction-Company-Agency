package domain

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"
)

func TestRole_Valid(t *testing.T) {
	tests := []struct {
		name string
		role Role
		want bool
	}{
		{name: "worker", role: RoleWorker, want: true},
		{name: "company", role: RoleCompany, want: true},
		{name: "admin", role: RoleAdmin, want: true},
		{name: "empty", role: Role(""), want: false},
		{name: "unknown", role: Role("root"), want: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.role.Valid(); got != tt.want {
				t.Errorf("Role(%q).Valid() = %v, want %v", tt.role, got, tt.want)
			}
		})
	}
}

func TestError_JSONEnvelopeShape(t *testing.T) {
	t.Run("without details has only code and message", func(t *testing.T) {
		raw, err := json.Marshal(Error{Code: "invalid_credentials", Message: "Credenciales inválidas"})
		if err != nil {
			t.Fatalf("marshal: %v", err)
		}

		var body map[string]any
		if err := json.Unmarshal(raw, &body); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if len(body) != 2 {
			t.Fatalf("error envelope keys = %v, want exactly code+message", body)
		}
		if body["code"] != "invalid_credentials" {
			t.Errorf("code = %v, want invalid_credentials", body["code"])
		}
		if body["message"] != "Credenciales inválidas" {
			t.Errorf("message = %v, want the es-AR copy", body["message"])
		}
		if _, ok := body["details"]; ok {
			t.Errorf("details key present when Details is nil: %v", body)
		}
	})

	t.Run("with details includes the details key", func(t *testing.T) {
		raw, err := json.Marshal(Error{
			Code:    "invalid_request",
			Message: "Solicitud inválida",
			Details: map[string]any{"field": "email"},
		})
		if err != nil {
			t.Fatalf("marshal: %v", err)
		}

		var body map[string]any
		if err := json.Unmarshal(raw, &body); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		details, ok := body["details"].(map[string]any)
		if !ok {
			t.Fatalf("details = %v, want an object", body["details"])
		}
		if details["field"] != "email" {
			t.Errorf("details.field = %v, want email", details["field"])
		}
	})
}

func TestNewID_IsUniqueV4UUID(t *testing.T) {
	first := NewID()
	second := NewID()

	if first == second {
		t.Fatalf("NewID() returned a duplicate value %q", first)
	}

	parsed, err := uuid.Parse(first)
	if err != nil {
		t.Fatalf("NewID() = %q is not a valid UUID: %v", first, err)
	}
	if parsed.Version() != 4 {
		t.Errorf("NewID() version = %d, want 4", parsed.Version())
	}
}
