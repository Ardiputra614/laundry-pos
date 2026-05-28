package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type appConfigRepository struct {
	db *gorm.DB
}

func NewAppConfigRepository(db *gorm.DB) domain.AppConfigRepository {
	return &appConfigRepository{db: db}
}

func (r *appConfigRepository) Find() (*domain.AppConfig, error) {
	var config domain.AppConfig
	err := r.db.First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *appConfigRepository) Save(config *domain.AppConfig) error {
	return r.db.Save(config).Error
}
