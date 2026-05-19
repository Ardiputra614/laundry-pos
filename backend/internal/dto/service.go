package dto

type CreateServiceRequest struct {
	CategoryID     string  `json:"category_id"`
	Name           string  `json:"name" binding:"required"`
	Description    string  `json:"description"`
	PriceType      string  `json:"price_type" binding:"required,oneof=weight piece"`
	Unit           string  `json:"unit" binding:"required"`
	BasePrice      float64 `json:"base_price" binding:"required,min=0"`
	MinQuantity    float64 `json:"min_quantity"`
	EstimatedHours int     `json:"estimated_hours"`
	IsActive       bool    `json:"is_active"`
}

type UpdateServiceRequest struct {
	CategoryID     string  `json:"category_id"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	PriceType      string  `json:"price_type" binding:"omitempty,oneof=weight piece"`
	Unit           string  `json:"unit"`
	BasePrice      float64 `json:"base_price" binding:"min=0"`
	MinQuantity    float64 `json:"min_quantity"`
	EstimatedHours int     `json:"estimated_hours"`
	IsActive       *bool   `json:"is_active"`
}

type ServiceResponse struct {
	ID             string  `json:"id"`
	CategoryID     string  `json:"category_id"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	PriceType      string  `json:"price_type"`
	Unit           string  `json:"unit"`
	BasePrice      float64 `json:"base_price"`
	MinQuantity    float64 `json:"min_quantity"`
	EstimatedHours int     `json:"estimated_hours"`
	IsActive       bool    `json:"is_active"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

type CategoryResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
	SortOrder   int    `json:"sort_order"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}
