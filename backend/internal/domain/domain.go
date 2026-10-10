// Package domain holds the core backend types shared across layers.
package domain

import "github.com/google/uuid"

// Role is an account role allowed by the API contract.
type Role string

// Contract roles.
const (
	RoleWorker  Role = "worker"
	RoleCompany Role = "company"
	RoleAdmin   Role = "admin"
)

// Valid reports whether the role is one of the contract roles.
func (r Role) Valid() bool {
	switch r {
	case RoleWorker, RoleCompany, RoleAdmin:
		return true
	default:
		return false
	}
}

// User is a stored account. PasswordHash is always a hash, never the plaintext
// password.
type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         Role
}

// Error is the contract error envelope shape {code, message, details?}.
type Error struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

// NewID returns a new random v4 UUID string, used as the userId for accounts.
func NewID() string {
	return uuid.NewString()
}
