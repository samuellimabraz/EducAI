# EduMath AI - Educational Mathematics Assistant for Elementary Students

## 📚 Project Overview

EduMath AI is an educational tool designed to assist elementary school students in learning mathematics. The system combines OCR capabilities for image processing with Large Language Models to provide interactive, pedagogical support aligned with Brazil's National Common Curricular Base (BNCC).

### Key Features
- 🧮 Interactive mathematics tutoring
- 📸 Image recognition for mathematical problems (OCR)
- 📊 Graph visualization tools
- 🔢 Built-in calculator
- 💬 Natural language conversation
- 🎯 Guided learning approach (Socratic method)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │────▶│                 │────▶│                 │
│  React Frontend │     │  FastAPI Backend│     │  Model Servers  │
│                 │◀────│                 │◀────│  (OCR + LLM)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.10+ (for backend development)
- NVIDIA GPU (recommended for model inference)
- 16GB+ RAM minimum

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd eco103
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Configure your `.env` file with appropriate values.

### Running the Complete Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- OlmOCR Server: http://localhost:8001 (AllenAI OlmOCR via vLLM)
- LLM Server: http://localhost:8002

## 📁 Project Structure

```
eco103/
├── backend/            # FastAPI backend application
│   ├── app/           # Application code
│   ├── tests/         # Backend tests
│   └── requirements.txt
├── frontend/          # React frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json
├── models/           # Model configuration and scripts
│   ├── olmocr/      # AllenAI OlmOCR setup (vLLM)
│   └── llm/         # LLM configuration (vLLM)
├── docker/          # Docker configurations
│   ├── backend/
│   ├── frontend/
│   └── models/
├── docs/            # Additional documentation
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Model Servers

#### OlmOCR2 Server
```bash
cd models/olmocr
docker build -t olmocr2-server .
docker run -p 8001:8001 --gpus all olmocr2-server
```

#### LLM Server (using vLLM)
```bash
cd models/llm
docker build -t llm-server .
docker run -p 8002:8002 --gpus all llm-server
```

## 🔧 Configuration

### Model Selection

The project supports various open-source models. Configure in `.env`:

```env
# OlmOCR2 Configuration
OLMOCR_MODEL=allenai/olmOCR-2-7B-1025-FP8
OLMOCR_PORT=8001

# LLM Configuration (Choose one)
LLM_MODEL=Qwen/Qwen2.5-Math-7B-Instruct  # Recommended for math
# LLM_MODEL=Qwen/Qwen2.5-7B-Instruct
# LLM_MODEL=meta-llama/Llama-3.2-3B-Instruct
LLM_PORT=8002

# Backend Configuration
BACKEND_PORT=8000
DATABASE_URL=postgresql://user:password@postgres:5432/edumath

# Frontend Configuration
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8000
```

## 📊 API Endpoints

### Core Endpoints

- `POST /api/chat` - Send message to AI assistant
- `POST /api/ocr` - Process image for text extraction
- `GET /api/history` - Get conversation history
- `POST /api/calculate` - Perform calculations
- `POST /api/graph` - Generate graph visualization

### Example Request

```python
import requests

# Send a chat message with image
response = requests.post(
    "http://localhost:8000/api/chat",
    files={"image": open("math_problem.jpg", "rb")},
    data={"message": "Can you help me solve this problem?"}
)
print(response.json())
```

## 🧑‍🏫 Pedagogical Approach

The AI assistant follows these principles:
1. **Guided Discovery**: Leads students to find answers themselves
2. **Step-by-Step**: Breaks complex problems into manageable parts
3. **Visual Learning**: Uses graphs and visual aids when helpful
4. **Positive Reinforcement**: Encourages students throughout the process
5. **BNCC Alignment**: Content aligned with Brazilian educational standards

## 🔒 Security & Privacy

- No personal data storage
- Session-based interactions only
- Content filtering for appropriate responses
- LGPD compliant
- Parental consent required for usage

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest

# Run frontend tests
cd frontend
npm test

# Run integration tests
docker-compose -f docker-compose.test.yml up
```

## 📈 Performance Optimization

- **Model Quantization**: Uses FP8/INT8 quantization for faster inference
- **Caching**: Redis caching for frequent queries
- **Batch Processing**: Processes multiple requests efficiently
- **GPU Acceleration**: CUDA-enabled for optimal performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Team

- Gabriel Del Monte Schiavi
- Gabrielle Gomes Almeida
- Julia Furtado Araujo
- Pedro Di Luca Martins Chaves
- Samuel Lima Braz

## 🙏 Acknowledgments

- [AllenAI for OlmOCR](https://github.com/allenai/olmocr) - State-of-the-art OCR for mathematical documents
- Qwen Team for mathematical LLMs
- UNIFEI - Federal University of Itajubá
- Course: Informatics and Society

## 📚 References

### OCR Model
- **OlmOCR**: [olmOCR: Unlocking Trillions of Tokens in PDFs with Vision Language Models](https://arxiv.org/abs/2502.18443)
- Model: [allenai/olmOCR-2-7B-1025-FP8](https://huggingface.co/allenai/olmOCR-2-7B-1025-FP8)
- GitHub: [https://github.com/allenai/olmocr](https://github.com/allenai/olmocr)

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the team.

---

**Note**: This project is part of the ECO103 - Informatics and Society discipline at UNIFEI and aims to demonstrate the responsible use of AI in education.
