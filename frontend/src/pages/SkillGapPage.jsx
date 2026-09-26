import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  Code
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { getProfile } from '../services/api';

const TARGET_ROLES = {
  'fullstack': {
    title: 'Full Stack Engineer',
    description: 'Build modern responsive client apps and robust scalable backend APIs with cloud databases.',
    expectedSkills: [
      { name: 'JavaScript', category: 'Language' },
      { name: 'Python', category: 'Language' },
      { name: 'React', category: 'Frontend' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'Express', category: 'Backend' },
      { name: 'MongoDB', category: 'Database' },
      { name: 'MySQL', category: 'Database' },
      { name: 'Git', category: 'Tooling' },
      { name: 'Docker', category: 'DevOps' },
      { name: 'Redis', category: 'Database / Caching' },
      { name: 'TypeScript', category: 'Language' },
      { name: 'System Design', category: 'Architecture' },
    ],
    roadmap: [
      {
        skill: 'Docker & Containerization',
        priority: 'High',
        timeToLearn: '1-2 weeks',
        resource: 'Docker Official Docs & FreeCodeCamp Docker Handbook',
        projectIdea: 'Containerize your React + Express + MongoDB stack with Docker Compose.',
      },
      {
        skill: 'Redis Caching & Session Stores',
        priority: 'Medium',
        timeToLearn: '3-5 days',
        resource: 'Redis University & Node-Redis Guide',
        projectIdea: 'Implement API response caching for high-traffic database queries.',
      },
      {
        skill: 'TypeScript for Production Apps',
        priority: 'High',
        timeToLearn: '1-2 weeks',
        resource: 'TypeScript Handbook (Official)',
        projectIdea: 'Migrate a standard JavaScript React frontend to strict TypeScript with type interfaces.',
      },
      {
        skill: 'System Design & Scalability',
        priority: 'Medium',
        timeToLearn: '3-4 weeks',
        resource: 'System Design Primer (GitHub)',
        projectIdea: 'Design a scalable URL shortener or real-time notification feed.',
      },
    ]
  },
  'aiml': {
    title: 'AI / Machine Learning Engineer',
    description: 'Design, fine-tune, and deploy machine learning and generative AI models into production environments.',
    expectedSkills: [
      { name: 'Python', category: 'Language' },
      { name: 'Machine Learning', category: 'Core AI' },
      { name: 'Deep Learning', category: 'Core AI' },
      { name: 'PyTorch', category: 'Framework' },
      { name: 'TensorFlow', category: 'Framework' },
      { name: 'REST APIs', category: 'Backend' },
      { name: 'FastAPI', category: 'Backend' },
      { name: 'Pandas', category: 'Data Analysis' },
      { name: 'NumPy', category: 'Data Analysis' },
      { name: 'Scikit-Learn', category: 'Core AI' },
      { name: 'Docker', category: 'DevOps' },
      { name: 'Vector Databases', category: 'GenAI' },
    ],
    roadmap: [
      {
        skill: 'PyTorch Deep Learning',
        priority: 'High',
        timeToLearn: '2-3 weeks',
        resource: 'Deep Learning with PyTorch (60 min blitz)',
        projectIdea: 'Train a vision classifier with transfer learning using ResNet.',
      },
      {
        skill: 'FastAPI Model Serving',
        priority: 'High',
        timeToLearn: '1 week',
        resource: 'FastAPI Official Documentation',
        projectIdea: 'Wrap an ML pipeline in an async REST API with pydantic schemas.',
      },
      {
        skill: 'Vector DBs (ChromaDB / Pinecone)',
        priority: 'Medium',
        timeToLearn: '3-5 days',
        resource: 'ChromaDB Docs & LangChain RAG Tutorials',
        projectIdea: 'Build a document question-answering system with retrieval augmented generation (RAG).',
      },
    ]
  },
  'devops': {
    title: 'Cloud & DevOps Engineer',
    description: 'Automate CI/CD pipelines, containerize microservices, and manage infrastructure as code on AWS/Azure.',
    expectedSkills: [
      { name: 'Python', category: 'Scripting' },
      { name: 'Linux / Bash', category: 'OS' },
      { name: 'Docker', category: 'Containers' },
      { name: 'Kubernetes', category: 'Orchestration' },
      { name: 'AWS / Cloud', category: 'Cloud' },
      { name: 'GitHub Actions / CI/CD', category: 'Automation' },
      { name: 'Terraform', category: 'IaC' },
      { name: 'Prometheus / Grafana', category: 'Monitoring' },
      { name: 'Git', category: 'Tooling' },
    ],
    roadmap: [
      {
        skill: 'Kubernetes Cluster Management',
        priority: 'High',
        timeToLearn: '3-4 weeks',
        resource: 'Kubernetes The Hard Way & KubeAcademy',
        projectIdea: 'Deploy and auto-scale a multi-pod web service with ingress and config maps.',
      },
      {
        skill: 'GitHub Actions CI/CD Pipeline',
        priority: 'High',
        timeToLearn: '1 week',
        resource: 'GitHub Actions Documentation',
        projectIdea: 'Automate testing, linting, and automated docker push on every commit.',
      },
      {
        skill: 'Terraform (Infrastructure as Code)',
        priority: 'Medium',
        timeToLearn: '2 weeks',
        resource: 'HashiCorp Terraform Tutorials',
        projectIdea: 'Provision an AWS VPC, EC2 instance, and S3 bucket using HCL code.',
      },
    ]
  }
};

export default function SkillGapPage() {
  const [activeRoleKey, setActiveRoleKey] = useState('fullstack');
  const [studentSkills, setStudentSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileSkills = async () => {
      try {
        const res = await getProfile();
        if (res?.data?.skills) {
          const flat = [];
          Object.values(res.data.skills).forEach((cat) => {
            const list = cat?.value;
            if (Array.isArray(list)) flat.push(...list);
          });
          setStudentSkills(flat);
        }
      } catch (err) {
        console.warn('Could not fetch skills for gap analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileSkills();
  }, []);

  const activeRole = TARGET_ROLES[activeRoleKey];

  // Calculate acquired vs missing skills
  const normalizedStudent = studentSkills.map((s) => s.toLowerCase());
  const acquired = activeRole.expectedSkills.filter((sk) =>
    normalizedStudent.some((st) => st.includes(sk.name.toLowerCase()) || sk.name.toLowerCase().includes(st))
  );
  const missing = activeRole.expectedSkills.filter((sk) => !acquired.some((a) => a.name === sk.name));

  const readinessScore = Math.round((acquired.length / activeRole.expectedSkills.length) * 100);

  return (
    <PageContainer>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Badge variant="purple" size="sm" dot>
              AI Career Readiness Engine
            </Badge>
          </div>
          <h1 className="text-h1">Skill Gap Analysis &amp; Learning Roadmap</h1>
          <p className="text-small" style={{ fontSize: '0.95rem', marginTop: '0.35rem', maxWidth: '700px' }}>
            Compare your resume-verified skills against industry expectations for competitive tech roles and follow tailored roadmaps to bridge critical gaps.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          {Object.entries(TARGET_ROLES).map(([key, role]) => {
            const isActive = activeRoleKey === key;
            return (
              <button
                key={key}
                onClick={() => setActiveRoleKey(key)}
                style={{
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isActive ? '2px solid var(--color-primary-600)' : '1px solid var(--border-control)',
                  backgroundColor: isActive ? 'var(--color-surface)' : 'var(--color-bg)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  minWidth: '220px',
                  boxShadow: isActive ? 'var(--shadow-raised)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isActive ? 'var(--color-primary-600)' : 'var(--color-text)' }}>
                    {role.title}
                  </span>
                  {isActive && <Sparkles size={16} color="var(--color-primary-600)" />}
                </div>
                <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                  {role.expectedSkills.length} key competencies
                </span>
              </button>
            );
          })}
        </div>

        {/* Readiness Meter Card */}
        <Card variant="raised" style={{ marginBottom: '2rem', borderTop: '4px solid var(--color-primary-600)' }}>
          <Card.Content style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Career Path Readiness
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                  {activeRole.title}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', maxWidth: '580px' }}>
                  {activeRole.description}
                </p>
              </div>

              <div style={{ textAlign: 'center', minWidth: '130px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: readinessScore >= 70 ? 'var(--color-success-dark)' : 'var(--color-primary-600)' }}>
                  {readinessScore}%
                </div>
                <Badge variant={readinessScore >= 70 ? 'success' : 'purple'} size="sm">
                  {readinessScore >= 70 ? 'Interview Ready' : 'In Progress'}
                </Badge>
              </div>
            </div>

            <ProgressBar
              value={readinessScore}
              variant={readinessScore >= 70 ? 'success' : 'primary'}
              size="lg"
              showPercentage={false}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              <span>Acquired: {acquired.length} skills</span>
              <span>Gap to close: {missing.length} skills</span>
            </div>
          </Card.Content>
        </Card>

        {/* Two Column Grid: Acquired vs Missing Skills */}
        <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
          {/* Acquired Skills */}
          <Card variant="default">
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--color-success)" />
                <h3 className="text-h3" style={{ fontSize: '1.1rem', margin: 0 }}>
                  Verified Skills in Your Profile ({acquired.length})
                </h3>
              </div>
              <p className="text-small">Extracted directly from your uploaded resume &amp; verified.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {acquired.map((sk) => (
                  <Badge key={sk.name} variant="success" size="md">
                    ✓ {sk.name}
                  </Badge>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Missing Skills */}
          <Card variant="default">
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="var(--color-warning)" />
                <h3 className="text-h3" style={{ fontSize: '1.1rem', margin: 0 }}>
                  High-Impact Missing Skills ({missing.length})
                </h3>
              </div>
              <p className="text-small">Frequently demanded in job descriptions for this role.</p>
            </Card.Header>
            <Card.Content style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {missing.map((sk) => (
                  <Badge key={sk.name} variant="warning" size="md">
                    + {sk.name}
                  </Badge>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Curated Learning Roadmap */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BookOpen size={20} color="var(--color-primary-600)" />
            <h3 className="text-h3" style={{ fontSize: '1.2rem', margin: 0 }}>
              Curated Action Plan to Close Missing Gaps
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeRole.roadmap.map((item, idx) => (
              <Card key={item.skill} variant="raised">
                <Card.Content style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-50)',
                        color: 'var(--color-primary-600)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                          {item.skill}
                        </h4>
                        <Badge variant={item.priority === 'High' ? 'danger' : 'purple'} size="sm">
                          {item.priority} Priority
                        </Badge>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          Est. Time: {item.timeToLearn}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Recommended Resource: </span>
                        {item.resource}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <span style={{ fontWeight: 600 }}>Portfolio Builder: </span>
                        {item.projectIdea}
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
