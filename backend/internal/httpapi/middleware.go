package httpapi

import (
	"strings"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/auth"
)

// Context keys under which RequireAuth stores the authenticated identity.
const (
	// CtxUserID holds the verified user id (JWT subject).
	CtxUserID = "auth.userID"
	// CtxRole holds the verified user role.
	CtxRole = "auth.role"
)

// bearerPrefix is the expected Authorization header scheme.
const bearerPrefix = "Bearer "

// RequireAuth returns middleware that requires a valid bearer JWT. It verifies
// the token before any protected handler runs and rejects a missing, malformed,
// expired, or otherwise invalid token with 401 not_authenticated. On success it
// exposes the user id and role on the Gin context.
func RequireAuth(tokens auth.Issuer) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, bearerPrefix) {
			writeNotAuthenticated(c)
			return
		}

		raw := strings.TrimSpace(strings.TrimPrefix(header, bearerPrefix))
		if raw == "" {
			writeNotAuthenticated(c)
			return
		}

		claims, err := tokens.Verify(raw)
		if err != nil {
			writeNotAuthenticated(c)
			return
		}

		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxRole, claims.Role)
		c.Next()
	}
}
