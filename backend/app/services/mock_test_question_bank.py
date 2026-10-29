from typing import Dict, List, Any

# Curated, validated question inventory for job-specific mock tests
# Each question is validated to have 4 distinct choices, exactly 1 matching correct_answer,
# topic metadata, detailed explanation, and difficulty level.
MOCK_TEST_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "tech_1",
        "category": "Technical MCQs",
        "topic": "System Design & Event Architecture",
        "difficulty": "Medium",
        "question_text": "Which architectural pattern is best suited for decoupling microservices so that downstream services can process messages asynchronously without blocking the caller?",
        "options": [
            "Event-Driven Architecture using Message Queues (e.g. RabbitMQ, Kafka)",
            "Synchronous REST requests with tight timeouts",
            "Direct database table sharing across microservice boundaries",
            "Distributed 2-Phase Commit (2PC) over HTTP"
        ],
        "correct_answer": "Event-Driven Architecture using Message Queues (e.g. RabbitMQ, Kafka)",
        "explanation": "Event-driven architecture with message queues decouples producers from consumers, buffering traffic surges and enabling horizontal asynchronous scaling.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_2",
        "category": "Technical MCQs",
        "topic": "Distributed Systems & CAP Theorem",
        "difficulty": "Medium",
        "question_text": "According to the CAP theorem, which property must a distributed system sacrifice when a network partition (P) occurs?",
        "options": [
            "Either Consistency (C) or Availability (A)",
            "Both Consistency and Partition Tolerance",
            "Network latency and throughput",
            "Data persistence on disk storage"
        ],
        "correct_answer": "Either Consistency (C) or Availability (A)",
        "explanation": "Under a network partition, a distributed system must choose between guaranteeing all nodes return the latest write (Consistency) or guaranteeing every non-failing node returns a response (Availability).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_3",
        "category": "Technical MCQs",
        "topic": "Resilience & Fault Tolerance",
        "difficulty": "Medium",
        "question_text": "What is the primary benefit of applying the Circuit Breaker pattern in microservices communication?",
        "options": [
            "It prevents cascading system failures by halting requests to a failing dependency until it recovers",
            "It encrypts payload data across transport layers automatically",
            "It balances incoming HTTP traffic across round-robin backend instances",
            "It compresses responses to reduce egress bandwidth"
        ],
        "correct_answer": "It prevents cascading system failures by halting requests to a failing dependency until it recovers",
        "explanation": "Circuit breakers monitor external calls; when failure thresholds are exceeded, the circuit trips (opens), failing fast rather than overwhelming dying dependencies or exhausting thread pools.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_4",
        "category": "Technical MCQs",
        "topic": "API Gateway & Edge Routing",
        "difficulty": "Easy",
        "question_text": "In microservice architectures, what is the role of an API Gateway?",
        "options": [
            "Centralized entry point providing routing, authentication, rate limiting, and SSL termination",
            "Directly storing the primary domain transactional data",
            "Compiling frontend Single Page Applications into binary WebAssembly",
            "Managing physical server hardware BIOS configurations"
        ],
        "correct_answer": "Centralized entry point providing routing, authentication, rate limiting, and SSL termination",
        "explanation": "An API Gateway acts as a reverse proxy, aggregating client requests, handling cross-cutting concerns like TLS, authentication, metrics, and routing to upstream services.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_5",
        "category": "Technical MCQs",
        "topic": "RESTful APIs & HTTP Semantics",
        "difficulty": "Easy",
        "question_text": "Which HTTP method is required by the HTTP specification to be inherently idempotent?",
        "options": [
            "PUT",
            "POST",
            "PATCH (standard non-idempotent by default)",
            "CONNECT"
        ],
        "correct_answer": "PUT",
        "explanation": "PUT is defined as idempotent: making the exact same PUT request multiple times must yield the exact same resource state as making it once. POST is not idempotent.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_6",
        "category": "Technical MCQs",
        "topic": "Scalability Concepts",
        "difficulty": "Easy",
        "question_text": "What is the difference between horizontal scaling and vertical scaling?",
        "options": [
            "Horizontal scaling adds more instances/machines; vertical scaling increases resources (CPU/RAM) on an existing machine",
            "Horizontal scaling upgrades the operating system; vertical scaling changes the programming language",
            "Horizontal scaling requires monolithic architectures; vertical scaling is strictly for serverless",
            "There is no difference; they are interchangeable terms"
        ],
        "correct_answer": "Horizontal scaling adds more instances/machines; vertical scaling increases resources (CPU/RAM) on an existing machine",
        "explanation": "Horizontal scaling (scale-out) distributes load across multiple servers, whereas vertical scaling (scale-up) provisions more compute capacity on a single node.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_7",
        "category": "Technical MCQs",
        "topic": "Software Design Principles",
        "difficulty": "Easy",
        "question_text": "What does the Single Responsibility Principle (SRP) in SOLID state?",
        "options": [
            "A class or module should have only one reason to change, encapsulating a single responsibility",
            "Every function must have exactly one line of executable code",
            "A system should only use a single programming language across all layers",
            "A database must only contain a single monolithic table"
        ],
        "correct_answer": "A class or module should have only one reason to change, encapsulating a single responsibility",
        "explanation": "SRP asserts that a software module or class should be responsible to only one actor, ensuring high cohesion and low coupling.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_8",
        "category": "Technical MCQs",
        "topic": "Caching Strategies",
        "difficulty": "Medium",
        "question_text": "In caching strategies, what is the 'Cache-Aside' (Lazy Loading) pattern?",
        "options": [
            "The application checks the cache; on a miss, it reads from the DB, stores the result in cache, and returns it",
            "The cache writes directly to the database synchronously before returning to the caller",
            "The database publishes events that update the cache automatically without application intervention",
            "The cache stores all tables in memory permanently upon system boot"
        ],
        "correct_answer": "The application checks the cache; on a miss, it reads from the DB, stores the result in cache, and returns it",
        "explanation": "In Cache-Aside, the application code directly orchestrates reading from cache first, and upon a miss, fetches from the primary datastore and backfills the cache with a TTL.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_9",
        "category": "Technical MCQs",
        "topic": "Caching & Concurrency",
        "difficulty": "Hard",
        "question_text": "What is the 'Thundering Herd' (or Cache Stampede) problem and how can it be mitigated?",
        "options": [
            "Simultaneous cache expiry causes hundreds of parallel requests to hit the database at once; mitigated with mutex locking or probabilistic early expiration",
            "A database runs out of disk space due to unbounded write operations",
            "A load balancer directs all traffic to the first server in the pool",
            "CPU cache lines are invalidated due to frequent memory reallocations"
        ],
        "correct_answer": "Simultaneous cache expiry causes hundreds of parallel requests to hit the database at once; mitigated with mutex locking or probabilistic early expiration",
        "explanation": "When a high-traffic cached key expires, concurrent threads miss simultaneously and overwhelm the database. Mitigations include mutex locking, background warming, or XFetch probabilistic early refresh.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_10",
        "category": "Technical MCQs",
        "topic": "Database Concurrency Control",
        "difficulty": "Medium",
        "question_text": "What is the primary difference between pessimistic locking and optimistic locking in database concurrency?",
        "options": [
            "Pessimistic locking holds exclusive record locks during the transaction; optimistic locking uses version numbers and validates at commit time",
            "Pessimistic locking is for NoSQL; optimistic locking is for relational databases",
            "Pessimistic locking always rolls back transactions; optimistic locking never fails",
            "Optimistic locking guarantees zero deadlocks while completely disabling ACID guarantees"
        ],
        "correct_answer": "Pessimistic locking holds exclusive record locks during the transaction; optimistic locking uses version numbers and validates at commit time",
        "explanation": "Pessimistic locking assumes conflicts are frequent and locks records upfront (SELECT FOR UPDATE). Optimistic locking assumes conflicts are rare, checks version timestamps at update time, and aborts if modified.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_11",
        "category": "Technical MCQs",
        "topic": "API Architecture & Rate Limiting",
        "difficulty": "Medium",
        "question_text": "Which rate-limiting algorithm permits temporary bursts of traffic while enforcing a smooth average rate?",
        "options": [
            "Token Bucket algorithm",
            "Fixed Window Counter algorithm",
            "Strict Round-Robin scheduling",
            "First-Come First-Served FIFO queue"
        ],
        "correct_answer": "Token Bucket algorithm",
        "explanation": "The Token Bucket algorithm accumulates tokens up to a maximum bucket capacity (permitting short bursts) while replenishing tokens at a steady constant rate.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_12",
        "category": "Technical MCQs",
        "topic": "Distributed Transactions",
        "difficulty": "Hard",
        "question_text": "In a microservices architecture, what is the Saga pattern primarily used for?",
        "options": [
            "Managing distributed transactions across multiple service boundaries using a sequence of local transactions and compensating actions",
            "Serving static assets from edge CDNs",
            "Generating cryptographic SSL certificates dynamically",
            "Performing blue-green database schema migrations"
        ],
        "correct_answer": "Managing distributed transactions across multiple service boundaries using a sequence of local transactions and compensating actions",
        "explanation": "The Saga pattern coordinates distributed transactions without blocking two-phase commits. If one step fails, compensating transactions are executed in reverse order to restore eventual consistency.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_13",
        "category": "Technical MCQs",
        "topic": "Real-time Web Communication",
        "difficulty": "Medium",
        "question_text": "What is the key difference between WebSockets and Server-Sent Events (SSE)?",
        "options": [
            "WebSockets provide bidirectional full-duplex communication; SSE provides unidirectional server-to-client streaming over standard HTTP",
            "SSE supports binary audio streaming, while WebSockets only support plain ASCII text",
            "WebSockets require UDP transport, whereas SSE operates over TCP",
            "SSE cannot be used through web browser JavaScript"
        ],
        "correct_answer": "WebSockets provide bidirectional full-duplex communication; SSE provides unidirectional server-to-client streaming over standard HTTP",
        "explanation": "WebSockets open a bidirectional full-duplex TCP connection. SSE provides an efficient, lightweight unidirectional stream from server to client using standard HTTP/1.1 or HTTP/2.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_14",
        "category": "Technical MCQs",
        "topic": "Distributed Messaging",
        "difficulty": "Medium",
        "question_text": "In distributed systems, what is an idempotent consumer in message processing?",
        "options": [
            "A consumer that produces the same system state even if the identical message is received and processed multiple times",
            "A consumer that deletes messages from the queue before acknowledging them",
            "A consumer that operates strictly in-memory without accessing any datastore",
            "A consumer that processes messages in batches of power-of-two sizes"
        ],
        "correct_answer": "A consumer that produces the same system state even if the identical message is received and processed multiple times",
        "explanation": "Because distributed message brokers provide at-least-once delivery, idempotent consumers track processed message IDs (deduplication) to ensure duplicate deliveries cause no unintended side effects.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_15",
        "category": "Technical MCQs",
        "topic": "Backend Performance",
        "difficulty": "Easy",
        "question_text": "What is the purpose of database connection pooling in high-throughput backend services?",
        "options": [
            "To reuse an existing pool of open database connections, eliminating the high TCP and authentication overhead of creating new connections per request",
            "To shard table partitions across physical hard drives automatically",
            "To convert SQL queries into NoSQL JSON documents",
            "To encrypt database passwords in the application configuration"
        ],
        "correct_answer": "To reuse an existing pool of open database connections, eliminating the high TCP and authentication overhead of creating new connections per request",
        "explanation": "Opening and tearing down database TCP sockets with TLS and auth handshakes is CPU-intensive. Connection pools maintain warm connections to reuse across concurrent web requests.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_16",
        "category": "Technical MCQs",
        "topic": "Distributed Consistency Models",
        "difficulty": "Hard",
        "question_text": "Which consistency model guarantees that once a client updates a value, all subsequent reads by that client will observe the updated value?",
        "options": [
            "Read-Your-Writes Consistency",
            "Weak Eventual Consistency",
            "Monotonic Read Consistency",
            "Strict Serializable Consistency across all nodes simultaneously"
        ],
        "correct_answer": "Read-Your-Writes Consistency",
        "explanation": "Read-Your-Writes consistency guarantees that a given process will always see updates it made itself, avoiding user confusion after submitting forms or editing profiles.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_17",
        "category": "Technical MCQs",
        "topic": "Security Fundamentals",
        "difficulty": "Easy",
        "question_text": "What is the difference between authentication and authorization?",
        "options": [
            "Authentication verifies who you are (identity); authorization verifies what you are allowed to do (permissions)",
            "Authentication checks permissions; authorization generates session tokens",
            "Authentication is handled on the client; authorization is only in the database",
            "There is no difference; they are synonymous"
        ],
        "correct_answer": "Authentication verifies who you are (identity); authorization verifies what you are allowed to do (permissions)",
        "explanation": "Authentication (AuthN) proves user identity (e.g. password, MFA). Authorization (AuthZ) evaluates permissions and access control policies (e.g. RBAC, ABAC).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_18",
        "category": "Technical MCQs",
        "topic": "Software Design Principles",
        "difficulty": "Medium",
        "question_text": "What is the Open-Closed Principle (OCP) in software engineering?",
        "options": [
            "Software entities should be open for extension, but closed for modification",
            "Code repositories must be open source but closed for commercial distribution",
            "Classes should expose open public fields rather than private getter/setter methods",
            "Network ports should remain open during production deployment"
        ],
        "correct_answer": "Software entities should be open for extension, but closed for modification",
        "explanation": "OCP states that system behavior can be extended (e.g. via inheritance, interfaces, polymorphism) without modifying the verified, existing source code.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_19",
        "category": "Technical MCQs",
        "topic": "API Protocols & Serialization",
        "difficulty": "Medium",
        "question_text": "What is the primary advantage of gRPC over standard REST/JSON for internal microservice communication?",
        "options": [
            "Binary Protocol Buffers serialization over HTTP/2 provides significantly higher throughput, lower latency, and strict schema contracts",
            "gRPC works natively inside standard web browsers without proxy translation",
            "gRPC does not require defining any data models or interfaces",
            "gRPC operates entirely without network transport layers"
        ],
        "correct_answer": "Binary Protocol Buffers serialization over HTTP/2 provides significantly higher throughput, lower latency, and strict schema contracts",
        "explanation": "gRPC uses compact binary Protobuf serialization and HTTP/2 multiplexing, delivering substantially lower serialization overhead and network bandwidth consumption than text-based REST/JSON.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_20",
        "category": "Technical MCQs",
        "topic": "Cryptography Fundamentals",
        "difficulty": "Medium",
        "question_text": "What is the difference between symmetric and asymmetric encryption?",
        "options": [
            "Symmetric encryption uses a single shared secret key for encryption and decryption; asymmetric encryption uses a public/private key pair",
            "Symmetric encryption is only for passwords; asymmetric encryption is only for file storage",
            "Asymmetric encryption is faster and used for bulk data transfer",
            "Symmetric encryption uses quantum keys; asymmetric uses prime numbers"
        ],
        "correct_answer": "Symmetric encryption uses a single shared secret key for encryption and decryption; asymmetric encryption uses a public/private key pair",
        "explanation": "Symmetric ciphers (e.g. AES-256) use one secret key and are fast for bulk data. Asymmetric ciphers (e.g. RSA, ECC) use public/private key pairs for secure key exchange and digital signatures.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_21",
        "category": "Technical MCQs",
        "topic": "Database Architecture",
        "difficulty": "Medium",
        "question_text": "What is the purpose of database sharding?",
        "options": [
            "Horizontally partitioning data across multiple database server instances based on a shard key to overcome single-machine storage and compute limits",
            "Creating read-only mirrors of the primary database",
            "Compressing historical records to cold archive storage",
            "Encrypting database columns with cryptographic salt"
        ],
        "correct_answer": "Horizontally partitioning data across multiple database server instances based on a shard key to overcome single-machine storage and compute limits",
        "explanation": "Sharding partitions rows across separate database nodes (e.g. by user_id hash), distributing CPU, RAM, and disk I/O beyond the physical limits of any single server.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_22",
        "category": "Technical MCQs",
        "topic": "DevOps & Deployment Strategies",
        "difficulty": "Medium",
        "question_text": "In cloud architecture, what is a Canary Deployment?",
        "options": [
            "Rolling out a new software version to a small subset of real users (e.g. 5%) to validate stability before full fleet deployment",
            "Deploying two identical production environments and flipping the load balancer switch entirely at once",
            "Deploying changes strictly to local developer laptop environments",
            "Running unit tests automatically on every Git commit"
        ],
        "correct_answer": "Rolling out a new software version to a small subset of real users (e.g. 5%) to validate stability before full fleet deployment",
        "explanation": "Canary deployments expose a small percentage of production traffic to the new build, monitoring error rates and performance metrics before rolling it out broadly.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_23",
        "category": "Technical MCQs",
        "topic": "ORM & Database Optimization",
        "difficulty": "Medium",
        "question_text": "What is the N+1 query problem in Object-Relational Mappers (ORMs)?",
        "options": [
            "Executing 1 initial query to fetch N parent records, followed by N separate queries to fetch related child records for each parent",
            "A database query that returns N+1 rows when only N were requested",
            "An algorithm that takes O(N+1) time complexity in the worst case",
            "A connection leak where N+1 sockets remain open in the pool"
        ],
        "correct_answer": "Executing 1 initial query to fetch N parent records, followed by N separate queries to fetch related child records for each parent",
        "explanation": "The N+1 problem occurs when lazy-loading associations in a loop: 1 query fetches 100 users, and 100 subsequent queries fetch each user's profile. Resolved via eager loading (JOINs).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_24",
        "category": "Technical MCQs",
        "topic": "Software Architecture Patterns",
        "difficulty": "Hard",
        "question_text": "What is the CQRS (Command Query Responsibility Segregation) pattern?",
        "options": [
            "Separating the read model (queries) from the write model (commands) into distinct models optimized for their specific access patterns",
            "Combining controllers and database repositories into a single monolithic file",
            "Executing all SQL queries twice to ensure transactional consistency",
            "Using Redis exclusively for both writes and reads"
        ],
        "correct_answer": "Separating the read model (queries) from the write model (commands) into distinct models optimized for their specific access patterns",
        "explanation": "CQRS decouples write operations (commands that mutate state) from read operations (queries that fetch data), allowing each model to scale, cache, and be schema-optimized independently.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "tech_25",
        "category": "Technical MCQs",
        "topic": "Observability & Monitoring",
        "difficulty": "Medium",
        "question_text": "What is distributed tracing and why is it essential in microservices?",
        "options": [
            "Propagating a unique trace ID across HTTP/RPC service hops to correlate logs and track end-to-end request latency across microservices",
            "Tracing source code lines in an interactive local debugger",
            "Tracking user mouse movements and clicks on web frontend pages",
            "Measuring CPU core temperature across physical data centers"
        ],
        "correct_answer": "Propagating a unique trace ID across HTTP/RPC service hops to correlate logs and track end-to-end request latency across microservices",
        "explanation": "Distributed tracing (e.g. OpenTelemetry, Jaeger) passes contextual trace and span headers across asynchronous and synchronous network hops, revealing bottleneck services and failure roots.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_1",
        "category": "Programming Language Fundamentals",
        "topic": "Python Memory & Object References",
        "difficulty": "Easy",
        "question_text": "In Python, what is the key difference between a shallow copy and a deep copy of a compound object?",
        "options": [
            "Shallow copy constructs a new compound object and inserts references to existing child objects; deep copy recursively copies child objects.",
            "Shallow copy duplicates nested objects, while deep copy copies only outer references.",
            "Shallow copy only works on immutable datatypes, while deep copy only works on mutable datatypes.",
            "There is no functional difference; they are aliases in the copy module."
        ],
        "correct_answer": "Shallow copy constructs a new compound object and inserts references to existing child objects; deep copy recursively copies child objects.",
        "explanation": "A shallow copy (copy.copy) creates a new container but populates it with references to the original nested elements. Deep copy (copy.deepcopy) constructs a completely independent clone recursively.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_2",
        "category": "Programming Language Fundamentals",
        "topic": "Python Concurrency & GIL",
        "difficulty": "Medium",
        "question_text": "What is the Global Interpreter Lock (GIL) in CPython and how does it affect CPU-bound multithreaded programs?",
        "options": [
            "It is a mutex that allows only one native thread to execute Python bytecode at a time, limiting CPU-bound threads to a single core.",
            "It prevents memory leaks by running the garbage collector on every CPU cycle.",
            "It enforces asynchronous event loop execution similar to Node.js libuv.",
            "It distributes Python threads evenly across all physical CPU cores automatically."
        ],
        "correct_answer": "It is a mutex that allows only one native thread to execute Python bytecode at a time, limiting CPU-bound threads to a single core.",
        "explanation": "In CPython, the GIL protects reference counting and internal object management from race conditions. Because only one thread executes bytecode at a time, CPU-bound multithreaded code does not achieve true multi-core parallelism.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_3",
        "category": "Programming Language Fundamentals",
        "topic": "JavaScript Event Loop & Microtasks",
        "difficulty": "Medium",
        "question_text": "In JavaScript, what is the output order of console logs in the following snippet: Promise.resolve().then(() => console.log('A')); setTimeout(() => console.log('B'), 0); console.log('C');?",
        "options": [
            "C, A, B",
            "A, B, C",
            "C, B, A",
            "B, A, C"
        ],
        "correct_answer": "C, A, B",
        "explanation": "Synchronous code ('C') runs first. Then the microtask queue (Promise callbacks) is processed before the macrotask queue, executing 'A'. Finally, the timer callback ('B') in the macrotask queue executes.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_4",
        "category": "Programming Language Fundamentals",
        "topic": "JavaScript Scope & Closures",
        "difficulty": "Easy",
        "question_text": "What is a closure in JavaScript and what is its primary practical utility?",
        "options": [
            "The combination of a function bundled together with references to its surrounding lexical environment, allowing data encapsulation.",
            "A method to terminate memory allocation when a function returns.",
            "A syntax sugar for class-based inheritance using the prototype chain.",
            "An asynchronous construct used to avoid callback hell."
        ],
        "correct_answer": "The combination of a function bundled together with references to its surrounding lexical environment, allowing data encapsulation.",
        "explanation": "A closure gives an inner function access to its outer function's scope even after the outer function has closed/returned. It is fundamental for data privacy, currying, and factory functions.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_5",
        "category": "Programming Language Fundamentals",
        "topic": "C++ Memory Management & RAII",
        "difficulty": "Hard",
        "question_text": "In C++, what is RAII (Resource Acquisition Is Initialization) and why is it recommended for resource management?",
        "options": [
            "It binds the lifecycle of resources (heap memory, file handles, sockets) to the lifetime of an object, guaranteeing cleanup upon scope exit via destructors.",
            "It requires all variables to be declared in global scope before main() executes.",
            "It enables runtime garbage collection by scanning stack pointers periodically.",
            "It forces compilation to abort if raw pointers are referenced inside templates."
        ],
        "correct_answer": "It binds the lifecycle of resources (heap memory, file handles, sockets) to the lifetime of an object, guaranteeing cleanup upon scope exit via destructors.",
        "explanation": "RAII guarantees that resource deallocation occurs deterministically when the wrapper object goes out of scope (including when exceptions are thrown), preventing resource and memory leaks without a garbage collector.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_6",
        "category": "Programming Language Fundamentals",
        "topic": "Python Generators & Iterators",
        "difficulty": "Medium",
        "question_text": "What is the memory and performance advantage of using a Python generator function with 'yield' instead of returning a pre-computed list?",
        "options": [
            "Generators produce values on demand (lazy evaluation) with O(1) memory consumption regardless of stream size",
            "Generators compile into native C assembly for 100x faster execution",
            "Generators automatically bypass the Global Interpreter Lock across all CPU cores",
            "Generators store items in redis cache automatically"
        ],
        "correct_answer": "Generators produce values on demand (lazy evaluation) with O(1) memory consumption regardless of stream size",
        "explanation": "Generators maintain execution state and yield one item at a time, allowing iteration over massive or infinite datasets without loading all elements into memory upfront.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_7",
        "category": "Programming Language Fundamentals",
        "topic": "JavaScript Prototypal Inheritance",
        "difficulty": "Medium",
        "question_text": "How does prototypal inheritance in JavaScript resolve property lookups on an object?",
        "options": [
            "It traverses the [[Prototype]] (__proto__) chain upwards until the property is found or null is reached",
            "It searches the browser DOM tree for matching id attributes",
            "It hashes the property name into an indexed binary search tree",
            "It checks global scope first, then falls back to local object properties"
        ],
        "correct_answer": "It traverses the [[Prototype]] (__proto__) chain upwards until the property is found or null is reached",
        "explanation": "When accessing obj.prop, JavaScript checks the object's own properties. If absent, it follows obj.__proto__, and continues up the prototype chain until Object.prototype.__proto__ (null).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_8",
        "category": "Programming Language Fundamentals",
        "topic": "Java Memory Management & GC",
        "difficulty": "Medium",
        "question_text": "In Java memory management, what is the fundamental difference between the Stack and the Heap?",
        "options": [
            "Stack stores local primitive variables and method call frames (LIFO, thread-private); Heap stores all instantiated objects shared across threads",
            "Stack stores serialized JSON; Heap stores compiled bytecode",
            "Stack is garbage collected using Mark-and-Sweep; Heap is deallocated when a method returns",
            "Stack size is unlimited; Heap size is strictly 64KB"
        ],
        "correct_answer": "Stack stores local primitive variables and method call frames (LIFO, thread-private); Heap stores all instantiated objects shared across threads",
        "explanation": "Each thread has its own Stack for execution frames and local variables. All Java objects are dynamically allocated on the shared Heap and managed by the JVM Garbage Collector.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_9",
        "category": "Programming Language Fundamentals",
        "topic": "Python Decorators",
        "difficulty": "Medium",
        "question_text": "What does a Python decorator fundamentally do?",
        "options": [
            "It takes a function as an argument, extends or modifies its behavior without directly changing its source code, and returns a callable",
            "It serializes a Python module into JSON format for network transport",
            "It optimizes bytecode using Cython during compilation",
            "It restricts a function so it can only be invoked once"
        ],
        "correct_answer": "It takes a function as an argument, extends or modifies its behavior without directly changing its source code, and returns a callable",
        "explanation": "A decorator is syntactic sugar (@decorator) for func = decorator(func), wrapping the target callable to execute pre/post logic such as timing, logging, or authorization checks.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_10",
        "category": "Programming Language Fundamentals",
        "topic": "TypeScript Types vs Interfaces",
        "difficulty": "Easy",
        "question_text": "In TypeScript, what is a key capability that 'interface' supports which 'type' aliases do not?",
        "options": [
            "Declaration merging (multiple interface definitions with the same name automatically merge their members)",
            "Union and intersection syntax (| and &)",
            "Primitive type aliasing (e.g. type ID = string)",
            "Tuple types definition"
        ],
        "correct_answer": "Declaration merging (multiple interface definitions with the same name automatically merge their members)",
        "explanation": "TypeScript interfaces support declaration merging, making them ideal for public library APIs and declarations. Type aliases cannot be reopened to add new properties.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_11",
        "category": "Programming Language Fundamentals",
        "topic": "Java String Immutability",
        "difficulty": "Easy",
        "question_text": "Why are String objects in Java designed to be immutable?",
        "options": [
            "For security, thread safety, and enabling the String Pool to cache identical literal values safely without side effects",
            "To prevent strings from consuming more than 8 bytes of memory",
            "Because Java does not support array resizing",
            "To force developers to use StringBuffer for all string operations"
        ],
        "correct_answer": "For security, thread safety, and enabling the String Pool to cache identical literal values safely without side effects",
        "explanation": "String immutability ensures hash code caching, prevents concurrent modification in multithreaded environments, and prevents malicious tampering with sensitive parameters like usernames or network URLs.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_12",
        "category": "Programming Language Fundamentals",
        "topic": "Python Magic Methods & Dunder",
        "difficulty": "Medium",
        "question_text": "In Python, what is the difference between `__str__` and `__repr__` methods?",
        "options": [
            "`__str__` returns a readable, user-friendly string; `__repr__` returns an unambiguous, developer-focused representation ideally evaluable with eval()",
            "`__str__` is for integers; `__repr__` is for floating point numbers",
            "`__str__` is called by debuggers; `__repr__` is called by print()",
            "There is no difference; they are aliases"
        ],
        "correct_answer": "`__str__` returns a readable, user-friendly string; `__repr__` returns an unambiguous, developer-focused representation ideally evaluable with eval()",
        "explanation": "`__repr__` is intended for developers and debugging (showing class name and attributes). `__str__` is for end-user display when printing or converting with str().",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_13",
        "category": "Programming Language Fundamentals",
        "topic": "JavaScript 'this' Binding",
        "difficulty": "Medium",
        "question_text": "How does the behavior of the `this` keyword in JavaScript arrow functions differ from standard function declarations?",
        "options": [
            "Arrow functions lexically bind `this` from their enclosing scope; standard functions bind `this` based on how they are called at runtime",
            "Arrow functions create their own dynamic `this` pointing to the window object",
            "Arrow functions can be rebound dynamically using .bind(), .call(), or .apply()",
            "Arrow functions set `this` to undefined in all execution contexts"
        ],
        "correct_answer": "Arrow functions lexically bind `this` from their enclosing scope; standard functions bind `this` based on how they are called at runtime",
        "explanation": "Arrow functions do not define their own `this`. They capture the `this` value of the enclosing lexical execution context at definition time.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_14",
        "category": "Programming Language Fundamentals",
        "topic": "C++ Smart Pointers",
        "difficulty": "Hard",
        "question_text": "What is the difference between `std::unique_ptr` and `std::shared_ptr` in modern C++?",
        "options": [
            "`std::unique_ptr` enforces exclusive, non-copyable ownership (move only); `std::shared_ptr` uses reference counting for shared ownership",
            "`std::unique_ptr` leaks memory when moved; `std::shared_ptr` never leaks",
            "`std::shared_ptr` is faster because it does not allocate a control block",
            "`std::unique_ptr` is for multithreading only; `std::shared_ptr` is single-threaded"
        ],
        "correct_answer": "`std::unique_ptr` enforces exclusive, non-copyable ownership (move only); `std::shared_ptr` uses reference counting for shared ownership",
        "explanation": "`std::unique_ptr` has zero runtime overhead over a raw pointer and cannot be copied. `std::shared_ptr` maintains an atomic reference counter control block in heap memory.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_15",
        "category": "Programming Language Fundamentals",
        "topic": "Python Memory Management & `__slots__`",
        "difficulty": "Hard",
        "question_text": "What is the purpose of defining `__slots__` in a Python class?",
        "options": [
            "It replaces the default instance `__dict__` with a fixed-size array of descriptors, substantially reducing memory footprint when instantiating millions of objects",
            "It prevents methods from being inherited by subclasses",
            "It forces Python to compile the class to C code",
            "It enables multithreaded parallelism without the GIL"
        ],
        "correct_answer": "It replaces the default instance `__dict__` with a fixed-size array of descriptors, substantially reducing memory footprint when instantiating millions of objects",
        "explanation": "By default, Python stores instance attributes in a dictionary (`__dict__`). `__slots__` reserves space for declared attributes, saving hundreds of bytes per instance when scaling to large object counts.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_16",
        "category": "Programming Language Fundamentals",
        "topic": "JavaScript Strict Mode",
        "difficulty": "Easy",
        "question_text": "What is one primary benefit of enabling `'use strict';` in JavaScript?",
        "options": [
            "It turns silent errors into throw exceptions (such as assigning to undeclared variables) and disables problematic features like `with`",
            "It compiles JavaScript directly into C++ binary code",
            "It automatically converts synchronous loops into Web Workers",
            "It prevents HTTP cookies from being transmitted"
        ],
        "correct_answer": "It turns silent errors into throw exceptions (such as assigning to undeclared variables) and disables problematic features like `with`",
        "explanation": "Strict mode catches common coding mistakes, prevents accidental global variables (e.g. x = 5 without let/const), and disables insecure language syntax.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_17",
        "category": "Programming Language Fundamentals",
        "topic": "Go Goroutines vs OS Threads",
        "difficulty": "Medium",
        "question_text": "In Go, how do goroutines differ from standard operating system (OS) threads?",
        "options": [
            "Goroutines are user-space green threads managed by the Go runtime, starting with tiny 2KB stack sizes that grow dynamically, enabling hundreds of thousands of concurrent routines",
            "Goroutines always map 1:1 to physical CPU cores without context switching",
            "Goroutines consume 8MB of stack memory upon creation",
            "Goroutines require manual kernel thread creation calls via system APIs"
        ],
        "correct_answer": "Goroutines are user-space green threads managed by the Go runtime, starting with tiny 2KB stack sizes that grow dynamically, enabling hundreds of thousands of concurrent routines",
        "explanation": "The Go runtime multiplexes M goroutines onto N OS kernel threads (M:N scheduler). Goroutines have negligible creation cost and tiny initial stacks compared to multi-megabyte OS threads.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_18",
        "category": "Programming Language Fundamentals",
        "topic": "Rust Ownership & Borrowing",
        "difficulty": "Hard",
        "question_text": "What are the core rules of Rust's ownership and borrowing model at compile time?",
        "options": [
            "Each value has exactly one owner; you can have either one mutable reference OR multiple immutable references, but never both simultaneously",
            "Variables can have multiple owners that increment a garbage collector count",
            "Mutable references can be shared freely across any number of concurrent threads",
            "Memory is freed only when the operating system process terminates"
        ],
        "correct_answer": "Each value has exactly one owner; you can have either one mutable reference OR multiple immutable references, but never both simultaneously",
        "explanation": "Rust guarantees memory safety without a garbage collector through ownership rules: one owner, deterministic drop on scope exit, and aliasing XOR mutability at compile time.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_19",
        "category": "Programming Language Fundamentals",
        "topic": "Python `is` vs `==`",
        "difficulty": "Easy",
        "question_text": "What is the fundamental difference between the `is` keyword and the `==` operator in Python?",
        "options": [
            "`is` checks identity (same memory address / id()); `==` checks equality of value",
            "`is` compares values; `==` compares data types",
            "`is` is used for mathematical numbers; `==` is used for strings",
            "There is no difference; they are interchangeable"
        ],
        "correct_answer": "`is` checks identity (same memory address / id()); `==` checks equality of value",
        "explanation": "`a == b` invokes `a.__eq__(b)` to evaluate value equivalence. `a is b` evaluates `id(a) == id(b)`, verifying whether both variables reference the exact same memory object.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_20",
        "category": "Programming Language Fundamentals",
        "topic": "JavaScript Promise.all vs Promise.allSettled",
        "difficulty": "Medium",
        "question_text": "How does `Promise.allSettled()` differ from `Promise.all()` in JavaScript?",
        "options": [
            "`Promise.all` rejects immediately upon the first rejected promise (fail-fast); `Promise.allSettled` waits for all promises to resolve or reject and returns an array of status objects",
            "`Promise.allSettled` cancels all pending network requests",
            "`Promise.all` executes promises sequentially, while `Promise.allSettled` executes them in parallel",
            "`Promise.allSettled` cannot handle rejected promises"
        ],
        "correct_answer": "`Promise.all` rejects immediately upon the first rejected promise (fail-fast); `Promise.allSettled` waits for all promises to resolve or reject and returns an array of status objects",
        "explanation": "`Promise.all` is fail-fast: if any promise fails, the entire batch rejects. `Promise.allSettled` guarantees every promise settles, returning an array of `{status, value/reason}` objects.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_21",
        "category": "Programming Language Fundamentals",
        "topic": "Java volatile Keyword",
        "difficulty": "Hard",
        "question_text": "What does the `volatile` keyword guarantee when applied to a variable in Java?",
        "options": [
            "It guarantees that reads and writes are made directly to/from main memory, preventing thread-caching and ensuring visibility across concurrent threads",
            "It makes compound operations like counter++ atomic without synchronization",
            "It prevents the variable from being serialized to disk",
            "It forces the variable to be stored on the stack"
        ],
        "correct_answer": "It guarantees that reads and writes are made directly to/from main memory, preventing thread-caching and ensuring visibility across concurrent threads",
        "explanation": "`volatile` enforces memory visibility across threads and prevents compiler instruction reordering around reads/writes. However, it does NOT provide atomicity for compound operations (e.g. read-modify-write).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_22",
        "category": "Programming Language Fundamentals",
        "topic": "Python Asyncio & Event Loop",
        "difficulty": "Medium",
        "question_text": "Why must blocking I/O calls (e.g. standard time.sleep() or synchronous requests.get()) be avoided inside Python `async def` coroutines?",
        "options": [
            "Because the asyncio event loop runs on a single thread; blocking calls halt the entire loop, preventing all concurrent coroutines from executing",
            "Because Python async functions cannot call non-async functions",
            "Because time.sleep throws an AsyncSyntaxError",
            "Because the operating system terminates the process if async functions block"
        ],
        "correct_answer": "Because the asyncio event loop runs on a single thread; blocking calls halt the entire loop, preventing all concurrent coroutines from executing",
        "explanation": "Asyncio relies on cooperative multitasking on a single thread. When a coroutine executes a synchronous blocking call, it starves the event loop, freezing all other concurrent tasks.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_23",
        "category": "Programming Language Fundamentals",
        "topic": "TypeScript Generics",
        "difficulty": "Easy",
        "question_text": "What is the primary benefit of using Generics in TypeScript functions and classes?",
        "options": [
            "It enables creating reusable, flexible components that work over a variety of types while preserving compile-time type safety",
            "It speeds up runtime JavaScript execution by pre-allocating memory buffers",
            "It converts TypeScript interfaces into runtime JSON schema validators",
            "It prevents classes from being instantiated more than once"
        ],
        "correct_answer": "It enables creating reusable, flexible components that work over a variety of types while preserving compile-time type safety",
        "explanation": "Generics (`function identity<T>(arg: T): T`) capture the argument type, allowing strongly typed reusable logic without resorting to unsafe `any` casting.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_24",
        "category": "Programming Language Fundamentals",
        "topic": "C++ Virtual Functions & VTable",
        "difficulty": "Hard",
        "question_text": "How does dynamic polymorphism work under the hood in C++ when calling a virtual member function through a base pointer?",
        "options": [
            "Each polymorphic class has a virtual method table (vtable) containing function pointers; the object contains a vptr pointing to this table to dispatch at runtime",
            "The compiler executes a switch statement based on the class string name",
            "The operating system resolves the function call via dynamic library symbol lookup",
            "The CPU interprets bytecode instructions through an internal JIT compiler"
        ],
        "correct_answer": "Each polymorphic class has a virtual method table (vtable) containing function pointers; the object contains a vptr pointing to this table to dispatch at runtime",
        "explanation": "Dynamic dispatch in C++ uses a compiler-generated vtable. Each object instance stores an internal pointer (vptr) that resolves the correct derived function address at runtime.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "lang_25",
        "category": "Programming Language Fundamentals",
        "topic": "Python Duck Typing",
        "difficulty": "Easy",
        "question_text": "What does the concept of 'Duck Typing' mean in Python?",
        "options": [
            "An object's suitability is determined by the presence of certain methods and properties, rather than its explicit class inheritance hierarchy ('if it walks like a duck and quacks like a duck, it's a duck')",
            "Functions must be declared with explicit type annotations for compiler verification",
            "All objects in Python inherit directly from a base Duck class",
            "Classes cannot have more than two methods"
        ],
        "correct_answer": "An object's suitability is determined by the presence of certain methods and properties, rather than its explicit class inheritance hierarchy ('if it walks like a duck and quacks like a duck, it's a duck')",
        "explanation": "Duck typing focuses on what an object can do (its interface and callable protocols) rather than what class it claims to be, enabling dynamic polymorphism without rigid type hierarchies.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_1",
        "category": "Data Structures & Algorithms",
        "topic": "Hash Tables & Collisions",
        "difficulty": "Easy",
        "question_text": "What is the average and worst-case time complexity for search, insertion, and deletion in a hash table with separate chaining?",
        "options": [
            "Average: O(1); Worst-case: O(N) when all keys hash to the same bucket.",
            "Average: O(log N); Worst-case: O(N log N).",
            "Average: O(1); Worst-case: O(log N) using AVL bucket balancing.",
            "Average: O(N); Worst-case: O(N^2)."
        ],
        "correct_answer": "Average: O(1); Worst-case: O(N) when all keys hash to the same bucket.",
        "explanation": "With a good hash function and uniform distribution, hash table operations run in O(1) average time. If a pathological hash function maps all keys to the same bucket, operations degrade to O(N) linked list scans.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_2",
        "category": "Data Structures & Algorithms",
        "topic": "Binary Trees & BST",
        "difficulty": "Medium",
        "question_text": "What condition must be satisfied for a binary tree to be considered a valid Binary Search Tree (BST)?",
        "options": [
            "For every node, all keys in its left subtree must be less than the node's key, and all keys in its right subtree must be greater.",
            "Every parent node must have exactly two children.",
            "The tree must be completely balanced such that the heights of left and right subtrees differ by at most one.",
            "All leaf nodes must reside at the exact same depth."
        ],
        "correct_answer": "For every node, all keys in its left subtree must be less than the node's key, and all keys in its right subtree must be greater.",
        "explanation": "A BST enforces the binary search invariant recursively: left subtree keys < node key < right subtree keys. In-order traversal of a BST yields keys in strictly ascending sorted order.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_3",
        "category": "Data Structures & Algorithms",
        "topic": "Sorting Algorithm Stability",
        "difficulty": "Medium",
        "question_text": "What does it mean for a sorting algorithm to be 'stable'?",
        "options": [
            "It preserves the relative order of elements that have equal comparison keys.",
            "It guarantees O(N log N) worst-case time complexity.",
            "It operates in-place with O(1) auxiliary space.",
            "It does not trigger stack overflow exceptions on large arrays."
        ],
        "correct_answer": "It preserves the relative order of elements that have equal comparison keys.",
        "explanation": "Stability means if element A and B have equal values and A appeared before B in the input, A will strictly appear before B in the sorted output (e.g. MergeSort is stable, standard QuickSort is not).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_4",
        "category": "Data Structures & Algorithms",
        "topic": "Graph Traversals & Shortest Path",
        "difficulty": "Medium",
        "question_text": "Which graph traversal algorithm guarantees finding the shortest path (in terms of minimum number of edges) in an unweighted graph?",
        "options": [
            "Breadth-First Search (BFS)",
            "Depth-First Search (DFS)",
            "Bellman-Ford Algorithm",
            "Tarjan's Strongly Connected Components Algorithm"
        ],
        "correct_answer": "Breadth-First Search (BFS)",
        "explanation": "BFS explores vertices level by level in order of distance from the source vertex. In unweighted graphs, the first time a vertex is reached via BFS is guaranteed to be the shortest path.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_5",
        "category": "Data Structures & Algorithms",
        "topic": "Heap Data Structure & PriorityQueue",
        "difficulty": "Medium",
        "question_text": "What is the time complexity to insert an element into a binary min-heap of N elements, and what is the time complexity to extract the minimum element?",
        "options": [
            "Insert: O(log N); Extract-Min: O(log N)",
            "Insert: O(1); Extract-Min: O(N)",
            "Insert: O(log N); Extract-Min: O(1)",
            "Insert: O(N); Extract-Min: O(log N)"
        ],
        "correct_answer": "Insert: O(log N); Extract-Min: O(log N)",
        "explanation": "Insertion appends the element at the end and bubbles up (O(log N)). Extract-Min removes the root, places the last element at the root, and trickles down (O(log N)).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_6",
        "category": "Data Structures & Algorithms",
        "topic": "Dynamic Programming: Knapsack",
        "difficulty": "Hard",
        "question_text": "In the 0/1 Knapsack Problem with N items and maximum weight capacity W, what is the time and space complexity of the standard dynamic programming solution?",
        "options": [
            "Time: O(N * W); Space: O(N * W) or O(W) optimized",
            "Time: O(2^N); Space: O(N)",
            "Time: O(N log N); Space: O(1)",
            "Time: O(N^2); Space: O(N^2)"
        ],
        "correct_answer": "Time: O(N * W); Space: O(N * W) or O(W) optimized",
        "explanation": "The 0/1 Knapsack DP evaluates whether to include or exclude each item for every sub-capacity from 0 to W, yielding pseudo-polynomial time O(N * W).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_7",
        "category": "Data Structures & Algorithms",
        "topic": "Trie (Prefix Tree)",
        "difficulty": "Medium",
        "question_text": "Why is a Trie preferred over a Hash Table for implementing autocomplete and prefix search?",
        "options": [
            "A Trie finds all words with a given prefix of length L in O(L + K) time, whereas a hash table must scan all N stored keys to evaluate prefixes",
            "A Trie requires 100x less memory than a hash table",
            "A Trie performs string hashing on 64-bit integers",
            "A Trie automatically sorts items alphabetically in O(1)"
        ],
        "correct_answer": "A Trie finds all words with a given prefix of length L in O(L + K) time, whereas a hash table must scan all N stored keys to evaluate prefixes",
        "explanation": "Tries share common prefixes along tree edges. Prefix lookup takes time proportional only to the prefix length L rather than scanning the entire dictionary.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_8",
        "category": "Data Structures & Algorithms",
        "topic": "Disjoint Set Union (Union-Find)",
        "difficulty": "Hard",
        "question_text": "With path compression and union by rank/size optimizations, what is the amortized time complexity per operation in a Disjoint Set Union (DSU)?",
        "options": [
            "O(alpha(N)), where alpha is the inverse Ackermann function (effectively O(1) for all practical purposes)",
            "O(log N)",
            "O(N)",
            "O(1) strict worst-case"
        ],
        "correct_answer": "O(alpha(N)), where alpha is the inverse Ackermann function (effectively O(1) for all practical purposes)",
        "explanation": "Path compression flattens tree depths during find operations, while union by rank keeps trees shallow. Together, they achieve near-constant amortized time governed by inverse Ackermann function.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_9",
        "category": "Data Structures & Algorithms",
        "topic": "LRU Cache Architecture",
        "difficulty": "Medium",
        "question_text": "What combination of data structures is classically used to implement an LRU (Least Recently Used) cache with O(1) get and O(1) put operations?",
        "options": [
            "A Hash Map combined with a Doubly Linked List",
            "A Binary Search Tree combined with an Array",
            "A Stack combined with a Min-Heap",
            "A Circular Queue combined with a Bloom Filter"
        ],
        "correct_answer": "A Hash Map combined with a Doubly Linked List",
        "explanation": "The Hash Map provides O(1) key-to-node lookup. The Doubly Linked List allows moving accessed nodes to the head and evicting the tail node in O(1) time without shifting elements.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_10",
        "category": "Data Structures & Algorithms",
        "topic": "Two Pointers Technique",
        "difficulty": "Easy",
        "question_text": "In which scenario is the two-pointer technique most directly applicable?",
        "options": [
            "Finding if two numbers in a sorted array sum to a target value in O(N) time and O(1) space",
            "Traversing an unweighted cyclic directed graph",
            "Balancing an unbalanced Red-Black tree",
            "Inverting a binary tree recursively"
        ],
        "correct_answer": "Finding if two numbers in a sorted array sum to a target value in O(N) time and O(1) space",
        "explanation": "With a sorted array, placing left pointer at 0 and right at N-1 allows shrinking the window based on whether sum < target or sum > target, solving Two Sum in O(N) time and O(1) space.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_11",
        "category": "Data Structures & Algorithms",
        "topic": "Fast & Slow Pointers (Floyd's Cycle)",
        "difficulty": "Easy",
        "question_text": "How does Floyd's Cycle Detection algorithm determine if a singly linked list contains a cycle?",
        "options": [
            "A slow pointer moves 1 step and a fast pointer moves 2 steps; if they meet, a cycle exists",
            "It hashes every node memory address in a global dictionary",
            "It reverses the linked list and checks if the head matches the tail",
            "It counts the nodes and compares against system RAM size"
        ],
        "correct_answer": "A slow pointer moves 1 step and a fast pointer moves 2 steps; if they meet, a cycle exists",
        "explanation": "Floyd's Tortoise and Hare algorithm detects loops in O(N) time and O(1) space because the fast pointer reduces the gap between them by 1 node per iteration inside any cycle.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_12",
        "category": "Data Structures & Algorithms",
        "topic": "Binary Search Boundary Conditions",
        "difficulty": "Easy",
        "question_text": "In standard binary search on a sorted array of N elements, why is `mid = left + (right - left) // 2` preferred over `mid = (left + right) // 2`?",
        "options": [
            "To prevent potential integer arithmetic overflow when left and right are large integers",
            "To force floating-point precision on 64-bit architectures",
            "Because it executes in 1 CPU cycle instead of 3",
            "To handle negative array indices automatically"
        ],
        "correct_answer": "To prevent potential integer arithmetic overflow when left and right are large integers",
        "explanation": "In languages with fixed-width integers (like Java, C, C++), `left + right` can exceed 2^31 - 1, causing arithmetic overflow into negative numbers. `left + (right - left) // 2` avoids this overflow.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_13",
        "category": "Data Structures & Algorithms",
        "topic": "Monotonic Stack",
        "difficulty": "Hard",
        "question_text": "What is a Monotonic Stack and what classic algorithmic problem does it solve in O(N) time?",
        "options": [
            "A stack that maintains elements in strictly increasing or decreasing order; solves 'Next Greater Element' in O(N)",
            "A stack that only stores prime numbers in O(log N)",
            "A stack that supports undo/redo operations in web browsers",
            "A call stack used by the CPU for recursive functions"
        ],
        "correct_answer": "A stack that maintains elements in strictly increasing or decreasing order; solves 'Next Greater Element' in O(N)",
        "explanation": "A monotonic stack pops elements that violate the monotonic invariant as new items arrive. Each element is pushed and popped at most once, finding the Next Greater / Smaller element in O(N) time.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_14",
        "category": "Data Structures & Algorithms",
        "topic": "Graph Topological Sort",
        "difficulty": "Medium",
        "question_text": "What is the prerequisite condition for a graph to possess a valid Topological Sort?",
        "options": [
            "The graph must be a Directed Acyclic Graph (DAG)",
            "The graph must be strongly connected and undirected",
            "The graph must be a complete bipartite graph",
            "The graph must have an even number of vertices"
        ],
        "correct_answer": "The graph must be a Directed Acyclic Graph (DAG)",
        "explanation": "Topological sorting linearly orders vertices such that for every directed edge u -> v, vertex u appears before v. If any cycle exists, no valid linear order is possible; hence DAG is required.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_15",
        "category": "Data Structures & Algorithms",
        "topic": "Dijkstra's Algorithm",
        "difficulty": "Medium",
        "question_text": "What is a fundamental limitation of Dijkstra's algorithm for shortest paths?",
        "options": [
            "It fails or produces incorrect results on graphs with negative edge weights",
            "It cannot be implemented with a priority queue",
            "It only works on trees with height less than 10",
            "It requires all vertices to have identical degrees"
        ],
        "correct_answer": "It fails or produces incorrect results on graphs with negative edge weights",
        "explanation": "Dijkstra assumes that adding an edge to a path always increases its total cost (greedy non-decreasing property). Negative edge weights violate this assumption; Bellman-Ford must be used instead.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_16",
        "category": "Data Structures & Algorithms",
        "topic": "Sliding Window Maximum",
        "difficulty": "Hard",
        "question_text": "Which data structure is optimal for solving the Sliding Window Maximum problem of window size K across an array of N elements in O(N) total time?",
        "options": [
            "A Monotonic Double-Ended Queue (Deque)",
            "A Min-Heap priority queue",
            "A sorted balanced AVL tree",
            "A single FIFO queue"
        ],
        "correct_answer": "A Monotonic Double-Ended Queue (Deque)",
        "explanation": "A monotonic deque stores indices of elements in descending value order. Evicting elements out of window from front and smaller elements from back achieves O(1) amortized time per element (O(N) total).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_17",
        "category": "Data Structures & Algorithms",
        "topic": "Bit Manipulation: Power of Two",
        "difficulty": "Easy",
        "question_text": "In bit manipulation, how do you verify if a positive integer N is a power of 2 in O(1) time?",
        "options": [
            "`(N & (N - 1)) == 0`",
            "`(N | (N + 1)) == 0`",
            "`N ^ (N - 1) == 0`",
            "`N % 2 == 1`"
        ],
        "correct_answer": "`(N & (N - 1)) == 0`",
        "explanation": "Powers of two have exactly one '1' bit in binary (e.g. 8 is 1000). N - 1 flips that bit and sets all lower bits to 1 (7 is 0111). Their bitwise AND is strictly 0.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_18",
        "category": "Data Structures & Algorithms",
        "topic": "MergeSort vs QuickSort",
        "difficulty": "Medium",
        "question_text": "Why is MergeSort typically preferred over QuickSort for sorting linked lists?",
        "options": [
            "MergeSort can merge linked lists in O(1) auxiliary space without random access, whereas QuickSort requires random element access for efficient partitioning",
            "MergeSort runs in O(N) time on linked lists",
            "QuickSort cannot sort elements that contain strings",
            "Linked lists cannot be partitioned"
        ],
        "correct_answer": "MergeSort can merge linked lists in O(1) auxiliary space without random access, whereas QuickSort requires random element access for efficient partitioning",
        "explanation": "Linked lists allow inserting nodes in O(1) without shifting arrays, enabling MergeSort to execute without extra memory allocation. QuickSort relies on random indexing which is O(N) in linked lists.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_19",
        "category": "Data Structures & Algorithms",
        "topic": "AVL Trees vs Red-Black Trees",
        "difficulty": "Hard",
        "question_text": "What is the key difference between an AVL tree and a Red-Black tree?",
        "options": [
            "AVL trees are more strictly balanced, providing faster lookups; Red-Black trees tolerate looser balance, resulting in faster insertions and deletions",
            "AVL trees only support integer keys; Red-Black trees support strings",
            "Red-Black trees require O(N) worst-case lookup time",
            "AVL trees do not use node rotations"
        ],
        "correct_answer": "AVL trees are more strictly balanced, providing faster lookups; Red-Black trees tolerate looser balance, resulting in faster insertions and deletions",
        "explanation": "AVL trees enforce a height difference of at most 1, making them better for read-heavy workloads. Red-Black trees require at most 2 rotations per insertion, making them faster for write-heavy use cases.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_20",
        "category": "Data Structures & Algorithms",
        "topic": "Kruskal's vs Prim's Algorithm",
        "difficulty": "Medium",
        "question_text": "What algorithmic paradigm do both Kruskal's and Prim's algorithms utilize to construct a Minimum Spanning Tree (MST)?",
        "options": [
            "Greedy Algorithm",
            "Dynamic Programming",
            "Divide and Conquer",
            "Backtracking"
        ],
        "correct_answer": "Greedy Algorithm",
        "explanation": "Both algorithms make greedy choices: Kruskal's greedily adds the cheapest edge that does not form a cycle (using DSU), and Prim's greedily extends the tree to the nearest adjacent vertex.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_21",
        "category": "Data Structures & Algorithms",
        "topic": "Bloom Filter Properties",
        "difficulty": "Hard",
        "question_text": "What are the probabilistic properties of a standard Bloom Filter?",
        "options": [
            "False positives are possible (may report an element is present when it isn't); false negatives are impossible (if it reports absent, it is definitely absent)",
            "False negatives are possible; false positives are impossible",
            "It guarantees 100% exact membership testing with zero error",
            "It can retrieve the original stored keys on demand"
        ],
        "correct_answer": "False positives are possible (may report an element is present when it isn't); false negatives are impossible (if it reports absent, it is definitely absent)",
        "explanation": "Bloom filters use K hash functions over a bit array. Collisions can cause all K bits to be set even for uninserted keys (false positive), but if any bit is 0, the item was definitely never added.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_22",
        "category": "Data Structures & Algorithms",
        "topic": "Tree In-order Successor",
        "difficulty": "Medium",
        "question_text": "In a Binary Search Tree, where is the in-order successor of a node with a non-empty right subtree located?",
        "options": [
            "The leftmost node of its right subtree",
            "The root node of the entire tree",
            "The rightmost node of its left subtree",
            "The parent of the current node"
        ],
        "correct_answer": "The leftmost node of its right subtree",
        "explanation": "In-order traversal visits left -> node -> right. If a node has a right subtree, the next value visited in ascending order is the minimum element in that right subtree (its leftmost descendant).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_23",
        "category": "Data Structures & Algorithms",
        "topic": "Dynamic Programming: Longest Common Subsequence",
        "difficulty": "Medium",
        "question_text": "What is the time complexity to find the Longest Common Subsequence (LCS) of two strings of lengths M and N using dynamic programming?",
        "options": [
            "O(M * N)",
            "O(M + N)",
            "O(2^(M + N))",
            "O(log(M * N))"
        ],
        "correct_answer": "O(M * N)",
        "explanation": "The 2D dynamic programming grid compares characters at indices i and j: if matched, dp[i][j] = 1 + dp[i-1][j-1]; otherwise max(dp[i-1][j], dp[i][j-1]), taking O(M * N) operations.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_24",
        "category": "Data Structures & Algorithms",
        "topic": "Kadane's Algorithm",
        "difficulty": "Easy",
        "question_text": "What problem does Kadane's algorithm solve in O(N) time and O(1) space?",
        "options": [
            "Maximum Subarray Sum (contiguous subsegment with largest sum)",
            "Longest Palindromic Substring",
            "Shortest Path in Directed Acyclic Graph",
            "Finding duplicate numbers in an array"
        ],
        "correct_answer": "Maximum Subarray Sum (contiguous subsegment with largest sum)",
        "explanation": "Kadane's algorithm iterates through the array maintaining the maximum sum ending at the current position (`curr = max(num, curr + num)`), finding the maximum contiguous sum in single pass O(N).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "dsa_25",
        "category": "Data Structures & Algorithms",
        "topic": "Array In-place Reversal",
        "difficulty": "Easy",
        "question_text": "What is the minimum number of swaps required to reverse an array of N elements in-place?",
        "options": [
            "N // 2 swaps",
            "N swaps",
            "N - 1 swaps",
            "N * log N swaps"
        ],
        "correct_answer": "N // 2 swaps",
        "explanation": "By swapping element at index i with element at index N - 1 - i for i from 0 to N // 2 - 1, the entire array is reversed with exactly floor(N / 2) swap operations.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_1",
        "category": "SQL & Databases",
        "topic": "B-Tree vs Hash Indexing",
        "difficulty": "Medium",
        "question_text": "Why are B-Tree indexes preferred over Hash indexes for general database columns?",
        "options": [
            "B-Trees support range queries (BETWEEN, <, >) and ORDER BY sorting; Hash indexes only support exact equality (=)",
            "Hash indexes require O(N) lookup time",
            "B-Trees consume no disk space",
            "B-Trees do not require index rebuilds upon deletion"
        ],
        "correct_answer": "B-Trees support range queries (BETWEEN, <, >) and ORDER BY sorting; Hash indexes only support exact equality (=)",
        "explanation": "B-Trees maintain keys in sorted order, enabling efficient range scans, prefix matching, and ORDER BY lookups in O(log N) time. Hash indexes only support O(1) exact equality lookups.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_2",
        "category": "SQL & Databases",
        "topic": "Transaction Isolation Levels",
        "difficulty": "Hard",
        "question_text": "Which phenomenon can occur under the 'Repeatable Read' isolation level in standard SQL that is prevented under 'Serializable'?",
        "options": [
            "Phantom Reads (concurrent transaction inserts new rows matching the WHERE filter)",
            "Dirty Reads (reading uncommitted data)",
            "Lost Updates on the same row",
            "Syntax errors during commit"
        ],
        "correct_answer": "Phantom Reads (concurrent transaction inserts new rows matching the WHERE filter)",
        "explanation": "Repeatable Read prevents Dirty Reads and Non-Repeatable Reads on existing rows. However, concurrent transactions can insert new rows that match the query criteria, appearing as 'phantoms' on subsequent queries.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_3",
        "category": "SQL & Databases",
        "topic": "Database Normalization",
        "difficulty": "Easy",
        "question_text": "What is the primary objective of normalizing a relational database schema up to Third Normal Form (3NF)?",
        "options": [
            "To eliminate data redundancy, avoid insertion/update/deletion anomalies, and ensure data integrity",
            "To maximize query execution speed regardless of table storage",
            "To allow every column to hold comma-separated lists of values",
            "To disable foreign key constraints for high throughput"
        ],
        "correct_answer": "To eliminate data redundancy, avoid insertion/update/deletion anomalies, and ensure data integrity",
        "explanation": "Normalization organizes tables so that each non-key column depends strictly on the primary key, preventing duplicated data and inconsistency during updates.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_4",
        "category": "SQL & Databases",
        "topic": "Clustered vs Non-Clustered Indexes",
        "difficulty": "Medium",
        "question_text": "What is the fundamental difference between a clustered index and a non-clustered index in relational database tables?",
        "options": [
            "A clustered index dictates the physical storage order of table data on disk (only one allowed per table); non-clustered indexes store pointers/keys to data rows",
            "A table can have up to 256 clustered indexes",
            "Clustered indexes only work on VARCHAR columns",
            "Non-clustered indexes are stored in RAM only"
        ],
        "correct_answer": "A clustered index dictates the physical storage order of table data on disk (only one allowed per table); non-clustered indexes store pointers/keys to data rows",
        "explanation": "A clustered index defines how table leaf pages are physically arranged on disk. Therefore, each table can only have one clustered index (usually the primary key). Non-clustered indexes are auxiliary search structures.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_5",
        "category": "SQL & Databases",
        "topic": "SQL Window Functions",
        "difficulty": "Medium",
        "question_text": "What is the difference between ROW_NUMBER() and DENSE_RANK() in SQL window functions when duplicate values occur in the ORDER BY clause?",
        "options": [
            "ROW_NUMBER() assigns consecutive integers regardless of duplicates; DENSE_RANK() assigns identical ranks to duplicates without skipping subsequent ranks",
            "ROW_NUMBER() skips ranks after duplicates",
            "DENSE_RANK() assigns negative integers to duplicate rows",
            "There is no difference; they are aliases"
        ],
        "correct_answer": "ROW_NUMBER() assigns consecutive integers regardless of duplicates; DENSE_RANK() assigns identical ranks to duplicates without skipping subsequent ranks",
        "explanation": "ROW_NUMBER() produces unique sequential values (1, 2, 3, 4). DENSE_RANK() gives ties the same rank and resumes immediately with the next number (1, 2, 2, 3). RANK() would skip (1, 2, 2, 4).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_6",
        "category": "SQL & Databases",
        "topic": "Write-Ahead Logging (WAL)",
        "difficulty": "Hard",
        "question_text": "Why do relational database engines like PostgreSQL and MySQL write changes to a Write-Ahead Log (WAL) before writing to the actual table data files?",
        "options": [
            "To guarantee durability (D in ACID) and crash recovery via fast sequential append-only writes, deferring expensive random disk I/O flushes",
            "To compress queries before parsing",
            "To encrypt user passwords in transit",
            "To replicate data to web browsers via WebSockets"
        ],
        "correct_answer": "To guarantee durability (D in ACID) and crash recovery via fast sequential append-only writes, deferring expensive random disk I/O flushes",
        "explanation": "Appending to WAL is fast sequential I/O. If the server crashes or power fails, the database replays uncommitted or dirty buffer page writes from the WAL log during startup recovery.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_7",
        "category": "SQL & Databases",
        "topic": "ACID: Atomicity",
        "difficulty": "Easy",
        "question_text": "What does 'Atomicity' guarantee in a database transaction?",
        "options": [
            "All statements within the transaction either succeed completely or are rolled back completely ('all-or-nothing')",
            "Transactions execute in isolation without seeing other concurrent updates",
            "Once committed, data will survive system crashes",
            "Database integrity constraints are never checked"
        ],
        "correct_answer": "All statements within the transaction either succeed completely or are rolled back completely ('all-or-nothing')",
        "explanation": "Atomicity ensures that if any command inside a BEGIN ... COMMIT transaction block fails, all previous changes in that transaction are reverted to leave the database in an untainted state.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_8",
        "category": "SQL & Databases",
        "topic": "Composite Index Leftmost Prefix Rule",
        "difficulty": "Medium",
        "question_text": "If a composite index is created on (A, B, C), which WHERE clause CANNOT use this index efficiently?",
        "options": [
            "WHERE B = 10 AND C = 20",
            "WHERE A = 5",
            "WHERE A = 5 AND B = 10",
            "WHERE A = 5 AND B = 10 AND C = 20"
        ],
        "correct_answer": "WHERE B = 10 AND C = 20",
        "explanation": "Composite indexes are sorted starting from the leftmost column. A query filtering only on (B, C) skips the leading column A and cannot utilize the B-Tree index, resulting in a full index/table scan.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_9",
        "category": "SQL & Databases",
        "topic": "Foreign Keys: ON DELETE CASCADE",
        "difficulty": "Easy",
        "question_text": "What happens when a record in a parent table is deleted if the child table has a foreign key configured with `ON DELETE CASCADE`?",
        "options": [
            "All referencing child rows in the child table are automatically deleted",
            "The parent row deletion is aborted with a foreign key violation error",
            "The foreign key in the child table is set to NULL",
            "The child table is dropped from the database schema"
        ],
        "correct_answer": "All referencing child rows in the child table are automatically deleted",
        "explanation": "ON DELETE CASCADE propagates parent row deletions to child rows automatically, preventing orphaned records without requiring manual deletion of dependent rows.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_10",
        "category": "SQL & Databases",
        "topic": "Database EXPLAIN Plans",
        "difficulty": "Medium",
        "question_text": "What does `EXPLAIN ANALYZE` do in PostgreSQL?",
        "options": [
            "It executes the query and returns the query planner's estimated cost alongside the actual execution time, rows processed, and scan methods used",
            "It analyzes the table schema and automatically creates missing indexes",
            "It checks the syntax of the SQL query without running it",
            "It deletes duplicate records in the database table"
        ],
        "correct_answer": "It executes the query and returns the query planner's estimated cost alongside the actual execution time, rows processed, and scan methods used",
        "explanation": "`EXPLAIN` alone shows the planner's estimated cost and plan. `EXPLAIN ANALYZE` actually executes the query in the engine, reporting real runtime execution timings, buffer cache hits, and loops.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_11",
        "category": "SQL & Databases",
        "topic": "HAVING vs WHERE Clause",
        "difficulty": "Easy",
        "question_text": "What is the difference between the WHERE clause and the HAVING clause in SQL?",
        "options": [
            "WHERE filters individual rows before aggregation; HAVING filters aggregated groups after GROUP BY",
            "WHERE is used with JOINs; HAVING is used with subqueries",
            "WHERE filters column names; HAVING filters table names",
            "There is no functional difference"
        ],
        "correct_answer": "WHERE filters individual rows before aggregation; HAVING filters aggregated groups after GROUP BY",
        "explanation": "WHERE acts on base table rows prior to aggregation functions (COUNT, SUM, AVG). HAVING applies filters to the grouped results generated by GROUP BY.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_12",
        "category": "SQL & Databases",
        "topic": "Deadlock Detection & Resolution",
        "difficulty": "Medium",
        "question_text": "How do modern relational database engines resolve a deadlock between two concurrent transactions?",
        "options": [
            "The database engine detects the circular lock dependency graph, selects one transaction as a victim, rolls it back, and returns a deadlock error to the application",
            "The database halts and reboots the operating system",
            "Both transactions are committed simultaneously with merged changes",
            "All connected database users are logged out automatically"
        ],
        "correct_answer": "The database engine detects the circular lock dependency graph, selects one transaction as a victim, rolls it back, and returns a deadlock error to the application",
        "explanation": "Relational databases maintain a wait-for lock graph. When a cycle (deadlock) is detected, the engine picks a victim transaction (often the one with fewest writes), aborts it, and allows the other to proceed.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_13",
        "category": "SQL & Databases",
        "topic": "SQL Injection Prevention",
        "difficulty": "Easy",
        "question_text": "What is the most effective and industry-standard method to prevent SQL Injection vulnerabilities in backend code?",
        "options": [
            "Using Parameterized Queries (Prepared Statements) with bound parameters",
            "Escaping single quotes manually using regex replace",
            "Encrypting database table names with AES",
            "Limiting SQL query execution to port 443"
        ],
        "correct_answer": "Using Parameterized Queries (Prepared Statements) with bound parameters",
        "explanation": "Parameterized queries separate SQL code from user-supplied data at the database driver level. The engine compiles the query template first, treating user input purely as literals, neutralizing injection.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_14",
        "category": "SQL & Databases",
        "topic": "NoSQL vs Relational Storage",
        "difficulty": "Medium",
        "question_text": "When is a document-oriented NoSQL database like MongoDB typically preferred over a traditional relational database (RDBMS)?",
        "options": [
            "When storing polymorphic, hierarchical, or rapidly evolving JSON documents with high write throughput and horizontal sharding requirements",
            "When complex multi-table ACID transactions across 20 tables are paramount",
            "When data requires strict third normal form relations with composite foreign keys",
            "When SQL reporting queries with dozens of nested joins are required"
        ],
        "correct_answer": "When storing polymorphic, hierarchical, or rapidly evolving JSON documents with high write throughput and horizontal sharding requirements",
        "explanation": "Document stores allow nesting related data into self-contained JSON/BSON documents, excelling when schemas evolve dynamically and horizontal sharding across commodity clusters is required.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_15",
        "category": "SQL & Databases",
        "topic": "Read Replicas & Replication Lag",
        "difficulty": "Medium",
        "question_text": "What is 'Replication Lag' in a primary-replica database setup?",
        "options": [
            "The delay between a transaction committing on the primary database and being written/visible on a read replica node",
            "The time required to establish a TCP socket to the database server",
            "The latency between client browser and CDN edge",
            "The difference in clock time between database servers"
        ],
        "correct_answer": "The delay between a transaction committing on the primary database and being written/visible on a read replica node",
        "explanation": "Asynchronous replication streams write changes from the primary node to read replicas. High write volume or network congestion causes replication lag, meaning reads on replicas may temporarily reflect stale data.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_16",
        "category": "SQL & Databases",
        "topic": "Optimistic Locking with Versioning",
        "difficulty": "Medium",
        "question_text": "In SQL, how is optimistic locking typically implemented using a version column?",
        "options": [
            "`UPDATE table SET balance = 100, version = version + 1 WHERE id = 1 AND version = current_version` and checking if affected rows == 1",
            "`SELECT * FROM table FOR UPDATE NOWAIT`",
            "`ALTER TABLE ADD LOCK EXCLUSIVE`",
            "`TRUNCATE TABLE table`"
        ],
        "correct_answer": "`UPDATE table SET balance = 100, version = version + 1 WHERE id = 1 AND version = current_version` and checking if affected rows == 1",
        "explanation": "The update checks that `version == current_version`. If another concurrent process incremented the version first, affected rows will be 0, alerting the application to retry or abort.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_17",
        "category": "SQL & Databases",
        "topic": "SQL NULL Semantics & Three-Valued Logic",
        "difficulty": "Hard",
        "question_text": "In standard SQL three-valued logic, what is the result of the expression `NULL = NULL`?",
        "options": [
            "UNKNOWN (evaluates to false in a WHERE filter)",
            "TRUE",
            "FALSE",
            "Syntax Error"
        ],
        "correct_answer": "UNKNOWN (evaluates to false in a WHERE filter)",
        "explanation": "NULL represents missing/unknown data. In SQL, NULL is not equal to anything, including another NULL. Expressions evaluating NULL must use `IS NULL` or `IS NOT NULL`.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_18",
        "category": "SQL & Databases",
        "topic": "Database Covering Index",
        "difficulty": "Hard",
        "question_text": "What is a 'Covering Index' and why does it significantly boost query performance?",
        "options": [
            "An index that contains all columns requested by a SELECT query, allowing the engine to satisfy the query entirely from the index without reading table heap pages",
            "An index that covers all tables in the entire database",
            "An index that compresses data by 90%",
            "An index that automatically prevents duplicate primary keys"
        ],
        "correct_answer": "An index that contains all columns requested by a SELECT query, allowing the engine to satisfy the query entirely from the index without reading table heap pages",
        "explanation": "A covering index (or index with INCLUDE columns) satisfies the query directly from the B-Tree leaf pages, eliminating the secondary heap lookup ('Bookmark Lookup' or 'Table Access by Rowid').",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_19",
        "category": "SQL & Databases",
        "topic": "Redis In-Memory Eviction Policies",
        "difficulty": "Medium",
        "question_text": "What does the Redis eviction policy `volatile-lru` do when memory reaches `maxmemory`?",
        "options": [
            "Evicts the least recently used keys among those with an expiration (TTL) set",
            "Evicts all keys randomly across the entire database",
            "Permanently deletes the Redis configuration file",
            "Rejects all read requests with memory overflow errors"
        ],
        "correct_answer": "Evicts the least recently used keys among those with an expiration (TTL) set",
        "explanation": "`volatile-lru` evicts keys using the LRU algorithm strictly from the subset of keys that have an expiration TTL configured, preserving persistent keys without TTL.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_20",
        "category": "SQL & Databases",
        "topic": "Database Table Partitioning",
        "difficulty": "Medium",
        "question_text": "What is the difference between range partitioning and hash partitioning in large database tables?",
        "options": [
            "Range partitioning assigns rows based on a continuous value range (e.g. by year/month); hash partitioning distributes rows using a hash of the partition key",
            "Range partitioning only works on strings; hash partitioning is for integers",
            "Hash partitioning stores data in memory only",
            "Range partitioning does not support indexing"
        ],
        "correct_answer": "Range partitioning assigns rows based on a continuous value range (e.g. by year/month); hash partitioning distributes rows using a hash of the partition key",
        "explanation": "Range partitioning groups data by boundaries (e.g. `created_at` by quarter, making pruning old partitions trivial). Hash partitioning evenly distributes rows across N partitions to balance write load.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_21",
        "category": "SQL & Databases",
        "topic": "SQL UNION vs UNION ALL",
        "difficulty": "Easy",
        "question_text": "What is the operational difference between `UNION` and `UNION ALL` in SQL?",
        "options": [
            "`UNION` removes duplicate rows by performing a distinct sort; `UNION ALL` retains all rows including duplicates and is faster",
            "`UNION ALL` only works on numbers; `UNION` works on strings",
            "`UNION` combines tables horizontally; `UNION ALL` combines them vertically",
            "`UNION ALL` requires both queries to have different column counts"
        ],
        "correct_answer": "`UNION` removes duplicate rows by performing a distinct sort; `UNION ALL` retains all rows including duplicates and is faster",
        "explanation": "`UNION` performs an internal sort/hash operation to deduplicate rows across result sets, which has computational overhead. `UNION ALL` simply concatenates results directly without deduplication.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_22",
        "category": "SQL & Databases",
        "topic": "Database CTE (Common Table Expressions)",
        "difficulty": "Easy",
        "question_text": "What is a Common Table Expression (CTE) in SQL defined with the `WITH` clause?",
        "options": [
            "A temporary, named result set defined within the scope of a single SELECT, INSERT, UPDATE, or DELETE query",
            "A permanent database table stored on disk",
            "A compiled stored procedure with admin privileges",
            "A custom user-defined aggregate function"
        ],
        "correct_answer": "A temporary, named result set defined within the scope of a single SELECT, INSERT, UPDATE, or DELETE query",
        "explanation": "CTEs improve query readability and modularity, acting as virtual tables available during query execution, and support recursion for tree/hierarchical graph queries.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_23",
        "category": "SQL & Databases",
        "topic": "Database ACID: Durability",
        "difficulty": "Easy",
        "question_text": "What does the 'Durability' property in ACID guarantee?",
        "options": [
            "Once a transaction is committed, its effects are permanent and will not be lost even in the event of an immediate system crash or power outage",
            "Transactions execute within a fixed duration of time",
            "The database automatically backs up data to tape every night",
            "No user can delete records from the table"
        ],
        "correct_answer": "Once a transaction is committed, its effects are permanent and will not be lost even in the event of an immediate system crash or power outage",
        "explanation": "Durability ensures committed state changes are persisted to non-volatile storage (via disk flushes and write-ahead logs) so that data remains safe through sudden power cuts or crashes.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_24",
        "category": "SQL & Databases",
        "topic": "Foreign Key Indexes",
        "difficulty": "Medium",
        "question_text": "Why is it recommended in relational databases to place an explicit index on foreign key columns in child tables?",
        "options": [
            "To prevent full table scans on child tables during parent row DELETE/UPDATE operations and accelerate JOIN performance",
            "Relational databases refuse to create foreign keys without indexes",
            "Foreign keys cannot store integers unless indexed",
            "To make the child table read-only"
        ],
        "correct_answer": "To prevent full table scans on child tables during parent row DELETE/UPDATE operations and accelerate JOIN performance",
        "explanation": "When a parent row is deleted or updated, the engine must verify child tables to enforce referential integrity. Without an index on the foreign key column, this causes a table scan on the child table.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "sql_25",
        "category": "SQL & Databases",
        "topic": "SQL UPSERT (ON CONFLICT)",
        "difficulty": "Medium",
        "question_text": "In modern SQL (e.g. PostgreSQL `INSERT INTO ... ON CONFLICT DO UPDATE`), what problem does UPSERT solve atomically?",
        "options": [
            "It inserts a row or updates it if a unique constraint key already exists, preventing race conditions without needing explicit locks",
            "It permanently deletes conflicting rows from all connected databases",
            "It rolls back the entire database to the previous day's snapshot",
            "It merges two foreign databases over HTTP"
        ],
        "correct_answer": "It inserts a row or updates it if a unique constraint key already exists, preventing race conditions without needing explicit locks",
        "explanation": "UPSERT eliminates check-then-act race conditions where two concurrent requests check if a key exists and both try to insert, avoiding duplicate key constraint violation exceptions.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_1",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Process vs Thread",
        "difficulty": "Easy",
        "question_text": "What is the key difference between a Process and a Thread in modern operating systems?",
        "options": [
            "A process has its own isolated virtual address space; threads within the same process share memory (heap, code, global data) but have independent stacks",
            "Processes cannot communicate with other processes; threads can",
            "Threads run on separate physical CPUs while processes share a single core",
            "Processes have smaller memory overhead than threads"
        ],
        "correct_answer": "A process has its own isolated virtual address space; threads within the same process share memory (heap, code, global data) but have independent stacks",
        "explanation": "Processes are isolated by OS kernel virtual memory pages for stability and security. Threads are lightweight execution units within a process sharing the same address space and file descriptors.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_2",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "TCP 3-Way Handshake",
        "difficulty": "Easy",
        "question_text": "What is the exact sequence of packets exchanged to establish a standard TCP connection?",
        "options": [
            "SYN -> SYN-ACK -> ACK",
            "ACK -> SYN -> SYN-ACK",
            "SYN -> ACK -> DATA",
            "HELLO -> ACK -> CONNECT"
        ],
        "correct_answer": "SYN -> SYN-ACK -> ACK",
        "explanation": "The client sends SYN (synchronize sequence number), the server replies with SYN-ACK (acknowledging client and proposing its sequence number), and the client returns ACK. The connection is established.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_3",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Deadlock Coffman Conditions",
        "difficulty": "Hard",
        "question_text": "Which of the following is NOT one of the four essential Coffman conditions required for a deadlock to occur?",
        "options": [
            "Preemption (operating system forcibly revokes resources from active threads)",
            "Mutual Exclusion",
            "Hold and Wait",
            "Circular Wait"
        ],
        "correct_answer": "Preemption (operating system forcibly revokes resources from active threads)",
        "explanation": "The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption is allowed (forcibly taking resources back), deadlocks cannot persist.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_4",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Virtual Memory & Page Faults",
        "difficulty": "Medium",
        "question_text": "What is a 'Page Fault' in an operating system?",
        "options": [
            "A hardware interrupt raised by the Memory Management Unit (MMU) when a program accesses a virtual page that is not currently mapped into physical RAM",
            "A fatal operating system crash requiring hardware replacement",
            "A syntax error in C compiler pointer dereferencing",
            "A memory leak caused by unclosed database connections"
        ],
        "correct_answer": "A hardware interrupt raised by the Memory Management Unit (MMU) when a program accesses a virtual page that is not currently mapped into physical RAM",
        "explanation": "When a virtual page is absent from physical memory (e.g. swapped out to disk or lazily allocated), the MMU triggers a page fault. The OS kernel traps, loads the page from disk into RAM, and resumes the thread.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_5",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "TCP vs UDP Protocols",
        "difficulty": "Easy",
        "question_text": "What is the primary operational difference between TCP and UDP at the transport layer?",
        "options": [
            "TCP is connection-oriented, reliable, and guarantees in-order delivery with flow/congestion control; UDP is connectionless, lightweight, and does not guarantee delivery",
            "TCP is for local networks; UDP is for the global Internet",
            "UDP encrypts data by default; TCP does not",
            "TCP operates on Layer 7; UDP operates on Layer 3"
        ],
        "correct_answer": "TCP is connection-oriented, reliable, and guarantees in-order delivery with flow/congestion control; UDP is connectionless, lightweight, and does not guarantee delivery",
        "explanation": "TCP provides reliable, sequenced delivery with acknowledgments and retransmission at the cost of higher latency. UDP sends datagrams without handshakes, making it ideal for DNS, video streaming, and gaming.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_6",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "DNS Resolution Process",
        "difficulty": "Medium",
        "question_text": "What is the correct hierarchical order of DNS servers queried during a recursive resolution of a domain (e.g. api.google.com)?",
        "options": [
            "Local DNS Resolver -> Root Nameserver -> TLD Nameserver (.com) -> Authoritative Nameserver (google.com)",
            "Root Nameserver -> Authoritative Nameserver -> Local Browser -> TLD Nameserver",
            "TLD Nameserver -> Local Cache -> Root Nameserver -> Client",
            "Client -> Authoritative Nameserver directly without resolvers"
        ],
        "correct_answer": "Local DNS Resolver -> Root Nameserver -> TLD Nameserver (.com) -> Authoritative Nameserver (google.com)",
        "explanation": "If not cached locally, the resolver queries the Root server (.), which directs to the TLD server (.com), which directs to the Authoritative server (google.com), which returns the final IP record.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_7",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "HTTP/1.1 vs HTTP/2",
        "difficulty": "Medium",
        "question_text": "What major performance limitation in HTTP/1.1 does HTTP/2 solve through multiplexing?",
        "options": [
            "Head-of-Line (HoL) blocking at the HTTP application layer (multiple parallel requests over a single TCP connection)",
            "Lack of SSL/TLS encryption support",
            "Inability to send cookies across domains",
            "Maximum file upload limits of 2MB"
        ],
        "correct_answer": "Head-of-Line (HoL) blocking at the HTTP application layer (multiple parallel requests over a single TCP connection)",
        "explanation": "In HTTP/1.1, browsers had to open multiple TCP connections because requests on one connection had to wait for previous responses. HTTP/2 multiplexes multiple streams over a single connection concurrently.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_8",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "OS Context Switching",
        "difficulty": "Medium",
        "question_text": "What happens during an operating system CPU context switch between two threads?",
        "options": [
            "The kernel saves the registers, program counter, and stack pointer of the current thread and restores the saved state of the next scheduled thread",
            "The physical RAM memory is wiped and reloaded from disk",
            "All TCP connections are temporarily disconnected",
            "The CPU frequency is overclocked to switch contexts"
        ],
        "correct_answer": "The kernel saves the registers, program counter, and stack pointer of the current thread and restores the saved state of the next scheduled thread",
        "explanation": "Context switching preserves the execution state of the departing process/thread into its Process Control Block (PCB) / Thread Control Block (TCB) and loads the new thread's context to resume instruction flow.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_9",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "CORS & Preflight Requests",
        "difficulty": "Medium",
        "question_text": "Why do web browsers send an HTTP `OPTIONS` preflight request before certain cross-origin HTTP requests?",
        "options": [
            "To check if the target server permits the request method, custom headers, and credentials from the origin domain before sending the actual request",
            "To measure network round-trip ping time to the server",
            "To download SSL certificates before initiating TLS",
            "To verify that the client has cookies enabled"
        ],
        "correct_answer": "To check if the target server permits the request method, custom headers, and credentials from the origin domain before sending the actual request",
        "explanation": "For 'non-simple' requests (e.g. PUT/DELETE, JSON Content-Type, custom headers), browsers send an OPTIONS preflight to verify CORS headers (Access-Control-Allow-Origin/Methods) prior to mutation.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_10",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "OS Inter-Process Communication (IPC)",
        "difficulty": "Medium",
        "question_text": "Which Inter-Process Communication (IPC) mechanism provides the fastest data exchange between processes on the same host?",
        "options": [
            "Shared Memory",
            "Pipes",
            "Unix Domain Sockets",
            "Loopback TCP Sockets"
        ],
        "correct_answer": "Shared Memory",
        "explanation": "Shared memory maps the same physical RAM pages into the virtual address spaces of both processes. After mapping, communication occurs directly via CPU memory reads/writes with zero kernel copy overhead.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_11",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Translation Lookaside Buffer (TLB)",
        "difficulty": "Hard",
        "question_text": "What is the purpose of the Translation Lookaside Buffer (TLB) in CPU hardware?",
        "options": [
            "A high-speed hardware cache that stores recent virtual-to-physical address translations, avoiding multi-level page table walks in RAM",
            "A hardware buffer that caches network packets from the Ethernet card",
            "A register file used exclusively for vector floating point instructions",
            "A storage sector on the hard drive for swap memory"
        ],
        "correct_answer": "A high-speed hardware cache that stores recent virtual-to-physical address translations, avoiding multi-level page table walks in RAM",
        "explanation": "Walking multi-level page tables in RAM for every memory access would cut CPU speed in half. The TLB caches virtual-to-physical address mappings, serving translations in a single clock cycle.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_12",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Subnetting & CIDR",
        "difficulty": "Easy",
        "question_text": "How many usable host IP addresses are available in a `/24` IPv4 subnet (e.g. `192.168.1.0/24`)?",
        "options": [
            "254 (256 total minus network address and broadcast address)",
            "256",
            "128",
            "512"
        ],
        "correct_answer": "254 (256 total minus network address and broadcast address)",
        "explanation": "A /24 subnet has 8 host bits (2^8 = 256 addresses). The first address (.0) is the network ID and the last address (.255) is the broadcast address, leaving 254 assignable host addresses.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_13",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "SYN Flood Attack & SYN Cookies",
        "difficulty": "Hard",
        "question_text": "How do SYN Cookies protect a server against SYN Flood Denial-of-Service attacks?",
        "options": [
            "The server encodes connection state into the initial SYN-ACK sequence number rather than allocating a half-open connection entry in memory",
            "The server drops all incoming TCP connections from unknown IP addresses",
            "The server encrypts all packets with asymmetric RSA keys",
            "The server shifts TCP traffic to UDP automatically"
        ],
        "correct_answer": "The server encodes connection state into the initial SYN-ACK sequence number rather than allocating a half-open connection entry in memory",
        "explanation": "In a SYN flood, attackers exhaust server backlog queues by not replying with final ACKs. SYN cookies encode the connection state mathematically into the sequence number, allocating zero memory until the final ACK arrives.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_14",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Unix File Descriptors & epoll",
        "difficulty": "Hard",
        "question_text": "Why is the `epoll` I/O multiplexing mechanism in Linux superior to `select` and `poll` for handling tens of thousands of concurrent connections (C10K problem)?",
        "options": [
            "`epoll` is event-driven with O(1) operational complexity for active events, whereas `select`/`poll` scan all N file descriptors linearly (O(N)) on every poll",
            "`epoll` runs directly in hardware without using the Linux kernel",
            "`epoll` can only manage up to 1024 file descriptors",
            "`epoll` replaces TCP with UDP automatically"
        ],
        "correct_answer": "`epoll` is event-driven with O(1) operational complexity for active events, whereas `select`/`poll` scan all N file descriptors linearly (O(N)) on every poll",
        "explanation": "`select` and `poll` pass arrays of all descriptors to the kernel and scan them all (O(N)). `epoll` registers descriptors in a kernel red-black tree and returns only the active ready descriptors in O(1) time.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_15",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "NAT (Network Address Translation)",
        "difficulty": "Easy",
        "question_text": "What is the primary function of Network Address Translation (NAT) in home/office routers?",
        "options": [
            "Mapping multiple private IP addresses within a local area network (LAN) to a single public IP address on the Internet",
            "Assigning permanent static IP addresses to mobile phones",
            "Converting IPv4 addresses into domain names",
            "Encrypting Wi-Fi passwords over radio waves"
        ],
        "correct_answer": "Mapping multiple private IP addresses within a local area network (LAN) to a single public IP address on the Internet",
        "explanation": "NAT modifies packet IP headers in transit, enabling hundreds of private LAN devices (e.g. 192.168.x.x) to share a single public IPv4 address, mitigating IPv4 address exhaustion.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_16",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "CPU Scheduling: Round Robin",
        "difficulty": "Medium",
        "question_text": "In CPU scheduling, what is the trade-off of setting the Round Robin time quantum too small versus too large?",
        "options": [
            "Too small: excessive context switching overhead degrades CPU throughput; Too large: behaves like First-Come First-Served (FCFS), hurting response time for interactive processes",
            "Too small causes deadlocks; too large causes memory leaks",
            "Too small disables multi-threading; too large limits RAM to 4GB",
            "There is no trade-off; smaller is always better"
        ],
        "correct_answer": "Too small: excessive context switching overhead degrades CPU throughput; Too large: behaves like First-Come First-Served (FCFS), hurting response time for interactive processes",
        "explanation": "If the time slice is microscopic (e.g. 1us), context switching consumes most of the CPU cycles. If too large (e.g. 10s), short interactive tasks lag behind long CPU-bound jobs.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_17",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "HTTP/3 & QUIC Protocol",
        "difficulty": "Medium",
        "question_text": "What transport protocol does HTTP/3 use instead of TCP to eliminate transport-layer Head-of-Line blocking?",
        "options": [
            "QUIC over UDP",
            "SCTP over IP",
            "WebSocket over TLS",
            "Raw Ethernet Frames"
        ],
        "correct_answer": "QUIC over UDP",
        "explanation": "HTTP/3 is built on QUIC (Quick UDP Internet Connections). By running over UDP with independent streams, packet loss on one stream does not stall data transmission on other streams.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_18",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Unix Inode Structure",
        "difficulty": "Medium",
        "question_text": "What information is stored inside an ext4 filesystem Inode?",
        "options": [
            "File metadata (permissions, owner, size, timestamps, data block pointers), but NOT the file name",
            "The file name and the file content directly in a single block",
            "The user's account password and web browser history",
            "Only the file extension string"
        ],
        "correct_answer": "File metadata (permissions, owner, size, timestamps, data block pointers), but NOT the file name",
        "explanation": "An inode contains all metadata about a file and pointers to its storage blocks. File names are stored in directory files which map names to inode numbers (enabling hard links).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_19",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "TLS/SSL Handshake",
        "difficulty": "Medium",
        "question_text": "During a TLS 1.3 handshake, what is the primary role of the Diffie-Hellman (ECDHE) key exchange?",
        "options": [
            "To securely establish a shared symmetric session key over an insecure channel, ensuring Perfect Forward Secrecy (PFS)",
            "To compress the HTML web page before transmission",
            "To store the user's password on the CA certificate authority server",
            "To assign an IP address to the client browser"
        ],
        "correct_answer": "To securely establish a shared symmetric session key over an insecure channel, ensuring Perfect Forward Secrecy (PFS)",
        "explanation": "Diffie-Hellman allows client and server to derive an identical secret encryption key without transmitting the key over the wire. Ephemeral keys (ECDHE) guarantee forward secrecy even if long-term server keys leak.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_20",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "CPU Cache Coherence",
        "difficulty": "Hard",
        "question_text": "In multi-core CPU architectures, what protocol is commonly used to maintain cache coherence across L1/L2 caches?",
        "options": [
            "MESI protocol (Modified, Exclusive, Shared, Invalid)",
            "TCP sliding window protocol",
            "Two-Phase Commit protocol",
            "Raft consensus protocol"
        ],
        "correct_answer": "MESI protocol (Modified, Exclusive, Shared, Invalid)",
        "explanation": "The MESI protocol tracks cache line states across CPU cores, invalidating or updating sibling core caches when one core writes to a shared memory address to prevent stale reads.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_21",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Thrashing in Operating Systems",
        "difficulty": "Medium",
        "question_text": "What is 'Thrashing' in an operating system virtual memory subsystem?",
        "options": [
            "A state where the CPU spends more time swapping virtual pages in and out of disk than executing actual instructions",
            "A condition where two threads deadlock on a mutex lock",
            "A hardware overheating emergency that throttles CPU clock speed",
            "A security vulnerability involving buffer overflows"
        ],
        "correct_answer": "A state where the CPU spends more time swapping virtual pages in and out of disk than executing actual instructions",
        "explanation": "Thrashing occurs when total working set sizes exceed physical RAM. The OS continuously triggers page faults, thrashing the disk while CPU utilization drops to near zero.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_22",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "TCP Sliding Window",
        "difficulty": "Medium",
        "question_text": "What is the purpose of the Sliding Window mechanism in TCP flow control?",
        "options": [
            "To prevent a fast sender from overwhelming a slow receiver by pacing transmitted bytes based on the receiver's advertised window size",
            "To cycle through IP addresses during DNS round-robin",
            "To close idle TCP sockets after 30 seconds of inactivity",
            "To encrypt TCP packets with rolling cipher keys"
        ],
        "correct_answer": "To prevent a fast sender from overwhelming a slow receiver by pacing transmitted bytes based on the receiver's advertised window size",
        "explanation": "The receiver advertises its available buffer space (Receive Window) in TCP ACKs. The sender adjusts its transmission window dynamically, achieving optimal throughput without overflowing buffers.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_23",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Unix Fork vs Exec",
        "difficulty": "Easy",
        "question_text": "In Unix systems programming, what is the distinction between the `fork()` and `exec()` system calls?",
        "options": [
            "`fork()` creates an exact duplicate child process; `exec()` replaces the current process image with a new executable binary program",
            "`fork()` kills a process; `exec()` creates a new thread",
            "`fork()` is for background threads; `exec()` is for user interfaces",
            "`fork()` allocates RAM; `exec()` writes data to disk"
        ],
        "correct_answer": "`fork()` creates an exact duplicate child process; `exec()` replaces the current process image with a new executable binary program",
        "explanation": "`fork()` spawns a clone of the calling process with copy-on-write memory. `execve()` overlays the process with a completely new binary code and reset stack/heap.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_24",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "Reverse Proxy vs Forward Proxy",
        "difficulty": "Easy",
        "question_text": "What is the difference between a Forward Proxy and a Reverse Proxy?",
        "options": [
            "A Forward Proxy represents clients accessing the Internet (outbound); a Reverse Proxy represents servers receiving client requests (inbound)",
            "A Forward Proxy handles HTTPS; a Reverse Proxy only handles FTP",
            "A Reverse Proxy is installed inside the client browser",
            "There is no architectural difference"
        ],
        "correct_answer": "A Forward Proxy represents clients accessing the Internet (outbound); a Reverse Proxy represents servers receiving client requests (inbound)",
        "explanation": "Forward proxies sit in front of clients (e.g. corporate internet filtering, privacy). Reverse proxies sit in front of servers (e.g. Nginx, Cloudflare), providing load balancing, caching, and SSL termination.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "os_25",
        "category": "Operating Systems, Networking, and DBMS",
        "topic": "OS Monolithic Kernel vs Microkernel",
        "difficulty": "Medium",
        "question_text": "What is the architectural difference between a Monolithic Kernel (e.g. Linux) and a Microkernel (e.g. seL4, QNX)?",
        "options": [
            "Monolithic kernels run all OS services (filesystem, drivers, networking, IPC) in privileged kernel space; microkernels keep only minimal primitives in kernel space, running drivers and filesystems in user space",
            "Monolithic kernels cannot support networking",
            "Microkernels run 10x faster because they have no system calls",
            "Monolithic kernels are only for embedded smartwatches"
        ],
        "correct_answer": "Monolithic kernels run all OS services (filesystem, drivers, networking, IPC) in privileged kernel space; microkernels keep only minimal primitives in kernel space, running drivers and filesystems in user space",
        "explanation": "Monolithic kernels achieve high performance by running everything in single address space (at risk of a single driver crash crashing the OS). Microkernels isolate components in user space for fault tolerance and formal verification.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_1",
        "category": "Job-Specific Technologies",
        "topic": "Docker Layer Caching & Multi-Stage",
        "difficulty": "Medium",
        "question_text": "What is the primary advantage of using multi-stage builds in Dockerfiles for production web applications?",
        "options": [
            "Separates the build environment (compilers, dev tools, SDKs) from the minimal production runtime container, drastically reducing final image size and attack surface",
            "Allows containers to run on both Windows and Linux simultaneously",
            "Enables Docker containers to boot without a Linux kernel",
            "Automatically generates Kubernetes YAML configurations"
        ],
        "correct_answer": "Separates the build environment (compilers, dev tools, SDKs) from the minimal production runtime container, drastically reducing final image size and attack surface",
        "explanation": "Multi-stage builds use `FROM ... AS builder` to build binaries and then copy only artifacts into a clean, minimal base image (like `alpine` or `distroless`), shrinking image sizes from 1GB to <50MB.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_2",
        "category": "Job-Specific Technologies",
        "topic": "Kubernetes Pods & Deployments",
        "difficulty": "Medium",
        "question_text": "In Kubernetes, what is the relationship between a Pod, a ReplicaSet, and a Deployment?",
        "options": [
            "A Deployment manages ReplicaSets declaratively (for rollouts and rollbacks), and ReplicaSets ensure the desired number of Pod instances are running",
            "A Pod manages multiple Deployments across different cloud providers",
            "A ReplicaSet is a hardware server inside a Kubernetes node",
            "Deployments are strictly for stateful databases; Pods are strictly for web servers"
        ],
        "correct_answer": "A Deployment manages ReplicaSets declaratively (for rollouts and rollbacks), and ReplicaSets ensure the desired number of Pod instances are running",
        "explanation": "A Deployment is a higher-level abstraction that orchestrates rolling updates. It creates and updates ReplicaSets, which in turn manage the lifecycle and scaling of individual Pods.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_3",
        "category": "Job-Specific Technologies",
        "topic": "Kafka Partitions & Consumer Groups",
        "difficulty": "Hard",
        "question_text": "In Apache Kafka, what determines the maximum degree of consumer parallelism within a single Consumer Group?",
        "options": [
            "The number of partitions in the subscribed topic (each partition can be assigned to at most one consumer in a group)",
            "The number of CPU cores on the Kafka broker",
            "The maximum RAM allocated to the JVM heap",
            "The number of producer clients publishing events"
        ],
        "correct_answer": "The number of partitions in the subscribed topic (each partition can be assigned to at most one consumer in a group)",
        "explanation": "In Kafka, order is strictly preserved per partition. To maintain ordering guarantees, each partition within a topic is consumed by at most one consumer instance within a given consumer group.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_4",
        "category": "Job-Specific Technologies",
        "topic": "Redis Data Structures: Sorted Sets",
        "difficulty": "Medium",
        "question_text": "Which Redis data structure is optimal for implementing a high-throughput, real-time gaming leaderboard?",
        "options": [
            "Sorted Set (ZSET) using `ZADD` and `ZREVRANGE`",
            "Hash Map using `HSET`",
            "Standard String using `SET`",
            "Circular Queue using `LPUSH`"
        ],
        "correct_answer": "Sorted Set (ZSET) using `ZADD` and `ZREVRANGE`",
        "explanation": "Redis Sorted Sets store unique members ordered by floating-point scores. Elements can be inserted, retrieved, or ranked in O(log N) time using skip-lists under the hood.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_5",
        "category": "Job-Specific Technologies",
        "topic": "GraphQL vs REST",
        "difficulty": "Medium",
        "question_text": "What classic REST performance issue does GraphQL solve via client-specified query selection?",
        "options": [
            "Over-fetching (receiving unneeded fields) and Under-fetching (requiring multiple waterfall requests to assemble related data)",
            "Database connection pool exhaustion",
            "Slow cryptographic SSL handshakes",
            "Lack of caching support in modern web browsers"
        ],
        "correct_answer": "Over-fetching (receiving unneeded fields) and Under-fetching (requiring multiple waterfall requests to assemble related data)",
        "explanation": "GraphQL allows clients to request exactly the fields and nested associations required in a single query payload, eliminating over-fetching and multi-endpoint under-fetching.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_6",
        "category": "Job-Specific Technologies",
        "topic": "ElasticSearch Inverted Index",
        "difficulty": "Medium",
        "question_text": "What underlying data structure does ElasticSearch / Lucene use to achieve sub-second full-text search across millions of documents?",
        "options": [
            "Inverted Index (mapping individual words/tokens to the list of document IDs containing them)",
            "B+ Tree table scan",
            "Linked List of serialized JSON files",
            "Distributed Hash Ring without disk storage"
        ],
        "correct_answer": "Inverted Index (mapping individual words/tokens to the list of document IDs containing them)",
        "explanation": "An inverted index tokenizes text and maintains a dictionary of terms with postings lists pointing to all documents where each term occurs, enabling instantaneous full-text searches.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_7",
        "category": "Job-Specific Technologies",
        "topic": "CI/CD Pipeline Artifact Caching",
        "difficulty": "Easy",
        "question_text": "Why is dependency caching (e.g. npm cache, pip cache, maven cache) recommended in CI/CD pipelines (e.g. GitHub Actions)?",
        "options": [
            "It eliminates re-downloading thousands of unchanged packages from external registries on every commit, speeding up build times from minutes to seconds",
            "It prevents unit tests from failing",
            "It automatically refactors legacy source code",
            "It deploys code directly to production without running tests"
        ],
        "correct_answer": "It eliminates re-downloading thousands of unchanged packages from external registries on every commit, speeding up build times from minutes to seconds",
        "explanation": "CI runners start from clean VMs. Caching package lock dependencies based on checksum hashes avoids network re-download bottlenecks and registry rate limits.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_8",
        "category": "Job-Specific Technologies",
        "topic": "Nginx Reverse Proxy & Load Balancing",
        "difficulty": "Easy",
        "question_text": "What is the default load balancing algorithm used by Nginx when proxying requests across upstream backend servers?",
        "options": [
            "Round Robin (requests distributed sequentially among servers)",
            "Least Connections",
            "IP Hash",
            "Random choice with power-of-two weighting"
        ],
        "correct_answer": "Round Robin (requests distributed sequentially among servers)",
        "explanation": "By default, Nginx distributes client requests sequentially in a round-robin order across upstream server pools, optionally accounting for server weights.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_9",
        "category": "Job-Specific Technologies",
        "topic": "Docker cgroups vs Namespaces",
        "difficulty": "Hard",
        "question_text": "What are the distinct roles of Linux Namespaces and Control Groups (cgroups) in container runtimes like Docker?",
        "options": [
            "Namespaces provide process isolation (PID, Network, Mount, IPC); cgroups enforce resource metering and limits (CPU, Memory, Disk I/O)",
            "Namespaces limit CPU speed; cgroups provide container file systems",
            "cgroups handle networking; namespaces handle disk encryption",
            "There is no difference; they are aliases in the Linux kernel"
        ],
        "correct_answer": "Namespaces provide process isolation (PID, Network, Mount, IPC); cgroups enforce resource metering and limits (CPU, Memory, Disk I/O)",
        "explanation": "Namespaces restrict what a container can SEE (providing the illusion of an isolated operating system). Control groups (cgroups) restrict what resources a container can USE (capping CPU, RAM, and I/O).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_10",
        "category": "Job-Specific Technologies",
        "topic": "AWS S3 Storage Classes",
        "difficulty": "Easy",
        "question_text": "Which AWS S3 storage class is best suited for archiving long-term audit logs that are rarely accessed but must be retained for compliance?",
        "options": [
            "S3 Glacier Flexible Retrieval or Glacier Deep Archive",
            "S3 Standard",
            "S3 Express One Zone",
            "S3 Intelligent-Tiering High Frequency"
        ],
        "correct_answer": "S3 Glacier Flexible Retrieval or Glacier Deep Archive",
        "explanation": "Glacier Deep Archive provides the lowest cost storage ($0.00099 per GB/month) for cold records accessed less than once a year, with retrieval times ranging from minutes to hours.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_11",
        "category": "Job-Specific Technologies",
        "topic": "Prometheus Metrics: Counters vs Gauges",
        "difficulty": "Medium",
        "question_text": "In Prometheus monitoring, what is the difference between a Counter metric and a Gauge metric?",
        "options": [
            "A Counter only increases (or resets to 0 on restart); a Gauge can go up or down to represent current instantaneous state (e.g. memory usage)",
            "A Counter measures float values; a Gauge only measures boolean values",
            "A Gauge resets to 0 on every scrape; a Counter never resets",
            "Counters are only for CPU; Gauges are only for network"
        ],
        "correct_answer": "A Counter only increases (or resets to 0 on restart); a Gauge can go up or down to represent current instantaneous state (e.g. memory usage)",
        "explanation": "Counters track cumulative events (e.g. `http_requests_total`). Gauges snapshot variable values that fluctuate up and down (e.g. `active_db_connections`, `memory_usage_bytes`).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_12",
        "category": "Job-Specific Technologies",
        "topic": "JWT (JSON Web Token) Security",
        "difficulty": "Medium",
        "question_text": "Why is it insecure to store sensitive, unencrypted personal information (like SSNs or credit card numbers) in a standard JWT payload?",
        "options": [
            "JWT payloads are merely base64url encoded, NOT encrypted; anyone with access to the token can decode and read the claims in plain text",
            "JWT tokens are stored in the browser BIOS",
            "JWT headers strip payload data after 10 minutes",
            "JSON Web Tokens cannot store string data"
        ],
        "correct_answer": "JWT payloads are merely base64url encoded, NOT encrypted; anyone with access to the token can decode and read the claims in plain text",
        "explanation": "A signed JWT (JWS) provides integrity verification (tamper-proofing), NOT confidentiality. Base64url encoding is trivial to decode. Confidential claims require nested JSON Web Encryption (JWE).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_13",
        "category": "Job-Specific Technologies",
        "topic": "Git Rebase vs Merge",
        "difficulty": "Medium",
        "question_text": "What is the primary difference between `git merge feature` and `git rebase main` on a feature branch?",
        "options": [
            "`git merge` creates a new merge commit preserving exact historical commit timestamps; `git rebase` replays feature commits on top of main, creating a linear history",
            "`git rebase` permanently deletes the commit author information",
            "`git merge` works locally only; `git rebase` can only be run on GitHub",
            "`git rebase` cannot cause merge conflicts"
        ],
        "correct_answer": "`git merge` creates a new merge commit preserving exact historical commit timestamps; `git rebase` replays feature commits on top of main, creating a linear history",
        "explanation": "Merging creates a non-linear history with a dedicated merge commit. Rebasing rewrites project history by transplanting branch commits sequentially onto the target branch tip, yielding a clean linear graph.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_14",
        "category": "Job-Specific Technologies",
        "topic": "Web Application Firewall (WAF)",
        "difficulty": "Easy",
        "question_text": "What is the primary role of a Web Application Firewall (WAF) like AWS WAF or Cloudflare WAF?",
        "options": [
            "Inspecting HTTP traffic at Layer 7 to block common web exploits such as SQL Injection, Cross-Site Scripting (XSS), and automated bots",
            "Encrypting database hard drives at rest",
            "Managing Git repository branch permissions",
            "Compiling React source code into static bundles"
        ],
        "correct_answer": "Inspecting HTTP traffic at Layer 7 to block common web exploits such as SQL Injection, Cross-Site Scripting (XSS), and automated bots",
        "explanation": "A WAF operates at application Layer 7, analyzing HTTP requests and applying rule sets (e.g. OWASP Core Rule Set) to filter malicious payloads before they hit application servers.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_15",
        "category": "Job-Specific Technologies",
        "topic": "Database Migration Versioning (Flyway/Liquibase)",
        "difficulty": "Medium",
        "question_text": "Why are database schema migration tools (e.g. Alembic, Prisma Migrate, Flyway) essential in modern team development?",
        "options": [
            "They apply version-controlled, reproducible SQL migration scripts incrementally across development, staging, and production databases",
            "They replace the database engine with an in-memory cache",
            "They automatically translate SQL into GraphQL",
            "They format frontend CSS styling according to design systems"
        ],
        "correct_answer": "They apply version-controlled, reproducible SQL migration scripts incrementally across development, staging, and production databases",
        "explanation": "Migration tools track executed schema versions in a migration history table, ensuring that database schema evolutions stay synchronized with source code across environments.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_16",
        "category": "Job-Specific Technologies",
        "topic": "Terraform Infrastructure as Code (IaC)",
        "difficulty": "Medium",
        "question_text": "In Terraform, what is the role of the state file (`terraform.tfstate`)?",
        "options": [
            "It maps declared configuration resources to real-world cloud infrastructure metadata, tracking resource IDs and dependencies",
            "It stores compiled server binaries for EC2 execution",
            "It acts as a live MySQL database for production web traffic",
            "It stores client session cookies for web applications"
        ],
        "correct_answer": "It maps declared configuration resources to real-world cloud infrastructure metadata, tracking resource IDs and dependencies",
        "explanation": "Terraform state stores bindings between declared HCL resource blocks and corresponding cloud provider resource IDs, determining the diff required during `terraform plan` and `terraform apply`.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_17",
        "category": "Job-Specific Technologies",
        "topic": "Zero-Downtime Database Migrations",
        "difficulty": "Hard",
        "question_text": "When renaming a database column in high-traffic production without downtime, what pattern should be followed?",
        "options": [
            "Expand and Contract pattern: Add new column, dual-write to both columns, backfill historical data, switch reads to new column, then deprecate and drop old column",
            "Run `ALTER TABLE RENAME COLUMN` directly during peak hours",
            "Shut down all web servers for 4 hours",
            "Drop the entire database and restore from last night's backup"
        ],
        "correct_answer": "Expand and Contract pattern: Add new column, dual-write to both columns, backfill historical data, switch reads to new column, then deprecate and drop old column",
        "explanation": "Direct column renames immediately break active web instances running the old code version. The phased Expand/Contract pattern ensures backward and forward compatibility throughout the rollout.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_18",
        "category": "Job-Specific Technologies",
        "topic": "Kubernetes Ingress Controllers",
        "difficulty": "Medium",
        "question_text": "What is the difference between a Kubernetes ClusterIP Service and an Ingress resource?",
        "options": [
            "ClusterIP exposes a service only internally within the cluster; Ingress exposes HTTP/HTTPS routes from outside the cluster to internal services with host/path routing",
            "ClusterIP is an external load balancer on public IP; Ingress is only for internal pods",
            "Ingress runs on physical routers outside the data center",
            "ClusterIP cannot direct traffic to pods"
        ],
        "correct_answer": "ClusterIP exposes a service only internally within the cluster; Ingress exposes HTTP/HTTPS routes from outside the cluster to internal services with host/path routing",
        "explanation": "ClusterIP services provide internal virtual IPs for pod discovery. Ingress acts as a smart Layer 7 reverse proxy managing external inbound traffic, TLS termination, and path routing to backend services.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_19",
        "category": "Job-Specific Technologies",
        "topic": "Feature Flags Architecture",
        "difficulty": "Easy",
        "question_text": "What is the primary operational advantage of using feature flags (e.g. LaunchDarkly, Unleash) in software development?",
        "options": [
            "Decouples code deployment from feature release, enabling instant feature enabling/disabling in production without redeploying code",
            "Compiles source code 10x faster",
            "Increases database query execution speed automatically",
            "Encrypts client-side local storage"
        ],
        "correct_answer": "Decouples code deployment from feature release, enabling instant feature enabling/disabling in production without redeploying code",
        "explanation": "Feature flags allow code to be merged and deployed safely into production dark. Features can be toggled on for specific user cohorts or instantly disabled if incidents arise.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_20",
        "category": "Job-Specific Technologies",
        "topic": "Redis Distributed Locks (Redlock)",
        "difficulty": "Hard",
        "question_text": "When using Redis to implement a distributed lock across microservice instances, what atomic command must be used?",
        "options": [
            "`SET resource_name my_random_value NX PX 30000`",
            "`GET resource_name` followed by `SET resource_name`",
            "`HSET resource_name locked true`",
            "`INCR resource_name`"
        ],
        "correct_answer": "`SET resource_name my_random_value NX PX 30000`",
        "explanation": "`SET ... NX` ensures the key is set only if it does not already exist, and `PX` sets an automatic expiration TTL to prevent deadlocks if the lock holder crashes. This must execute atomically.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_21",
        "category": "Job-Specific Technologies",
        "topic": "Microservices Service Mesh (Istio)",
        "difficulty": "Hard",
        "question_text": "What is the primary role of a Service Mesh (e.g. Istio, Linkerd) in a Kubernetes cluster?",
        "options": [
            "Injecting sidecar proxies (e.g. Envoy) alongside application pods to handle mutual TLS (mTLS), traffic shaping, fault injection, and telemetry transparently",
            "Replacing the Kubernetes API server with a relational database",
            "Managing container image registry storage",
            "Compiling microservice code from Go to C++"
        ],
        "correct_answer": "Injecting sidecar proxies (e.g. Envoy) alongside application pods to handle mutual TLS (mTLS), traffic shaping, fault injection, and telemetry transparently",
        "explanation": "A service mesh delegates service-to-service communication concerns (encryption, retries, circuit breaking, observability) to sidecar proxies, decoupling cross-cutting network logic from business code.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_22",
        "category": "Job-Specific Technologies",
        "topic": "REST API Idempotency Keys",
        "difficulty": "Medium",
        "question_text": "Why do payment APIs (like Stripe) require an `Idempotency-Key` HTTP header on POST requests?",
        "options": [
            "To ensure that if a network timeout causes the client to retry the payment charge, the customer's card is only charged exactly once",
            "To encrypt the credit card CVV number with quantum keys",
            "To verify that the client has sufficient balance before charging",
            "To prevent users from logging out during checkout"
        ],
        "correct_answer": "To ensure that if a network timeout causes the client to retry the payment charge, the customer's card is only charged exactly once",
        "explanation": "If a client charges a card and the network drops before receiving the response, retrying without an idempotency key could double-bill the user. The server checks the key and returns the saved result if already processed.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_23",
        "category": "Job-Specific Technologies",
        "topic": "OpenAPI / Swagger Contracts",
        "difficulty": "Easy",
        "question_text": "What is the primary purpose of an OpenAPI Specification (OAS)?",
        "options": [
            "A standardized, language-agnostic interface description for REST APIs that enables automated documentation generation, client SDK generation, and mock servers",
            "A programming language developed by Google for backend microservices",
            "A protocol that replaces HTTP with Bluetooth",
            "A database query language for MongoDB"
        ],
        "correct_answer": "A standardized, language-agnostic interface description for REST APIs that enables automated documentation generation, client SDK generation, and mock servers",
        "explanation": "OpenAPI definitions provide machine-readable API contracts in JSON/YAML, allowing automated interactive Swagger UI docs, client SDK generation, and automated contract testing.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_24",
        "category": "Job-Specific Technologies",
        "topic": "Semantic Versioning (SemVer)",
        "difficulty": "Easy",
        "question_text": "According to Semantic Versioning (MAJOR.MINOR.PATCH), when must the MAJOR version number be incremented?",
        "options": [
            "When introducing breaking, incompatible API changes",
            "When adding backward-compatible functionality",
            "When making backward-compatible bug fixes",
            "Every calendar year automatically"
        ],
        "correct_answer": "When introducing breaking, incompatible API changes",
        "explanation": "SemVer rules specify: PATCH for backward-compatible bug fixes, MINOR for backward-compatible new features, and MAJOR for incompatible API changes.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "job_25",
        "category": "Job-Specific Technologies",
        "topic": "Serverless Cold Starts",
        "difficulty": "Medium",
        "question_text": "What causes a 'Cold Start' in serverless cloud functions (e.g. AWS Lambda, Google Cloud Functions)?",
        "options": [
            "The cloud provider spinning up a new container instance, initializing the runtime, and downloading application code when no idle warm container is available",
            "The server's cooling fans turning on during high load",
            "The function running out of memory and crashing",
            "Network latency caused by slow Wi-Fi routers"
        ],
        "correct_answer": "The cloud provider spinning up a new container instance, initializing the runtime, and downloading application code when no idle warm container is available",
        "explanation": "Serverless instances scale to zero when idle. An incoming request on a cold container requires provisioning a microVM, initializing the runtime, and parsing application code, adding initial latency.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_1",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Speed, Distance & Time",
        "difficulty": "Easy",
        "question_text": "A train traveling at 72 km/h crosses a 200-meter long platform in 20 seconds. What is the length of the train?",
        "options": [
            "200 meters",
            "150 meters",
            "250 meters",
            "300 meters"
        ],
        "correct_answer": "200 meters",
        "explanation": "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance in 20s = 20 * 20 = 400 meters. Distance = Train Length + Platform Length -> 400 = Train Length + 200 -> Train Length = 200 meters.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_2",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Work and Time",
        "difficulty": "Easy",
        "question_text": "Worker A can complete a task in 12 days, and Worker B can complete the same task in 24 days. Working together, how many days will they take to finish the task?",
        "options": [
            "8 days",
            "6 days",
            "10 days",
            "9 days"
        ],
        "correct_answer": "8 days",
        "explanation": "A's daily work = 1/12. B's daily work = 1/24. Combined daily work = 1/12 + 1/24 = 3/24 = 1/8. Therefore, together they take 8 days.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_3",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Number Series",
        "difficulty": "Easy",
        "question_text": "What is the next number in the series: 3, 7, 15, 31, 63, ___?",
        "options": [
            "127",
            "125",
            "128",
            "126"
        ],
        "correct_answer": "127",
        "explanation": "Each number is obtained by multiplying the previous number by 2 and adding 1: (3*2)+1=7, (7*2)+1=15, (15*2)+1=31, (31*2)+1=63, (63*2)+1 = 127.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_4",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Percentage & Profit",
        "difficulty": "Medium",
        "question_text": "An item is bought for $400 and sold for $500. What is the profit percentage?",
        "options": [
            "25%",
            "20%",
            "30%",
            "15%"
        ],
        "correct_answer": "25%",
        "explanation": "Profit = Selling Price - Cost Price = 500 - 400 = $100. Profit % = (Profit / Cost Price) * 100 = (100 / 400) * 100 = 25%.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_5",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Probability",
        "difficulty": "Medium",
        "question_text": "Two fair six-sided dice are rolled simultaneously. What is the probability that the sum of the numbers is 7?",
        "options": [
            "1/6",
            "1/12",
            "7/36",
            "5/36"
        ],
        "correct_answer": "1/6",
        "explanation": "Total possible outcomes = 6 * 6 = 36. Favorable outcomes summing to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 outcomes. Probability = 6 / 36 = 1/6.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_6",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Syllogisms",
        "difficulty": "Easy",
        "question_text": "Statements: All laptops are electronic devices. All electronic devices require power. Conclusion I: All laptops require power. Conclusion II: Some devices that require power are laptops. Which conclusions follow?",
        "options": [
            "Both Conclusion I and Conclusion II follow",
            "Only Conclusion I follows",
            "Only Conclusion II follows",
            "Neither follows"
        ],
        "correct_answer": "Both Conclusion I and Conclusion II follow",
        "explanation": "Since laptops are a subset of electronic devices, and electronic devices are a subset of things requiring power, all laptops require power (I). Furthermore, since laptops require power, some power-requiring things are laptops (II). Both follow.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_7",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Ratio and Proportion",
        "difficulty": "Easy",
        "question_text": "The ratio of boys to girls in a class of 45 students is 3:2. How many girls are in the class?",
        "options": [
            "18",
            "27",
            "15",
            "20"
        ],
        "correct_answer": "18",
        "explanation": "Total ratio parts = 3 + 2 = 5. Value of 1 part = 45 / 5 = 9 students. Number of girls = 2 parts = 2 * 9 = 18 girls.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_8",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Blood Relations",
        "difficulty": "Medium",
        "question_text": "Pointing to a photograph, John says: 'She is the daughter of my grandfather's only son.' How is the woman in the photograph related to John?",
        "options": [
            "Sister",
            "Mother",
            "Aunt",
            "Cousin"
        ],
        "correct_answer": "Sister",
        "explanation": "John's grandfather's only son is John's father. The daughter of John's father is John's sister.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_9",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Simple vs Compound Interest",
        "difficulty": "Medium",
        "question_text": "What is the compound interest on a principal of $1,000 at an annual interest rate of 10% compounded annually for 2 years?",
        "options": [
            "$210",
            "$200",
            "$220",
            "$205"
        ],
        "correct_answer": "$210",
        "explanation": "Amount = P * (1 + r)^t = 1000 * (1.10)^2 = 1000 * 1.21 = $1210. Compound Interest = Amount - Principal = 1210 - 1000 = $210.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_10",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Coding-Decoding",
        "difficulty": "Easy",
        "question_text": "In a certain code language, if 'PYTHON' is coded as 'QZWIPO' (each letter shifted forward by +1), how is 'JAVA' coded?",
        "options": [
            "KBWB",
            "KZXB",
            "LAWB",
            "IBUZ"
        ],
        "correct_answer": "KBWB",
        "explanation": "Each letter is shifted forward by 1 in the alphabet: J -> K, A -> B, V -> W, A -> B. Hence, 'KBWB'.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_11",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Permutations & Combinations",
        "difficulty": "Medium",
        "question_text": "In how many different ways can a committee of 3 people be selected from a group of 7 candidates?",
        "options": [
            "35",
            "21",
            "210",
            "42"
        ],
        "correct_answer": "35",
        "explanation": "Formula for combinations is C(n, r) = n! / (r! * (n-r)!). C(7, 3) = (7 * 6 * 5) / (3 * 2 * 1) = 210 / 6 = 35.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_12",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Direction Sense",
        "difficulty": "Easy",
        "question_text": "A person walks 10 meters North, turns right and walks 10 meters, then turns right again and walks 10 meters. How far and in what direction is the person from the starting point?",
        "options": [
            "10 meters East",
            "10 meters North",
            "10 meters South",
            "20 meters East"
        ],
        "correct_answer": "10 meters East",
        "explanation": "Moving 10m North, then 10m East (right), then 10m South (right) places the person exactly 10 meters East of the origin coordinates.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_13",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Averages",
        "difficulty": "Easy",
        "question_text": "The average score of 4 exams is 80. What score must a student achieve on the 5th exam to raise the average score to 84?",
        "options": [
            "100",
            "96",
            "92",
            "105"
        ],
        "correct_answer": "100",
        "explanation": "Total score for 4 exams = 4 * 80 = 320. Desired total for 5 exams = 5 * 84 = 420. Required score = 420 - 320 = 100.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_14",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Clock Angles",
        "difficulty": "Medium",
        "question_text": "What is the angle between the hour hand and the minute hand of a clock at 3:30?",
        "options": [
            "75 degrees",
            "90 degrees",
            "60 degrees",
            "85 degrees"
        ],
        "correct_answer": "75 degrees",
        "explanation": "At 3:30, minute hand is at 180 deg (6). Hour hand is at (3 * 30) + (30 * 0.5) = 90 + 15 = 105 deg. Angle = 180 - 105 = 75 degrees.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_15",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Mixtures & Alligation",
        "difficulty": "Medium",
        "question_text": "In what ratio must water be mixed with milk costing $60 per liter to obtain a mixture worth $50 per liter (assuming water is free)?",
        "options": [
            "1:5",
            "1:6",
            "1:4",
            "2:5"
        ],
        "correct_answer": "1:5",
        "explanation": "By rule of alligation: Cost of water = $0, Cost of milk = $60, Mean price = $50. Ratio (Water : Milk) = (60 - 50) : (50 - 0) = 10 : 50 = 1:5.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_16",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Seating Arrangements",
        "difficulty": "Medium",
        "question_text": "Five people (A, B, C, D, E) are sitting in a row facing North. C is sitting in the exact middle. A is to the immediate left of C. B is at the extreme right end. Who is sitting at the extreme left end if D is between C and B?",
        "options": [
            "E",
            "A",
            "D",
            "Cannot be determined"
        ],
        "correct_answer": "E",
        "explanation": "Positions from left to right: (1, 2, 3, 4, 5). C is at 3. A is at 2 (immediate left of C). B is at 5 (extreme right). D is at 4 (between C and B). Therefore, position 1 (extreme left) must be E.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_17",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Boats and Streams",
        "difficulty": "Medium",
        "question_text": "A boat travels at 15 km/h in still water. If the river current flows at 3 km/h, what is the boat's speed downstream and upstream?",
        "options": [
            "Downstream: 18 km/h; Upstream: 12 km/h",
            "Downstream: 15 km/h; Upstream: 12 km/h",
            "Downstream: 18 km/h; Upstream: 15 km/h",
            "Downstream: 20 km/h; Upstream: 10 km/h"
        ],
        "correct_answer": "Downstream: 18 km/h; Upstream: 12 km/h",
        "explanation": "Downstream speed = Boat speed + Stream speed = 15 + 3 = 18 km/h. Upstream speed = Boat speed - Stream speed = 15 - 3 = 12 km/h.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_18",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Venn Diagrams",
        "difficulty": "Easy",
        "question_text": "In a group of 100 students, 60 like Coffee, 50 like Tea, and 20 like both. How many students like neither Coffee nor Tea?",
        "options": [
            "10",
            "20",
            "15",
            "5"
        ],
        "correct_answer": "10",
        "explanation": "Students liking at least one = (Coffee + Tea) - Both = 60 + 50 - 20 = 90 students. Students liking neither = 100 - 90 = 10 students.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_19",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Divisibility Rules",
        "difficulty": "Easy",
        "question_text": "Which of the following numbers is divisible by both 3 and 4?",
        "options": [
            "432",
            "514",
            "326",
            "218"
        ],
        "correct_answer": "432",
        "explanation": "Divisibility by 4: last two digits must be divisible by 4 (32 / 4 = 8, passes). Divisibility by 3: sum of digits must be divisible by 3 (4 + 3 + 2 = 9, passes). 432 is divisible by both.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_20",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Calendar Problems",
        "difficulty": "Medium",
        "question_text": "If January 1st of a non-leap year falls on a Monday, on what day of the week will December 31st of that same year fall?",
        "options": [
            "Monday",
            "Tuesday",
            "Sunday",
            "Wednesday"
        ],
        "correct_answer": "Monday",
        "explanation": "A non-leap year has 365 days = 52 weeks + 1 odd day. In any ordinary year, the first day of the year and the last day of the year fall on the exact same day of the week (Monday).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_21",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Pipes and Cisterns",
        "difficulty": "Medium",
        "question_text": "Pipe A can fill a tank in 4 hours, while Pipe B can empty the full tank in 6 hours. If both pipes are opened simultaneously, in how many hours will the tank be filled?",
        "options": [
            "12 hours",
            "10 hours",
            "8 hours",
            "14 hours"
        ],
        "correct_answer": "12 hours",
        "explanation": "Net filling rate per hour = (1/4) - (1/6) = (3 - 2) / 12 = 1/12 of the tank per hour. Therefore, the tank fills in 12 hours.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_22",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Analogy",
        "difficulty": "Easy",
        "question_text": "Architect is to Building as Sculptor is to ___?",
        "options": [
            "Statue",
            "Museum",
            "Chisel",
            "Stone"
        ],
        "correct_answer": "Statue",
        "explanation": "An architect creates/designs a building. Similarly, a sculptor creates a statue.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_23",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Square Roots and Exponents",
        "difficulty": "Easy",
        "question_text": "What is the value of (2^3 * 2^4) / 2^5?",
        "options": [
            "4",
            "8",
            "2",
            "16"
        ],
        "correct_answer": "4",
        "explanation": "Using exponent rules: 2^3 * 2^4 = 2^(3+4) = 2^7. Dividing by 2^5 yields 2^(7-5) = 2^2 = 4.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_24",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Logical Reasoning: Critical Reasoning",
        "difficulty": "Medium",
        "question_text": "Statement: 'To reduce urban traffic congestion, the city council should implement a congestion pricing tax on vehicles entering downtown during rush hour.' Which assumption underlies this argument?",
        "options": [
            "Financial cost influences commuter transportation choices and will encourage alternative transit or off-peak travel",
            "All downtown commuters have access to luxury private vehicles",
            "Traffic congestion has no economic impact on local businesses",
            "Downtown businesses will permanently close if traffic is reduced"
        ],
        "correct_answer": "Financial cost influences commuter transportation choices and will encourage alternative transit or off-peak travel",
        "explanation": "For congestion pricing to reduce traffic, commuters must be sensitive to the financial fee and respond by changing travel times or modes. Assumption 1 directly underlies the argument.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "apt_25",
        "category": "Aptitude and Logical Reasoning",
        "topic": "Quantitative: Arithmetic Progression",
        "difficulty": "Easy",
        "question_text": "What is the sum of the first 10 terms of the arithmetic progression: 2, 5, 8, 11, ...?",
        "options": [
            "155",
            "145",
            "165",
            "150"
        ],
        "correct_answer": "155",
        "explanation": "First term a = 2, common difference d = 3. Sum = (n / 2) * [2a + (n - 1)d] = (10 / 2) * [2(2) + 9(3)] = 5 * [4 + 27] = 5 * 31 = 155.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_1",
        "category": "Resume and Project Concepts",
        "topic": "Application Security & Password Hashing",
        "difficulty": "Medium",
        "question_text": "When building a web application with user authentication, why should passwords be stored using slow adaptive hashing functions (e.g. bcrypt, Argon2) rather than standard SHA-256?",
        "options": [
            "Fast algorithms like SHA-256 can be brute-forced at billions of hashes per second using GPUs/ASICs; bcrypt introduces a configurable work factor and automatic salting to thwart rainbow tables.",
            "SHA-256 is an asymmetric cipher that requires public and private keys.",
            "Bcrypt compresses passwords to fit into 16-bit integer database columns.",
            "SHA-256 generates identical hashes even when different salts are applied."
        ],
        "correct_answer": "Fast algorithms like SHA-256 can be brute-forced at billions of hashes per second using GPUs/ASICs; bcrypt introduces a configurable work factor and automatic salting to thwart rainbow tables.",
        "explanation": "Cryptographic hash functions like MD5 or SHA-256 are designed to be fast, making them vulnerable to massive parallel offline cracking. Password hashing algorithms like bcrypt and Argon2 are intentionally computationally expensive with tunable cost factors and unique per-password salts.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_2",
        "category": "Resume and Project Concepts",
        "topic": "API Pagination & Database Performance",
        "difficulty": "Hard",
        "question_text": "When engineering high-volume REST endpoints in your project, why is cursor-based pagination preferred over offset-based pagination (LIMIT / OFFSET) for large datasets?",
        "options": [
            "Offset pagination forces the database to read and discard all skipped rows (O(OFFSET + LIMIT)), degrading performance on deep pages, whereas cursor pagination uses indexed WHERE keys (O(LIMIT)).",
            "Offset pagination cannot return JSON arrays.",
            "Cursor pagination only works with MongoDB and cannot be implemented in PostgreSQL.",
            "Offset pagination locks the entire database table during query execution."
        ],
        "correct_answer": "Offset pagination forces the database to read and discard all skipped rows (O(OFFSET + LIMIT)), degrading performance on deep pages, whereas cursor pagination uses indexed WHERE keys (O(LIMIT)).",
        "explanation": "With OFFSET 100000 LIMIT 20, the database engine must scan and discard 100,000 rows before returning 20 rows. Cursor-based pagination uses a deterministic indexed column (e.g. WHERE id > last_seen_id ORDER BY id LIMIT 20), scanning only the requested rows directly.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_3",
        "category": "Resume and Project Concepts",
        "topic": "Cross-Site Scripting (XSS) Prevention",
        "difficulty": "Medium",
        "question_text": "In frontend engineering, what is the primary risk of using `dangerouslySetInnerHTML` in React, and how is it safely mitigated?",
        "options": [
            "It exposes the application to Cross-Site Scripting (XSS) attacks by injecting untrusted HTML/JS; mitigated by sanitizing input with libraries like DOMPurify",
            "It crashes the virtual DOM diffing engine",
            "It causes memory leaks in React state hooks",
            "It disables CSS styling on the rendered elements"
        ],
        "correct_answer": "It exposes the application to Cross-Site Scripting (XSS) attacks by injecting untrusted HTML/JS; mitigated by sanitizing input with libraries like DOMPurify",
        "explanation": "Directly injecting unescaped strings into the DOM allows malicious actors to inject `<script>` tags or onerror attributes, stealing auth tokens or cookies. DOMPurify cleans dangerous tags and attributes before rendering.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_4",
        "category": "Resume and Project Concepts",
        "topic": "Cross-Site Request Forgery (CSRF)",
        "difficulty": "Medium",
        "question_text": "How does setting the `SameSite=Strict` or `SameSite=Lax` attribute on session cookies protect a web application against CSRF attacks?",
        "options": [
            "It instructs the browser not to send the cookie on cross-site requests initiated by third-party origins, preventing attackers from forging authenticated requests",
            "It encrypts the cookie payload using TLS 1.3",
            "It deletes the cookie whenever the user closes the browser tab",
            "It prevents JavaScript from accessing the cookie via document.cookie"
        ],
        "correct_answer": "It instructs the browser not to send the cookie on cross-site requests initiated by third-party origins, preventing attackers from forging authenticated requests",
        "explanation": "`SameSite` cookie policy prevents browsers from attaching session cookies when requests originate from external third-party sites, blocking CSRF attacks at the browser level.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_5",
        "category": "Resume and Project Concepts",
        "topic": "Secure File Uploads",
        "difficulty": "Hard",
        "question_text": "When handling user avatar and document uploads in a production web application, why is validating the file extension alone insufficient for security?",
        "options": [
            "Attackers can disguise executable malware or web shells (e.g. PHP/JS) by renaming file extensions; applications must inspect magic bytes, use random filenames, and store uploads on isolated object storage (S3)",
            "File extensions are stripped by the HTTP protocol during transport",
            "Image files cannot have extensions longer than 3 characters",
            "Operating systems do not support file extensions"
        ],
        "correct_answer": "Attackers can disguise executable malware or web shells (e.g. PHP/JS) by renaming file extensions; applications must inspect magic bytes, use random filenames, and store uploads on isolated object storage (S3)",
        "explanation": "Checking `.jpg` or `.png` is trivial to bypass. Robust systems inspect the file's binary magic bytes, generate UUID filenames, serve files with `Content-Disposition: attachment` or from isolated subdomains/S3 with strict CORS.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_6",
        "category": "Resume and Project Concepts",
        "topic": "Webhook Delivery & Idempotency",
        "difficulty": "Hard",
        "question_text": "When receiving webhooks from third-party services (e.g. Stripe, GitHub, Twilio), what two security and reliability practices must always be implemented?",
        "options": [
            "Verify HMAC cryptographic signatures using a shared secret to confirm authenticity, and record event IDs in a datastore to enforce idempotent processing",
            "Accept all requests without authentication and process them synchronously",
            "Store webhooks in browser localStorage before processing",
            "Reply with HTTP 500 until the webhook is sent three times"
        ],
        "correct_answer": "Verify HMAC cryptographic signatures using a shared secret to confirm authenticity, and record event IDs in a datastore to enforce idempotent processing",
        "explanation": "HMAC signature validation verifies the payload was not forged or altered by an attacker. Event ID deduplication prevents processing duplicate deliveries that occur when network glitches trigger retries.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_7",
        "category": "Resume and Project Concepts",
        "topic": "Database Soft Deletes vs Hard Deletes",
        "difficulty": "Medium",
        "question_text": "What is the architectural purpose of implementing 'Soft Deletes' (e.g. `deleted_at IS NOT NULL`) in relational project tables?",
        "options": [
            "Preserves historical data integrity and audit trails while allowing easy recovery of accidentally deleted records without violating foreign keys",
            "Speeds up SELECT queries by 10x",
            "Reduces physical disk storage usage",
            "Enables real-time WebSockets automatically"
        ],
        "correct_answer": "Preserves historical data integrity and audit trails while allowing easy recovery of accidentally deleted records without violating foreign keys",
        "explanation": "Hard deletes (`DELETE FROM`) permanently erase rows and can cascade destructively into historical orders, invoices, or logs. Soft deletes flag records as archived while maintaining referential integrity.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_8",
        "category": "Resume and Project Concepts",
        "topic": "Distributed Rate Limiting with Redis",
        "difficulty": "Hard",
        "question_text": "Why is storing rate limit counters in-memory on a single web server instance problematic in a modern scaled web deployment?",
        "options": [
            "When traffic is distributed across multiple load-balanced server instances, local in-memory counters cannot track a user's total aggregate requests, allowing rate limits to be bypassed",
            "In-memory variables cannot store integers larger than 100",
            "Load balancers refuse to route traffic to servers with local memory",
            "Single instances cannot execute arithmetic additions"
        ],
        "correct_answer": "When traffic is distributed across multiple load-balanced server instances, local in-memory counters cannot track a user's total aggregate requests, allowing rate limits to be bypassed",
        "explanation": "In a horizontal fleet of 10 instances, an attacker could send 10x the allowed rate if each server tracks requests locally. A centralized in-memory store like Redis provides shared, atomic sliding window rate limiting.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_9",
        "category": "Resume and Project Concepts",
        "topic": "Database Connection Leak Debugging",
        "difficulty": "Medium",
        "question_text": "What symptoms indicate a database connection pool leak in a Node.js/Python backend application?",
        "options": [
            "The application works initially, but after a period of sustained traffic, all new database queries hang indefinitely with pool exhaustion timeout errors",
            "The server CPU usage stays at 0%",
            "The database deletes all table indexes automatically",
            "The web browser displays 404 Not Found errors on static files"
        ],
        "correct_answer": "The application works initially, but after a period of sustained traffic, all new database queries hang indefinitely with pool exhaustion timeout errors",
        "explanation": "Connection leaks happen when database connections are checked out of the pool but never released (e.g. missing `finally` blocks during exception handling). Once the pool reaches its max size, subsequent requests block and time out.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_10",
        "category": "Resume and Project Concepts",
        "topic": "Content Security Policy (CSP)",
        "difficulty": "Medium",
        "question_text": "What is the purpose of the `Content-Security-Policy` (CSP) HTTP response header?",
        "options": [
            "It restricts the origins from which scripts, images, stylesheets, and frames can be loaded and executed by the browser, neutralizing XSS attacks",
            "It forces web browsers to reload the page every 5 minutes",
            "It specifies which database users are allowed to run queries",
            "It compresses outgoing JSON responses with gzip"
        ],
        "correct_answer": "It restricts the origins from which scripts, images, stylesheets, and frames can be loaded and executed by the browser, neutralizing XSS attacks",
        "explanation": "A robust CSP header (e.g. `default-src 'self'; script-src 'self' https://trusted.cdn.com`) instructs modern browsers to refuse executing inline scripts or loading external malicious resources injected via XSS.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_11",
        "category": "Resume and Project Concepts",
        "topic": "Database Index Selectivity",
        "difficulty": "Hard",
        "question_text": "Why is creating an index on a boolean column (e.g. `is_active`) often ignored by relational query planners on large tables?",
        "options": [
            "Low selectivity: when a column contains only two distinct values, scanning the B-tree index and performing random table row lookups is more expensive than a sequential table scan",
            "Databases do not support indexes on boolean types",
            "Boolean indexes require 100x more memory than integer indexes",
            "Indexes can only be created on foreign keys"
        ],
        "correct_answer": "Low selectivity: when a column contains only two distinct values, scanning the B-tree index and performing random table row lookups is more expensive than a sequential table scan",
        "explanation": "Indexes provide the greatest advantage on columns with high cardinality (many distinct values). If `is_active=true` matches 90% of the table, the optimizer will correctly choose a sequential scan over millions of random index lookups.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_12",
        "category": "Resume and Project Concepts",
        "topic": "Microservices Log Aggregation (ELK / Loki)",
        "difficulty": "Medium",
        "question_text": "Why is structured logging (e.g. JSON format with timestamp, level, trace_id, user_id) standard practice in production backend engineering?",
        "options": [
            "It enables log aggregators (Elasticsearch, Grafana Loki, CloudWatch) to parse, filter, query, and alert on specific fields efficiently without brittle regex",
            "It reduces log file sizes to zero bytes",
            "It converts backend logs into frontend HTML tables automatically",
            "It prevents runtime exceptions from occurring"
        ],
        "correct_answer": "It enables log aggregators (Elasticsearch, Grafana Loki, CloudWatch) to parse, filter, query, and alert on specific fields efficiently without brittle regex",
        "explanation": "Unstructured plain text logs are difficult to parse across millions of distributed lines. Structured JSON logs allow developers to filter by `trace_id` or query `statusCode >= 500` instantaneously.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_13",
        "category": "Resume and Project Concepts",
        "topic": "WebSocket Reconnection Architecture",
        "difficulty": "Medium",
        "question_text": "When building real-time applications with WebSockets, how should client reconnection logic be designed to protect the backend from server restarts?",
        "options": [
            "Use Exponential Backoff with randomized Jitter to prevent thousands of clients from reconnecting simultaneously and creating a thundering herd",
            "Reconnect every 10 milliseconds in an infinite while loop",
            "Force the user to clear their browser cache before reconnecting",
            "Open 10 simultaneous backup WebSocket connections"
        ],
        "correct_answer": "Use Exponential Backoff with randomized Jitter to prevent thousands of clients from reconnecting simultaneously and creating a thundering herd",
        "explanation": "If a server restarts and thousands of clients reconnect at the exact same instant, the backend will crash under the connection surge. Exponential backoff with random jitter spreads reconnection attempts smoothly.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_14",
        "category": "Resume and Project Concepts",
        "topic": "Environment Variables & Secrets Management",
        "difficulty": "Easy",
        "question_text": "Why must sensitive secrets (database passwords, private API keys, JWT signing keys) NEVER be committed to Git repositories?",
        "options": [
            "Git history is permanent and distributed; committing secrets leaks them to anyone with repository access and risks public exposure through automated scraping bots",
            "Git repositories reject commits containing the word 'password'",
            "Environment variables cannot be read by Git",
            "Compilers fail to build if secrets are in source code"
        ],
        "correct_answer": "Git history is permanent and distributed; committing secrets leaks them to anyone with repository access and risks public exposure through automated scraping bots",
        "explanation": "Once committed, credentials remain in Git commit history even after deletion. Attackers continuously scrape public and private repositories for leaked AWS/database credentials.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_15",
        "category": "Resume and Project Concepts",
        "topic": "Health Check Endpoints (/healthz)",
        "difficulty": "Easy",
        "question_text": "What is the difference between a Liveness Probe and a Readiness Probe in container orchestrators like Kubernetes?",
        "options": [
            "Liveness checks if the process is alive (if failed, restarts container); Readiness checks if the application is ready to accept user traffic (if failed, removes from load balancer)",
            "Liveness is for databases; Readiness is for web servers",
            "Liveness checks CPU speed; Readiness checks disk size",
            "There is no difference; they are aliases"
        ],
        "correct_answer": "Liveness checks if the process is alive (if failed, restarts container); Readiness checks if the application is ready to accept user traffic (if failed, removes from load balancer)",
        "explanation": "A liveness probe catches deadlocks and crashes by restarting frozen containers. A readiness probe checks dependencies (e.g. DB connection warm); if failing, it routes traffic away without restarting the process.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_16",
        "category": "Resume and Project Concepts",
        "topic": "Database Transactions: Rollback Handling",
        "difficulty": "Medium",
        "question_text": "In backend database service layers, what must be done inside a catch/except block when an operation inside a transaction fails?",
        "options": [
            "Explicitly invoke `transaction.rollback()` and close or release the connection to prevent leaving uncommitted dirty locks in the pool",
            "Commit the partial changes to save progress",
            "Rethrow the error without touching the transaction",
            "Delete the database table"
        ],
        "correct_answer": "Explicitly invoke `transaction.rollback()` and close or release the connection to prevent leaving uncommitted dirty locks in the pool",
        "explanation": "Failing to roll back an aborted transaction leaves the database connection in an error state. Returning an un-rolled-back connection to the pool corrupts subsequent requests borrowing that connection.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_17",
        "category": "Resume and Project Concepts",
        "topic": "Server-Side Rendering (SSR) vs CSR",
        "difficulty": "Medium",
        "question_text": "What are the two primary trade-offs of Server-Side Rendering (SSR) compared to Client-Side Rendering (CSR)?",
        "options": [
            "SSR provides faster First Contentful Paint (FCP) and superior SEO, but incurs higher server compute load and potential hydration overhead",
            "SSR cannot run JavaScript in the browser",
            "CSR works without web browsers",
            "SSR cannot be deployed to cloud hosting providers"
        ],
        "correct_answer": "SSR provides faster First Contentful Paint (FCP) and superior SEO, but incurs higher server compute load and potential hydration overhead",
        "explanation": "SSR renders HTML on the server, delivering fast initial render and perfect web crawler visibility, but increases server CPU consumption and requires client-side JavaScript hydration.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_18",
        "category": "Resume and Project Concepts",
        "topic": "API Versioning Strategies",
        "difficulty": "Easy",
        "question_text": "Which API versioning strategy is generally considered the most transparent and cache-friendly for public REST endpoints?",
        "options": [
            "URI path versioning (e.g. `/api/v1/users`)",
            "Passing the version in an unindexed database column",
            "Changing the domain name for every bug fix",
            "Sending the version in a cookie only"
        ],
        "correct_answer": "URI path versioning (e.g. `/api/v1/users`)",
        "explanation": "URI path versioning (`/api/v1/...`) is explicit, easy to route in API gateways and Nginx, and caches cleanly in CDNs and browser caches without requiring custom header inspection.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_19",
        "category": "Resume and Project Concepts",
        "topic": "Graceful Shutdown in Production Services",
        "difficulty": "Hard",
        "question_text": "What sequence of actions should a backend web server execute upon receiving a `SIGTERM` signal from the OS/Kubernetes?",
        "options": [
            "Stop accepting new connections, finish processing in-flight requests within a grace period timeout, flush pending logs/metrics, close database pools, and exit 0",
            "Immediately kill all active process threads instantly with exit 1",
            "Restart the server automatically without closing sockets",
            "Delete all temporary files and ignore the signal"
        ],
        "correct_answer": "Stop accepting new connections, finish processing in-flight requests within a grace period timeout, flush pending logs/metrics, close database pools, and exit 0",
        "explanation": "Graceful shutdown allows active user requests to complete cleanly rather than dropping ongoing payments or transactions, ensuring zero dropped requests during rolling production updates.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_20",
        "category": "Resume and Project Concepts",
        "topic": "Frontend Bundle Optimization & Code Splitting",
        "difficulty": "Medium",
        "question_text": "How does dynamic code splitting (e.g. `React.lazy()` and dynamic `import()`) improve Single Page Application (SPA) load performance?",
        "options": [
            "It splits the monolithic JavaScript bundle into smaller chunks loaded on-demand only when the user navigates to that specific route, dramatically reducing initial page load time",
            "It compiles JavaScript into binary C++ code",
            "It disables all CSS animations in the browser",
            "It runs React components on the GPU"
        ],
        "correct_answer": "It splits the monolithic JavaScript bundle into smaller chunks loaded on-demand only when the user navigates to that specific route, dramatically reducing initial page load time",
        "explanation": "Without code splitting, a visitor must download code for every admin page and modal before seeing the login screen. Code splitting serves minimal initial JS and fetches other pages lazily on demand.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_21",
        "category": "Resume and Project Concepts",
        "topic": "Database Read-After-Write Consistency",
        "difficulty": "Hard",
        "question_text": "In a system with a primary write database and asynchronous read replicas, how can an application prevent a user from seeing stale data immediately after updating their profile?",
        "options": [
            "Route read requests for the recently updated user directly to the primary database for a short window (e.g. 5 seconds) after mutations",
            "Disable all read replicas permanently",
            "Force the user to log out and log back in",
            "Wait 10 minutes before saving user data"
        ],
        "correct_answer": "Route read requests for the recently updated user directly to the primary database for a short window (e.g. 5 seconds) after mutations",
        "explanation": "Because asynchronous replication takes tens to hundreds of milliseconds, reading from a replica immediately after updating can show old data. Reading from the primary for N seconds guarantees read-your-writes consistency.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_22",
        "category": "Resume and Project Concepts",
        "topic": "Distributed Caching: Cache Invalidation",
        "difficulty": "Medium",
        "question_text": "As the famous computer science quote states: 'There are only two hard things in Computer Science: cache invalidation and naming things.' Why is cache invalidation inherently challenging?",
        "options": [
            "Ensuring that cached copies across distributed nodes are accurately updated or purged the moment primary data changes, avoiding stale data and synchronization race conditions",
            "Caches cannot store strings longer than 8 characters",
            "RAM memory cannot be overwritten after creation",
            "Modern CPUs do not support cache clearing"
        ],
        "correct_answer": "Ensuring that cached copies across distributed nodes are accurately updated or purged the moment primary data changes, avoiding stale data and synchronization race conditions",
        "explanation": "When data mutates in the primary store, cached copies in CDN edges, Redis clusters, and client memory must be invalidated synchronously or via events without causing stampedes or serving stale state.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_23",
        "category": "Resume and Project Concepts",
        "topic": "Defensive Programming: Input Validation",
        "difficulty": "Easy",
        "question_text": "Why must server-side input validation ALWAYS be performed even if comprehensive client-side form validation is already implemented?",
        "options": [
            "Client-side validation can be completely bypassed by attackers using curl, Postman, or custom HTTP scripts directly against backend endpoints",
            "Client-side validation only works on Chrome browsers",
            "Server-side validation is required by the HTTP/2 specification",
            "Databases reject queries that were validated on the client"
        ],
        "correct_answer": "Client-side validation can be completely bypassed by attackers using curl, Postman, or custom HTTP scripts directly against backend endpoints",
        "explanation": "Client-side validation is purely for user experience (instant feedback). Never trust the client: all endpoints must validate types, lengths, and schemas on the server using robust tools (e.g. Zod, Pydantic).",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_24",
        "category": "Resume and Project Concepts",
        "topic": "High Availability & Multi-AZ Deployments",
        "difficulty": "Medium",
        "question_text": "In cloud infrastructure (AWS/GCP/Azure), what is the difference between deploying resources across multiple Availability Zones (Multi-AZ) versus multiple Regions?",
        "options": [
            "Multi-AZ protects against local data center physical failures within a metropolitan area with sub-millisecond latency; Multi-Region protects against entire geographical disasters",
            "Multi-AZ is for dev environments; Multi-Region is for production",
            "Multi-AZ does not support database replication",
            "Multi-Region operates on a single physical fiber optic cable"
        ],
        "correct_answer": "Multi-AZ protects against local data center physical failures within a metropolitan area with sub-millisecond latency; Multi-Region protects against entire geographical disasters",
        "explanation": "AZs are isolated data centers within a single region connected by high-speed fiber. Multi-AZ provides high availability against hardware, power, or flood outages without cross-country latency penalties.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    },
    {
        "id": "proj_25",
        "category": "Resume and Project Concepts",
        "topic": "Database Migrations: Locking Table Warning",
        "difficulty": "Hard",
        "question_text": "Why can running `ALTER TABLE users ADD COLUMN bio VARCHAR(255) DEFAULT 'none';` cause major production outages on PostgreSQL 10 and earlier?",
        "options": [
            "In older engines, adding a column with a non-null default rewrites the entire table on disk, holding an EXCLUSIVE table lock that blocks all incoming reads and writes",
            "It permanently corrupts user passwords",
            "It drops all foreign key relationships in the schema",
            "It forces the database to convert all tables to NoSQL"
        ],
        "correct_answer": "In older engines, adding a column with a non-null default rewrites the entire table on disk, holding an EXCLUSIVE table lock that blocks all incoming reads and writes",
        "explanation": "Prior to PostgreSQL 11, adding a column with a default value required rewriting every row on disk while holding an AccessExclusiveLock, queuing up all incoming web requests until connection pools exhausted.",
        "question_type": "single_choice",
        "is_practice_question": True,
        "is_official_exam_question": False
    }
]

def get_questions_by_category(category: str) -> List[Dict[str, Any]]:
    """Returns questions matching canonical category or fuzzy substring."""
    cat_lower = category.strip().lower()
    return [q for q in MOCK_TEST_QUESTIONS if cat_lower in q["category"].lower() or q["category"].lower() in cat_lower]

def get_all_mock_questions() -> List[Dict[str, Any]]:
    return list(MOCK_TEST_QUESTIONS)
