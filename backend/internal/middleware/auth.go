package middleware

import (
	"net/http"
	"strings"

	"github.com/ardiputra/laundry-pos/internal/domain"
	jwtpkg "github.com/ardiputra/laundry-pos/internal/pkg/jwt"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

func GetClaims(c *gin.Context) *jwtpkg.Claims {
	if v, ok := c.Get("claims"); ok {
		return v.(*jwtpkg.Claims)
	}
	return nil
}

func AuthRequired(jwtManager *jwtpkg.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "authorization header required")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(c, http.StatusUnauthorized, "invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := jwtManager.ValidateToken(parts[1])
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set("claims", claims)
		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextTenantID, claims.TenantID)
		c.Set(ContextCompanyID, claims.CompanyID)
		c.Set(ContextUserRole, claims.Role)
		c.Set(ContextUserEmail, claims.Email)

		c.Next()
	}
}

func RequireRole(roles ...domain.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := GetUserRole(c)
		for _, role := range roles {
			if domain.UserRole(userRole) == role {
				c.Next()
				return
			}
		}
		response.Error(c, http.StatusForbidden, "insufficient permissions")
		c.Abort()
	}
}

func RequireTenant() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := GetTenantID(c)
		if tenantID == "" {
			response.Error(c, http.StatusBadRequest, "tenant id is required")
			c.Abort()
			return
		}
		c.Next()
	}
}
