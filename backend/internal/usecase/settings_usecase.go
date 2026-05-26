package usecase

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SettingsUsecase struct {
	settingRepo domain.CompanySettingRepository
}

func NewSettingsUsecase(settingRepo domain.CompanySettingRepository) *SettingsUsecase {
	return &SettingsUsecase{settingRepo: settingRepo}
}

func (uc *SettingsUsecase) GetSettings(ctx *gin.Context) (*dto.SettingsResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	if tenantID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	setting, err := uc.settingRepo.FindByTenant(tenantID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return &dto.SettingsResponse{}, http.StatusOK, nil
		}
		return nil, http.StatusInternalServerError, err
	}

	return &dto.SettingsResponse{
		TaxEnabled:      setting.TaxEnabled,
		DefaultTaxRate:  setting.DefaultTaxRate,
		DiscountEnabled: setting.DiscountEnabled,
	}, http.StatusOK, nil
}

func (uc *SettingsUsecase) UpdateSettings(ctx *gin.Context, req dto.UpdateSettingsRequest) (*dto.SettingsResponse, int, error) {
	tenantID := middleware.GetTenantID(ctx)
	companyID := middleware.GetCompanyID(ctx)
	if tenantID == "" {
		return nil, http.StatusBadRequest, domain.ErrTenantRequired
	}

	setting, err := uc.settingRepo.FindByTenant(tenantID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			setting = &domain.CompanySetting{
				ID:        uuid.New().String(),
				TenantID:  tenantID,
				CompanyID: companyID,
			}
		} else {
			return nil, http.StatusInternalServerError, err
		}
	}

	if req.TaxEnabled != nil {
		setting.TaxEnabled = *req.TaxEnabled
	}
	if req.DefaultTaxRate >= 0 {
		setting.DefaultTaxRate = req.DefaultTaxRate
	}
	if req.DiscountEnabled != nil {
		setting.DiscountEnabled = *req.DiscountEnabled
	}

	if err := uc.settingRepo.Upsert(setting); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return &dto.SettingsResponse{
		TaxEnabled:      setting.TaxEnabled,
		DefaultTaxRate:  setting.DefaultTaxRate,
		DiscountEnabled: setting.DiscountEnabled,
	}, http.StatusOK, nil
}
