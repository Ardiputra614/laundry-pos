package domain

import "time"

type UserRole string

const (
	RoleSuperAdmin UserRole = "superadmin"
	RoleCompanyAdmin UserRole = "company_admin"
	RoleBranchManager UserRole = "branch_manager"
	RoleStaff UserRole = "staff"
	RoleDriver UserRole = "driver"
)

type User struct {
	ID          string    `gorm:"type:char(36);primaryKey"`
	TenantID    string    `gorm:"type:char(36);index;not null"`
	CompanyID   string    `gorm:"type:char(36);index"`
	Email       string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	Password    string    `gorm:"type:varchar(255);not null"`
	FullName    string    `gorm:"type:varchar(255);not null"`
	Phone       string    `gorm:"type:varchar(20)"`
	Role        UserRole  `gorm:"type:varchar(20);not null;default:'staff'"`
	IsActive    bool      `gorm:"not null;default:true"`
	LastLoginAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time `gorm:"index"`
}

func (User) TableName() string {
	return "users"
}

type UserRepository interface {
	Create(user *User) error
	FindByID(id string) (*User, error)
	FindByEmail(email string) (*User, error)
	FindByTenant(tenantID string, page, limit int) ([]User, int64, error)
	FindByCompany(companyID string) ([]User, error)
	CountByCompany(companyID string) (int64, error)
	Update(user *User) error
	Delete(id string) error
}

type RegisterRequest struct {
	Email    string   `json:"email" binding:"required,email"`
	Password string   `json:"password" binding:"required,min=8"`
	FullName string   `json:"full_name" binding:"required"`
	Phone    string   `json:"phone"`
	Role     UserRole `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	DeviceID string `json:"device_id"`
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	User         *User  `json:"user"`
}
