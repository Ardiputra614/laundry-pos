package handler

import (
	"net/http"
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderUsecase *usecase.OrderUsecase
}

func NewOrderHandler(orderUsecase *usecase.OrderUsecase) *OrderHandler {
	return &OrderHandler{orderUsecase: orderUsecase}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req dto.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.orderUsecase.CreateOrder(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "order created", resp)
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	id := c.Param("id")

	resp, statusCode, err := h.orderUsecase.GetOrder(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "order retrieved", resp)
}

func (h *OrderHandler) ListOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	filters := map[string]any{
		"status":         c.Query("status"),
		"payment_status": c.Query("payment_status"),
		"start_date":     c.Query("start_date"),
		"end_date":       c.Query("end_date"),
		"customer_id":    c.Query("customer_id"),
		"search":         c.Query("search"),
	}

	orders, total, err := h.orderUsecase.ListOrders(c, page, limit, filters)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Paginated(c, "orders retrieved", orders, page, limit, total)
}

func (h *OrderHandler) UpdateStatus(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.orderUsecase.UpdateStatus(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "order status updated", resp)
}

func (h *OrderHandler) ProcessPayment(c *gin.Context) {
	id := c.Param("id")

	var req dto.ProcessPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.orderUsecase.ProcessPayment(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "payment processed", resp)
}
