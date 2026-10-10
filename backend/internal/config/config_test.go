package config

import (
	"strings"
	"testing"
	"time"
)

func TestLoad_DefaultsPortAndTTL(t *testing.T) {
	t.Setenv("JWT_SECRET", "s3cr3t")
	t.Setenv("PORT", "")
	t.Setenv("TOKEN_TTL", "")
	t.Setenv("CONTRACT_PATH", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned error: %v", err)
	}
	if cfg.Port != 8080 {
		t.Errorf("Port = %d, want 8080", cfg.Port)
	}
	if cfg.TokenTTL != 24*time.Hour {
		t.Errorf("TokenTTL = %v, want 24h", cfg.TokenTTL)
	}
	if cfg.JWTSecret != "s3cr3t" {
		t.Errorf("JWTSecret = %q, want s3cr3t", cfg.JWTSecret)
	}
	if cfg.ContractPath != "" {
		t.Errorf("ContractPath = %q, want empty default", cfg.ContractPath)
	}
}

func TestLoad_MissingJWTSecretFails(t *testing.T) {
	t.Setenv("JWT_SECRET", "")
	t.Setenv("PORT", "8080")

	if _, err := Load(); err == nil {
		t.Fatal("Load() with empty JWT_SECRET returned nil error, want failure")
	} else if !strings.Contains(err.Error(), "JWT_SECRET") {
		t.Errorf("error = %q, want it to mention JWT_SECRET", err.Error())
	}
}

func TestLoad_RejectsInvalidPort(t *testing.T) {
	tests := []struct {
		name string
		port string
	}{
		{name: "not a number", port: "abc"},
		{name: "zero", port: "0"},
		{name: "negative", port: "-1"},
		{name: "above max", port: "70000"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("JWT_SECRET", "s3cr3t")
			t.Setenv("PORT", tt.port)

			if _, err := Load(); err == nil {
				t.Fatalf("Load() with PORT=%q returned nil error, want failure", tt.port)
			}
		})
	}
}

func TestLoad_ReadsOverrides(t *testing.T) {
	t.Setenv("JWT_SECRET", "topsecret")
	t.Setenv("PORT", "9090")
	t.Setenv("CONTRACT_PATH", "/tmp/custom-openapi.yaml")
	t.Setenv("TOKEN_TTL", "2h30m")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned error: %v", err)
	}
	if cfg.Port != 9090 {
		t.Errorf("Port = %d, want 9090", cfg.Port)
	}
	if cfg.JWTSecret != "topsecret" {
		t.Errorf("JWTSecret = %q, want topsecret", cfg.JWTSecret)
	}
	if cfg.ContractPath != "/tmp/custom-openapi.yaml" {
		t.Errorf("ContractPath = %q, want the override", cfg.ContractPath)
	}
	if cfg.TokenTTL != 2*time.Hour+30*time.Minute {
		t.Errorf("TokenTTL = %v, want 2h30m", cfg.TokenTTL)
	}
}
