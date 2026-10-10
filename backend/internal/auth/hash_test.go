package auth

import (
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestBcrypt_HashIsNotPlaintext(t *testing.T) {
	h := Bcrypt{} // zero Cost must default to DefaultBcryptCost

	hash, err := h.Hash("s3cret-password")
	if err != nil {
		t.Fatalf("Hash() error = %v, want nil", err)
	}
	if hash == "s3cret-password" {
		t.Fatal("Hash() returned the plaintext password")
	}
	if strings.Contains(hash, "s3cret-password") {
		t.Fatalf("Hash() = %q contains the plaintext password", hash)
	}
	if !strings.HasPrefix(hash, "$2") {
		t.Fatalf("Hash() = %q, want a bcrypt hash", hash)
	}

	cost, err := bcrypt.Cost([]byte(hash))
	if err != nil {
		t.Fatalf("bcrypt.Cost() error = %v", err)
	}
	if cost != DefaultBcryptCost {
		t.Errorf("hash cost = %d, want %d", cost, DefaultBcryptCost)
	}
}

func TestBcrypt_Compare(t *testing.T) {
	const password = "correct horse battery staple"

	h := Bcrypt{}
	hash, err := h.Hash(password)
	if err != nil {
		t.Fatalf("Hash() error = %v, want nil", err)
	}

	tests := []struct {
		name    string
		hash    string
		attempt string
		wantErr bool
	}{
		{name: "matching password", hash: hash, attempt: password, wantErr: false},
		{name: "wrong password", hash: hash, attempt: "wrong-password", wantErr: true},
		{name: "empty attempt", hash: hash, attempt: "", wantErr: true},
		{name: "malformed hash", hash: "not-a-bcrypt-hash", attempt: password, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := h.Compare(tt.hash, tt.attempt)
			if tt.wantErr && err == nil {
				t.Fatalf("Compare() error = nil, want failure")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("Compare() error = %v, want nil", err)
			}
		})
	}
}
