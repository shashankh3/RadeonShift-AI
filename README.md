# RadeonShift AI

RadeonShift turns an 18-month manual NVIDIA CUDA to AMD ROCm migration project into a 3-week automated sprint.

```ascii
+-----------------+       +--------------------+       +-----------------+
| legacy.cu       | ----> | hipify-perl (Native)| ----> | target.hip.cpp   |
| (NVIDIA CUDA)   |       | Deterministic Pass  |       | (AMD ROCm)       |
+-----------------+       +--------------------+       +-----------------+
                                     |
                                     v
                        +----------------------------+
                        |  Fireworks AI (MoA)        |
                        | - Agent A: NVIDIA Purist   |
                        | - Agent B: AMD Optimizer   |
                        +----------------------------+
                                     |
                                     v
                            [ MI300X Readiness Score ]
```

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, TailwindCSS v4
- Backend: Python FastAPI, uvicorn, asyncio, httpx
- AI: Fireworks AI API with DeepSeek V4 Flash
- Infrastructure: Docker (rocm/dev-ubuntu-22.04)

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the root directory and add your Fireworks AI API key:
```bash
cp .env.example .env
# Edit .env with your FIREWORKS_API_KEY
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
npm install
npm run dev
```

### 4. Docker Deployment (AMD Developer Cloud)
```bash
cd backend
docker build -t radeonshift-backend .
docker run -p 8000:8000 radeonshift-backend
```

### 5. CLI Scanner
Run the batch migration feasibility tool on any codebase:
```bash
python radeonshift_scanner.py /path/to/cuda/repo
```

### 6. GitHub Action
The repository includes a `.github/workflows/radeonshift.yml` which automatically comments an MoA Migration Audit on any Pull Request containing `.cu` or `.cuh` files.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Returns real `rocm-smi` hardware telemetry (or degrades gracefully). |
| POST | `/translate` | Translates CUDA to ROCm and fires parallel MoA agents. |
| GET | `/docs` | Auto-generated Swagger UI / OpenAPI specification. |

## Features
- **Deterministic Translation:** Uses AMD's native `hipify-perl` for guaranteed syntax accuracy.
- **Parallel MoA:** DeepSeek V4 Flash simultaneously audits PTX risks and optimizes for Wavefront64.
- **Enterprise DevSecOps:** CLI scanner and GitHub Actions integrations built-in.
- **No Hallucinations:** AI is isolated to advisory roles (scoring and optimization recommendations).

## License
- Translation Layer: Apache 2.0
- MoA Orchestration & UI: Proprietary
