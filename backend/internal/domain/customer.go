package domain

import "time"

type Customer struct {
	ID          string     `gorm:"type:char(36);primaryKey"`
	TenantID    string     `gorm:"type:char(36);index;not null"`
	CompanyID   string     `gorm:"type:char(36);index;not null"`
	BranchID    string     `gorm:"type:char(36);index"`
	Name        string     `gorm:"type:varchar(255);not null"`
	Phone       string     `gorm:"type:varchar(20)"`
	Email       string     `gorm:"type:varchar(255)"`
	Address     string     `gorm:"type:text"`
	IsMember    bool       `gorm:"not null;default:false"`
	TotalOrders int        `gorm:"not null;default:0"`
	TotalSpent  float64    `gorm:"type:decimal(15,2);not null;default:0"`
	Notes       string     `gorm:"type:text"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time `gorm:"index"`
}

func (Customer) TableName() string {
	return "customers"
}

type CustomerRepository interface {
	FindByID(id string) (*Customer, error)
	FindByTenant(tenantID string, page, limit int) ([]Customer, int64, error)
	FindByPhone(tenantID, phone string) (*Customer, error)
	Create(customer *Customer) error
	Update(customer *Customer) error
	Delete(id string) error
}
