package domain

import "time"

type CompanySetting struct {
	ID               string    `gorm:"type:char(36);primaryKey"`
	TenantID         string    `gorm:"type:char(36);uniqueIndex;not null"`
	CompanyID        string    `gorm:"type:char(36);index;not null"`
	TaxEnabled       bool      `gorm:"not null;default:false"`
	DefaultTaxRate   float64   `gorm:"type:decimal(5,2);not null;default:0"`
	DiscountEnabled  bool      `gorm:"not null;default:false"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

func (CompanySetting) TableName() string {
	return "company_settings"
}

type CompanySettingRepository interface {
	FindByTenant(tenantID string) (*CompanySetting, error)
	Upsert(setting *CompanySetting) error
}
