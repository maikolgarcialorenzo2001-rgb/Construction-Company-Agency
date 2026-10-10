package service

import (
	"context"
	"errors"
	"fmt"

	"cca/backend/internal/store"
)

// Login verifies credentials and mints a bearer token.
//
// An unknown email and a wrong password are indistinguishable to the caller:
// both return ErrInvalidCredentials so the API does not leak which emails are
// registered.
func (s *Auth) Login(ctx context.Context, email, password string) (LoginResult, error) {
	user, err := s.users.ByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			return LoginResult{}, ErrInvalidCredentials
		}
		return LoginResult{}, fmt.Errorf("service: find user: %w", err)
	}

	if err := s.hasher.Compare(user.PasswordHash, password); err != nil {
		return LoginResult{}, ErrInvalidCredentials
	}

	token, err := s.tokens.Issue(user.ID, user.Role)
	if err != nil {
		return LoginResult{}, fmt.Errorf("service: issue token: %w", err)
	}

	return LoginResult{Token: token, Role: user.Role}, nil
}
