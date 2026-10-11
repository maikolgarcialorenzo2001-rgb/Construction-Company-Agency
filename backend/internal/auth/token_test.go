package auth

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"cca/backend/internal/domain"
)

func TestJWT_IssueVerifyRoundTrip(t *testing.T) {
	const ttl = time.Hour
	j := NewJWT("top-secret", ttl)

	token, err := j.Issue("user-1", domain.RoleWorker)
	if err != nil {
		t.Fatalf("Issue() error = %v, want nil", err)
	}
	if token == "" {
		t.Fatal("Issue() returned an empty token")
	}

	claims, err := j.Verify(token)
	if err != nil {
		t.Fatalf("Verify() error = %v, want nil", err)
	}
	if claims.UserID != "user-1" {
		t.Errorf("claims.UserID = %q, want user-1", claims.UserID)
	}
	if claims.Role != domain.RoleWorker {
		t.Errorf("claims.Role = %q, want worker", claims.Role)
	}

	// Decode the minted payload and assert the exp claim directly: exp must be
	// present and exp − iat must equal the configured TTL. Issue derives both
	// from a single clock read, so the difference is exact for a whole-second TTL.
	var wire jwt.MapClaims
	if _, _, err := jwt.NewParser().ParseUnverified(token, &wire); err != nil {
		t.Fatalf("ParseUnverified() error = %v, want nil", err)
	}
	exp, ok := wire["exp"].(float64)
	if !ok {
		t.Fatal(`token is missing the "exp" claim`)
	}
	iat, ok := wire["iat"].(float64)
	if !ok {
		t.Fatal(`token is missing the "iat" claim`)
	}
	if got := int64(exp - iat); got != int64(ttl.Seconds()) {
		t.Errorf("exp - iat = %ds, want the TTL %ds", got, int64(ttl.Seconds()))
	}
}

func TestJWT_RejectsExpired(t *testing.T) {
	// A negative TTL mints a token whose exp is already in the past.
	j := NewJWT("top-secret", -time.Hour)

	token, err := j.Issue("user-1", domain.RoleWorker)
	if err != nil {
		t.Fatalf("Issue() error = %v, want nil", err)
	}

	if _, err := j.Verify(token); err == nil {
		t.Fatal("Verify() of an expired token returned nil error, want failure")
	}
}

func TestJWT_RejectsWrongSecret(t *testing.T) {
	issuer := NewJWT("secret-a", time.Hour)
	token, err := issuer.Issue("user-1", domain.RoleCompany)
	if err != nil {
		t.Fatalf("Issue() error = %v, want nil", err)
	}

	verifier := NewJWT("secret-b", time.Hour)
	if _, err := verifier.Verify(token); err == nil {
		t.Fatal("Verify() under a different secret returned nil error, want failure")
	}
}

func TestJWT_RejectsTampered(t *testing.T) {
	j := NewJWT("top-secret", time.Hour)
	token, err := j.Issue("user-1", domain.RoleWorker)
	if err != nil {
		t.Fatalf("Issue() error = %v, want nil", err)
	}

	if _, err := j.Verify(tamperSignature(token)); err == nil {
		t.Fatal("Verify() of a tampered token returned nil error, want failure")
	}
}

// tamperSignature flips the first character of the signature segment, which
// always changes the decoded signature bytes.
func tamperSignature(token string) string {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return token + "x"
	}
	sig := []byte(parts[2])
	if sig[0] == 'A' {
		sig[0] = 'B'
	} else {
		sig[0] = 'A'
	}
	parts[2] = string(sig)
	return strings.Join(parts, ".")
}
