package migrator

import (
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

func Run(db *gorm.DB, migrationsDir string) {
	if err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		filename VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`).Error; err != nil {
		log.Fatalf("failed to create schema_migrations table: %v", err)
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("failed to read migrations directory %s: %v", migrationsDir, err)
	}

	var files []fs.DirEntry
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".up.sql") {
			files = append(files, e)
		}
	}
	sort.Slice(files, func(i, j int) bool { return files[i].Name() < files[j].Name() })

	for _, f := range files {
		var count int64
		db.Raw("SELECT COUNT(*) FROM schema_migrations WHERE filename = ?", f.Name()).Scan(&count)
		if count > 0 {
			continue
		}

		content, err := os.ReadFile(filepath.Join(migrationsDir, f.Name()))
		if err != nil {
			log.Fatalf("failed to read migration %s: %v", f.Name(), err)
		}

		statements := strings.Split(string(content), ";")
		for _, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if err := db.Exec(stmt).Error; err != nil {
				log.Fatalf("migration %s failed: %v\nSQL: %s", f.Name(), err, stmt)
			}
		}

		db.Exec("INSERT INTO schema_migrations (filename) VALUES (?)", f.Name())
		log.Printf("migration applied: %s", f.Name())
	}
}

func Seed(db *gorm.DB, seedFile string) {
	content, err := os.ReadFile(seedFile)
	if err != nil {
		log.Printf("seed file %s not found, skipping", seedFile)
		return
	}

	statements := strings.Split(string(content), ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") {
			continue
		}
		if err := db.Exec(stmt).Error; err != nil {
			log.Printf("seed warning: %v\nSQL: %s", err, stmt)
		}
	}
	log.Printf("seed applied: %s", seedFile)
}
