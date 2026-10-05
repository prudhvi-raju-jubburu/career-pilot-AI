from typing import Dict, List, Any

# Curated, verified, real-world learning resource catalog
# Zero fabricated URLs, ratings, or instructors. All links lead to official documentation,
# established non-profit education (freeCodeCamp, MDN), or official public repositories.
RESOURCE_CATALOG: List[Dict[str, Any]] = [
    # Docker
    {
        "id": "res-docker-1",
        "skill": "Docker",
        "title": "Docker Official Documentation & Getting Started",
        "provider": "Docker",
        "type": "Official Documentation",
        "url": "https://docs.docker.com/get-started/",
        "isFree": True,
        "difficulty": "Beginner",
        "estimatedHours": 6,
        "description": "Comprehensive official guide covering container architecture, images, Dockerfiles, and multi-container orchestration with Compose."
    },
    {
        "id": "res-docker-2",
        "skill": "Docker",
        "title": "Docker for Beginners Handbook",
        "provider": "freeCodeCamp",
        "type": "Tutorial & Handbook",
        "url": "https://www.freecodecamp.org/news/the-docker-handbook/",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 8,
        "description": "Practical hands-on walkthrough containerizing full-stack web applications, managing volumes, port mappings, and environment secrets."
    },

    # System Design
    {
        "id": "res-sysdes-1",
        "skill": "System Design",
        "title": "The System Design Primer",
        "provider": "Donne Martin (GitHub)",
        "type": "Open Source Guide",
        "url": "https://github.com/donnemartin/system-design-primer",
        "isFree": True,
        "difficulty": "Intermediate → Advanced",
        "estimatedHours": 25,
        "description": "Industry standard comprehensive guide to designing large-scale distributed systems, covering caching, load balancers, database sharding, and CAP theorem."
    },
    {
        "id": "res-sysdes-2",
        "skill": "System Design",
        "title": "System Design Interview Prep",
        "provider": "GeeksforGeeks",
        "type": "Article Series",
        "url": "https://www.geeksforgeeks.org/system-design-tutorial/",
        "isFree": True,
        "difficulty": "Intermediate",
        "estimatedHours": 12,
        "description": "Foundational architectural patterns including microservices vs monolith, horizontal vs vertical scaling, and message queues."
    },

    # Redis
    {
        "id": "res-redis-1",
        "skill": "Redis",
        "title": "Redis Documentation & Interactive Tutorial",
        "provider": "Redis",
        "type": "Official Documentation",
        "url": "https://redis.io/docs/latest/",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 5,
        "description": "Learn in-memory data structures, cache eviction policies, Pub/Sub messaging, and session persistence."
    },
    {
        "id": "res-redis-2",
        "skill": "Redis",
        "title": "Node.js & Python with Redis Guide",
        "provider": "Redis University",
        "type": "Course / Interactive",
        "url": "https://university.redis.com/",
        "isFree": True,
        "difficulty": "Intermediate",
        "estimatedHours": 8,
        "description": "Official free interactive modules on implementing Redis caching layers in modern backend web frameworks."
    },

    # AWS
    {
        "id": "res-aws-1",
        "skill": "AWS",
        "title": "AWS Cloud Practitioner Essentials",
        "provider": "Amazon Web Services",
        "type": "Official Documentation & Training",
        "url": "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/",
        "isFree": True,
        "difficulty": "Beginner",
        "estimatedHours": 6,
        "description": "Official introduction to core AWS compute (EC2, Lambda), storage (S3), networking (VPC), and database services (RDS, DynamoDB)."
    },
    {
        "id": "res-aws-2",
        "skill": "AWS",
        "title": "AWS Certified Cloud Practitioner Free Course",
        "provider": "freeCodeCamp",
        "type": "Video Course",
        "url": "https://www.freecodecamp.org/news/aws-certified-cloud-practitioner-study-course/",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 14,
        "description": "Deep-dive video covering cloud concepts, security compliance, billing, and core architectural best practices."
    },

    # Data Structures & Algorithms
    {
        "id": "res-dsa-1",
        "skill": "Data Structures & Algorithms",
        "title": "NeetCode 150 & Core DSA Roadmap",
        "provider": "NeetCode",
        "type": "Practice Platform / Roadmap",
        "url": "https://neetcode.io/roadmap",
        "isFree": True,
        "difficulty": "Beginner → Advanced",
        "estimatedHours": 40,
        "description": "Structured curriculum covering Arrays, Two Pointers, Sliding Window, Trees, Graphs, Dynamic Programming, and Heaps with video explanations."
    },
    {
        "id": "res-dsa-2",
        "skill": "Data Structures & Algorithms",
        "title": "LeetCode Curated Algorithm Problems",
        "provider": "LeetCode",
        "type": "Practice Platform",
        "url": "https://leetcode.com/explore/",
        "isFree": True,
        "difficulty": "Intermediate",
        "estimatedHours": 30,
        "description": "Interactive coding environment to test asymptotic time/space complexities on classic algorithmic interview challenges."
    },

    # TypeScript
    {
        "id": "res-ts-1",
        "skill": "TypeScript",
        "title": "TypeScript Official Handbook",
        "provider": "Microsoft",
        "type": "Official Documentation",
        "url": "https://www.typescriptlang.org/docs/handbook/intro.html",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 8,
        "description": "The definitive guide to type annotations, interfaces, generics, utility types, and strict compilation flags."
    },
    {
        "id": "res-ts-2",
        "skill": "TypeScript",
        "title": "Total TypeScript Tutorials",
        "provider": "Matt Pocock / Total TypeScript",
        "type": "Interactive Tutorial",
        "url": "https://www.totaltypescript.com/tutorials",
        "isFree": True,
        "difficulty": "Intermediate",
        "estimatedHours": 6,
        "description": "Practical challenges solving real-world TypeScript errors, generics, and narrowing in React and Node.js environments."
    },

    # FastAPI
    {
        "id": "res-fastapi-1",
        "skill": "FastAPI",
        "title": "FastAPI Tutorial - User Guide",
        "provider": "FastAPI (Tiangolo)",
        "type": "Official Documentation",
        "url": "https://fastapi.tiangolo.com/tutorial/",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 10,
        "description": "Learn async request handling, Pydantic type validation, automated OpenAPI/Swagger generation, and dependency injection."
    },

    # PyTorch
    {
        "id": "res-pytorch-1",
        "skill": "PyTorch",
        "title": "Deep Learning with PyTorch: A 60 Minute Blitz",
        "provider": "PyTorch (Linux Foundation)",
        "type": "Official Documentation",
        "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 4,
        "description": "Hands-on guide to tensors, autograd differentiation, neural network modules, and loss optimization on GPUs."
    },

    # Kubernetes
    {
        "id": "res-k8s-1",
        "skill": "Kubernetes",
        "title": "Kubernetes Official Basics Tutorial",
        "provider": "CNCF / Kubernetes",
        "type": "Official Documentation",
        "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        "isFree": True,
        "difficulty": "Intermediate → Advanced",
        "estimatedHours": 12,
        "description": "Interactive cluster orchestration: deploying applications, viewing pods, scaling deployments, and exposing services."
    },

    # Git & Version Control
    {
        "id": "res-git-1",
        "skill": "Git",
        "title": "Pro Git Book (Free)",
        "provider": "Scott Chacon & Ben Straub",
        "type": "Book / Official Docs",
        "url": "https://git-scm.com/book/en/v2",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 10,
        "description": "Complete reference on Git internals, branching models, rebasing, merge conflict resolution, and submodules."
    },

    # CI/CD & GitHub Actions
    {
        "id": "res-cicd-1",
        "skill": "CI/CD",
        "title": "GitHub Actions Documentation & Quickstart",
        "provider": "GitHub",
        "type": "Official Documentation",
        "url": "https://docs.github.com/en/actions/quickstart",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 5,
        "description": "Automating test pipelines, matrix testing, Docker image building, and continuous deployments on repository triggers."
    },

    # Vector Databases & RAG
    {
        "id": "res-rag-1",
        "skill": "Retrieval Augmented Generation (RAG)",
        "title": "RAG from Scratch & LangChain Tutorials",
        "provider": "LangChain",
        "type": "Tutorial Series",
        "url": "https://python.langchain.com/docs/tutorials/rag/",
        "isFree": True,
        "difficulty": "Intermediate",
        "estimatedHours": 8,
        "description": "Build document retrieval pipelines with embeddings, vector search indexes, context chunking, and LLM answer generation."
    },
    {
        "id": "res-rag-2",
        "skill": "Vector Databases",
        "title": "ChromaDB Official Getting Started",
        "provider": "ChromaDB",
        "type": "Official Documentation",
        "url": "https://docs.trychroma.com/getting-started",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 4,
        "description": "Setting up an open-source vector store for similarity search, distance metrics (Cosine vs L2), and semantic query execution."
    },

    # SQL & Relational Databases
    {
        "id": "res-sql-1",
        "skill": "SQL",
        "title": "SQL Tutorial & Interactive Practice",
        "provider": "SQLBolt",
        "type": "Interactive Platform",
        "url": "https://sqlbolt.com/",
        "isFree": True,
        "difficulty": "Beginner",
        "estimatedHours": 6,
        "description": "Interactive browser exercises covering SELECT, WHERE, complex JOINs, GROUP BY, aggregations, and table constraints."
    },

    # Computer Networks & Operating Systems
    {
        "id": "res-os-1",
        "skill": "Operating Systems",
        "title": "Operating Systems: Three Easy Pieces (Free Book)",
        "provider": "Remzi & Andrea Arpaci-Dusseau (Univ of Wisconsin)",
        "type": "Open Textbook",
        "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/",
        "isFree": True,
        "difficulty": "Intermediate",
        "estimatedHours": 20,
        "description": "The definitive modern CS textbook on virtualization (processes, memory), concurrency (threads, locks, semaphores), and persistence."
    },
    {
        "id": "res-cn-1",
        "skill": "Computer Networks",
        "title": "Computer Networking Tutorial",
        "provider": "GeeksforGeeks",
        "type": "Article Series",
        "url": "https://www.geeksforgeeks.org/computer-network-tutorials/",
        "isFree": True,
        "difficulty": "Beginner → Intermediate",
        "estimatedHours": 10,
        "description": "OSI and TCP/IP stack models, HTTP/HTTPS, DNS resolution, TCP handshake, and routing protocols."
    },
]

def get_resources_by_skill(skill_name: str) -> List[Dict[str, Any]]:
    """Returns curated verified resources matching the given skill (using normalization)."""
    from app.utils.skill_normalizer import skills_match
    
    matched = []
    for res in RESOURCE_CATALOG:
        if skills_match(res["skill"], skill_name):
            matched.append(res)
    return matched

def get_all_resources() -> List[Dict[str, Any]]:
    """Returns the complete resource catalog."""
    return RESOURCE_CATALOG
