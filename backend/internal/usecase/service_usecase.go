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

type ServiceUsecase struct {
	categoryRepo domain.ServiceCategoryRepository
	serviceRepo  domain.ServiceRepository
}

func NewServiceUsecase(
	categoryRepo domain.ServiceCategoryRepository,
	serviceRepo domain.ServiceRepository,
) *ServiceUsecase {
	return &ServiceUsecase{
		categoryRepo: categoryRepo,
		serviceRepo:  serviceRepo,
	}
}

func (uc *ServiceUsecase) CreateCategory(ctx *gin.Context, req dto.CreateCategoryRequest) (*dto.CategoryResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	category := &domain.ServiceCategory{
		ID:          uuid.New().String(),
		TenantID:    tenantID,
		CompanyID:   companyID,
		Name:        req.Name,
		Description: req.Description,
		SortOrder:   req.SortOrder,
		IsActive:    true,
	}

	if err := uc.categoryRepo.Create(category); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := toCategoryResponse(category)
	return resp, http.StatusCreated, nil
}

func (uc *ServiceUsecase) ListCategories(ctx *gin.Context) ([]dto.CategoryResponse, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, domain.ErrTenantRequired
	}

	categories, err := uc.categoryRepo.FindByTenant(tenantID)
	if err != nil {
		return nil, err
	}

	var responses []dto.CategoryResponse
	for _, c := range categories {
		responses = append(responses, *toCategoryResponse(&c))
	}
	return responses, nil
}

func (uc *ServiceUsecase) CreateService(ctx *gin.Context, req dto.CreateServiceRequest) (*dto.ServiceResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	service := &domain.Service{
		ID:             uuid.New().String(),
		TenantID:       tenantID,
		CompanyID:      companyID,
		CategoryID:     req.CategoryID,
		Name:           req.Name,
		Description:    req.Description,
		PriceType:      domain.PriceType(req.PriceType),
		Unit:           req.Unit,
		BasePrice:      req.BasePrice,
		DiscountPercent: req.DiscountPercent,
		MinQuantity:    req.MinQuantity,
		EstimatedHours: req.EstimatedHours,
		IsActive:       true,
	}

	if service.MinQuantity <= 0 {
		service.MinQuantity = 1
	}
	if service.EstimatedHours <= 0 {
		service.EstimatedHours = 24
	}

	if err := uc.serviceRepo.Create(service); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := toServiceResponse(service)
	return resp, http.StatusCreated, nil
}

func (uc *ServiceUsecase) UpdateService(ctx *gin.Context, id string, req dto.UpdateServiceRequest) (*dto.ServiceResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)

	service, err := uc.serviceRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if service.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	if req.Name != "" {
		service.Name = req.Name
	}
	if req.Description != "" {
		service.Description = req.Description
	}
	if req.PriceType != "" {
		service.PriceType = domain.PriceType(req.PriceType)
	}
	if req.Unit != "" {
		service.Unit = req.Unit
	}
	if req.BasePrice >= 0 {
		service.BasePrice = req.BasePrice
	}
	if req.DiscountPercent >= 0 {
		service.DiscountPercent = req.DiscountPercent
	}
	if req.MinQuantity > 0 {
		service.MinQuantity = req.MinQuantity
	}
	if req.EstimatedHours > 0 {
		service.EstimatedHours = req.EstimatedHours
	}
	if req.CategoryID != "" {
		service.CategoryID = req.CategoryID
	}
	if req.IsActive != nil {
		service.IsActive = *req.IsActive
	}

	if err := uc.serviceRepo.Update(service); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	resp := toServiceResponse(service)
	return resp, http.StatusOK, nil
}

func (uc *ServiceUsecase) ListServices(ctx *gin.Context, page, limit int) ([]dto.ServiceResponse, int64, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, 0, domain.ErrTenantRequired
	}

	services, total, err := uc.serviceRepo.FindByTenant(tenantID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	var responses []dto.ServiceResponse
	for _, s := range services {
		responses = append(responses, *toServiceResponse(&s))
	}
	return responses, total, nil
}

func (uc *ServiceUsecase) DeleteService(ctx *gin.Context, id string) (int, error) {
	tenantID := middleware.GetTenantID(ctx)

	service, err := uc.serviceRepo.FindByID(id)
	if err != nil {
		return http.StatusNotFound, domain.ErrNotFound
	}

	if service.TenantID != tenantID {
		return http.StatusNotFound, domain.ErrNotFound
	}

	if err := uc.serviceRepo.Delete(id); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (uc *ServiceUsecase) ListActiveServices(ctx *gin.Context) ([]dto.ServiceResponse, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, domain.ErrTenantRequired
	}

	services, err := uc.serviceRepo.FindActiveByTenant(tenantID)
	if err != nil {
		return nil, err
	}

	var responses []dto.ServiceResponse
	for _, s := range services {
		responses = append(responses, *toServiceResponse(&s))
	}
	return responses, nil
}

func toCategoryResponse(c *domain.ServiceCategory) *dto.CategoryResponse {
	return &dto.CategoryResponse{
		ID:          c.ID,
		Name:        c.Name,
		Description: c.Description,
		IsActive:    c.IsActive,
		SortOrder:   c.SortOrder,
		CreatedAt:   c.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   c.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func toServiceResponse(s *domain.Service) *dto.ServiceResponse {
	return &dto.ServiceResponse{
		ID:             s.ID,
		CategoryID:     s.CategoryID,
		Name:           s.Name,
		Description:    s.Description,
		PriceType:      string(s.PriceType),
		Unit:           s.Unit,
		BasePrice:      s.BasePrice,
		DiscountPercent: s.DiscountPercent,
		MinQuantity:    s.MinQuantity,
		EstimatedHours: s.EstimatedHours,
		IsActive:       s.IsActive,
		CreatedAt:      s.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:      s.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
