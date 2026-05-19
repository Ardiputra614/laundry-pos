package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	ContextTenantID  = "tenant_id"
	ContextCompanyID = "company_id"
	ContextUserID    = "user_id"
	ContextUserRole  = "user_role"
	ContextUserEmail = "user_email"
)

func Tenant() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := c.GetHeader("X-Tenant-ID")
		if tenantID == "" {
			tenantID = c.Query("tenant_id")
		}
		if tenantID == "" {
			claims := GetClaims(c)
			if claims != nil {
				tenantID = claims.TenantID
			}
		}

		tenantID = strings.TrimSpace(tenantID)

		if tenantID != "" {
			if _, err := uuid.Parse(tenantID); err != nil {
				c.AbortWithStatusJSON(400, gin.H{"code": 400, "message": "invalid tenant id format"})
				return
			}
			c.Set(ContextTenantID, tenantID)
		}

		c.Next()
	}
}

func GetTenantID(c *gin.Context) string {
	if v, ok := c.Get(ContextTenantID); ok {
		return v.(string)
	}
	return ""
}

func GetUserID(c *gin.Context) string {
	if v, ok := c.Get(ContextUserID); ok {
		return v.(string)
	}
	return ""
}

func GetCompanyID(c *gin.Context) string {
	if v, ok := c.Get(ContextCompanyID); ok {
		return v.(string)
	}
	return ""
}

func GetUserRole(c *gin.Context) string {
	if v, ok := c.Get(ContextUserRole); ok {
		return v.(string)
	}
	return ""
}
