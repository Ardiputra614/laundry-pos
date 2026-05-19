package domain

import "time"

type ActivityLog struct {
	ID          string    `gorm:"type:char(36);primaryKey"`
	TenantID    string    `gorm:"type:char(36);index;not null"`
	CompanyID   string    `gorm:"type:char(36);index;not null"`
	UserID      string    `gorm:"type:char(36);index"`
	Action      string    `gorm:"type:varchar(100);not null"`
	EntityType  string    `gorm:"type:varchar(100)"`
	EntityID    string    `gorm:"type:char(36)"`
	Description string    `gorm:"type:text"`
	IPAddress   string    `gorm:"type:varchar(45)"`
	UserAgent   string    `gorm:"type:text"`
	Metadata    string    `gorm:"type:json"`
	CreatedAt   time.Time
}

func (ActivityLog) TableName() string {
	return "activity_logs"
}

type ActivityLogRepository interface {
	Create(log *ActivityLog) error
	FindByTenant(tenantID string, page, limit int) ([]ActivityLog, int64, error)
	FindByCompany(companyID string, page, limit int) ([]ActivityLog, int64, error)
	FindByUser(userID string, page, limit int) ([]ActivityLog, int64, error)
}
