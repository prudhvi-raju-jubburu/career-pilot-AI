/**
 * CareerPilot AI Client-Side Skill Catalog & Learning Resources
 * 100% Verified URLs from official documentation and reputable open-source platforms.
 * Zero fabricated links or instructors.
 */

export const CANONICAL_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'AI Engineer',
  'Machine Learning Engineer',
  'Data Analyst',
  'Data Scientist',
  'Cloud & DevOps Engineer',
];

export const SKILL_ALIASES = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  'c++': 'C++',
  cpp: 'C++',
  sql: 'SQL',
  react: 'React',
  reactjs: 'React',
  'react.js': 'React',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  'mongo db': 'MongoDB',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  redis: 'Redis',
  dsa: 'Data Structures & Algorithms',
  'data structures': 'Data Structures & Algorithms',
  oop: 'Object-Oriented Programming (OOP)',
  os: 'Operating Systems',
  cn: 'Computer Networks',
  'system design': 'System Design',
  git: 'Git',
  docker: 'Docker',
  'docker containers': 'Docker',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  aws: 'AWS',
  fastapi: 'FastAPI',
  pytorch: 'PyTorch',
  rag: 'Retrieval Augmented Generation (RAG)',
  'vector db': 'Vector Databases',
  'vector databases': 'Vector Databases',
  'ci/cd': 'CI/CD',
};

export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return '';
  const clean = skill.trim().toLowerCase().replace(/[\(\)\[\],]/g, '').trim();
  return SKILL_ALIASES[clean] || skill.trim();
}

export function skillsMatch(a, b) {
  const normA = normalizeSkill(a).toLowerCase();
  const normB = normalizeSkill(b).toLowerCase();
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

export const VERIFIED_RESOURCES = [
  {
    id: 'res-docker-1',
    skill: 'Docker',
    title: 'Docker Official Documentation & Guides',
    provider: 'Docker',
    type: 'Official Documentation',
    url: 'https://docs.docker.com/get-started/',
    isFree: true,
    difficulty: 'Beginner',
    estimatedHours: 6,
    description: 'Learn container architecture, image creation, Dockerfiles, volumes, and multi-container Compose orchestration.',
  },
  {
    id: 'res-docker-2',
    skill: 'Docker',
    title: 'Docker for Beginners Handbook',
    provider: 'freeCodeCamp',
    type: 'Tutorial & Handbook',
    url: 'https://www.freecodecamp.org/news/the-docker-handbook/',
    isFree: true,
    difficulty: 'Beginner → Intermediate',
    estimatedHours: 8,
    description: 'Hands-on walkthrough containerizing full-stack apps, managing port mapping, volume persistence, and environment secrets.',
  },
  {
    id: 'res-sysdes-1',
    skill: 'System Design',
    title: 'The System Design Primer',
    provider: 'GitHub / Donne Martin',
    type: 'Open Source Guide',
    url: 'https://github.com/donnemartin/system-design-primer',
    isFree: true,
    difficulty: 'Intermediate → Advanced',
    estimatedHours: 25,
    description: 'Industry-standard open-source curriculum covering distributed systems, caching, message queues, database sharding, and CAP theorem.',
  },
  {
    id: 'res-redis-1',
    skill: 'Redis',
    title: 'Redis Official Documentation & Quickstart',
    provider: 'Redis',
    type: 'Official Documentation',
    url: 'https://redis.io/docs/latest/',
    isFree: true,
    difficulty: 'Beginner → Intermediate',
    estimatedHours: 5,
    description: 'Master in-memory key-value data structures, cache eviction policies, Pub/Sub messaging, and session stores.',
  },
  {
    id: 'res-aws-1',
    skill: 'AWS',
    title: 'AWS Cloud Practitioner Essentials',
    provider: 'Amazon Web Services',
    type: 'Official Training',
    url: 'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/',
    isFree: true,
    difficulty: 'Beginner',
    estimatedHours: 6,
    description: 'Official introduction to core AWS compute (EC2, Lambda), storage (S3), networking (VPC), and database services (RDS, DynamoDB).',
  },
  {
    id: 'res-dsa-1',
    skill: 'Data Structures & Algorithms',
    title: 'NeetCode 150 Algorithmic Roadmap',
    provider: 'NeetCode',
    type: 'Practice Platform / Video',
    url: 'https://neetcode.io/roadmap',
    isFree: true,
    difficulty: 'Beginner → Advanced',
    estimatedHours: 40,
    description: 'Structured pattern-based problem-solving across Two Pointers, Sliding Window, Trees, Graphs, DP, and Heaps.',
  },
  {
    id: 'res-ts-1',
    skill: 'TypeScript',
    title: 'TypeScript Official Handbook',
    provider: 'Microsoft',
    type: 'Official Documentation',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    isFree: true,
    difficulty: 'Beginner → Intermediate',
    estimatedHours: 8,
    description: 'Official deep dive into static type annotations, interfaces, generics, utility types, and strict compilation options.',
  },
  {
    id: 'res-fastapi-1',
    skill: 'FastAPI',
    title: 'FastAPI Tutorial User Guide',
    provider: 'FastAPI',
    type: 'Official Documentation',
    url: 'https://fastapi.tiangolo.com/tutorial/',
    isFree: true,
    difficulty: 'Beginner → Intermediate',
    estimatedHours: 10,
    description: 'High-throughput async Python endpoints, Pydantic type validation, automated OpenAPI Swagger documentation, and dependency injection.',
  },
  {
    id: 'res-pytorch-1',
    skill: 'PyTorch',
    title: 'Deep Learning with PyTorch: 60 Minute Blitz',
    provider: 'PyTorch (Linux Foundation)',
    type: 'Official Documentation',
    url: 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html',
    isFree: true,
    difficulty: 'Beginner → Intermediate',
    estimatedHours: 4,
    description: 'Hands-on guide to tensors, autograd automatic differentiation, neural network modules, and loss optimization.',
  },
  {
    id: 'res-k8s-1',
    skill: 'Kubernetes',
    title: 'Kubernetes Basics Interactive Tutorial',
    provider: 'CNCF / Kubernetes',
    type: 'Official Documentation',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    isFree: true,
    difficulty: 'Intermediate → Advanced',
    estimatedHours: 12,
    description: 'Deploying containerized apps, viewing pods, scaling deployments, and exposing services with ingress controllers.',
  },
  {
    id: 'res-rag-1',
    skill: 'Retrieval Augmented Generation (RAG)',
    title: 'RAG from Scratch & LangChain Tutorials',
    provider: 'LangChain',
    type: 'Tutorial Series',
    url: 'https://python.langchain.com/docs/tutorials/rag/',
    isFree: true,
    difficulty: 'Intermediate',
    estimatedHours: 8,
    description: 'Connecting LLMs with document chunking, semantic vector embeddings, ChromaDB search, and context augmentation.',
  },
];

export const PRACTICAL_PROJECTS = {
  Docker: {
    title: 'Containerize CareerPilot AI Microservices',
    description: 'Package the React frontend, Flask backend, and MongoDB database into reproducible multi-stage Docker containers with Docker Compose.',
    difficulty: 'Intermediate',
    estimatedDays: '3–5 days',
    requirements: [
      'Write multi-stage Dockerfile for React build with Nginx reverse proxy',
      'Write lightweight Python slim Dockerfile for Flask with Gunicorn',
      'Configure docker-compose.yml linking frontend, backend, and mongo services',
      'Manage persistent volumes and secure environment variables (.env)',
      'Perform container health checks and port forwarding',
    ],
    deliverable: 'Single command `docker compose up --build` launching full stack locally.',
  },
  'System Design': {
    title: 'Design a Distributed Job Alert & Notification Pipeline',
    description: 'Architect an asynchronous notification pipeline that delivers real-time job match alerts to thousands of students without dropping messages.',
    difficulty: 'Advanced',
    estimatedDays: '1–2 weeks',
    requirements: [
      'Draw high-level architecture diagram (API Gateway, Queues, Worker Nodes, DB)',
      'Incorporate Redis / RabbitMQ message queue for rate limiting and backoff retries',
      'Calculate back-of-the-envelope throughput, network bandwidth, and storage capacity',
      'Document trade-offs (Push vs Pull, SQL vs NoSQL, Eventual Consistency)',
    ],
    deliverable: 'System design RFC document with architecture diagram and working queue prototype.',
  },
  Redis: {
    title: 'High-Throughput API Response & Session Caching Layer',
    description: 'Implement an intelligent Redis cache for heavy career match queries with TTL expiration and stale-cache invalidation.',
    difficulty: 'Intermediate',
    estimatedDays: '2–4 days',
    requirements: [
      'Connect Redis client in Python Flask / Node.js backend',
      'Cache opportunity query results with 5-minute Time-To-Live (TTL)',
      'Implement cache invalidation hooks whenever a new job is ingested',
      'Benchmark response latency (cached vs database roundtrip) with Locust/wrk',
    ],
    deliverable: 'Benchmarked caching decorator achieving <15ms response latency.',
  },
  AWS: {
    title: 'Deploy Full-Stack App on AWS ECS & S3',
    description: 'Host static frontend on Amazon S3 + CloudFront and deploy the backend container on AWS Elastic Container Service (ECS) with RDS.',
    difficulty: 'Intermediate → Advanced',
    estimatedDays: '5–7 days',
    requirements: [
      'Configure S3 bucket for static website hosting with CloudFront CDN HTTPS',
      'Push backend Docker image to AWS Elastic Container Registry (ECR)',
      'Launch an ECS Fargate cluster with task definitions and security groups',
      'Provision Amazon RDS PostgreSQL or MongoDB Atlas cloud instance',
    ],
    deliverable: 'Publicly accessible HTTPS web application running on AWS infrastructure.',
  },
  TypeScript: {
    title: 'Strict Type-Safe SaaS Dashboard with Generic API Client',
    description: 'Refactor a JavaScript frontend to strict TypeScript with strict null checks, discriminated unions, and automated API type interfaces.',
    difficulty: 'Intermediate',
    estimatedDays: '4–6 days',
    requirements: [
      'Configure tsconfig.json with `strict: true` and no implicit any',
      'Define strongly-typed DTO interfaces for user profile, opportunities, and applications',
      'Write a generic Axios client wrapper enforcing response payload types',
      'Utilize discriminated unions for async state (Loading, Success, Error)',
    ],
    deliverable: 'Zero-lint warning, fully typed interactive student dashboard.',
  },
  'Retrieval Augmented Generation (RAG)': {
    title: 'Build a CareerPilot Resume Q&A Semantic Assistant',
    description: 'Create a vector search RAG pipeline allowing recruiters and students to ask natural language questions against resume PDFs.',
    difficulty: 'Intermediate → Advanced',
    estimatedDays: '4–7 days',
    requirements: [
      'Extract and chunk resume text using recursive character splitters',
      'Generate semantic embeddings and store in ChromaDB vector database',
      'Implement similarity retrieval with top-k nearest neighbors',
      'Prompt Gemini / LLM with retrieved context to answer specific technical questions',
    ],
    deliverable: 'Interactive question-answering CLI or web UI backed by vector search.',
  },
};

export const TOPIC_SEQUENCES = {
  Docker: [
    { level: 1, title: 'Fundamentals', topics: ['Containers vs Virtual Machines', 'Docker Engine Architecture', 'Pulling & Running Images'] },
    { level: 2, title: 'Development', topics: ['Writing clean Dockerfiles', 'Exposing Ports', 'Persistent Data Volumes', 'Environment Variables (.env)'] },
    { level: 3, title: 'Networking', topics: ['Docker Bridge & Host Networks', 'Inter-container communication', 'DNS service discovery'] },
    { level: 4, title: 'Production', topics: ['Docker Compose orchestration', 'Multi-stage builds', 'Minimizing image size with Alpine/Distroless'] },
    { level: 5, title: 'Practical Project', topics: ['Containerize CareerPilot AI with Frontend, Backend & MongoDB'] },
  ],
  'System Design': [
    { level: 1, title: 'Fundamentals', topics: ['Vertical vs Horizontal Scaling', 'Latency vs Throughput', 'CAP Theorem trade-offs'] },
    { level: 2, title: 'Caching & Load Balancing', topics: ['Reverse Proxies (Nginx)', 'Load Balancer Algorithms', 'Redis Caching Strategies'] },
    { level: 3, title: 'Databases & Storage', topics: ['SQL vs NoSQL trade-offs', 'Database Sharding & Replication', 'Read Replicas'] },
    { level: 4, title: 'Asynchronous Architecture', topics: ['Message Queues (RabbitMQ/Kafka)', 'Pub/Sub models', 'Rate Limiting & Token Bucket'] },
    { level: 5, title: 'Practical Project', topics: ['Design a High-Throughput Notification & Match Feed Pipeline'] },
  ],
  Redis: [
    { level: 1, title: 'Fundamentals', topics: ['In-memory key-value architecture', 'Basic Data Types (Strings, Hashes, Sets)', 'CLI Commands'] },
    { level: 2, title: 'Cache Implementation', topics: ['TTL Expiration & Eviction Policies', 'Cache Stampede Prevention', 'Python/Node Integration'] },
    { level: 3, title: 'Advanced Features', topics: ['Redis Pub/Sub Messaging', 'Sorted Sets for Leaderboards', 'Atomic Transactions'] },
    { level: 4, title: 'Reliability & Clustering', topics: ['RDB vs AOF Persistence', 'Redis Sentinel for High Availability', 'Cluster Sharding'] },
    { level: 5, title: 'Practical Project', topics: ['Implement API Response Caching for High-Frequency Queries'] },
  ],
  AWS: [
    { level: 1, title: 'Cloud Basics & IAM', topics: ['Cloud Computing Models (IaaS, PaaS, SaaS)', 'AWS Console & CLI', 'IAM Roles & Policies'] },
    { level: 2, title: 'Compute & Storage', topics: ['Amazon EC2 Instances & SSH', 'Security Groups & Firewalls', 'Amazon S3 Object Storage'] },
    { level: 3, title: 'Networking & Databases', topics: ['Virtual Private Cloud (VPC)', 'Public vs Private Subnets', 'Amazon RDS PostgreSQL/MySQL'] },
    { level: 4, title: 'Containers & Serverless', topics: ['Elastic Container Registry (ECR)', 'AWS ECS Fargate Deployments', 'AWS Lambda Serverless'] },
    { level: 5, title: 'Practical Project', topics: ['Deploy Full-Stack Application on AWS ECS with S3 Static Frontend'] },
  ],
};

export const mockSupportedRoles = CANONICAL_ROLES;

const FALLBACK_GAP_SKILLS = [
  { name: 'Docker', priority: 'High' },
  { name: 'AWS', priority: 'Medium' },
  { name: 'TypeScript', priority: 'High' },
  { name: 'System Design', priority: 'Medium' },
];

export const mockSkillRequirements = Object.fromEntries(
  CANONICAL_ROLES.map((role) => [role, { skills: FALLBACK_GAP_SKILLS }])
);
