package usecase

import (
	"errors"
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OutletUsecase struct {
	outletRepo domain.OutletRepository
}

func NewOutletUsecase(outletRepo domain.OutletRepository) *OutletUsecase {
	return &OutletUsecase{outletRepo: outletRepo}
}

func (uc *OutletUsecase) Create(ctx *gin.Context, req dto.CreateOutletRequest) (*dto.OutletResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	outlet := &domain.Outlet{
		ID:        uuid.New().String(),
		TenantID:  tenantID,
		CompanyID: companyID,
		BranchID:  req.BranchID,
		Name:      req.Name,
		Code:      req.Code,
		Address:   req.Address,
		Phone:     req.Phone,
		IsActive:  true,
	}

	if err := uc.outletRepo.Create(outlet); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toOutletResponse(outlet), http.StatusCreated, nil
}

func (uc *OutletUsecase) Update(ctx *gin.Context, id string, req dto.UpdateOutletRequest) (*dto.OutletResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)

	outlet, err := uc.outletRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if outlet.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	if req.Name != "" {
		outlet.Name = req.Name
	}
	if req.Code != "" {
		outlet.Code = req.Code
	}
	if req.Address != "" {
		outlet.Address = req.Address
	}
	if req.Phone != "" {
		outlet.Phone = req.Phone
	}
	if req.BranchID != "" {
		outlet.BranchID = req.BranchID
	}
	if req.IsActive != nil {
		outlet.IsActive = *req.IsActive
	}

	if err := uc.outletRepo.Update(outlet); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toOutletResponse(outlet), http.StatusOK, nil
}

func (uc *OutletUsecase) GetByID(ctx *gin.Context, id string) (*dto.OutletResponse, error) {
	tenantID := middleware.GetTenantID(ctx)

	outlet, err := uc.outletRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	if outlet.TenantID != tenantID {
		return nil, domain.ErrNotFound
	}

	return toOutletResponse(outlet), nil
}

func (uc *OutletUsecase) ListByCompany(ctx *gin.Context) ([]dto.OutletResponse, error) {
	companyID := middleware.GetCompanyID(ctx)

	outlets, err := uc.outletRepo.FindByCompany(companyID)
	if err != nil {
		return nil, err
	}

	var responses []dto.OutletResponse
	for _, o := range outlets {
		responses = append(responses, *toOutletResponse(&o))
	}
	return responses, nil
}

func (uc *OutletUsecase) ListByTenant(ctx *gin.Context, page, limit int) ([]dto.OutletResponse, int64, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, 0, domain.ErrTenantRequired
	}

	outlets, total, err := uc.outletRepo.FindByTenant(tenantID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	var responses []dto.OutletResponse
	for _, o := range outlets {
		responses = append(responses, *toOutletResponse(&o))
	}
	return responses, total, nil
}

func (uc *OutletUsecase) Delete(ctx *gin.Context, id string) error {
	tenantID := middleware.GetTenantID(ctx)

	outlet, err := uc.outletRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.ErrNotFound
		}
		return err
	}

	if outlet.TenantID != tenantID {
		return domain.ErrNotFound
	}

	return uc.outletRepo.Delete(id)
}

func toOutletResponse(o *domain.Outlet) *dto.OutletResponse {
	return &dto.OutletResponse{
		ID:        o.ID,
		CompanyID: o.CompanyID,
		BranchID:  o.BranchID,
		Name:      o.Name,
		Code:      o.Code,
		Address:   o.Address,
		Phone:     o.Phone,
		IsActive:  o.IsActive,
		CreatedAt: o.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: o.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
