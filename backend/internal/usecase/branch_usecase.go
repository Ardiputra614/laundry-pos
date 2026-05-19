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

type BranchUsecase struct {
	branchRepo domain.BranchRepository
}

func NewBranchUsecase(branchRepo domain.BranchRepository) *BranchUsecase {
	return &BranchUsecase{branchRepo: branchRepo}
}

func (uc *BranchUsecase) Create(ctx *gin.Context, req dto.CreateBranchRequest) (*dto.BranchResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	branch := &domain.Branch{
		ID:        uuid.New().String(),
		TenantID:  tenantID,
		CompanyID: companyID,
		Name:      req.Name,
		Code:      req.Code,
		Address:   req.Address,
		Phone:     req.Phone,
		Email:     req.Email,
		IsActive:  true,
	}

	if err := uc.branchRepo.Create(branch); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toBranchResponse(branch), http.StatusCreated, nil
}

func (uc *BranchUsecase) Update(ctx *gin.Context, id string, req dto.UpdateBranchRequest) (*dto.BranchResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)

	branch, err := uc.branchRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if branch.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	if req.Name != "" {
		branch.Name = req.Name
	}
	if req.Code != "" {
		branch.Code = req.Code
	}
	if req.Address != "" {
		branch.Address = req.Address
	}
	if req.Phone != "" {
		branch.Phone = req.Phone
	}
	if req.Email != "" {
		branch.Email = req.Email
	}
	if req.IsActive != nil {
		branch.IsActive = *req.IsActive
	}

	if err := uc.branchRepo.Update(branch); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toBranchResponse(branch), http.StatusOK, nil
}

func (uc *BranchUsecase) GetByID(ctx *gin.Context, id string) (*dto.BranchResponse, error) {
	tenantID := middleware.GetTenantID(ctx)

	branch, err := uc.branchRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	if branch.TenantID != tenantID {
		return nil, domain.ErrNotFound
	}

	return toBranchResponse(branch), nil
}

func (uc *BranchUsecase) ListByCompany(ctx *gin.Context) ([]dto.BranchResponse, error) {
	companyID := middleware.GetCompanyID(ctx)

	branches, err := uc.branchRepo.FindByCompany(companyID)
	if err != nil {
		return nil, err
	}

	var responses []dto.BranchResponse
	for _, b := range branches {
		responses = append(responses, *toBranchResponse(&b))
	}
	return responses, nil
}

func (uc *BranchUsecase) ListByTenant(ctx *gin.Context, page, limit int) ([]dto.BranchResponse, int64, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, 0, domain.ErrTenantRequired
	}

	branches, total, err := uc.branchRepo.FindByTenant(tenantID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	var responses []dto.BranchResponse
	for _, b := range branches {
		responses = append(responses, *toBranchResponse(&b))
	}
	return responses, total, nil
}

func (uc *BranchUsecase) Delete(ctx *gin.Context, id string) error {
	tenantID := middleware.GetTenantID(ctx)

	branch, err := uc.branchRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.ErrNotFound
		}
		return err
	}

	if branch.TenantID != tenantID {
		return domain.ErrNotFound
	}

	return uc.branchRepo.Delete(id)
}

func toBranchResponse(b *domain.Branch) *dto.BranchResponse {
	return &dto.BranchResponse{
		ID:        b.ID,
		CompanyID: b.CompanyID,
		Name:      b.Name,
		Code:      b.Code,
		Address:   b.Address,
		Phone:     b.Phone,
		Email:     b.Email,
		IsActive:  b.IsActive,
		CreatedAt: b.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: b.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
