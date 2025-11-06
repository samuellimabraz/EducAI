# EduMath AI - Guia de Configuração

## Requisitos Mínimos

- **Sistema Operacional**: Linux/macOS/Windows com WSL2
- **Docker**: versão 20.10+
- **Docker Compose**: versão 1.29+
- **RAM**: 16GB mínimo (recomendado 32GB)
- **GPU**: NVIDIA com CUDA 11.8+ (recomendado para melhor performance)
- **Espaço em Disco**: 50GB livres

## Instalação Rápida

### 1. Clone o repositório

```bash
git clone <repository-url>
cd eco103
```

### 2. Execute o script de inicialização

```bash
./start.sh
```

O script irá:
- Verificar dependências
- Criar arquivo de configuração (.env)
- Construir imagens Docker
- Iniciar todos os serviços
- Verificar a saúde dos serviços

### 3. Acesse a aplicação

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **OlmOCR API**: http://localhost:8001
- **LLM API**: http://localhost:8002

## Configuração Manual

### 1. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste conforme necessário:

```bash
cp .env.example .env
```

### 2. Construir as imagens

```bash
docker-compose build
```

### 3. Iniciar os serviços

```bash
docker-compose up -d
```

### 4. Verificar logs

```bash
docker-compose logs -f
```

## Escolha de Modelos

### Modelo OCR - AllenAI OlmOCR

- **allenai/olmOCR-2-7B-1025-FP8** (padrão)
  - Estado da arte em OCR para documentos matemáticos
  - Suporte para LaTeX, tabelas e escrita à mão
  - Requer ~10-12GB de VRAM
  - Servido via vLLM para máxima eficiência
  - [Documentação oficial](https://github.com/allenai/olmocr)

### Modelos LLM Recomendados para Matemática

1. **Qwen2.5-Math-7B-Instruct** (padrão)
   - Melhor performance em matemática
   - Requer ~14GB de VRAM

2. **DeepSeek-Math-7B-Instruct**
   - Boa alternativa para matemática
   - Similar em requisitos

3. **Llama-3.2-3B-Instruct**
   - Menor, mais rápido
   - Requer ~6GB de VRAM

## Resolução de Problemas

### Erro: "Out of memory"

Ajuste a utilização de memória GPU no arquivo `.env`:

```env
GPU_MEMORY_UTILIZATION=0.7
```

### Serviços não iniciam

1. Verifique os logs:
```bash
docker-compose logs [service-name]
```

2. Verifique se as portas estão livres:
```bash
netstat -tuln | grep -E "3000|8000|8001|8002"
```

### Modelos demoram para carregar

Na primeira execução, os modelos precisam ser baixados. Isso pode levar:
- OlmOCR: ~5-10 minutos
- LLM: ~10-20 minutos

## Desenvolvimento

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

## Comandos Úteis

### Parar todos os serviços

```bash
docker-compose down
```

### Limpar volumes e recomeçar

```bash
docker-compose down -v
docker-compose up -d
```

### Atualizar um serviço específico

```bash
docker-compose up -d --build [service-name]
```

### Ver uso de recursos

```bash
docker stats
```

## Segurança

1. **Sempre mude a SECRET_KEY** em produção
2. **Configure HTTPS** com certificado SSL
3. **Limite CORS_ORIGINS** para domínios específicos
4. **Ative todos os filtros de conteúdo** para uso com crianças
5. **Configure rate limiting** apropriado

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs dos containers
2. Consulte a documentação da API em /docs
3. Abra uma issue no GitHub
