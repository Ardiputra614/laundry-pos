package repository

import (
	"github.com/ardiputra/laundry-pos/internal/domain"
	"gorm.io/gorm"
)

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) domain.NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notif *domain.Notification) error {
	return r.db.Create(notif).Error
}

func (r *notificationRepository) FindByID(id string) (*domain.Notification, error) {
	var notif domain.Notification
	err := r.db.Where("id = ?", id).First(&notif).Error
	if err != nil {
		return nil, err
	}
	return &notif, nil
}

func (r *notificationRepository) FindByUser(userID string, page, limit int) ([]domain.Notification, int64, error) {
	var notifications []domain.Notification
	var total int64

	query := r.db.Model(&domain.Notification{}).Where("user_id = ?", userID)
	query.Count(&total)

	offset := (page - 1) * limit
	err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&notifications).Error
	if err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (r *notificationRepository) FindUnreadByUser(userID string) ([]domain.Notification, error) {
	var notifications []domain.Notification
	err := r.db.Where("user_id = ? AND is_read = ?", userID, false).
		Order("created_at DESC").
		Find(&notifications).Error
	if err != nil {
		return nil, err
	}
	return notifications, nil
}

func (r *notificationRepository) CountUnread(userID string) (int64, error) {
	var total int64
	err := r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&total).Error
	return total, err
}

func (r *notificationRepository) MarkAsRead(id string) error {
	return r.db.Model(&domain.Notification{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{"is_read": true, "read_at": gorm.Expr("NOW()")}).Error
}

func (r *notificationRepository) MarkAllAsRead(userID string) error {
	return r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{"is_read": true, "read_at": gorm.Expr("NOW()")}).Error
}

func (r *notificationRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Notification{}).Error
}
