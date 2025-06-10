DIR = /Volumes/SSD02/Private/Dev/WebAR

.PHONY: install dev build lint format clean info ar-dev

install:
	@echo "📦 Installing dependencies..."
	npm install --prefix $(DIR)

dev:
	@echo "🚀 Starting development server..."
	cd $(DIR) && npm run dev

ar-dev:
	@echo "📱 Starting AR development server (HTTPS)..."
	cd $(DIR) && npm run ar-dev

build:
	@echo "🔧 Building project..."
	cd $(DIR) && npm run build

lint:
	@echo "🔍 Running ESLint..."
	cd $(DIR) && npx eslint src --ext .ts --fix

format:
	@echo "✨ Formatting code with Prettier..."
	cd $(DIR) && npx prettier --write "src/**/*.{ts,js,json}" "*.{json,md}"

type-check:
	@echo "🔧 Running TypeScript type check..."
	cd $(DIR) && npx tsc --noEmit

test:
	@echo "🧪 Running tests..."
	@echo "⚠️  No tests configured yet"

check-all: lint type-check
	@echo "✅ All checks completed"

clean:
	@echo "🧹 Cleaning up..."
	rm -rf $(DIR)/node_modules
	rm -rf $(DIR)/dist
	@echo "✅ Cleaned node_modules and dist"

info:
	@echo "📂 Project Directory: $(DIR)"
	@echo ""
	@echo "📋 Available Commands:"
	@echo "  make install   - Install dependencies"
	@echo "  make dev       - Start development server"
	@echo "  make ar-dev    - Start AR development server (HTTPS)"
	@echo "  make build     - Build for production"
	@echo "  make lint      - Run ESLint"
	@echo "  make format    - Format code with Prettier"
	@echo "  make type-check - Run TypeScript type checking"
	@echo "  make test      - Run tests"
	@echo "  make check-all - Run all checks (lint + type-check)"
	@echo "  make clean     - Remove node_modules and dist"
	@echo "  make info      - Show this help message"
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  1. make install"
	@echo "  2. make dev"