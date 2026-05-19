package domain

import "time"

type Employee struct {
	ID           string     `gorm:"type:char(36);primaryKey"`
	TenantID     string     `gorm:"type:char(36);index;not null"`
	CompanyID    string     `gorm:"type:char(36);index;not null"`
	UserID       string     `gorm:"type:char(36);index"`
	BranchID     string     `gorm:"type:char(36);index"`
	EmployeeCode string     `gorm:"type:varchar(20);not null"`
	FullName     string     `gorm:"type:varchar(255);not null"`
	Phone        string     `gorm:"type:varchar(20)"`
	Email        string     `gorm:"type:varchar(255)"`
	Position     string     `gorm:"type:varchar(100)"`
	Salary       float64    `gorm:"type:decimal(15,2);default:0"`
	IsActive     bool       `gorm:"not null;default:true"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time `gorm:"index"`
}

func (Employee) TableName() string {
	return "employees"
}

type EmployeeRepository interface {
	Create(emp *Employee) error
	FindByID(id string) (*Employee, error)
	FindByCompany(companyID string, page, limit int) ([]Employee, int64, error)
	FindByTenant(tenantID string, page, limit int) ([]Employee, int64, error)
	FindByBranch(branchID string) ([]Employee, error)
	Update(emp *Employee) error
	Delete(id string) error
}
