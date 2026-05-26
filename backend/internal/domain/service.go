package domain

import "time"

type PriceType string

const (
	PriceTypeWeight PriceType = "weight"
	PriceTypePiece  PriceType = "piece"
)

type ServiceCategory struct {
	ID          string     `gorm:"type:char(36);primaryKey"`
	TenantID    string     `gorm:"type:char(36);index;not null"`
	CompanyID   string     `gorm:"type:char(36);index;not null"`
	Name        string     `gorm:"type:varchar(255);not null"`
	Description string     `gorm:"type:text"`
	IsActive    bool       `gorm:"not null;default:true"`
	SortOrder   int        `gorm:"not null;default:0"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time `gorm:"index"`
}

func (ServiceCategory) TableName() string {
	return "service_categories"
}

type Service struct {
	ID             string     `gorm:"type:char(36);primaryKey"`
	TenantID       string     `gorm:"type:char(36);index;not null"`
	CompanyID      string     `gorm:"type:char(36);index;not null"`
	CategoryID     string     `gorm:"type:char(36);index"`
	Name           string     `gorm:"type:varchar(255);not null"`
	Description    string     `gorm:"type:text"`
	PriceType      PriceType  `gorm:"type:varchar(20);not null;default:'weight'"`
	Unit           string     `gorm:"type:varchar(20);not null;default:'kg'"`
	BasePrice      float64    `gorm:"type:decimal(15,2);not null;default:0"`
	DiscountPercent float64   `gorm:"type:decimal(5,2);not null;default:0"`
	MinQuantity    float64    `gorm:"type:decimal(10,2);not null;default:1"`
	EstimatedHours int        `gorm:"not null;default:24"`
	IsActive       bool       `gorm:"not null;default:true"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time `gorm:"index"`
}

func (Service) TableName() string {
	return "services"
}

type ServicePricing struct {
	ID        string     `gorm:"type:char(36);primaryKey"`
	TenantID  string     `gorm:"type:char(36);index;not null"`
	CompanyID string     `gorm:"type:char(36);index;not null"`
	ServiceID string     `gorm:"type:char(36);index;not null"`
	OutletID  string     `gorm:"type:char(36);index"`
	MinWeight float64    `gorm:"type:decimal(10,2)"`
	MaxWeight float64    `gorm:"type:decimal(10,2)"`
	Price     float64    `gorm:"type:decimal(15,2);not null"`
	IsActive  bool       `gorm:"not null;default:true"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time `gorm:"index"`
}

func (ServicePricing) TableName() string {
	return "service_pricings"
}

type ServiceCategoryRepository interface {
	Create(category *ServiceCategory) error
	FindByID(id string) (*ServiceCategory, error)
	FindByTenant(tenantID string) ([]ServiceCategory, error)
	Update(category *ServiceCategory) error
	Delete(id string) error
}

type ServiceRepository interface {
	Create(service *Service) error
	FindByID(id string) (*Service, error)
	FindByTenant(tenantID string, page, limit int) ([]Service, int64, error)
	FindByCategory(tenantID, categoryID string) ([]Service, error)
	FindActiveByTenant(tenantID string) ([]Service, error)
	Update(service *Service) error
	Delete(id string) error
}

type ServicePricingRepository interface {
	Create(pricing *ServicePricing) error
	FindByServiceID(serviceID string) ([]ServicePricing, error)
	Update(pricing *ServicePricing) error
	Delete(id string) error
}
