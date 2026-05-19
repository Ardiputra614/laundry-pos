package domain

import "time"

type Notification struct {
	ID            string     `gorm:"type:char(36);primaryKey"`
	TenantID      string     `gorm:"type:char(36);index;not null"`
	CompanyID     string     `gorm:"type:char(36);index;not null"`
	UserID        string     `gorm:"type:char(36);index"`
	Title         string     `gorm:"type:varchar(255);not null"`
	Body          string     `gorm:"type:text"`
	Type          string     `gorm:"type:varchar(50);not null;default:'info'"`
	Channel       string     `gorm:"type:varchar(20);not null;default:'in_app'"`
	ReferenceType string     `gorm:"type:varchar(100)"`
	ReferenceID   string     `gorm:"type:char(36)"`
	IsRead        bool       `gorm:"not null;default:false"`
	ReadAt        *time.Time
	CreatedAt     time.Time
}

func (Notification) TableName() string {
	return "notifications"
}

type NotificationRepository interface {
	Create(notif *Notification) error
	FindByID(id string) (*Notification, error)
	FindByUser(userID string, page, limit int) ([]Notification, int64, error)
	FindUnreadByUser(userID string) ([]Notification, error)
	CountUnread(userID string) (int64, error)
	MarkAsRead(id string) error
	MarkAllAsRead(userID string) error
	Delete(id string) error
}
