import re
from typing import Dict, List

# Standard canonical dictionary mapping common aliases and variations to canonical skill names
SKILL_ALIASES: Dict[str, str] = {
    # Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "java script": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "c++": "C++",
    "cpp": "C++",
    "c plus plus": "C++",
    "c#": "C#",
    "csharp": "C#",
    "java": "Java",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "sql": "SQL",
    "html": "HTML/CSS",
    "css": "HTML/CSS",
    "html5": "HTML/CSS",
    "css3": "HTML/CSS",

    # Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "redux": "Redux",

    # Backend
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node js": "Node.js",
    "express": "Express",
    "expressjs": "Express",
    "express.js": "Express",
    "flask": "Flask",
    "django": "Django",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "restful": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "graphql": "GraphQL",

    # Databases
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "mongo db": "MongoDB",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "my sql": "MySQL",
    "redis": "Redis",
    "sqlite": "SQLite",

    # Core CS & Engineering
    "dsa": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "data structures and algorithms": "Data Structures & Algorithms",
    "data structures & algorithms": "Data Structures & Algorithms",
    "oop": "Object-Oriented Programming (OOP)",
    "oops": "Object-Oriented Programming (OOP)",
    "object oriented programming": "Object-Oriented Programming (OOP)",
    "os": "Operating Systems",
    "operating systems": "Operating Systems",
    "operating system": "Operating Systems",
    "cn": "Computer Networks",
    "computer networks": "Computer Networks",
    "networking": "Computer Networks",
    "dbms": "Database Management Systems",
    "system design": "System Design",
    "distributed systems": "Distributed Systems",

    # DevOps & Cloud
    "git": "Git",
    "github": "Git",
    "gitlab": "Git",
    "git / github": "Git",
    "docker": "Docker",
    "docker containers": "Docker",
    "containerization": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud Platform (GCP)",
    "google cloud": "Google Cloud Platform (GCP)",
    "azure": "Microsoft Azure",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "github actions": "GitHub Actions",
    "terraform": "Terraform",
    "linux": "Linux / Bash",
    "bash": "Linux / Bash",
    "shell": "Linux / Bash",

    # AI & ML
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "scikitlearn": "Scikit-Learn",
    "llm": "Large Language Models (LLMs)",
    "llms": "Large Language Models (LLMs)",
    "rag": "Retrieval Augmented Generation (RAG)",
    "vector db": "Vector Databases",
    "vector database": "Vector Databases",
    "vector databases": "Vector Databases",
    "chromadb": "Vector Databases",
    "pinecone": "Vector Databases",
    "nlp": "Natural Language Processing (NLP)",
    "computer vision": "Computer Vision",
    "cv": "Computer Vision",
}

def normalize_skill(skill_name: str) -> str:
    """Normalizes a raw skill string into its canonical representation."""
    if not skill_name or not isinstance(skill_name, str):
        return ""
    
    clean = skill_name.strip().lower()
    # Remove excessive punctuation
    clean_key = re.sub(r'[\(\)\[\],]', '', clean).strip()

    if clean_key in SKILL_ALIASES:
        return SKILL_ALIASES[clean_key]

    # Partial substring matches for common abbreviations
    for alias, canonical in SKILL_ALIASES.items():
        if clean_key == alias.lower():
            return canonical

    # Return title-cased clean string if no alias found
    return skill_name.strip()

def normalize_skill_list(skills: List[str]) -> List[str]:
    """Returns a unique, normalized list of skills preserving order."""
    seen = set()
    result = []
    for s in skills:
        norm = normalize_skill(s)
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            result.append(norm)
    return result

def skills_match(skill_a: str, skill_b: str) -> bool:
    """Checks whether two skill strings match using canonical normalization."""
    norm_a = normalize_skill(skill_a).lower()
    norm_b = normalize_skill(skill_b).lower()
    if norm_a == norm_b:
        return True
    # Substring containment for compound terms
    if norm_a in norm_b or norm_b in norm_a:
        return True
    return False
