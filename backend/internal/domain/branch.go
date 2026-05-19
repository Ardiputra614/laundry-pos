package domain

import "time"

type Branch struct {
	ID        string     `gorm:"type:char(36);primaryKey"`
	TenantID  string     `gorm:"type:char(36);index;not null"`
	CompanyID string     `gorm:"type:char(36);index;not null"`
	Name      string     `gorm:"type:varchar(255);not null"`
	Code      string     `gorm:"type:varchar(20);not null"`
	Address   string     `gorm:"type:text"`
	Phone     string     `gorm:"type:varchar(20)"`
	Email     string     `gorm:"type:varchar(255)"`
	IsActive  bool       `gorm:"not null;default:true"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

func (Branch) TableName() string {
	return "branches"
}

type BranchRepository interface {
	Create(branch *Branch) error
	FindByID(id string) (*Branch, error)
	FindByCompany(companyID string) ([]Branch, error)
	FindByTenant(tenantID string, page, limit int) ([]Branch, int64, error)
	Update(branch *Branch) error
	Delete(id string) error
}
