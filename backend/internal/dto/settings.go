package dto

type UpdateSettingsRequest struct {
	TaxEnabled      *bool   `json:"tax_enabled"`
	DefaultTaxRate  float64 `json:"default_tax_rate"`
	DiscountEnabled *bool   `json:"discount_enabled"`
}

type SettingsResponse struct {
	TaxEnabled      bool    `json:"tax_enabled"`
	DefaultTaxRate  float64 `json:"default_tax_rate"`
	DiscountEnabled bool    `json:"discount_enabled"`
}
