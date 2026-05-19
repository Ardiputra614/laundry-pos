package handler

import (
	"net/http"
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notifUsecase *usecase.NotificationUsecase
}

func NewNotificationHandler(notifUsecase *usecase.NotificationUsecase) *NotificationHandler {
	return &NotificationHandler{notifUsecase: notifUsecase}
}

func (h *NotificationHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	notifications, total, err := h.notifUsecase.List(c, page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Paginated(c, "notifications retrieved", notifications, page, limit, total)
}

func (h *NotificationHandler) GetUnread(c *gin.Context) {
	notifications, err := h.notifUsecase.GetUnread(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "unread notifications", notifications)
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	id := c.Param("id")
	statusCode, err := h.notifUsecase.MarkAsRead(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "notification marked as read", nil)
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	if err := h.notifUsecase.MarkAllAsRead(c); err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "all notifications marked as read", nil)
}

func (h *NotificationHandler) CountUnread(c *gin.Context) {
	count, err := h.notifUsecase.CountUnread(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "unread count", gin.H{"count": count})
}
