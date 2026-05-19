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

type EmployeeUsecase struct {
	employeeRepo domain.EmployeeRepository
}

func NewEmployeeUsecase(employeeRepo domain.EmployeeRepository) *EmployeeUsecase {
	return &EmployeeUsecase{employeeRepo: employeeRepo}
}

func (uc *EmployeeUsecase) Create(ctx *gin.Context, req dto.CreateEmployeeRequest) (*dto.EmployeeResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)

	emp := &domain.Employee{
		ID:           uuid.New().String(),
		TenantID:     tenantID,
		CompanyID:    companyID,
		BranchID:     req.BranchID,
		EmployeeCode: req.EmployeeCode,
		FullName:     req.FullName,
		Phone:        req.Phone,
		Email:        req.Email,
		Position:     req.Position,
		Salary:       req.Salary,
		IsActive:     true,
	}

	if err := uc.employeeRepo.Create(emp); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toEmployeeResponse(emp), http.StatusCreated, nil
}

func (uc *EmployeeUsecase) Update(ctx *gin.Context, id string, req dto.UpdateEmployeeRequest) (*dto.EmployeeResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)

	emp, err := uc.employeeRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if emp.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	if req.FullName != "" {
		emp.FullName = req.FullName
	}
	if req.EmployeeCode != "" {
		emp.EmployeeCode = req.EmployeeCode
	}
	if req.Phone != "" {
		emp.Phone = req.Phone
	}
	if req.Email != "" {
		emp.Email = req.Email
	}
	if req.Position != "" {
		emp.Position = req.Position
	}
	if req.Salary > 0 {
		emp.Salary = req.Salary
	}
	if req.BranchID != "" {
		emp.BranchID = req.BranchID
	}
	if req.IsActive != nil {
		emp.IsActive = *req.IsActive
	}

	if err := uc.employeeRepo.Update(emp); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toEmployeeResponse(emp), http.StatusOK, nil
}

func (uc *EmployeeUsecase) GetByID(ctx *gin.Context, id string) (*dto.EmployeeResponse, error) {
	tenantID := middleware.GetTenantID(ctx)

	emp, err := uc.employeeRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	if emp.TenantID != tenantID {
		return nil, domain.ErrNotFound
	}

	return toEmployeeResponse(emp), nil
}

func (uc *EmployeeUsecase) ListByCompany(ctx *gin.Context, page, limit int) ([]dto.EmployeeResponse, int64, error) {
	companyID := middleware.GetCompanyID(ctx)

	employees, total, err := uc.employeeRepo.FindByCompany(companyID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	var responses []dto.EmployeeResponse
	for _, e := range employees {
		responses = append(responses, *toEmployeeResponse(&e))
	}
	return responses, total, nil
}

func (uc *EmployeeUsecase) ListByBranch(ctx *gin.Context, branchID string) ([]dto.EmployeeResponse, error) {
	employees, err := uc.employeeRepo.FindByBranch(branchID)
	if err != nil {
		return nil, err
	}

	var responses []dto.EmployeeResponse
	for _, e := range employees {
		responses = append(responses, *toEmployeeResponse(&e))
	}
	return responses, nil
}

func (uc *EmployeeUsecase) Delete(ctx *gin.Context, id string) error {
	tenantID := middleware.GetTenantID(ctx)

	emp, err := uc.employeeRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.ErrNotFound
		}
		return err
	}

	if emp.TenantID != tenantID {
		return domain.ErrNotFound
	}

	return uc.employeeRepo.Delete(id)
}

func toEmployeeResponse(e *domain.Employee) *dto.EmployeeResponse {
	resp := &dto.EmployeeResponse{
		ID:           e.ID,
		CompanyID:    e.CompanyID,
		BranchID:     e.BranchID,
		EmployeeCode: e.EmployeeCode,
		FullName:     e.FullName,
		Phone:        e.Phone,
		Email:        e.Email,
		Position:     e.Position,
		Salary:       e.Salary,
		IsActive:     e.IsActive,
		CreatedAt:    e.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    e.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if e.UserID != "" {
		resp.UserID = e.UserID
	}
	return resp
}
