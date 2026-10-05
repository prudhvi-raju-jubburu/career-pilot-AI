from typing import Dict, List, Any

# Curated practical project recommendations mapped to core skills
PROJECT_CATALOG: Dict[str, Dict[str, Any]] = {
    "Docker": {
        "title": "Containerize CareerPilot AI Microservices",
        "description": "Package the React frontend, Flask backend, and MongoDB database into reproducible multi-stage Docker containers with Docker Compose.",
        "difficulty": "Intermediate",
        "estimatedDays": "3–5 days",
        "requirements": [
            "Write a multi-stage Dockerfile for React Vite production build with Nginx",
            "Write a lightweight Python slim Dockerfile for Flask with Gunicorn",
            "Configure docker-compose.yml linking frontend, backend, and mongo services",
            "Manage persistent database volumes and secure environment variables (.env)",
            "Perform container health checks and port forwarding"
        ],
        "deliverable": "A single command `docker compose up --build` running the entire full-stack app locally."
    },
    "System Design": {
        "title": "Design a Distributed Job Alert & Notification Pipeline",
        "description": "Architect an asynchronous notification pipeline that delivers real-time job match alerts to thousands of students without dropping messages.",
        "difficulty": "Advanced",
        "estimatedDays": "1–2 weeks",
        "requirements": [
            "Draw high-level architecture diagram (API Gateway, Queues, Worker Nodes, DB)",
            "Incorporate Redis / RabbitMQ message queue for rate limiting and backoff retries",
            "Calculate back-of-the-envelope throughput, network bandwidth, and storage capacity",
            "Document trade-offs (Push vs Pull, SQL vs NoSQL, Eventual Consistency)"
        ],
        "deliverable": "System design RFC document with architecture diagram and working queue prototype."
    },
    "Redis": {
        "title": "High-Throughput API Response & Session Caching Layer",
        "description": "Implement an intelligent Redis cache for heavy career match queries with TTL expiration and stale-cache invalidation.",
        "difficulty": "Intermediate",
        "estimatedDays": "2–4 days",
        "requirements": [
            "Connect Redis client in Python Flask / Node.js backend",
            "Cache opportunity query results with 5-minute Time-To-Live (TTL)",
            "Implement cache invalidation hooks whenever a new job is ingested",
            "Benchmark response latency (cached vs database roundtrip) with Locust/wrk"
        ],
        "deliverable": "Benchmarked caching decorator achieving <15ms response latency."
    },
    "AWS": {
        "title": "Deploy Full-Stack App on AWS ECS & S3",
        "description": "Host static frontend on Amazon S3 + CloudFront and deploy the backend container on AWS Elastic Container Service (ECS) with RDS.",
        "difficulty": "Intermediate → Advanced",
        "estimatedDays": "5–7 days",
        "requirements": [
            "Configure S3 bucket for static website hosting with CloudFront CDN HTTPS",
            "Push backend Docker image to AWS Elastic Container Registry (ECR)",
            "Launch an ECS Fargate cluster with task definitions and security groups",
            "Provision Amazon RDS PostgreSQL or MongoDB Atlas cloud instance"
        ],
        "deliverable": "Publicly accessible HTTPS web application running on AWS infrastructure."
    },
    "TypeScript": {
        "title": "Strict Type-Safe SaaS Dashboard with Generic API Client",
        "description": "Refactor a JavaScript frontend to strict TypeScript with strict null checks, discriminated unions, and automated API type interfaces.",
        "difficulty": "Intermediate",
        "estimatedDays": "4–6 days",
        "requirements": [
            "Configure tsconfig.json with `strict: true` and no implicit any",
            "Define strongly-typed DTO interfaces for user profile, opportunities, and applications",
            "Write a generic Axios client wrapper enforcing response payload types",
            "Utilize discriminated unions for async state (Loading, Success, Error)"
        ],
        "deliverable": "Zero-lint warning, fully typed interactive student dashboard."
    },
    "FastAPI": {
        "title": "Asynchronous AI Resume Inference Microservice",
        "description": "Build a high-performance async REST API with FastAPI that validates uploaded resume PDFs and serves structured inferences.",
        "difficulty": "Intermediate",
        "estimatedDays": "3–5 days",
        "requirements": [
            "Implement async endpoints with Python type hints and Pydantic schemas",
            "Generate automatic Swagger documentation with interactive try-it-out testing",
            "Implement background tasks for asynchronous document embedding",
            "Write automated pytest test cases with TestClient"
        ],
        "deliverable": "Production-grade FastAPI service with 100% test coverage and Swagger docs."
    },
    "PyTorch": {
        "title": "Transfer Learning Job Role Skill Classifier",
        "description": "Fine-tune a pretrained transformer/neural network model to classify tech resumes into target role categories.",
        "difficulty": "Advanced",
        "estimatedDays": "1–2 weeks",
        "requirements": [
            "Tokenize and preprocess textual resume descriptions using HuggingFace / PyTorch tensors",
            "Build PyTorch Dataset and DataLoader with batch shuffling",
            "Implement training loop with CrossEntropyLoss and AdamW optimizer",
            "Evaluate F1 score, precision, and confusion matrix on holdout test set"
        ],
        "deliverable": "Trained PyTorch model weight file (.pt) achieving >85% classification accuracy."
    },
    "Retrieval Augmented Generation (RAG)": {
        "title": "Build a CareerPilot Resume Q&A Semantic Assistant",
        "description": "Create a vector search RAG pipeline allowing recruiters and students to ask natural language questions against resume PDFs.",
        "difficulty": "Intermediate → Advanced",
        "estimatedDays": "4–7 days",
        "requirements": [
            "Extract and chunk resume text using recursive character splitters",
            "Generate semantic embeddings and store in ChromaDB vector database",
            "Implement similarity retrieval with top-k nearest neighbors",
            "Prompt Gemini / LLM with retrieved context to answer specific technical questions"
        ],
        "deliverable": "Interactive question-answering CLI or web UI backed by vector search."
    },
    "Kubernetes": {
        "title": "Microservices Auto-Scaling Cluster Deployment",
        "description": "Deploy a multi-pod containerized application on a local Minikube / K3s cluster with Horizontal Pod Autoscaling (HPA).",
        "difficulty": "Advanced",
        "estimatedDays": "1–2 weeks",
        "requirements": [
            "Write Deployment and Service YAML manifests for web and API tiers",
            "Configure ConfigMaps and Secrets for environment isolation",
            "Set up Nginx Ingress Controller for path-based routing",
            "Enable Horizontal Pod Autoscaler (HPA) based on CPU/Memory thresholds"
        ],
        "deliverable": "Working Kubernetes manifests verified with `kubectl apply` and load-tested autoscaling."
    },
    "Data Structures & Algorithms": {
        "title": "Algorithmic Code Execution & Interview Sandbox",
        "description": "Build an algorithmic sandbox solving the top 50 high-frequency technical interview problems with verified O(N) optimizations.",
        "difficulty": "Intermediate",
        "estimatedDays": "2–3 weeks",
        "requirements": [
            "Implement Core Graph Traversals (BFS, DFS, Dijkstra's)",
            "Solve Sliding Window & Two Pointer problems on sorted datasets",
            "Implement Tree traversals (Inorder, Preorder, Lowest Common Ancestor)",
            "Document time and space complexity analysis for every solution"
        ],
        "deliverable": "Clean GitHub repository showcasing verified algorithmic solutions and test cases."
    }
}

def get_project_by_skill(skill_name: str) -> Dict[str, Any]:
    """Retrieves practical project for the given skill, with alias resolution."""
    from app.utils.skill_normalizer import normalize_skill
    norm = normalize_skill(skill_name)
    if norm in PROJECT_CATALOG:
        return PROJECT_CATALOG[norm]
    # Fallback default project
    return {
        "title": f"Build a Production Application using {norm}",
        "description": f"Develop a comprehensive, portfolio-ready project demonstrating practical proficiency in {norm}.",
        "difficulty": "Intermediate",
        "estimatedDays": "3–5 days",
        "requirements": [
            f"Set up development environment and integrate {norm} into application architecture",
            "Implement core features following industry best practices",
            "Write comprehensive unit and integration tests",
            "Deploy project to GitHub with clear README and architecture documentation"
        ],
        "deliverable": f"Working open-source GitHub repository utilizing {norm}."
    }
