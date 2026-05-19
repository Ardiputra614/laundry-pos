package domain

import "time"

type Outlet struct {
	ID        string     `gorm:"type:char(36);primaryKey"`
	TenantID  string     `gorm:"type:char(36);index;not null"`
	CompanyID string     `gorm:"type:char(36);index;not null"`
	BranchID  string     `gorm:"type:char(36);index"`
	Name      string     `gorm:"type:varchar(255);not null"`
	Code      string     `gorm:"type:varchar(20);not null"`
	Address   string     `gorm:"type:text"`
	Phone     string     `gorm:"type:varchar(20)"`
	IsActive  bool       `gorm:"not null;default:true"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

func (Outlet) TableName() string {
	return "outlets"
}

type OutletRepository interface {
	Create(outlet *Outlet) error
	FindByID(id string) (*Outlet, error)
	FindByCompany(companyID string) ([]Outlet, error)
	FindByTenant(tenantID string, page, limit int) ([]Outlet, int64, error)
	Update(outlet *Outlet) error
	Delete(id string) error
}
