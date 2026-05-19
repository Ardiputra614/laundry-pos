package handler

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type SubscriptionHandler struct {
	subscriptionUsecase *usecase.SubscriptionUsecase
}

func NewSubscriptionHandler(subscriptionUsecase *usecase.SubscriptionUsecase) *SubscriptionHandler {
	return &SubscriptionHandler{subscriptionUsecase: subscriptionUsecase}
}

func (h *SubscriptionHandler) CreatePlan(c *gin.Context) {
	var req dto.CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.subscriptionUsecase.CreatePlan(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "plan created", resp)
}

func (h *SubscriptionHandler) UpdatePlan(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.subscriptionUsecase.UpdatePlan(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "plan updated", resp)
}

func (h *SubscriptionHandler) DeletePlan(c *gin.Context) {
	id := c.Param("id")

	statusCode, err := h.subscriptionUsecase.DeletePlan(c, id)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "plan deleted", nil)
}

func (h *SubscriptionHandler) ListPlans(c *gin.Context) {
	plans, err := h.subscriptionUsecase.ListPlans(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "plans retrieved", plans)
}

func (h *SubscriptionHandler) ListActivePlans(c *gin.Context) {
	plans, err := h.subscriptionUsecase.ListActivePlans(c)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, "active plans retrieved", plans)
}

func (h *SubscriptionHandler) GetCompanySubscription(c *gin.Context) {
	resp, statusCode, err := h.subscriptionUsecase.GetCompanySubscription(c)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "subscription retrieved", resp)
}

func (h *SubscriptionHandler) ChangePlan(c *gin.Context) {
	var req dto.ChangePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.subscriptionUsecase.ChangePlan(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "plan changed", resp)
}

func (h *SubscriptionHandler) CreatePayment(c *gin.Context) {
	var req dto.CreateSubscriptionPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.subscriptionUsecase.CreateSubscriptionPayment(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "payment created", resp)
}

func (h *SubscriptionHandler) SelectPlan(c *gin.Context) {
	var req dto.ChangePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.subscriptionUsecase.SelectPlan(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "plan selected", resp)
}

func (h *SubscriptionHandler) CancelSubscription(c *gin.Context) {
	resp, statusCode, err := h.subscriptionUsecase.CancelSubscription(c)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "subscription cancelled", resp)
}
