package domain

import "time"

type AppConfig struct {
	ID          string `gorm:"type:char(36);primaryKey"`
	AppName     string `gorm:"type:varchar(255);not null;default:'Laundry POS'"`
	Description string `gorm:"type:text"`
	Version     string `gorm:"type:varchar(50);not null;default:'1.0.0'"`
	LogoURL     string `gorm:"type:varchar(500)"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (AppConfig) TableName() string {
	return "app_config"
}

type AppConfigRepository interface {
	Find() (*AppConfig, error)
	Save(config *AppConfig) error
}
