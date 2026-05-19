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

type DeviceUsecase struct {
	deviceRepo domain.DeviceRepository
}

func NewDeviceUsecase(deviceRepo domain.DeviceRepository) *DeviceUsecase {
	return &DeviceUsecase{deviceRepo: deviceRepo}
}

func (uc *DeviceUsecase) Register(ctx *gin.Context, req dto.RegisterDeviceRequest) (*dto.DeviceResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)
	userID := middleware.GetUserID(ctx)

	device := &domain.Device{
		ID:         uuid.New().String(),
		TenantID:   tenantID,
		CompanyID:  companyID,
		BranchID:   req.BranchID,
		UserID:     userID,
		DeviceName: req.DeviceName,
		DeviceType: req.DeviceType,
		DeviceID:   req.DeviceID,
		FCMToken:   req.FCMToken,
		IsActive:   true,
	}

	if err := uc.deviceRepo.Create(device); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toDeviceResponse(device), http.StatusCreated, nil
}

func (uc *DeviceUsecase) ListByCompany(ctx *gin.Context) ([]dto.DeviceResponse, error) {
	companyID := middleware.GetCompanyID(ctx)

	devices, err := uc.deviceRepo.FindByCompany(companyID)
	if err != nil {
		return nil, err
	}

	var responses []dto.DeviceResponse
	for _, d := range devices {
		responses = append(responses, *toDeviceResponse(&d))
	}
	return responses, nil
}

func (uc *DeviceUsecase) Deactivate(ctx *gin.Context, id string) (*dto.DeviceResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)

	device, err := uc.deviceRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusNotFound, domain.ErrNotFound
		}
		return nil, http.StatusInternalServerError, err
	}

	if device.TenantID != tenantID {
		return nil, http.StatusNotFound, domain.ErrNotFound
	}

	device.IsActive = false
	if err := uc.deviceRepo.Update(device); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return toDeviceResponse(device), http.StatusOK, nil
}

func toDeviceResponse(d *domain.Device) *dto.DeviceResponse {
	resp := &dto.DeviceResponse{
		ID:         d.ID,
		CompanyID:  d.CompanyID,
		BranchID:   d.BranchID,
		UserID:     d.UserID,
		DeviceName: d.DeviceName,
		DeviceType: d.DeviceType,
		DeviceID:   d.DeviceID,
		IsActive:   d.IsActive,
		CreatedAt:  d.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  d.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if d.LastSyncAt != nil {
		formatted := d.LastSyncAt.Format("2006-01-02T15:04:05Z")
		resp.LastSyncAt = &formatted
	}
	return resp
}
