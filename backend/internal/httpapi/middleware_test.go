package httpapi_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"cca/backend/internal/auth"
	"cca/backend/internal/domain"
	"cca/backend/internal/httpapi"
)

// protectedRouter mounts RequireAuth in front of a probe handler that echoes
// the identity the middleware placed in the context.
func protectedRouter(tokens auth.Issuer, gotUser, gotRole *string) *gin.Engine {
	r := gin.New()
	r.GET("/protected", httpapi.RequireAuth(tokens), func(c *gin.Context) {
		*gotUser = c.GetString(httpapi.CtxUserID)
		if v, ok := c.Get(httpapi.CtxRole); ok {
			if role, ok := v.(domain.Role); ok {
				*gotRole = string(role)
			}
		}
		c.Status(http.StatusOK)
	})
	return r
}

func TestRequireAuth_MissingHeader401(t *testing.T) {
	var user, role string
	r := protectedRouter(auth.NewJWT(testSecret, time.Hour), &user, &role)

	rec := doJSON(r, http.MethodGet, "/protected", "", "")

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
	if body := decode(t, rec); body["code"] != "not_authenticated" {
		t.Errorf("code = %v, want not_authenticated", body["code"])
	}
}

func TestRequireAuth_MalformedHeader401(t *testing.T) {
	var user, role string
	r := protectedRouter(auth.NewJWT(testSecret, time.Hour), &user, &role)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Token not-a-bearer")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestRequireAuth_ExpiredToken401(t *testing.T) {
	expiredIssuer := auth.NewJWT(testSecret, -time.Hour)
	token, err := expiredIssuer.Issue("u1", domain.RoleWorker)
	if err != nil {
		t.Fatalf("Issue() error = %v, want nil", err)
	}

	var user, role string
	r := protectedRouter(auth.NewJWT(testSecret, time.Hour), &user, &role)

	rec := doJSON(r, http.MethodGet, "/protected", "", token)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401 (body=%s)", rec.Code, rec.Body.String())
	}
}

func TestRequireAuth_ValidTokenSetsContext(t *testing.T) {
	issuer := auth.NewJWT(testSecret, time.Hour)
	token, err := issuer.Issue("u1", domain.RoleWorker)
	if err != nil {
		t.Fatalf("Issue() error = %v, want nil", err)
	}

	var user, role string
	r := protectedRouter(issuer, &user, &role)

	rec := doJSON(r, http.MethodGet, "/protected", "", token)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body=%s)", rec.Code, rec.Body.String())
	}
	if user != "u1" {
		t.Errorf("context userId = %q, want u1", user)
	}
	if role != string(domain.RoleWorker) {
		t.Errorf("context role = %q, want worker", role)
	}
}
