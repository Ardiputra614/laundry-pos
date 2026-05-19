package dto

type CreateOutletRequest struct {
	BranchID string `json:"branch_id" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Code     string `json:"code" binding:"required"`
	Address  string `json:"address"`
	Phone    string `json:"phone"`
}

type UpdateOutletRequest struct {
	BranchID string `json:"branch_id"`
	Name     string `json:"name"`
	Code     string `json:"code"`
	Address  string `json:"address"`
	Phone    string `json:"phone"`
	IsActive *bool  `json:"is_active"`
}

type OutletResponse struct {
	ID        string `json:"id"`
	CompanyID string `json:"company_id"`
	BranchID  string `json:"branch_id"`
	Name      string `json:"name"`
	Code      string `json:"code"`
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}
