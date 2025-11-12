#!/bin/bash


if [ "$1" = "hf" ] || [ "$USE_HF_ENDPOINTS" = "true" ]; then
    if [ -z "$HF_TOKEN" ]; then
        echo "x HF_TOKEN environment variable is required for Hugging Face endpoints"
        echo "   Export it: export HF_TOKEN='your-hugging-face-token'"
        exit 1
    fi
    
    echo "Using Hugging Face Endpoints"
    echo ""
    
    # Copy HF env file
    if [ -f "env.hf.example" ]; then
        cp env.hf.example .env
        echo "Using Hugging Face endpoints configuration"
    fi
    
    docker compose -f docker-compose.hf.yml up -d
    
    echo ""
    echo "Services starting at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "Using external endpoints"
    
else
    echo "Using Local vLLM Servers"
    echo ""
    
    if ! nvidia-smi &> /dev/null; then
        echo "⚠️  Warning: No GPU detected. Local model serving requires GPU."
        echo "   Consider using HF endpoints: ./run.sh hf"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
    fi
    
    echo "Starting all services (including model servers)..."
    echo "⚠️  First run will download models (~15GB), this may take 10-20 minutes"
    docker compose up -d
    
    echo ""
    echo "Services starting at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo "  OlmOCR Server: http://localhost:8001"
    echo "  LLM Server: http://localhost:8002"
fi

echo ""
echo "View logs: docker compose logs -f"
echo "Stop: docker compose down"
echo ""

echo "Waiting for services to be ready..."
sleep 5
    
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo " - Backend is ready"
else
    echo " - Backend is starting, check logs if it doesn't start"
fi

echo ""
echo " To test the services:"
if [ "$1" = "hf" ] || [ "$USE_HF_ENDPOINTS" = "true" ]; then
    echo "   USE_HF_ENDPOINTS=true HF_TOKEN=\$HF_TOKEN python test_services.py"
else
    echo "   python test_services.py"
fi

echo "Ready! Open http://localhost:3000 in your browser"
