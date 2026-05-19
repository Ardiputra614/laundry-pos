package handler

import (
	"net/http"
	"strconv"

	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/pkg/response"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

type BranchHandler struct {
	branchUsecase *usecase.BranchUsecase
}

func NewBranchHandler(branchUsecase *usecase.BranchUsecase) *BranchHandler {
	return &BranchHandler{branchUsecase: branchUsecase}
}

func (h *BranchHandler) Create(c *gin.Context) {
	var req dto.CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.branchUsecase.Create(c, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.Created(c, "branch created", resp)
}

func (h *BranchHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req dto.UpdateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}

	resp, statusCode, err := h.branchUsecase.Update(c, id, req)
	if err != nil {
		response.Error(c, statusCode, err.Error())
		return
	}

	response.OK(c, "branch updated", resp)
}

func (h *BranchHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	resp, err := h.branchUsecase.GetByID(c, id)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.OK(c, "branch retrieved", resp)
}

func (h *BranchHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	branches, total, err := h.branchUsecase.ListByTenant(c, page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.Paginated(c, "branches retrieved", branches, page, limit, total)
}

func (h *BranchHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.branchUsecase.Delete(c, id); err != nil {
		response.Error(c, http.StatusNotFound, err.Error())
		return
	}

	response.OK(c, "branch deleted", nil)
}
