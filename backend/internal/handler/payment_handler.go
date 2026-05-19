package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	paymentUsecase *usecase.PaymentUsecase
}

func NewPaymentHandler(paymentUsecase *usecase.PaymentUsecase) *PaymentHandler {
	return &PaymentHandler{paymentUsecase: paymentUsecase}
}

func (h *PaymentHandler) HandleMidtransWebhook(c *gin.Context) {
	var req dto.MidtransWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	statusCode, err := h.paymentUsecase.HandleMidtransWebhook(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "webhook processed", nil)
}
