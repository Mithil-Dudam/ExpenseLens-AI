# ExpenseLens-AI

ExpenseLens-AI is a full-stack, AI-powered expense tracker. Effortlessly scan receipts, extract totals, and categorize expenses with a modern UI.

## Features

- Secure user registration and login
- Upload receipt images (JPG, PNG)
- Automatic text extraction using EasyOCR
- AI-powered parsing and categorization (LangChain + Ollama)
- Expense table with category filters, pagination, and totals
- Responsive, dark-themed React frontend
- FastAPI backend with SQLAlchemy and PostgreSQL
- Timezone-aware timestamps
- Fully containerized with Docker Compose

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, bcrypt, EasyOCR, LangChain/Ollama
- **Database:** PostgreSQL
- **AI Model:** Ollama LLM

## Quick Start (Docker Hub Images)

1. **Clone the repository:**

```sh
git clone https://github.com/Mithil-Dudam/ExpenseLens-AI.git
cd ExpenseLens-AI
```

2. **Set up environment variables:**

- Create a `.env` file in the root directory with your database connection string and any other required variables:
  ```env
  URL_db=postgresql://youruser:yourpassword@db:5432/yourdb
  ```

3. **Run the application:**

```sh
docker compose up
```

Docker will automatically pull the latest images from Docker Hub:

- `notmithil/ocr-backend:latest`
- `notmithil/ocr-frontend:latest`
- `notmithil/ollama:latest`
- `postgres:15-alpine`

4. **Access the app:**

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

## Updating Images

If you make changes to the code, rebuild and push updated images to Docker Hub, then re-run `docker compose up` to use the latest versions.

## Project Structure

- `app.py` — FastAPI backend
- `app_ui/` — React frontend
- `docker-compose.yml` — Multi-service orchestration
- `Dockerfile` — Backend Docker build
- `app_ui/Dockerfile` — Frontend Docker build

## Requirements

- Docker & Docker Compose
- (Optional) Python, Node.js for local development

## License

MIT

---

For questions or contributions, open an issue or pull request on GitHub.
