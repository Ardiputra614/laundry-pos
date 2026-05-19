package domain

import "errors"

var (
	ErrNotFound         = errors.New("not found")
	ErrConflict         = errors.New("conflict")
	ErrUnauthorized     = errors.New("unauthorized")
	ErrForbidden        = errors.New("forbidden")
	ErrValidation       = errors.New("validation error")
	ErrInvalidToken     = errors.New("invalid token")
	ErrTokenExpired     = errors.New("token expired")
	ErrEmailExists      = errors.New("email already exists")
	ErrCompanySuspended = errors.New("company is suspended")
	ErrTenantRequired   = errors.New("tenant id is required")
	ErrRateLimited      = errors.New("rate limit exceeded")
	ErrSubscriptionExpired = errors.New("subscription expired")
)
