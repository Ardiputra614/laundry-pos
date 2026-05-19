package usecase

import (
	"errors"
	"net/http"
	"time"

	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/dto"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	jwtpkg "github.com/ardiputra/laundry-pos/internal/pkg/jwt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthUsecase struct {
	userRepo         domain.UserRepository
	companyRepo      domain.CompanyRepository
	refreshTokenRepo domain.RefreshTokenRepository
	jwtManager       *jwtpkg.Manager
	defaultTrialDays int
}

func NewAuthUsecase(
	userRepo domain.UserRepository,
	companyRepo domain.CompanyRepository,
	refreshTokenRepo domain.RefreshTokenRepository,
	jwtManager *jwtpkg.Manager,
	defaultTrialDays int,
) *AuthUsecase {
	return &AuthUsecase{
		userRepo:         userRepo,
		companyRepo:      companyRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtManager:       jwtManager,
		defaultTrialDays: defaultTrialDays,
	}
}

func (uc *AuthUsecase) Register(ctx *gin.Context, req dto.RegisterRequest) (*dto.AuthResponse, int, error) {
	existing, err := uc.userRepo.FindByEmail(req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, 500, err
	}
	if existing != nil {
		return nil, 409, domain.ErrEmailExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, 500, err
	}

	tenantID := uuid.New().String()
	companyID := uuid.New().String()
	userID := uuid.New().String()

	role := domain.UserRole(req.Role)
	if role == "" || role == domain.RoleSuperAdmin {
		role = domain.RoleCompanyAdmin
	}

	now := time.Now()
	trialExp := now.AddDate(0, 0, uc.defaultTrialDays)

	company := &domain.Company{
		ID:          companyID,
		TenantID:    tenantID,
		Name:        req.FullName + "'s Company",
		Slug:        uuid.New().String()[:8],
		IsActive:    true,
		Plan:        domain.PlanBasic,
		SubStatus:   domain.SubTrial,
		SubExpiresAt: &trialExp,
		MaxUsers:    5,
		MaxBranches: 1,
	}

	if err := uc.companyRepo.Create(company); err != nil {
		return nil, 500, err
	}

	user := &domain.User{
		ID:        userID,
		TenantID:  tenantID,
		CompanyID: companyID,
		Email:     req.Email,
		Password:  string(hashedPassword),
		FullName:  req.FullName,
		Phone:     req.Phone,
		Role:      role,
		IsActive:  true,
	}

	if err := uc.userRepo.Create(user); err != nil {
		return nil, 500, err
	}

	accessToken, exp, err := uc.jwtManager.GenerateAccessToken(userID, tenantID, companyID, string(role), user.Email)
	if err != nil {
		return nil, 500, err
	}

	refreshToken, refreshExp, err := uc.jwtManager.GenerateRefreshToken(userID)
	if err != nil {
		return nil, 500, err
	}

	uc.refreshTokenRepo.Create(&domain.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    userID,
		Token:     refreshToken,
		ExpiresAt: refreshExp,
	})

	resp := &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    exp,
		User: dto.UserDTO{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Phone:    user.Phone,
			Role:     string(user.Role),
			IsActive: user.IsActive,
		},
	}

	return resp, 201, nil
}

func (uc *AuthUsecase) Login(ctx *gin.Context, req dto.LoginRequest) (*dto.AuthResponse, int, error) {
	user, err := uc.userRepo.FindByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 401, domain.ErrUnauthorized
		}
		return nil, 500, err
	}

	if !user.IsActive {
		return nil, 403, domain.ErrForbidden
	}

	company, err := uc.companyRepo.FindByID(user.CompanyID)
	if err == nil && company.IsSuspended {
		return nil, 403, domain.ErrCompanySuspended
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, 401, domain.ErrUnauthorized
	}

	accessToken, exp, err := uc.jwtManager.GenerateAccessToken(user.ID, user.TenantID, user.CompanyID, string(user.Role), user.Email)
	if err != nil {
		return nil, 500, err
	}

	refreshToken, refreshExp, err := uc.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, 500, err
	}

	if req.DeviceID != "" {
		uc.refreshTokenRepo.DeleteByUserID(user.ID)
	}

	uc.refreshTokenRepo.Create(&domain.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     refreshToken,
		DeviceID:  req.DeviceID,
		ExpiresAt: refreshExp,
	})

	now := time.Now()
	user.LastLoginAt = &now
	uc.userRepo.Update(user)

	resp := &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    exp,
		User: dto.UserDTO{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Phone:    user.Phone,
			Role:     string(user.Role),
			IsActive: user.IsActive,
		},
	}

	return resp, 200, nil
}

func (uc *AuthUsecase) RefreshToken(c *gin.Context, req dto.RefreshRequest) (*dto.AuthResponse, int, error) {
	storedToken, err := uc.refreshTokenRepo.FindByToken(req.RefreshToken)
	if err != nil {
		return nil, 401, domain.ErrInvalidToken
	}

	if time.Now().After(storedToken.ExpiresAt) {
		return nil, 401, domain.ErrTokenExpired
	}

	claims, err := uc.jwtManager.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, 401, domain.ErrInvalidToken
	}

	user, err := uc.userRepo.FindByID(claims.UserID)
	if err != nil {
		return nil, 401, domain.ErrUnauthorized
	}

	uc.refreshTokenRepo.DeleteByUserID(user.ID)

	accessToken, exp, err := uc.jwtManager.GenerateAccessToken(user.ID, user.TenantID, user.CompanyID, string(user.Role), user.Email)
	if err != nil {
		return nil, 500, err
	}

	newRefreshToken, refreshExp, err := uc.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, 500, err
	}

	uc.refreshTokenRepo.Create(&domain.RefreshToken{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Token:     newRefreshToken,
		ExpiresAt: refreshExp,
	})

	resp := &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    exp,
		User: dto.UserDTO{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Phone:    user.Phone,
			Role:     string(user.Role),
			IsActive: user.IsActive,
		},
	}

	return resp, 200, nil
}

func (uc *AuthUsecase) ChangePassword(c *gin.Context, req dto.ChangePasswordRequest) (int, error) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return http.StatusUnauthorized, domain.ErrUnauthorized
	}

	user, err := uc.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, domain.ErrNotFound
		}
		return http.StatusInternalServerError, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return http.StatusBadRequest, errors.New("current password is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return http.StatusInternalServerError, err
	}

	user.Password = string(hashedPassword)
	if err := uc.userRepo.Update(user); err != nil {
		return http.StatusInternalServerError, err
	}

	if err := uc.refreshTokenRepo.DeleteByUserID(userID); err != nil {
		return http.StatusInternalServerError, err
	}

	return http.StatusOK, nil
}

func (uc *AuthUsecase) Logout(c *gin.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return domain.ErrUnauthorized
	}
	return uc.refreshTokenRepo.DeleteByUserID(userID)
}

func (uc *AuthUsecase) GetProfile(c *gin.Context) (*dto.UserDTO, error) {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return nil, domain.ErrUnauthorized
	}

	user, err := uc.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	return &dto.UserDTO{
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
		Phone:    user.Phone,
		Role:     string(user.Role),
		IsActive: user.IsActive,
	}, nil
}
