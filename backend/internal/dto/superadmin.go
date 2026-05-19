package dto

type CompanyListResponse struct {
	ID          string `json:"id"`
	TenantID    string `json:"tenant_id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Plan        string `json:"plan"`
	SubStatus   string `json:"sub_status"`
	IsActive    bool   `json:"is_active"`
	IsSuspended bool   `json:"is_suspended"`
	MaxUsers    int    `json:"max_users"`
	MaxBranches int    `json:"max_branches"`
	UserCount   int64  `json:"user_count"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type CompanyDetailResponse struct {
	ID          string       `json:"id"`
	TenantID    string       `json:"tenant_id"`
	Name        string       `json:"name"`
	Slug        string       `json:"slug"`
	Logo        string       `json:"logo"`
	Address     string       `json:"address"`
	Phone       string       `json:"phone"`
	Email       string       `json:"email"`
	TaxID       string       `json:"tax_id"`
	Currency    string       `json:"currency"`
	Timezone    string       `json:"timezone"`
	IsActive    bool         `json:"is_active"`
	IsSuspended bool         `json:"is_suspended"`
	Plan        string       `json:"plan"`
	SubStatus   string       `json:"sub_status"`
	MaxUsers    int          `json:"max_users"`
	MaxBranches int          `json:"max_branches"`
	CreatedAt   string       `json:"created_at"`
	UpdatedAt   string       `json:"updated_at"`
	Subscription *SubscriptionResponse `json:"subscription,omitempty"`
	UserCount   int64        `json:"user_count"`
}

type DashboardStatsResponse struct {
	TotalCompanies        int64   `json:"total_companies"`
	ActiveCompanies       int64   `json:"active_companies"`
	SuspendedCompanies    int64   `json:"suspended_companies"`
	TrialCompanies        int64   `json:"trial_companies"`
	ActiveSubscriptions   int64   `json:"active_subscriptions"`
	MonthlyRevenue        float64 `json:"monthly_revenue"`
	TotalRevenue          float64 `json:"total_revenue"`
	NewCompaniesThisMonth int64   `json:"new_companies_this_month"`
}

type SystemHealthResponse struct {
	Database  ServiceStatus `json:"database"`
	API       ServiceStatus `json:"api"`
	Uptime    string        `json:"uptime"`
	Version   string        `json:"version"`
}

type ServiceStatus struct {
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}
