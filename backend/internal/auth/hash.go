package auth

import "golang.org/x/crypto/bcrypt"

// DefaultBcryptCost is the bcrypt cost used by the backend (design D6).
const DefaultBcryptCost = 10

// Hasher hashes and verifies passwords.
type Hasher interface {
	// Hash returns the bcrypt hash of password.
	Hash(password string) (string, error)
	// Compare reports whether password matches hash.
	Compare(hash, password string) error
}

// Bcrypt is a bcrypt-backed Hasher. A zero Cost defaults to DefaultBcryptCost.
type Bcrypt struct {
	Cost int
}

var _ Hasher = Bcrypt{}

// Hash returns the bcrypt hash of password.
func (b Bcrypt) Hash(password string) (string, error) {
	cost := b.Cost
	if cost == 0 {
		cost = DefaultBcryptCost
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

// Compare reports whether password matches hash.
func (b Bcrypt) Compare(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
