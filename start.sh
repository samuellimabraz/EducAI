#!/bin/bash

# EduMath AI - Quick Start Script

echo "🚀 Starting EduMath AI..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOF
# Database Configuration
POSTGRES_USER=edumath
POSTGRES_PASSWORD=edumath123
POSTGRES_DB=edumath_db
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PORT=6379

# OlmOCR2 Configuration
OLMOCR_MODEL=allenai/OlmOCR-GPT4o-mini
OLMOCR_PORT=8001

# LLM Configuration
LLM_MODEL=Qwen/Qwen2.5-Math-7B-Instruct
LLM_PORT=8002
LLM_QUANTIZATION=awq
MAX_MODEL_LEN=8192
GPU_MEMORY_UTILIZATION=0.9

# Backend Configuration
BACKEND_PORT=8000
SECRET_KEY=your-secret-key-$(date +%s)
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000

# Frontend Configuration
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8000

# Security
CONTENT_FILTER_ENABLED=true
MAX_MESSAGE_LENGTH=2000
MAX_IMAGE_SIZE_MB=10
EOF
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🔧 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Function to check if a service is ready
check_service() {
    local url=$1
    local name=$2
    if curl -f -s $url > /dev/null; then
        echo "✅ $name is ready"
        return 0
    else
        echo "⚠️  $name is not ready yet"
        return 1
    fi
}

# Check each service
check_service "http://localhost:8000/health" "Backend API"
check_service "http://localhost:3000" "Frontend"

echo ""
echo "🎉 EduMath AI is starting!"
echo ""
echo "📚 Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 View logs with: docker-compose logs -f"
echo "🛑 Stop with: docker-compose down"
echo ""
echo "Note: Model servers may take a few minutes to fully initialize on first run."
