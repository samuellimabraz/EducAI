# EducAI - Educational AI Assistant for Elementary Mathematics

<div align="center">

![EducAI Logo](assets/logo.png)

**An intelligent mathematics learning assistant for elementary school students**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-v3.11+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-v18.3+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-green.svg)](https://www.docker.com/)

</div>

## About EducAI

EducAI is an AI-powered educational platform designed to help elementary school students learn mathematics through interactive tools and personalized assistance. Developed as part of the Informatics and Society discipline at UNIFEI (Universidade Federal de Itajubá).

### Team
- [Gabriel Del Monte Schiavi](https://github.com/gabrieldelmonte)
- [Gabrielle Gomes Almeida](https://github.com/gavgms12)
- [Julia Furtado Araujo](https://github.com/Jubss2)
- [Pedro Di Luca Martins Chaves](https://github.com/PedroWChaves)
- [Samuel Lima Braz](https://github.com/samuellimabraz) 

## Features

### AI Chat Assistant
- Natural language understanding for math questions
- Step-by-step problem-solving guidance
- Image recognition for handwritten problems (OCR)
- Personalized learning support

### Interactive Math Tools
- **📊 Graph Visualizer**: Plot and analyze functions
- **🍕 Fraction Visualizer**: Visual fraction operations
- **📏 Number Line**: Interactive number operations
- **🧮 Calculator**: Smart calculation tool
- **✏️ Sketch Pad**: Draw and solve problems

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/EducAI.git
cd EducAI
```

2. **Set up environment variables**
```bash
cp env.hf.example .env
# Edit .env with your API keys
```

3. **Run with Docker**
```bash
# Using Hugging Face endpoints
docker-compose -f docker-compose.hf.yml up

# Or using local models
docker-compose up
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Project Structure

```
EducAI/
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   │   ├── services/ # AI services (OCR, LLM, Math)
│   │   └── models.py # Data models
│   └── Dockerfile
├── frontend/         # React frontend  
│   ├── src/
│   │   ├── components/ # React components
│   │   └── App.js     # Main app
│   └── Dockerfile
├── docker/           # Docker configurations
├── assets/           # Sample questions and images
└── docker-compose.yml
```

## 🔑 Environment Variables

Create a `.env` file with:

```env
# Database
POSTGRES_USER=edumath
POSTGRES_PASSWORD=edumath123
POSTGRES_DB=edumath_db

# Hugging Face Endpoints (if using)
OLMOCR_URL=your_olmocr_endpoint
OLMOCR_API_KEY=your_api_key
LLM_URL=your_llm_endpoint  
LLM_API_KEY=your_api_key

# App Configuration
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-change-this
```

See `env.hf.example` for more details.

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Technologies Used

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Redis
- **Frontend**: React, KaTeX, Recharts
- **AI/ML**: OlmOCR, Qwen Math LLM, vLLM
- **Infrastructure**: Docker, Docker Compose
- **Tools**: NumPy, Matplotlib, Sympy

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
Made with ❤️ by UNIFEI Students
</div>
