package service

import (
	"context"
	"errors"
	"fmt"

	"cca/backend/internal/domain"
	"cca/backend/internal/store"
)

// Register creates a new worker or company account and mints a bearer token.
//
// A role that cannot be self-assigned (admin, or anything outside worker and
// company) is rejected BEFORE any write. The password is hashed before storing;
// the plaintext never reaches the store. A duplicate email is reported as
// ErrEmailAlreadyExists and creates no second user.
func (s *Auth) Register(ctx context.Context, email, password string, role domain.Role) (RegisterResult, error) {
	if role != domain.RoleWorker && role != domain.RoleCompany {
		return RegisterResult{}, ErrRoleNotAllowed
	}

	hash, err := s.hasher.Hash(password)
	if err != nil {
		return RegisterResult{}, fmt.Errorf("service: hash password: %w", err)
	}

	user := domain.User{
		ID:           s.newID(),
		Email:        email,
		PasswordHash: hash,
		Role:         role,
	}

	if err := s.users.Create(ctx, user); err != nil {
		if errors.Is(err, store.ErrEmailExists) {
			return RegisterResult{}, ErrEmailAlreadyExists
		}
		return RegisterResult{}, fmt.Errorf("service: create user: %w", err)
	}

	token, err := s.tokens.Issue(user.ID, user.Role)
	if err != nil {
		return RegisterResult{}, fmt.Errorf("service: issue token: %w", err)
	}

	return RegisterResult{UserID: user.ID, Token: token}, nil
}
