package domain

import "time"

type PlanType string

const (
	PlanBasic      PlanType = "basic"
	PlanProfessional PlanType = "professional"
	PlanEnterprise PlanType = "enterprise"
)

type SubscriptionStatus string

const (
	SubActive    SubscriptionStatus = "active"
	SubTrial     SubscriptionStatus = "trial"
	SubExpired   SubscriptionStatus = "expired"
	SubSuspended SubscriptionStatus = "suspended"
	SubCancelled SubscriptionStatus = "cancelled"
)

type Company struct {
	ID          string             `gorm:"type:char(36);primaryKey"`
	TenantID    string             `gorm:"type:char(36);uniqueIndex;not null"`
	Name        string             `gorm:"type:varchar(255);not null"`
	Slug        string             `gorm:"type:varchar(100);uniqueIndex;not null"`
	Logo        string             `gorm:"type:varchar(500)"`
	Address     string             `gorm:"type:text"`
	Phone       string             `gorm:"type:varchar(20)"`
	Email       string             `gorm:"type:varchar(255)"`
	TaxID       string             `gorm:"type:varchar(50)"`
	Currency    string             `gorm:"type:varchar(3);default:'IDR'"`
	Timezone    string             `gorm:"type:varchar(50);default:'Asia/Jakarta'"`
	IsActive    bool               `gorm:"not null;default:true"`
	IsSuspended bool               `gorm:"not null;default:false"`
	Plan        PlanType           `gorm:"type:varchar(20);not null;default:'trial'"`
	SubStatus   SubscriptionStatus `gorm:"type:varchar(20);not null;default:'trial'"`
	SubExpiresAt *time.Time
	MaxUsers    int                `gorm:"not null;default:5"`
	MaxBranches int                `gorm:"not null;default:1"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time         `gorm:"index"`
}

func (Company) TableName() string {
	return "companies"
}

type CompanyRepository interface {
	Create(company *Company) error
	FindByID(id string) (*Company, error)
	FindByTenantID(tenantID string) (*Company, error)
	FindBySlug(slug string) (*Company, error)
	FindAll(page, limit int) ([]Company, int64, error)
	FindAllFiltered(page, limit int, status, plan string, suspended *bool) ([]Company, int64, error)
	Update(company *Company) error
	Delete(id string) error
	CountActive() (int64, error)
	CountSuspended() (int64, error)
	CountByStatus(status SubscriptionStatus) (int64, error)
	CountCreatedSince(since time.Time) (int64, error)
}

type RefreshToken struct {
	ID        string    `gorm:"type:char(36);primaryKey"`
	UserID    string    `gorm:"type:char(36);index;not null"`
	Token     string    `gorm:"type:varchar(500);index;not null"`
	DeviceID  string    `gorm:"type:varchar(255)"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

type RefreshTokenRepository interface {
	Create(token *RefreshToken) error
	FindByToken(token string) (*RefreshToken, error)
	DeleteByUserID(userID string) error
	DeleteExpired() error
}
