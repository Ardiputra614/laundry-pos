package dto

type CreateEmployeeRequest struct {
	BranchID     string  `json:"branch_id"`
	EmployeeCode string  `json:"employee_code" binding:"required"`
	FullName     string  `json:"full_name" binding:"required"`
	Phone        string  `json:"phone"`
	Email        string  `json:"email"`
	Position     string  `json:"position"`
	Salary       float64 `json:"salary"`
}

type UpdateEmployeeRequest struct {
	BranchID     string  `json:"branch_id"`
	EmployeeCode string  `json:"employee_code"`
	FullName     string  `json:"full_name"`
	Phone        string  `json:"phone"`
	Email        string  `json:"email"`
	Position     string  `json:"position"`
	Salary       float64 `json:"salary"`
	IsActive     *bool   `json:"is_active"`
}

type EmployeeResponse struct {
	ID           string  `json:"id"`
	CompanyID    string  `json:"company_id"`
	UserID       string  `json:"user_id,omitempty"`
	BranchID     string  `json:"branch_id,omitempty"`
	EmployeeCode string  `json:"employee_code"`
	FullName     string  `json:"full_name"`
	Phone        string  `json:"phone"`
	Email        string  `json:"email"`
	Position     string  `json:"position"`
	Salary       float64 `json:"salary"`
	IsActive     bool    `json:"is_active"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}
