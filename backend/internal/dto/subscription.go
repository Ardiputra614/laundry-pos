package dto

import "github.com/ardiputra/laundry-pos/internal/domain"

type CreatePlanRequest struct {
	Name         string              `json:"name" binding:"required"`
	Code         string              `json:"code" binding:"required"`
	Description  string              `json:"description"`
	PriceMonthly float64             `json:"price_monthly" binding:"min=0"`
	PriceYearly  float64             `json:"price_yearly" binding:"min=0"`
	MaxUsers     int                 `json:"max_users" binding:"min=1"`
	MaxBranches  int                 `json:"max_branches" binding:"min=1"`
	MaxOutlets   int                 `json:"max_outlets" binding:"min=1"`
	Features     domain.PlanFeatures `json:"features"`
	SortOrder    int                 `json:"sort_order"`
	IsActive     *bool               `json:"is_active"`
}

type UpdatePlanRequest struct {
	Name         *string             `json:"name"`
	Description  *string             `json:"description"`
	PriceMonthly *float64            `json:"price_monthly" binding:"omitempty,min=0"`
	PriceYearly  *float64            `json:"price_yearly" binding:"omitempty,min=0"`
	MaxUsers     *int                `json:"max_users" binding:"omitempty,min=1"`
	MaxBranches  *int                `json:"max_branches" binding:"omitempty,min=1"`
	MaxOutlets   *int                `json:"max_outlets" binding:"omitempty,min=1"`
	Features     *domain.PlanFeatures `json:"features"`
	SortOrder    *int                `json:"sort_order"`
	IsActive     *bool               `json:"is_active"`
}

type PlanResponse struct {
	ID           string              `json:"id"`
	Name         string              `json:"name"`
	Code         string              `json:"code"`
	Description  string              `json:"description"`
	PriceMonthly float64             `json:"price_monthly"`
	PriceYearly  float64             `json:"price_yearly"`
	MaxUsers     int                 `json:"max_users"`
	MaxBranches  int                 `json:"max_branches"`
	MaxOutlets   int                 `json:"max_outlets"`
	Features     domain.PlanFeatures `json:"features"`
	IsActive     bool                `json:"is_active"`
	SortOrder    int                 `json:"sort_order"`
	CreatedAt    string              `json:"created_at"`
	UpdatedAt    string              `json:"updated_at"`
}

type SubscriptionResponse struct {
	ID                string  `json:"id"`
	TenantID          string  `json:"tenant_id"`
	CompanyID         string  `json:"company_id"`
	PlanID            string  `json:"plan_id"`
	PlanName          string  `json:"plan_name"`
	PlanCode          string  `json:"plan_code"`
	Status            string  `json:"status"`
	BillingCycle      string  `json:"billing_cycle"`
	Amount            float64 `json:"amount"`
	StartedAt         *string `json:"started_at"`
	TrialEndsAt       *string `json:"trial_ends_at"`
	CurrentPeriodStart *string `json:"current_period_start"`
	CurrentPeriodEnd  *string `json:"current_period_end"`
	CancelledAt       *string `json:"cancelled_at"`
	AutoRenew         bool    `json:"auto_renew"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

type InvoiceResponse struct {
	ID                    string  `json:"id"`
	TenantID              string  `json:"tenant_id"`
	CompanyID             string  `json:"company_id"`
	SubscriptionID        string  `json:"subscription_id"`
	InvoiceNumber         string  `json:"invoice_number"`
	Status                string  `json:"status"`
	Amount                float64 `json:"amount"`
	TaxAmount             float64 `json:"tax_amount"`
	TotalAmount           float64 `json:"total_amount"`
	DueDate               *string `json:"due_date"`
	PaidAt                *string `json:"paid_at"`
	PaymentMethod         string  `json:"payment_method"`
	PaymentChannel        string  `json:"payment_channel"`
	MidtransTransactionID string  `json:"midtrans_transaction_id"`
	CreatedAt             string  `json:"created_at"`
	UpdatedAt             string  `json:"updated_at"`
}

type ChangePlanRequest struct {
	PlanID       string `json:"plan_id" binding:"required"`
	BillingCycle string `json:"billing_cycle" binding:"omitempty,oneof=monthly yearly"`
}

type CreateSubscriptionPaymentRequest struct {
	PlanID       string `json:"plan_id" binding:"required"`
	BillingCycle string `json:"billing_cycle" binding:"omitempty,oneof=monthly yearly"`
}

type SubscriptionPaymentResponse struct {
	InvoiceID     string `json:"invoice_id"`
	InvoiceNumber string `json:"invoice_number"`
	Amount        float64 `json:"amount"`
	SnapToken     string `json:"snap_token"`
	RedirectURL   string `json:"redirect_url"`
}
