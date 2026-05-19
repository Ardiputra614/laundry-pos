package domain

import "time"

type PlanFeatures struct {
	MaxBranches    int  `json:"max_branches"`
	MaxOutlets     int  `json:"max_outlets"`
	MaxUsers       int  `json:"max_users"`
	MaxCustomers   int  `json:"max_customers"`
	MaxOrders      int  `json:"max_orders_monthly"`
	AdvancedReport bool `json:"advanced_report"`
	APIEnabled     bool `json:"api_enabled"`
	Priority       bool `json:"priority_support"`
}

type SubscriptionPlan struct {
	ID           string    `gorm:"type:char(36);primaryKey"`
	Name         string    `gorm:"type:varchar(100);not null"`
	Code         string    `gorm:"type:varchar(20);uniqueIndex;not null"`
	Description  string    `gorm:"type:text"`
	PriceMonthly float64   `gorm:"type:decimal(15,2);not null;default:0"`
	PriceYearly  float64   `gorm:"type:decimal(15,2);not null;default:0"`
	MaxUsers     int       `gorm:"not null;default:5"`
	MaxBranches  int       `gorm:"not null;default:1"`
	MaxOutlets   int       `gorm:"not null;default:1"`
	Features     string    `gorm:"type:json"`
	IsActive     bool      `gorm:"not null;default:true"`
	SortOrder    int       `gorm:"not null;default:0"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (SubscriptionPlan) TableName() string {
	return "subscription_plans"
}

type Subscription struct {
	ID                string     `gorm:"type:char(36);primaryKey"`
	TenantID          string     `gorm:"type:char(36);not null"`
	CompanyID         string     `gorm:"type:char(36);not null"`
	PlanID            string     `gorm:"type:char(36);not null"`
	Status            string     `gorm:"type:varchar(20);not null;default:'trial'"`
	BillingCycle      string     `gorm:"type:varchar(10);not null;default:'monthly'"`
	Amount            float64    `gorm:"type:decimal(15,2);not null;default:0"`
	StartedAt         *time.Time
	TrialEndsAt       *time.Time
	CurrentPeriodStart *time.Time
	CurrentPeriodEnd  *time.Time
	CancelledAt       *time.Time
	AutoRenew         bool       `gorm:"not null;default:true"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	DeletedAt         *time.Time `gorm:"index"`
}

func (Subscription) TableName() string {
	return "subscriptions"
}

type Invoice struct {
	ID                    string     `gorm:"type:char(36);primaryKey"`
	TenantID              string     `gorm:"type:char(36);not null"`
	CompanyID             string     `gorm:"type:char(36);not null"`
	SubscriptionID        string     `gorm:"type:char(36)"`
	InvoiceNumber         string     `gorm:"type:varchar(50);uniqueIndex;not null"`
	Status                string     `gorm:"type:varchar(20);not null;default:'pending'"`
	Amount                float64    `gorm:"type:decimal(15,2);not null;default:0"`
	TaxAmount             float64    `gorm:"type:decimal(15,2);not null;default:0"`
	TotalAmount           float64    `gorm:"type:decimal(15,2);not null;default:0"`
	DueDate               *time.Time
	PaidAt                *time.Time
	PaymentMethod         string     `gorm:"type:varchar(50)"`
	PaymentChannel        string     `gorm:"type:varchar(50)"`
	MidtransTransactionID string     `gorm:"type:varchar(255)"`
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

func (Invoice) TableName() string {
	return "invoices"
}

type SubscriptionPlanRepository interface {
	Create(plan *SubscriptionPlan) error
	FindByID(id string) (*SubscriptionPlan, error)
	FindByCode(code string) (*SubscriptionPlan, error)
	FindAll() ([]SubscriptionPlan, error)
	FindActive() ([]SubscriptionPlan, error)
	Update(plan *SubscriptionPlan) error
	Delete(id string) error
}

type SubscriptionRepository interface {
	Create(sub *Subscription) error
	FindByID(id string) (*Subscription, error)
	FindByTenant(tenantID string) (*Subscription, error)
	FindByCompany(companyID string) (*Subscription, error)
	FindExpiring(days int) ([]Subscription, error)
	FindExpired() ([]Subscription, error)
	Update(sub *Subscription) error
}

type InvoiceRepository interface {
	Create(inv *Invoice) error
	FindByID(id string) (*Invoice, error)
	FindByInvoiceNumber(number string) (*Invoice, error)
	FindByCompany(companyID string, page, limit int) ([]Invoice, int64, error)
	FindBySubscription(subscriptionID string) ([]Invoice, error)
	FindPending() ([]Invoice, error)
	Update(inv *Invoice) error
}
