from typing import Dict, List, Any

# Structured skill requirement models for industry target roles
# Highly configurable and extensible.
TARGET_ROLE_REQUIREMENTS: Dict[str, Dict[str, Any]] = {
    "Software Engineer": {
        "title": "Software Engineer",
        "category": "Core Engineering",
        "description": "Develop reliable, scalable software solutions by mastering core computer science foundations, algorithms, object-oriented design, and modern production engineering.",
        "skills": {
            "core": [
                {"name": "Data Structures & Algorithms", "importance": "Critical", "category": "Core", "prerequisites": []},
                {"name": "Python", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "C++", "importance": "High", "category": "Language", "prerequisites": []},
                {"name": "Object-Oriented Programming (OOP)", "importance": "Critical", "category": "Core", "prerequisites": []},
                {"name": "Git", "importance": "High", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "SQL", "importance": "High", "category": "Databases", "prerequisites": []},
                {"name": "REST APIs", "importance": "High", "category": "Development", "prerequisites": ["Python"]},
                {"name": "Database Management Systems", "importance": "High", "category": "Core", "prerequisites": ["SQL"]},
            ],
            "engineering": [
                {"name": "Operating Systems", "importance": "High", "category": "Engineering", "prerequisites": ["C++"]},
                {"name": "Computer Networks", "importance": "High", "category": "Engineering", "prerequisites": []},
                {"name": "System Design", "importance": "High", "category": "Engineering", "prerequisites": ["REST APIs", "SQL"]},
            ],
            "optional": [
                {"name": "Docker", "importance": "Medium", "category": "DevOps", "prerequisites": ["Operating Systems"]},
                {"name": "AWS", "importance": "Medium", "category": "Cloud", "prerequisites": ["Docker"]},
                {"name": "CI/CD", "importance": "Low", "category": "Automation", "prerequisites": ["Git"]},
            ]
        },
        "futureSkills": [
            {"name": "System Design & Distributed Systems", "reason": "Essential for senior SDE interviews and designing microservices handling millions of QPS.", "category": "Architecture"},
            {"name": "Cloud Native Architecture (AWS/GCP)", "reason": "Modern engineering teams deploy directly to managed serverless and container clouds.", "category": "Cloud"},
            {"name": "AI-Assisted Development", "reason": "Accelerating code generation, automated test writing, and developer velocity using LLMs.", "category": "AI Tools"}
        ]
    },

    "Full Stack Developer": {
        "title": "Full Stack Developer",
        "category": "Web Development",
        "description": "Build modern responsive client applications and robust scalable backend APIs with relational and NoSQL databases.",
        "skills": {
            "core": [
                {"name": "JavaScript", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "React", "importance": "Critical", "category": "Frontend", "prerequisites": ["JavaScript"]},
                {"name": "Node.js", "importance": "Critical", "category": "Backend", "prerequisites": ["JavaScript"]},
                {"name": "Git", "importance": "High", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "REST APIs", "importance": "High", "category": "Backend", "prerequisites": ["Node.js"]},
                {"name": "MongoDB", "importance": "High", "category": "Database", "prerequisites": []},
                {"name": "SQL", "importance": "High", "category": "Database", "prerequisites": []},
                {"name": "TypeScript", "importance": "High", "category": "Language", "prerequisites": ["JavaScript"]},
            ],
            "engineering": [
                {"name": "Docker", "importance": "High", "category": "DevOps", "prerequisites": ["Node.js"]},
                {"name": "Redis", "importance": "Medium", "category": "Caching", "prerequisites": ["MongoDB", "SQL"]},
                {"name": "System Design", "importance": "Medium", "category": "Engineering", "prerequisites": ["REST APIs"]},
            ],
            "optional": [
                {"name": "AWS", "importance": "Medium", "category": "Cloud", "prerequisites": ["Docker"]},
                {"name": "CI/CD", "importance": "Low", "category": "Automation", "prerequisites": ["Git"]},
                {"name": "GraphQL", "importance": "Low", "category": "API", "prerequisites": ["REST APIs"]},
            ]
        },
        "futureSkills": [
            {"name": "Next.js & Server Components", "reason": "Combines server-side rendering, streaming, and edge caching into one unified React framework.", "category": "Frontend"},
            {"name": "Vector Databases & AI Integration", "reason": "Enables integrating conversational AI and document embeddings into SaaS web apps.", "category": "AI Web"},
            {"name": "Serverless & Edge Compute", "reason": "Deploying zero-cold-start APIs closer to global users via Cloudflare Workers and AWS Lambda.", "category": "Cloud"}
        ]
    },

    "Frontend Developer": {
        "title": "Frontend Developer",
        "category": "Web Development",
        "description": "Craft intuitive, accessible, performant user interfaces with modern React, TypeScript, state management, and web vitals optimization.",
        "skills": {
            "core": [
                {"name": "JavaScript", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "HTML/CSS", "importance": "Critical", "category": "Frontend", "prerequisites": []},
                {"name": "React", "importance": "Critical", "category": "Frontend", "prerequisites": ["JavaScript"]},
                {"name": "Git", "importance": "High", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "TypeScript", "importance": "High", "category": "Language", "prerequisites": ["JavaScript"]},
                {"name": "REST APIs", "importance": "High", "category": "Integration", "prerequisites": ["JavaScript"]},
                {"name": "Redux", "importance": "Medium", "category": "State Management", "prerequisites": ["React"]},
                {"name": "Tailwind CSS", "importance": "Medium", "category": "Styling", "prerequisites": ["HTML/CSS"]},
            ],
            "engineering": [
                {"name": "Web Performance & Vitals", "importance": "Medium", "category": "Optimization", "prerequisites": ["React"]},
                {"name": "Testing (Jest / RTL)", "importance": "Medium", "category": "Quality", "prerequisites": ["React"]},
            ],
            "optional": [
                {"name": "Next.js", "importance": "Medium", "category": "Framework", "prerequisites": ["React"]},
                {"name": "Docker", "importance": "Low", "category": "DevOps", "prerequisites": []},
            ]
        },
        "futureSkills": [
            {"name": "Micro-Frontends", "reason": "Modular architecture allowing independent teams to deploy discrete UI fragments.", "category": "Architecture"},
            {"name": "WebAssembly (WASM)", "reason": "Running high-performance C++/Rust compiled code directly inside modern browsers.", "category": "Performance"}
        ]
    },

    "Backend Developer": {
        "title": "Backend Developer",
        "category": "Server & APIs",
        "description": "Design resilient server architectures, high-performance database schemas, caching layers, and secure RESTful microservices.",
        "skills": {
            "core": [
                {"name": "Python", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "Node.js", "importance": "Critical", "category": "Language / Runtime", "prerequisites": []},
                {"name": "SQL", "importance": "Critical", "category": "Databases", "prerequisites": []},
                {"name": "REST APIs", "importance": "Critical", "category": "Architecture", "prerequisites": ["Python"]},
                {"name": "Git", "importance": "High", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "FastAPI", "importance": "High", "category": "Framework", "prerequisites": ["Python"]},
                {"name": "PostgreSQL", "importance": "High", "category": "Database", "prerequisites": ["SQL"]},
                {"name": "MongoDB", "importance": "High", "category": "NoSQL Database", "prerequisites": []},
                {"name": "Database Management Systems", "importance": "High", "category": "Core", "prerequisites": ["SQL"]},
            ],
            "engineering": [
                {"name": "Docker", "importance": "Critical", "category": "DevOps", "prerequisites": []},
                {"name": "Redis", "importance": "High", "category": "Caching", "prerequisites": ["SQL"]},
                {"name": "System Design", "importance": "High", "category": "Architecture", "prerequisites": ["REST APIs", "SQL"]},
                {"name": "Computer Networks", "importance": "Medium", "category": "Core", "prerequisites": []},
            ],
            "optional": [
                {"name": "AWS", "importance": "High", "category": "Cloud", "prerequisites": ["Docker"]},
                {"name": "CI/CD", "importance": "Medium", "category": "DevOps", "prerequisites": ["Git"]},
                {"name": "Kubernetes", "importance": "Medium", "category": "Orchestration", "prerequisites": ["Docker"]},
            ]
        },
        "futureSkills": [
            {"name": "Event-Driven Microservices (Kafka / RabbitMQ)", "reason": "Decoupling high-volume transaction processing with asynchronous pub/sub message brokers.", "category": "Distributed Systems"},
            {"name": "gRPC & Protocol Buffers", "reason": "High-throughput binary RPC communication between internal cloud services.", "category": "Networking"}
        ]
    },

    "AI Engineer": {
        "title": "AI Engineer",
        "category": "Artificial Intelligence",
        "description": "Build, evaluate, fine-tune, and deploy foundation models, RAG pipelines, and intelligent agentic workflows into production software.",
        "skills": {
            "core": [
                {"name": "Python", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "Machine Learning", "importance": "Critical", "category": "Core AI", "prerequisites": ["Python"]},
                {"name": "Large Language Models (LLMs)", "importance": "Critical", "category": "Generative AI", "prerequisites": ["Python"]},
                {"name": "Git", "importance": "High", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "Retrieval Augmented Generation (RAG)", "importance": "Critical", "category": "GenAI", "prerequisites": ["Python", "Large Language Models (LLMs)"]},
                {"name": "Vector Databases", "importance": "High", "category": "Databases", "prerequisites": ["Python"]},
                {"name": "REST APIs", "importance": "High", "category": "Deployment", "prerequisites": ["Python"]},
                {"name": "FastAPI", "importance": "High", "category": "Serving", "prerequisites": ["Python", "REST APIs"]},
            ],
            "engineering": [
                {"name": "Docker", "importance": "High", "category": "DevOps", "prerequisites": ["Python"]},
                {"name": "Deep Learning", "importance": "High", "category": "Core AI", "prerequisites": ["Machine Learning"]},
                {"name": "PyTorch", "importance": "High", "category": "Framework", "prerequisites": ["Python", "Deep Learning"]},
            ],
            "optional": [
                {"name": "AWS", "importance": "Medium", "category": "Cloud", "prerequisites": ["Docker"]},
                {"name": "Model Evaluation & Benchmarking", "importance": "Medium", "category": "Quality", "prerequisites": ["Large Language Models (LLMs)"]},
            ]
        },
        "futureSkills": [
            {"name": "Autonomous AI Agents (LangGraph / AutoGen)", "reason": "Multi-agent systems executing complex tool calls and reasoning over multi-step workflows.", "category": "Agentic AI"},
            {"name": "AI Observability & Guardrails", "reason": "Tracking hallucination rates, token latencies, and security prompt injection in production.", "category": "AI Ops"},
            {"name": "Fine-Tuning with LoRA/QLoRA", "reason": "Efficiently adapting open-weights models to specialized company knowledge domains.", "category": "Model Training"}
        ]
    },

    "Machine Learning Engineer": {
        "title": "Machine Learning Engineer",
        "category": "Data Science & ML",
        "description": "Develop production ML pipelines, train deep learning networks, optimize loss functions, and serve model predictions at scale.",
        "skills": {
            "core": [
                {"name": "Python", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "Machine Learning", "importance": "Critical", "category": "Core", "prerequisites": ["Python"]},
                {"name": "Deep Learning", "importance": "Critical", "category": "Core", "prerequisites": ["Machine Learning"]},
                {"name": "PyTorch", "importance": "Critical", "category": "Framework", "prerequisites": ["Python", "Deep Learning"]},
                {"name": "Git", "importance": "High", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "NumPy", "importance": "High", "category": "Data", "prerequisites": ["Python"]},
                {"name": "Pandas", "importance": "High", "category": "Data", "prerequisites": ["Python"]},
                {"name": "Scikit-Learn", "importance": "High", "category": "ML", "prerequisites": ["Python", "NumPy"]},
                {"name": "SQL", "importance": "High", "category": "Database", "prerequisites": []},
            ],
            "engineering": [
                {"name": "FastAPI", "importance": "High", "category": "Serving", "prerequisites": ["Python"]},
                {"name": "Docker", "importance": "High", "category": "DevOps", "prerequisites": []},
                {"name": "MLOps & Model Tracking", "importance": "Medium", "category": "MLOps", "prerequisites": ["Machine Learning", "Docker"]},
            ],
            "optional": [
                {"name": "AWS", "importance": "Medium", "category": "Cloud", "prerequisites": ["Docker"]},
                {"name": "TensorFlow", "importance": "Low", "category": "Framework", "prerequisites": ["Deep Learning"]},
            ]
        },
        "futureSkills": [
            {"name": "MLOps Feature Stores (Feast)", "reason": "Centralizing feature engineering logic across offline training and real-time inference.", "category": "MLOps"},
            {"name": "Quantization & TensorRT Inference", "reason": "Compressing weights to INT8/FP16 for 4x faster GPU inference latency.", "category": "Inference Optimization"}
        ]
    },

    "Cloud & DevOps Engineer": {
        "title": "Cloud & DevOps Engineer",
        "category": "Infrastructure",
        "description": "Automate CI/CD pipelines, containerize microservices, provision infrastructure as code, and monitor production reliability.",
        "skills": {
            "core": [
                {"name": "Linux / Bash", "importance": "Critical", "category": "OS", "prerequisites": []},
                {"name": "Docker", "importance": "Critical", "category": "Containers", "prerequisites": ["Linux / Bash"]},
                {"name": "Git", "importance": "Critical", "category": "Tooling", "prerequisites": []},
                {"name": "Python", "importance": "High", "category": "Scripting", "prerequisites": []},
            ],
            "development": [
                {"name": "AWS", "importance": "Critical", "category": "Cloud", "prerequisites": ["Linux / Bash", "Docker"]},
                {"name": "CI/CD", "importance": "Critical", "category": "Automation", "prerequisites": ["Git"]},
                {"name": "GitHub Actions", "importance": "High", "category": "Automation", "prerequisites": ["CI/CD"]},
                {"name": "Computer Networks", "importance": "High", "category": "Networking", "prerequisites": []},
            ],
            "engineering": [
                {"name": "Kubernetes", "importance": "Critical", "category": "Orchestration", "prerequisites": ["Docker", "Linux / Bash"]},
                {"name": "Terraform", "importance": "High", "category": "IaC", "prerequisites": ["AWS"]},
                {"name": "Prometheus & Monitoring", "importance": "Medium", "category": "Observability", "prerequisites": ["Docker"]},
            ],
            "optional": [
                {"name": "Google Cloud Platform (GCP)", "importance": "Medium", "category": "Cloud", "prerequisites": ["AWS"]},
                {"name": "System Design", "importance": "Medium", "category": "Architecture", "prerequisites": []},
            ]
        },
        "futureSkills": [
            {"name": "GitOps (ArgoCD)", "reason": "Declarative, automated Kubernetes cluster synchronizations powered directly by Git commits.", "category": "GitOps"},
            {"name": "Service Mesh (Istio / Linkerd)", "reason": "Transparent mTLS encryption, traffic shifting, and circuit breaking between microservices.", "category": "Networking"}
        ]
    },

    "Data Analyst": {
        "title": "Data Analyst",
        "category": "Analytics",
        "description": "Extract business insights from raw data using advanced SQL queries, Python data analysis libraries, and visual dashboards.",
        "skills": {
            "core": [
                {"name": "SQL", "importance": "Critical", "category": "Database", "prerequisites": []},
                {"name": "Python", "importance": "Critical", "category": "Language", "prerequisites": []},
                {"name": "Excel / Spreadsheets", "importance": "High", "category": "Tools", "prerequisites": []},
                {"name": "Git", "importance": "Medium", "category": "Tooling", "prerequisites": []},
            ],
            "development": [
                {"name": "Pandas", "importance": "Critical", "category": "Data Analysis", "prerequisites": ["Python"]},
                {"name": "NumPy", "importance": "High", "category": "Data Analysis", "prerequisites": ["Python"]},
                {"name": "Data Visualization (Matplotlib / Seaborn)", "importance": "High", "category": "Visualization", "prerequisites": ["Python"]},
                {"name": "Database Management Systems", "importance": "High", "category": "Databases", "prerequisites": ["SQL"]},
            ],
            "engineering": [
                {"name": "Tableau / Power BI", "importance": "High", "category": "BI Tools", "prerequisites": ["SQL"]},
                {"name": "Statistical Analysis & A/B Testing", "importance": "Medium", "category": "Statistics", "prerequisites": []},
            ],
            "optional": [
                {"name": "Machine Learning", "importance": "Low", "category": "Advanced", "prerequisites": ["Python", "Pandas"]},
                {"name": "AWS", "importance": "Low", "category": "Cloud", "prerequisites": []},
            ]
        },
        "futureSkills": [
            {"name": "dbt (Data Build Tool)", "reason": "Transforming data in the warehouse using modular SQL and version control.", "category": "Analytics Engineering"},
            {"name": "Snowflake & BigQuery", "reason": "Querying petabyte-scale cloud data warehouses with lightning fast columnar execution.", "category": "Data Cloud"}
        ]
    }
}

# 5-Level Learning Sequence Topics per Skill
SKILL_TOPIC_SEQUENCES: Dict[str, List[Dict[str, Any]]] = {
    "Docker": [
        {"level": 1, "title": "Fundamentals", "topics": ["Containers vs Virtual Machines", "Docker Engine Architecture", "Pulling & Running Images"]},
        {"level": 2, "title": "Development", "topics": ["Writing clean Dockerfiles", "Exposing Ports", "Persistent Data Volumes", "Environment Variables (.env)"]},
        {"level": 3, "title": "Networking", "topics": ["Docker Bridge & Host Networks", "Inter-container communication", "DNS service discovery"]},
        {"level": 4, "title": "Production", "topics": ["Docker Compose orchestration", "Multi-stage builds", "Minimizing image size with Alpine/Distroless"]},
        {"level": 5, "title": "Practical Project", "topics": ["Containerize CareerPilot AI with Frontend, Backend & MongoDB"]}
    ],
    "System Design": [
        {"level": 1, "title": "Fundamentals", "topics": ["Vertical vs Horizontal Scaling", "Latency vs Throughput", "CAP Theorem trade-offs"]},
        {"level": 2, "title": "Caching & Load Balancing", "topics": ["Reverse Proxies (Nginx)", "Load Balancer Algorithms", "Redis Caching Strategies (Cache-Aside, Write-Through)"]},
        {"level": 3, "title": "Databases & Storage", "topics": ["SQL vs NoSQL trade-offs", "Database Sharding & Replication", "Read Replicas & Connection Pooling"]},
        {"level": 4, "title": "Asynchronous Architecture", "topics": ["Message Queues (RabbitMQ/Kafka)", "Pub/Sub models", "Rate Limiting & Token Bucket"]},
        {"level": 5, "title": "Practical Project", "topics": ["Design a High-Throughput Notification & Match Feed Pipeline"]}
    ],
    "Redis": [
        {"level": 1, "title": "Fundamentals", "topics": ["In-memory key-value architecture", "Basic Data Types: Strings, Hashes, Lists, Sets", "CLI Commands"]},
        {"level": 2, "title": "Cache Implementation", "topics": ["TTL Expiration & Eviction Policies", "Cache Stampede Prevention", "Python/Node Client Integration"]},
        {"level": 3, "title": "Advanced Features", "topics": ["Redis Pub/Sub Messaging", "Sorted Sets for Leaderboards", "Atomic Transactions (MULTI/EXEC)"]},
        {"level": 4, "title": "Reliability & Clustering", "topics": ["RDB vs AOF Persistence", "Redis Sentinel for High Availability", "Cluster Sharding"]},
        {"level": 5, "title": "Practical Project", "topics": ["Implement API Response Caching for High-Frequency Career Queries"]}
    ],
    "AWS": [
        {"level": 1, "title": "Cloud Basics & IAM", "topics": ["Cloud Computing Models (IaaS, PaaS, SaaS)", "AWS Management Console", "IAM Users, Roles & Security Policies"]},
        {"level": 2, "title": "Compute & Storage", "topics": ["Amazon EC2 Instances", "Security Groups & SSH", "Amazon S3 Object Storage & Bucket Policies"]},
        {"level": 3, "title": "Networking & Databases", "topics": ["Virtual Private Cloud (VPC)", "Public vs Private Subnets", "Amazon RDS PostgreSQL/MySQL"]},
        {"level": 4, "title": "Containers & Serverless", "topics": ["Elastic Container Registry (ECR)", "AWS ECS / Fargate deployments", "AWS Lambda Serverless"]},
        {"level": 5, "title": "Practical Project", "topics": ["Deploy CareerPilot AI on AWS ECS with S3 Static Frontend"]}
    ],
    "Data Structures & Algorithms": [
        {"level": 1, "title": "Asymptotics & Arrays", "topics": ["Big-O Time & Space Complexity", "Arrays & Dynamic Sizing", "Two Pointers Technique"]},
        {"level": 2, "title": "Linear Structures", "topics": ["Sliding Window Algorithms", "Hash Maps & Sets for O(1) Lookups", "Stacks & Queues"]},
        {"level": 3, "title": "Trees & Recursion", "topics": ["Binary Search Trees", "Tree Traversals (BFS & DFS)", "Recursion & Backtracking"]},
        {"level": 4, "title": "Advanced Graphs & DP", "topics": ["Graph Adjacency Lists & Topological Sort", "Dijkstra's Shortest Path", "1D and 2D Dynamic Programming"]},
        {"level": 5, "title": "Practical Project", "topics": ["Solve Top 50 LeetCode Patterns in Dedicated Portfolio Repo"]}
    ],
    "FastAPI": [
        {"level": 1, "title": "Async Basics", "topics": ["Python type hints & Asyncio", "Path and Query parameters", "Automatic Swagger UI docs"]},
        {"level": 2, "title": "Validation & Models", "topics": ["Pydantic BaseModel schemas", "Request Body validation", "HTTP Exception handling"]},
        {"level": 3, "title": "Architecture", "topics": ["Dependency Injection System", "APIRouter modular architecture", "Middleware & CORS"]},
        {"level": 4, "title": "Database & Production", "topics": ["Async SQLAlchemy / Motor integration", "Background Tasks", "Gunicorn / Uvicorn deployment"]},
        {"level": 5, "title": "Practical Project", "topics": ["High-Performance Resume AI Inference Microservice"]}
    ],
    "Retrieval Augmented Generation (RAG)": [
        {"level": 1, "title": "GenAI Foundations", "topics": ["How LLMs process context", "Token limitations & Prompt Engineering", "Vector Embeddings"]},
        {"level": 2, "title": "Document Pipeline", "topics": ["PDF document parsing", "Recursive Text Chunking strategies", "Chunk overlap trade-offs"]},
        {"level": 3, "title": "Vector Stores", "topics": ["ChromaDB setup & collections", "Similarity Metrics (Cosine Distance)", "Metadata Filtering"]},
        {"level": 4, "title": "Retrieval & Generation", "topics": ["Top-K nearest neighbor search", "Prompt augmentation with context", "Hallucination mitigation"]},
        {"level": 5, "title": "Practical Project", "topics": ["Build a Resume Semantic Q&A Assistant"]}
    ],
    "TypeScript": [
        {"level": 1, "title": "Type Foundations", "topics": ["Primitive & Union Types", "Type inference", "Interfaces vs Type Aliases"]},
        {"level": 2, "title": "Complex Types", "topics": ["Discriminated Unions", "Generics syntax", "Optional and Readonly properties"]},
        {"level": 3, "title": "React Integration", "topics": ["Typing React Props & State", "Event Handlers typing", "Custom typed Hooks"]},
        {"level": 4, "title": "Utility Types & Strict Mode", "topics": ["Partial, Pick, Omit, Record", "Type Narrowing & Guards", "tsconfig strict compilation"]},
        {"level": 5, "title": "Practical Project", "topics": ["Refactor Core Components to Strict TypeScript with Zero Any"]}
    ],
    "Kubernetes": [
        {"level": 1, "title": "Container Orchestration", "topics": ["Why Kubernetes?", "Cluster architecture (Control Plane & Nodes)", "kubectl CLI basics"]},
        {"level": 2, "title": "Core Workloads", "topics": ["Pods and ReplicaSets", "Deployment manifests & rolling updates", "Namespaces"]},
        {"level": 3, "title": "Networking & Storage", "topics": ["ClusterIP, NodePort, LoadBalancer services", "Ingress Controllers", "Persistent Volumes (PV/PVC)"]},
        {"level": 4, "title": "Production Readiness", "topics": ["ConfigMaps and Secrets", "Resource Requests & Limits", "Horizontal Pod Autoscaler (HPA)"]},
        {"level": 5, "title": "Practical Project", "topics": ["Deploy Multi-tier Microservices with Auto-scaling on Minikube"]}
    ]
}

def get_role_requirements(role_name: str) -> Dict[str, Any]:
    """Retrieves structured requirements for a role, with fuzzy fallback."""
    from app.utils.skill_normalizer import normalize_skill
    
    clean_name = role_name.strip()
    if clean_name in TARGET_ROLE_REQUIREMENTS:
        return TARGET_ROLE_REQUIREMENTS[clean_name]

    # Partial search
    for r_name, data in TARGET_ROLE_REQUIREMENTS.items():
        if r_name.lower() in clean_name.lower() or clean_name.lower() in r_name.lower():
            return data

    # Default to Software Engineer if unrecognized
    return TARGET_ROLE_REQUIREMENTS["Software Engineer"]

def get_skill_topic_sequence(skill_name: str) -> List[Dict[str, Any]]:
    """Retrieves 5-level topic progression for a skill."""
    from app.utils.skill_normalizer import normalize_skill
    norm = normalize_skill(skill_name)
    if norm in SKILL_TOPIC_SEQUENCES:
        return SKILL_TOPIC_SEQUENCES[norm]
    
    # Generic structured 5-level progression fallback
    return [
        {"level": 1, "title": "Fundamentals", "topics": [f"{norm} syntax & basic concepts", "Environment setup", "Core operations"]},
        {"level": 2, "title": "Development", "topics": [f"Building applications with {norm}", "Debugging & best practices", "Standard libraries"]},
        {"level": 3, "title": "Architecture", "topics": ["Design patterns & optimization", "Error handling & testing", "Modularity"]},
        {"level": 4, "title": "Production", "topics": ["Security & performance tuning", "Production deployment", "Monitoring"]},
        {"level": 5, "title": "Practical Project", "topics": [f"Build and deploy a portfolio-ready project in {norm}"]}
    ]
