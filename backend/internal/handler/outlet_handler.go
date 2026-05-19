package handler

import (
	"net/http"
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type OutletHandler struct {
	outletUsecase *usecase.OutletUsecase
}

func NewOutletHandler(outletUsecase *usecase.OutletUsecase) *OutletHandler {
	return &OutletHandler{outletUsecase: outletUsecase}
}

func (h *OutletHandler) Create(c *gin.Context) {
	var req dto.CreateOutletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.outletUsecase.Create(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "outlet created", resp)
}

func (h *OutletHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateOutletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.outletUsecase.Update(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "outlet updated", resp)
}

func (h *OutletHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	resp, err := h.outletUsecase.GetByID(c, id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.OK(c, "outlet retrieved", resp)
}

func (h *OutletHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	outlets, total, err := h.outletUsecase.ListByTenant(c, page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Paginated(c, "outlets retrieved", outlets, page, limit, total)
}

func (h *OutletHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.outletUsecase.Delete(c, id); err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.OK(c, "outlet deleted", nil)
}
