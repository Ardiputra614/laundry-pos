package dto

type ServiceUsageItem struct {
	ServiceName string  `json:"service_name"`
	Count       int     `json:"count"`
	Revenue     float64 `json:"revenue"`
}

type ReportResponse struct {
	TotalOrders    int                    `json:"total_orders"`
	TotalRevenue   float64                `json:"total_revenue"`
	TotalDiscount  float64                `json:"total_discount"`
	TotalTax       float64                `json:"total_tax"`
	NetRevenue     float64                `json:"net_revenue"`
	AvgPerDay      float64                `json:"avg_per_day"`
	StartDate      string                 `json:"start_date"`
	EndDate        string                 `json:"end_date"`
	ServiceUsage   []ServiceUsageItem     `json:"service_usage"`
	OrdersByStatus map[string]int         `json:"orders_by_status"`
}
