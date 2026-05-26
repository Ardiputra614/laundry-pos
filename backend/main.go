package main

import (
	"fmt"
	"log"

	"github.com/ardiputra/laundry-pos/internal/config"
	"github.com/ardiputra/laundry-pos/internal/domain"
	"github.com/ardiputra/laundry-pos/internal/handler"
	"github.com/ardiputra/laundry-pos/internal/middleware"
	"github.com/ardiputra/laundry-pos/internal/pkg/database"
	jwtpkg "github.com/ardiputra/laundry-pos/internal/pkg/jwt"
	"github.com/ardiputra/laundry-pos/internal/pkg/migrator"
	"github.com/ardiputra/laundry-pos/internal/pkg/uploader"
	midtranspkg "github.com/ardiputra/laundry-pos/internal/pkg/midtrans"
	ws "github.com/ardiputra/laundry-pos/internal/pkg/websocket"
	"github.com/ardiputra/laundry-pos/internal/repository"
	"github.com/ardiputra/laundry-pos/internal/usecase"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	db := database.New(cfg.DSN())

	migrator.Run(db, "migrations")
	migrator.Seed(db, "seeds/seed.sql")

	jwtManager := jwtpkg.New(cfg.JWTSecret, cfg.JWTAccessExpiration, cfg.JWTRefreshExpiration)

	userRepo := repository.NewUserRepository(db)
	companyRepo := repository.NewCompanyRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	serviceCategoryRepo := repository.NewServiceCategoryRepository(db)
	serviceRepo := repository.NewServiceRepository(db)
	var _ = repository.NewServicePricingRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	orderItemRepo := repository.NewOrderItemRepository(db)
	orderTrackingRepo := repository.NewOrderTrackingRepository(db)
	paymentRepo := repository.NewPaymentRepository(db)
	branchRepo := repository.NewBranchRepository(db)
	outletRepo := repository.NewOutletRepository(db)
	employeeRepo := repository.NewEmployeeRepository(db)
	deviceRepo := repository.NewDeviceRepository(db)
	settingRepo := repository.NewCompanySettingRepository(db)

	// Infrastructure repositories
	notifRepo := repository.NewNotificationRepository(db)
	activityLogRepo := repository.NewActivityLogRepository(db)
	syncLogRepo := repository.NewSyncLogRepository(db)
	_ = syncLogRepo

	authUsecase := usecase.NewAuthUsecase(
		userRepo,
		companyRepo,
		refreshTokenRepo,
		jwtManager,
		cfg.DefaultTrialDays,
	)

	subscriptionPlanRepo := repository.NewSubscriptionPlanRepository(db)
	subscriptionRepo := repository.NewSubscriptionRepository(db)
	invoiceRepo := repository.NewInvoiceRepository(db)

	midtransClient := midtranspkg.New(cfg.MidtransServerKey, cfg.MidtransProduction)

	serviceUsecase := usecase.NewServiceUsecase(serviceCategoryRepo, serviceRepo)
	orderUsecase := usecase.NewOrderUsecase(orderRepo, orderItemRepo, orderTrackingRepo, serviceRepo, paymentRepo, settingRepo)
	paymentUsecase := usecase.NewPaymentUsecase(paymentRepo, orderRepo, invoiceRepo, subscriptionRepo, companyRepo, subscriptionPlanRepo)
	subscriptionUsecase := usecase.NewSubscriptionUsecase(subscriptionPlanRepo, subscriptionRepo, invoiceRepo, companyRepo, midtransClient)
	superadminUsecase := usecase.NewSuperadminUsecase(companyRepo, userRepo, subscriptionRepo, subscriptionPlanRepo, invoiceRepo)
	branchUsecase := usecase.NewBranchUsecase(branchRepo)
	outletUsecase := usecase.NewOutletUsecase(outletRepo)
	employeeUsecase := usecase.NewEmployeeUsecase(employeeRepo)
	deviceUsecase := usecase.NewDeviceUsecase(deviceRepo)

	reportUsecase := usecase.NewReportUsecase(orderRepo, orderItemRepo)
	settingsUsecase := usecase.NewSettingsUsecase(settingRepo)

	// Infrastructure usecases
	notifUsecase := usecase.NewNotificationUsecase(notifRepo)
	activityUsecase := usecase.NewActivityUsecase(activityLogRepo)
	_ = activityUsecase

	authHandler := handler.NewAuthHandler(authUsecase)
	serviceHandler := handler.NewServiceHandler(serviceUsecase)
	orderHandler := handler.NewOrderHandler(orderUsecase)
	paymentHandler := handler.NewPaymentHandler(paymentUsecase)
	subscriptionHandler := handler.NewSubscriptionHandler(subscriptionUsecase)
	superadminHandler := handler.NewSuperadminHandler(superadminUsecase)
	branchHandler := handler.NewBranchHandler(branchUsecase)
	outletHandler := handler.NewOutletHandler(outletUsecase)
	employeeHandler := handler.NewEmployeeHandler(employeeUsecase)
	deviceHandler := handler.NewDeviceHandler(deviceUsecase)

	reportHandler := handler.NewReportHandler(reportUsecase)
	settingsHandler := handler.NewSettingsHandler(settingsUsecase)

	// Infrastructure handlers
	notifHandler := handler.NewNotificationHandler(notifUsecase)

	// S3 uploader
	var fileUploader *uploader.Uploader
	if cfg.S3Endpoint != "" {
		var err error
		fileUploader, err = uploader.New(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3Bucket, false)
		if err != nil {
			log.Printf("Warning: failed to initialize S3 uploader: %v", err)
		}
	}
	_ = fileUploader

	// WebSocket hub
	wsHub := ws.NewHub()
	wsHandler := handler.NewWebSocketHandler(wsHub)
	go wsHub.Run()

	r := gin.Default()

	r.Use(middleware.Tenant())

	r.NoRoute(func(c *gin.Context) {
		log.Printf("[404] %s %s — route not found (all routes under /api/v1)", c.Request.Method, c.Request.URL.Path)
		c.JSON(404, gin.H{
			"code":    404,
			"message": fmt.Sprintf("route %s %s not found. all routes are under /api/v1 prefix", c.Request.Method, c.Request.URL.Path),
		})
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "laundry-pos"})
	})

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(jwtManager))
		{
			protected.POST("/auth/logout", authHandler.Logout)
			protected.PUT("/auth/change-password", authHandler.ChangePassword)
			protected.GET("/auth/me", authHandler.GetMe)
			protected.GET("/profile", authHandler.GetProfile)

			protected.POST("/services/categories", serviceHandler.CreateCategory)
			protected.GET("/services/categories", serviceHandler.ListCategories)
			protected.POST("/services", serviceHandler.CreateService)
			protected.GET("/services", serviceHandler.ListServices)
			protected.PUT("/services/:id", serviceHandler.UpdateService)
			protected.DELETE("/services/:id", serviceHandler.DeleteService)

			protected.POST("/orders", orderHandler.CreateOrder)
			protected.GET("/orders", orderHandler.ListOrders)
			protected.GET("/orders/:id", orderHandler.GetOrder)
			protected.PUT("/orders/:id/status", orderHandler.UpdateStatus)
			protected.POST("/orders/:id/payment", orderHandler.ProcessPayment)

			protected.GET("/subscription", subscriptionHandler.GetCompanySubscription)
			protected.POST("/subscription/select-plan", subscriptionHandler.SelectPlan)
			protected.POST("/subscription/change-plan", subscriptionHandler.ChangePlan)
			protected.POST("/subscription/create-payment", subscriptionHandler.CreatePayment)
			protected.POST("/subscription/cancel", subscriptionHandler.CancelSubscription)

			protected.GET("/branches", branchHandler.List)
			protected.POST("/branches", branchHandler.Create)
			protected.GET("/branches/:id", branchHandler.GetByID)
			protected.PUT("/branches/:id", branchHandler.Update)
			protected.DELETE("/branches/:id", branchHandler.Delete)

			protected.GET("/outlets", outletHandler.List)
			protected.POST("/outlets", outletHandler.Create)
			protected.GET("/outlets/:id", outletHandler.GetByID)
			protected.PUT("/outlets/:id", outletHandler.Update)
			protected.DELETE("/outlets/:id", outletHandler.Delete)

			protected.GET("/employees", employeeHandler.List)
			protected.POST("/employees", employeeHandler.Create)
			protected.GET("/employees/:id", employeeHandler.GetByID)
			protected.PUT("/employees/:id", employeeHandler.Update)
			protected.DELETE("/employees/:id", employeeHandler.Delete)

			protected.POST("/devices/register", deviceHandler.Register)
			protected.GET("/devices", deviceHandler.List)
			protected.PUT("/devices/:id/deactivate", deviceHandler.Deactivate)

			// Settings routes
			protected.GET("/settings", settingsHandler.GetSettings)
			protected.PUT("/settings", settingsHandler.UpdateSettings)

			// Report routes
			protected.GET("/reports", reportHandler.GetReport)

			// Notification routes
			protected.GET("/notifications", notifHandler.List)
			protected.GET("/notifications/unread", notifHandler.GetUnread)
			protected.PUT("/notifications/:id/read", notifHandler.MarkAsRead)
			protected.PUT("/notifications/read-all", notifHandler.MarkAllAsRead)
			protected.GET("/notifications/count-unread", notifHandler.CountUnread)

			// WebSocket route
			protected.GET("/ws", wsHandler.ServeWS)

			// Superadmin routes
			superadmin := protected.Group("/superadmin")
			superadmin.Use(middleware.RequireRole(domain.RoleSuperAdmin))
			{
				superadmin.GET("/companies", superadminHandler.ListCompanies)
				superadmin.GET("/companies/:id", superadminHandler.GetCompanyDetail)
				superadmin.PUT("/companies/:id/suspend", superadminHandler.SuspendCompany)
				superadmin.PUT("/companies/:id/activate", superadminHandler.ActivateCompany)
				superadmin.GET("/dashboard/stats", superadminHandler.GetDashboardStats)
				superadmin.GET("/system/health", superadminHandler.GetSystemHealth)

				superadmin.POST("/plans", subscriptionHandler.CreatePlan)
				superadmin.PUT("/plans/:id", subscriptionHandler.UpdatePlan)
				superadmin.DELETE("/plans/:id", subscriptionHandler.DeletePlan)
				superadmin.GET("/plans", subscriptionHandler.ListPlans)
			}
		}

		api.POST("/payments/webhook", paymentHandler.HandleMidtransWebhook)

		// Public subscription routes
		api.GET("/plans", subscriptionHandler.ListActivePlans)
	}

	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
