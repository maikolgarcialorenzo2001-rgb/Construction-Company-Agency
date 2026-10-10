// Package auth provides JWT issuance/verification and password hashing for the
// backend. Services depend on the Issuer and Hasher ports.
package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"cca/backend/internal/domain"
)

// Claims are the identity claims carried by a backend JWT.
type Claims struct {
	UserID string
	Role   domain.Role
}

// Issuer issues and verifies bearer tokens.
type Issuer interface {
	// Issue mints a signed token for the given user and role.
	Issue(userID string, role domain.Role) (string, error)
	// Verify validates a token and returns its claims.
	Verify(token string) (Claims, error)
}

// tokenClaims is the JWT payload: RegisteredClaims (sub, exp) plus role.
type tokenClaims struct {
	Role domain.Role `json:"role"`
	jwt.RegisteredClaims
}

// JWT is an HS256 issuer/verifier.
type JWT struct {
	secret []byte
	ttl    time.Duration
}

var _ Issuer = (*JWT)(nil)

// NewJWT returns an HS256 JWT service that signs with secret and mints tokens
// expiring after ttl.
func NewJWT(secret string, ttl time.Duration) *JWT {
	return &JWT{secret: []byte(secret), ttl: ttl}
}

// Issue mints a signed token carrying sub (userID), role and exp.
func (j *JWT) Issue(userID string, role domain.Role) (string, error) {
	now := time.Now()
	claims := tokenClaims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(j.secret)
	if err != nil {
		return "", fmt.Errorf("auth: sign token: %w", err)
	}
	return signed, nil
}

// Verify parses and validates a token, returning its identity claims. It
// rejects tokens with an unexpected signing method, a bad signature, or an
// expired exp.
func (j *JWT) Verify(token string) (Claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &tokenClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("auth: unexpected signing method %q", t.Header["alg"])
		}
		return j.secret, nil
	})
	if err != nil {
		return Claims{}, fmt.Errorf("auth: invalid token: %w", err)
	}

	claims, ok := parsed.Claims.(*tokenClaims)
	if !ok || !parsed.Valid {
		return Claims{}, errors.New("auth: invalid token")
	}
	if claims.Subject == "" {
		return Claims{}, errors.New("auth: token is missing a subject")
	}

	return Claims{UserID: claims.Subject, Role: claims.Role}, nil
}
