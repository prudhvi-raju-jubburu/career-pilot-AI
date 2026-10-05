/**
 * CareerPilot AI — Centralized Mock Data Layer
 * 
 * Provides rich, realistic mock data for frontend UI development and testing
 * without coupling mock data into UI presentation components.
 * When real API endpoints are attached in future phases, components can
 * simply switch from these providers to API calls.
 */

export const mockOpportunities = [
  {
    id: 'opp-google-sde-intern',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=80',
    title: 'Software Engineer Intern',
    type: 'Internship',
    workMode: 'Hybrid',
    location: 'Bengaluru, India',
    stipend: '₹1,20,000 / month',
    matchScore: 91,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 7.0,
      studentCgpa: 8.4,
      allowedBranches: ['Computer Science', 'Information Technology', 'Electronics'],
      graduationYears: [2025, 2026],
      reason: 'Meets CGPA cutoff, branch criteria, and graduation year (2026).'
    },
    deadline: '2026-10-12',
    daysLeft: 9,
    skills: ['Python', 'Data Structures', 'Algorithms', 'Java', 'System Design'],
    matchingSkills: ['Python', 'Data Structures', 'Algorithms'],
    missingSkills: ['Java', 'System Design'],
    description: `Join Google as a Software Engineer Intern to build reliable, high-scale products used by billions of people. You will work with a host team on production code, design reviews, and intern project milestones.`,
    responsibilities: [
      'Ship production-quality features with a Google engineering mentor',
      'Write tests, review code, and participate in design discussions',
      'Present intern project outcomes to the host team'
    ],
    requirements: [
      'Currently enrolled in a B.Tech / M.Tech in CS or equivalent with graduation in 2025 or 2026',
      'Strong grasp of data structures, algorithms, and coding interviews',
      'Experience with Python, Java, C++, or Go'
    ],
    whyMatches: 'Your verified CS fundamentals and internship-ready project work align with 91% of this intern role.'
  },
  {
    id: 'opp-stripe-sde',
    company: 'Stripe',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    title: 'Software Engineering Intern — Core Infrastructure',
    type: 'Internship',
    workMode: 'Hybrid',
    location: 'Bengaluru, India',
    stipend: '₹1,25,000 / month',
    matchScore: 94,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 7.5,
      studentCgpa: 8.4,
      allowedBranches: ['Computer Science', 'Information Technology', 'Electronics'],
      graduationYears: [2025, 2026],
      reason: 'Meets CGPA cutoff (8.4 >= 7.5), branch criteria, and graduation year (2026).'
    },
    deadline: '2026-10-12',
    daysLeft: 4,
    skills: ['Python', 'Distributed Systems', 'SQL', 'REST APIs', 'System Design'],
    matchingSkills: ['Python', 'SQL', 'REST APIs', 'System Design'],
    missingSkills: ['Distributed Systems', 'Kafka'],
    description: `Join Stripe's Core Platform Infrastructure team to design, build, and optimize high-throughput financial routing systems processing hundreds of millions of transactions every day. You will collaborate directly with senior engineers on latency reduction, fault-tolerance mechanisms, and scalable microservices.`,
    responsibilities: [
      'Architect resilient API primitives with p99 latency < 50ms',
      'Optimize database queries and caching layers across distributed PostgreSQL clusters',
      'Participate in design reviews, production on-call shadows, and code reviews',
      'Collaborate with global teams across San Francisco, Dublin, and Singapore'
    ],
    requirements: [
      'Currently enrolled in a B.Tech / M.Tech in CS or equivalent with graduation in 2025 or 2026',
      'Strong grasp of Data Structures, Algorithms, and Concurrency fundamentals',
      'Experience with Python, Go, or Java for backend services',
      'Understanding of relational databases and ACID transactions'
    ],
    whyMatches: 'Your verified projects in high-performance REST APIs, Python mastery, and database indexing align with 94% of Stripe\'s platform requirements.'
  },
  {
    id: 'opp-msft-sde',
    company: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?w=100&auto=format&fit=crop&q=80',
    title: 'Graduate SDE (Full-Time)',
    type: 'Full-Time',
    workMode: 'Onsite',
    location: 'Hyderabad, India',
    stipend: '₹24,00,000 / annum + Stocks',
    matchScore: 88,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 7.0,
      studentCgpa: 8.4,
      allowedBranches: ['All Engineering Disciplines'],
      graduationYears: [2025, 2026],
      reason: 'Fully satisfies academic eligibility parameters.'
    },
    deadline: '2026-10-19',
    daysLeft: 11,
    skills: ['Data Structures', 'C++', 'System Design', 'Algorithms', 'Azure'],
    matchingSkills: ['Data Structures', 'Algorithms', 'System Design'],
    missingSkills: ['C++', 'Azure Cloud'],
    description: `Microsoft India Development Center (IDC) is recruiting Graduate Software Engineers for Azure Cloud and Developer Experience teams. You will work on planetary-scale cloud services, enterprise AI tooling, and mission-critical developer platforms.`,
    responsibilities: [
      'Develop cloud-native microservices utilizing Azure container primitives',
      'Write clean, maintainable, test-driven code with high unit test coverage',
      'Implement observability, automated alerting, and telemetry dashboards'
    ],
    requirements: [
      'Graduation year 2025 or 2026 in Engineering',
      'Proficiency in C++, C#, Java, or Python',
      'Solid problem solving ability and knowledge of algorithms'
    ],
    whyMatches: 'Matches 88% of your core computer science fundamentals. Bridging Azure and C++ will elevate your score to 96%.'
  },
  {
    id: 'opp-google-hackathon',
    company: 'Google Cloud',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=80',
    title: 'GenAI Solution Sprint 2026 Hackathon',
    type: 'Hackathons',
    workMode: 'Remote',
    location: 'Virtual / Online',
    stipend: '₹10,00,000 Prize Pool + Mentorship',
    matchScore: 96,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 0,
      studentCgpa: 8.4,
      allowedBranches: ['Open to All College Students'],
      graduationYears: [2024, 2025, 2026, 2027],
      reason: 'Open to all university students with interest in Generative AI.'
    },
    deadline: '2026-10-25',
    daysLeft: 17,
    skills: ['Generative AI', 'Gemini API', 'React', 'FastAPI', 'Vector Databases'],
    matchingSkills: ['Generative AI', 'React', 'Gemini API', 'Vector Databases'],
    missingSkills: ['Kubernetes deployment'],
    description: `Build groundbreaking GenAI agent applications utilizing Google Gemini and Vertex AI models. Top teams receive direct interview fast-tracks for Google student programs, Google Cloud credits, and cash prizes.`,
    responsibilities: [
      'Form teams of 2 to 4 students',
      'Build a working prototype addressing Education, Healthcare, or Sustainability',
      'Submit GitHub repo and a 3-minute video walkthrough'
    ],
    requirements: [
      'Valid student ID from any recognized university',
      'Use of Google Cloud / Gemini AI APIs in core architecture'
    ],
    whyMatches: '96% match! Your hands-on experience with Gemini API and React makes you an ideal competitor for top prize honors.'
  },
  {
    id: 'opp-razorpay-fe',
    company: 'Razorpay',
    companyLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80',
    title: 'Frontend Engineer Intern — Merchant Experience',
    type: 'Internship',
    workMode: 'Remote',
    location: 'Remote (India)',
    stipend: '₹60,000 / month',
    matchScore: 91,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 7.0,
      studentCgpa: 8.4,
      allowedBranches: ['CS', 'IT', 'ECE'],
      graduationYears: [2025, 2026],
      reason: 'Meets all criteria for 6-month internship.'
    },
    deadline: '2026-10-15',
    daysLeft: 7,
    skills: ['React.js', 'JavaScript (ES6+)', 'TypeScript', 'CSS/Design Systems', 'Web Performance'],
    matchingSkills: ['React.js', 'JavaScript (ES6+)', 'CSS/Design Systems', 'Web Performance'],
    missingSkills: ['TypeScript (Advanced)'],
    description: `Join India's leading fintech unicorn to build ultra-responsive merchant portals, payment checkout flows, and analytics dashboards handling billions in monthly payments.`,
    responsibilities: [
      'Craft pixel-perfect, accessible UI components with high Lighthouse performance',
      'Optimize web vitals, bundle splitting, and client-side caching',
      'Collaborate closely with product designers and backend API engineers'
    ],
    requirements: [
      'Strong React 18+ knowledge, Hooks, and Context patterns',
      'Deep understanding of DOM, CSS Flexbox/Grid, and modern layout techniques',
      'Portfolio showing 2+ production-grade web applications'
    ],
    whyMatches: '91% fit! Your proficiency in modern React, component architecture, and responsive SaaS UI matches the role requirements.'
  },
  {
    id: 'opp-atlassian-contest',
    company: 'Atlassian',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80',
    title: 'Atlassian Global Student Coding Challenge',
    type: 'Coding Contests',
    workMode: 'Remote',
    location: 'Virtual',
    stipend: 'Direct Job Interviews + ₹5,00,000 Cash',
    matchScore: 84,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 6.5,
      studentCgpa: 8.4,
      allowedBranches: ['Open to All'],
      graduationYears: [2025, 2026, 2027],
      reason: 'Open challenge for problem solving enthusiasts.'
    },
    deadline: '2026-11-02',
    daysLeft: 24,
    skills: ['Competitive Programming', 'Graph Algorithms', 'Dynamic Programming', 'Complexity Analysis'],
    matchingSkills: ['Graph Algorithms', 'Complexity Analysis'],
    missingSkills: ['Advanced Dynamic Programming'],
    description: `A 3-hour competitive algorithmic challenge designed by Atlassian engineering. Top 50 rankers get immediate technical screening interviews for Summer 2026 internships and full-time positions.`,
    responsibilities: [
      'Solve 4 algorithmic problems ranging from medium to hard difficulty within 180 minutes',
      'Adhere to code integrity guidelines and anti-plagiarism checks'
    ],
    requirements: [
      'Strong fundamentals in trees, graphs, heaps, dynamic programming, and greedy algorithms'
    ],
    whyMatches: '84% match. Practicing 10 advanced DP problems on LeetCode will maximize your chances of cracking the top 50.'
  },
  {
    id: 'opp-swiggy-fulltime',
    company: 'Swiggy',
    companyLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&auto=format&fit=crop&q=80',
    title: 'Associate Software Development Engineer (Backend)',
    type: 'Full-Time',
    workMode: 'Hybrid',
    location: 'Bengaluru, India',
    stipend: '₹18,50,000 / annum + ESOPs',
    matchScore: 87,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 7.0,
      studentCgpa: 8.4,
      allowedBranches: ['CS', 'IT', 'ECE', 'EE'],
      graduationYears: [2025, 2026],
      reason: 'Eligible based on academic cutoff and degree.'
    },
    deadline: '2026-10-30',
    daysLeft: 22,
    skills: ['Go', 'Java', 'Redis', 'PostgreSQL', 'Microservices', 'Message Queues'],
    matchingSkills: ['PostgreSQL', 'Redis', 'Microservices'],
    missingSkills: ['Go', 'Apache Kafka'],
    description: `Power the logistics engine that feeds 100+ cities in India. Work on real-time driver allocation, dynamic surge pricing algorithms, and order tracking pipelines.`,
    responsibilities: [
      'Develop low-latency services processing 100k events/second',
      'Optimize cache invalidation strategies using Redis and memory caches',
      'Work with Docker, Kubernetes, and AWS infrastructure'
    ],
    requirements: [
      'Sound understanding of database indexing, query planning, and sharding',
      'Hands-on experience building REST/gRPC backend services'
    ],
    whyMatches: '87% match. Your database optimization and backend systems experience match well.'
  },
  {
    id: 'opp-mit-conference',
    company: 'MIT Media Lab',
    companyLogo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=100&auto=format&fit=crop&q=80',
    title: 'International Student AI Research Fellowship & Conference',
    type: 'Conferences',
    workMode: 'Hybrid',
    location: 'Cambridge, MA (Travel Grant Provided)',
    stipend: 'Full $3,500 Travel Grant + Stipend',
    matchScore: 79,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 8.0,
      studentCgpa: 8.4,
      allowedBranches: ['All Engineering and Science'],
      graduationYears: [2025, 2026, 2027],
      reason: 'Meets academic research threshold (8.4 > 8.0).'
    },
    deadline: '2026-11-15',
    daysLeft: 37,
    skills: ['Research Writing', 'Machine Learning', 'PyTorch', 'Model Interpretability'],
    matchingSkills: ['Machine Learning', 'PyTorch'],
    missingSkills: ['Paper Publication', 'LaTeX'],
    description: `Present your undergraduate machine learning or systems research at the premier student AI symposium. Fully sponsored travel fellowship for selected student authors.`,
    responsibilities: [
      'Submit a 4-page extended abstract on ongoing AI/ML projects',
      'Deliver a poster presentation or 15-minute spotlight talk'
    ],
    requirements: [
      'Demonstrated research curiosity in AI, NLP, or Human-Computer Interaction',
      'Recommendation letter from a faculty mentor'
    ],
    whyMatches: '79% match. Enhancing your project documentation into an academic abstract will qualify you for the grant.'
  },
  {
    id: 'opp-tata-scholarship',
    company: 'Tata Trusts',
    companyLogo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&auto=format&fit=crop&q=80',
    title: 'Tata Technology Merit Scholarship for Women & Underrepresented Engineers',
    type: 'Scholarships',
    workMode: 'Remote',
    location: 'National / All India',
    stipend: '₹2,00,000 Tuition Grant',
    matchScore: 92,
    eligibility: {
      isEligible: true,
      cgpaCutoff: 7.5,
      studentCgpa: 8.4,
      allowedBranches: ['B.Tech / B.E. All Streams'],
      graduationYears: [2025, 2026],
      reason: 'Meets merit threshold criteria.'
    },
    deadline: '2026-11-20',
    daysLeft: 42,
    skills: ['Academic Excellence', 'Community Leadership', 'Technical Projects'],
    matchingSkills: ['Academic Excellence', 'Technical Projects'],
    missingSkills: ['Formal Statement of Purpose'],
    description: `Merit-cum-means scholarship supporting exceptional engineering students with tuition support, laptop grants, and 1-on-1 industry mentorship from Tata Group technology leaders.`,
    responsibilities: [
      'Submit academic transcripts and family income certificate',
      'Write a 500-word essay on how you will use technology to solve social challenges'
    ],
    requirements: [
      'Minimum 7.5 CGPA with no active backlogs',
      'Enrolled in 3rd or 4th year of engineering'
    ],
    whyMatches: '92% match. Your high CGPA and consistent technical project record make you an exceptional candidate.'
  }
];

export const mockApplications = [
  {
    id: 'app-1',
    opportunityId: 'opp-stripe-sde',
    company: 'Stripe',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    role: 'Software Engineering Intern — Core Platform',
    type: 'Internship',
    status: 'Interviewing',
    appliedDate: '2026-09-18',
    lastUpdated: '2026-09-28',
    nextAction: 'Technical Round 2 (System Design & Python)',
    nextActionDate: '2026-10-04',
    matchScore: 94,
    notes: 'Completed HackerRank round (100% test cases). Recruiter scheduled 45-min live coding with staff engineer.',
    timeline: [
      { date: '2026-09-18', event: 'Applied via CareerPilot 1-Click Assistant' },
      { date: '2026-09-22', event: 'Passed ATS screening (Score: 91/100)' },
      { date: '2026-09-25', event: 'Completed Coding Assessment (2 medium, 1 hard)' },
      { date: '2026-09-28', event: 'Technical Interview scheduled for Oct 4' }
    ]
  },
  {
    id: 'app-2',
    opportunityId: 'opp-msft-sde',
    company: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?w=100&auto=format&fit=crop&q=80',
    role: 'Graduate SDE (Full-Time)',
    type: 'Full-Time',
    status: 'Applied',
    appliedDate: '2026-09-21',
    lastUpdated: '2026-09-22',
    nextAction: 'Awaiting Online Assessment invite',
    nextActionDate: '2026-10-08',
    matchScore: 88,
    notes: 'Submitted resume through IDC university careers portal.',
    timeline: [
      { date: '2026-09-21', event: 'Application submitted with verified resume' },
      { date: '2026-09-22', event: 'Application received by Talent Acquisition' }
    ]
  },
  {
    id: 'app-3',
    opportunityId: 'opp-razorpay-fe',
    company: 'Razorpay',
    companyLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80',
    role: 'Frontend Engineer Intern',
    type: 'Internship',
    status: 'Offered',
    appliedDate: '2026-08-30',
    lastUpdated: '2026-09-27',
    nextAction: 'Offer Letter Review & Acceptance Deadline',
    nextActionDate: '2026-10-06',
    matchScore: 91,
    notes: 'Received official offer letter! ₹60,000/month stipend + equipment allowance.',
    timeline: [
      { date: '2026-08-30', event: 'Applied' },
      { date: '2026-09-08', event: 'Passed Frontend take-home challenge' },
      { date: '2026-09-17', event: 'Passed live React architecture interview' },
      { date: '2026-09-27', event: 'Received official internship offer 🎉' }
    ]
  },
  {
    id: 'app-4',
    opportunityId: 'opp-google-hackathon',
    company: 'Google Cloud',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=80',
    role: 'GenAI Solution Sprint 2026',
    type: 'Hackathons',
    status: 'Saved',
    appliedDate: null,
    lastUpdated: '2026-09-29',
    nextAction: 'Finalize team members & submit proposal',
    nextActionDate: '2026-10-15',
    matchScore: 96,
    notes: 'Formed 3-person team. Building an automated student scholarship and contest finder agent.',
    timeline: [
      { date: '2026-09-29', event: 'Saved to Opportunities & Application Tracker' }
    ]
  },
  {
    id: 'app-5',
    opportunityId: 'opp-swiggy-fulltime',
    company: 'Uber',
    companyLogo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&auto=format&fit=crop&q=80',
    role: 'Backend Engineering Associate',
    type: 'Full-Time',
    status: 'Rejected',
    appliedDate: '2026-08-15',
    lastUpdated: '2026-09-10',
    nextAction: 'Re-apply window opens in 6 months',
    nextActionDate: '2027-03-01',
    matchScore: 78,
    notes: 'Received feedback: strengthen low-level concurrency and Go routines.',
    timeline: [
      { date: '2026-08-15', event: 'Applied' },
      { date: '2026-09-02', event: 'Completed assessment' },
      { date: '2026-09-10', event: 'Position filled internally' }
    ]
  }
];

export const mockSkillGapData = {
  targetRoles: [
    { id: 'role-fullstack', title: 'Full-Stack Developer (SDE)', currentFit: 84, level: 'Advanced' },
    { id: 'role-aiml', title: 'AI/ML Systems Engineer', currentFit: 78, level: 'Intermediate' },
    { id: 'role-devops', title: 'Cloud & DevOps Engineer', currentFit: 65, level: 'Beginner-to-Intermediate' },
    { id: 'role-data', title: 'Data Platform Engineer', currentFit: 72, level: 'Intermediate' },
    { id: 'role-cyber', title: 'Cybersecurity Analyst', currentFit: 54, level: 'Beginner' }
  ],
  skillsBreakdown: {
    'role-fullstack': {
      currentSkills: [
        { name: 'JavaScript (ES6+)', level: 'Advanced', verified: true, source: 'Resume' },
        { name: 'React 18', level: 'Advanced', verified: true, source: 'Resume' },
        { name: 'Python', level: 'Proficient', verified: true, source: 'Resume' },
        { name: 'Flask / REST APIs', level: 'Proficient', verified: true, source: 'Resume' },
        { name: 'MongoDB / PyMongo', level: 'Proficient', verified: true, source: 'Resume' },
        { name: 'SQL & PostgreSQL', level: 'Intermediate', verified: true, source: 'Manual' },
        { name: 'Git & GitHub', level: 'Advanced', verified: true, source: 'Resume' }
      ],
      requiredSkills: [
        { name: 'TypeScript', priority: 'High', demand: '92% of SDE job postings', status: 'missing' },
        { name: 'Docker & Containerization', priority: 'High', demand: '88% of job postings', status: 'missing' },
        { name: 'System Design Basics', priority: 'High', demand: '85% of tech interviews', status: 'learning' },
        { name: 'Redis Caching', priority: 'Medium', demand: '74% of backend postings', status: 'missing' },
        { name: 'CI/CD Pipelines (GitHub Actions)', priority: 'Medium', demand: '70% of tech teams', status: 'missing' }
      ],
      learningRoadmap: [
        {
          phase: 'Phase 1: Foundations (Week 1–2)',
          level: 'Beginner',
          title: 'TypeScript & Modern Static Typing',
          duration: '14 hours',
          description: 'Master strict typing, interfaces, generics, and React component prop types.',
          resources: [
            { title: 'TypeScript Official Handbook (Free)', url: 'https://www.typescriptlang.org/docs/' },
            { title: 'Full-Stack TypeScript Tutorial', url: 'https://fullstackopen.com/en/' }
          ],
          completed: false
        },
        {
          phase: 'Phase 2: Core Engineering (Week 3–5)',
          level: 'Intermediate',
          title: 'Docker, Containerization & Microservices',
          duration: '22 hours',
          description: 'Package Flask and Node services into multi-stage container builds with Docker Compose.',
          resources: [
            { title: 'Docker for Software Engineers', url: 'https://docker-curriculum.com/' },
            { title: 'FreeCodeCamp Docker & Kubernetes', url: 'https://freecodecamp.org' }
          ],
          completed: false
        },
        {
          phase: 'Phase 3: Production Readiness (Week 6–8)',
          level: 'Advanced',
          title: 'High-Concurrency System Design & Caching',
          duration: '28 hours',
          description: 'Understand cache invalidation, rate limiting with Redis, database indexing, and horizontal scaling.',
          resources: [
            { title: 'System Design Primer by Donne Martin', url: 'https://github.com/donnemartin/system-design-primer' },
            { title: 'Grokking the System Design Interview', url: 'https://educative.io' }
          ],
          completed: false
        }
      ]
    }
  }
};

export const mockNotifications = [
  {
    id: 'notif-1',
    category: 'Opportunity',
    title: 'New 94% Match: Stripe Intern',
    message: 'Stripe just posted "Software Engineering Intern — Core Infrastructure" matching your verified skills in Python and APIs.',
    timeAgo: '2 hours ago',
    read: false,
    link: '/opportunities',
    priority: 'high'
  },
  {
    id: 'notif-2',
    category: 'Application',
    title: 'Interview Scheduled with Stripe',
    message: 'Your Technical Round 2 with Stripe has been confirmed for Oct 4 at 3:00 PM IST.',
    timeAgo: '5 hours ago',
    read: false,
    link: '/applications',
    priority: 'urgent'
  },
  {
    id: 'notif-3',
    category: 'Deadline',
    title: 'Deadline Alert: Razorpay Offer Decision',
    message: 'Your internship offer acceptance window with Razorpay closes in 4 days (Oct 6).',
    timeAgo: '1 day ago',
    read: false,
    link: '/applications',
    priority: 'warning'
  },
  {
    id: 'notif-4',
    category: 'AI Recommendation',
    title: 'AI Advisor Tip: Add Docker to your Profile',
    message: 'Adding Docker to your verified skills will boost your eligibility for 6 additional high-paying backend roles.',
    timeAgo: '2 days ago',
    read: true,
    link: '/skill-gap',
    priority: 'normal'
  },
  {
    id: 'notif-5',
    category: 'System',
    title: 'Resume ATS Analysis Verified',
    message: 'Your updated resume was successfully indexed with an ATS compatibility score of 88/100.',
    timeAgo: '3 days ago',
    read: true,
    link: '/resume',
    priority: 'normal'
  }
];

export const mockStudentProfile = {
  personal: {
    fullName: 'Prudhvi Raju Jubburu',
    email: 'prudhvi.jubburu@student.edu',
    phone: '+91 98765 43210',
    location: 'Hyderabad, India',
    github: 'https://github.com/prudhviraju',
    linkedin: 'https://linkedin.com/in/prudhvi-raju',
    portfolio: 'https://prudhviraju.dev',
    bio: 'Pre-final year Computer Science undergraduate passionate about full-stack engineering, distributed systems, and modern AI developer tools.'
  },
  education: [
    {
      institution: 'National Institute of Technology',
      degree: 'B.Tech in Computer Science and Engineering',
      year: '2022 – 2026',
      cgpa: '8.4 / 10.0',
      source: 'Extracted from Resume',
      verified: true
    }
  ],
  skills: [
    { name: 'Python', category: 'Languages', source: 'Extracted from Resume', verified: true },
    { name: 'JavaScript (ES6+)', category: 'Languages', source: 'Extracted from Resume', verified: true },
    { name: 'C++', category: 'Languages', source: 'Added Manually', verified: true },
    { name: 'React.js', category: 'Frameworks', source: 'Extracted from Resume', verified: true },
    { name: 'Flask', category: 'Frameworks', source: 'Extracted from Resume', verified: true },
    { name: 'Node.js', category: 'Frameworks', source: 'Extracted from Resume', verified: true },
    { name: 'MongoDB', category: 'Databases', source: 'Extracted from Resume', verified: true },
    { name: 'PostgreSQL', category: 'Databases', source: 'Added Manually', verified: false },
    { name: 'Git & GitHub', category: 'Tools', source: 'Extracted from Resume', verified: true },
    { name: 'RESTful API Architecture', category: 'Concepts', source: 'Extracted from Resume', verified: true }
  ],
  projects: [
    {
      title: 'CareerPilot AI — Intelligent Opportunity Platform',
      technologies: ['React 18', 'Flask', 'MongoDB', 'Gemini API', 'Tailored CSS'],
      description: 'End-to-end career intelligence engine featuring deterministic eligibility filtering, ATS resume scoring, and conversational career guidance.',
      link: 'https://github.com/prudhviraju/careerpilot-ai',
      source: 'Extracted from Resume',
      verified: true
    },
    {
      title: 'Distributed Transaction Router',
      technologies: ['Python', 'Redis', 'PostgreSQL', 'Docker'],
      description: 'Simulated high-throughput payment router handling 2,000 requests/sec with idempotency keys and ledger verification.',
      link: 'https://github.com/prudhviraju/transaction-router',
      source: 'Extracted from Resume',
      verified: true
    }
  ],
  certifications: [
    {
      name: 'Google Cloud Certified: Associate Cloud Engineer',
      issuer: 'Google Cloud',
      issueDate: 'August 2025',
      credentialId: 'GCP-88492019',
      source: 'Added Manually',
      verified: true
    }
  ],
  preferences: {
    desiredRoles: ['Software Engineering Intern', 'Graduate SDE', 'Full-Stack Developer'],
    preferredLocations: ['Bengaluru', 'Hyderabad', 'Remote'],
    openToRelocation: true,
    workAuthorization: 'Citizen of India (No sponsorship required)'
  },
  completionPercentage: 88
};
