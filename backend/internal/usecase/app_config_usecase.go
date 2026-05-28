package usecase

import (
	"net/http"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppConfigUsecase struct {
	configRepo domain.AppConfigRepository
}

func NewAppConfigUsecase(configRepo domain.AppConfigRepository) *AppConfigUsecase {
	return &AppConfigUsecase{configRepo: configRepo}
}

func (uc *AppConfigUsecase) GetConfig() (*dto.AppConfigResponse, int, error) {
	config, err := uc.configRepo.Find()
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return &dto.AppConfigResponse{
				AppName:     "Laundry POS",
				Version:     "1.0.0",
				Description: "Aplikasi manajemen laundry profesional.",
			}, http.StatusOK, nil
		}
		return nil, http.StatusInternalServerError, err
	}
	return &dto.AppConfigResponse{
		ID:          config.ID,
		AppName:     config.AppName,
		Description: config.Description,
		Version:     config.Version,
		LogoURL:     config.LogoURL,
	}, http.StatusOK, nil
}

func (uc *AppConfigUsecase) UpdateConfig(req dto.UpdateAppConfigRequest) (*dto.AppConfigResponse, int, error) {
	config, err := uc.configRepo.Find()
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			config = &domain.AppConfig{
				ID: uuid.New().String(),
			}
		} else {
			return nil, http.StatusInternalServerError, err
		}
	}

	if req.AppName != "" {
		config.AppName = req.AppName
	}
	if req.Description != "" {
		config.Description = req.Description
	}
	if req.Version != "" {
		config.Version = req.Version
	}
	if req.LogoURL != "" {
		config.LogoURL = req.LogoURL
	}

	if err := uc.configRepo.Save(config); err != nil {
		return nil, http.StatusInternalServerError, err
	}

	return &dto.AppConfigResponse{
		ID:          config.ID,
		AppName:     config.AppName,
		Description: config.Description,
		Version:     config.Version,
		LogoURL:     config.LogoURL,
	}, http.StatusOK, nil
}
