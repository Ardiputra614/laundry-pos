package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/middleware"
	ws "github.com/ardiputra/laundry-pos/internal/pkg/websocket"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

type WebSocketHandler struct {
	hub *ws.Hub
}

func NewWebSocketHandler(hub *ws.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

func (h *WebSocketHandler) ServeWS(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)

	if userID == "" {
		response.Error(c, http.StatusUnauthorized, "authentication required")
		return
	}

	ws.ServeWS(h.hub, c.Writer, c.Request, tenantID, userID)
}
