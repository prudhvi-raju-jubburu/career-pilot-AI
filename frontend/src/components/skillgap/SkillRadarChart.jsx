import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend
} from 'recharts';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Sparkles, TrendingUp } from 'lucide-react';

const CATEGORY_MAP = {
  'Frontend Architecture': ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Next.js', 'Redux', 'Vue'],
  'Backend & APIs': ['Node.js', 'Python', 'REST APIs', 'Express', 'Django', 'FastAPI', 'Java', 'Go'],
  'Databases & Storage': ['MongoDB', 'SQL', 'PostgreSQL', 'Redis', 'Database Indexing', 'MySQL'],
  'Cloud & DevOps': ['Docker', 'AWS', 'CI/CD', 'Kubernetes', 'Linux', 'Git', 'Terraform'],
  'Algorithms & CS': ['Data Structures', 'Algorithms', 'LeetCode', 'Problem Solving', 'OOP'],
  'System Design': ['System Design', 'Microservices', 'Caching', 'Message Queues', 'Kafka', 'Scalability'],
};

// Role baseline weights (out of 100)
const ROLE_BASELINES = {
  'Software Engineer': { 'Frontend Architecture': 75, 'Backend & APIs': 90, 'Databases & Storage': 80, 'Cloud & DevOps': 70, 'Algorithms & CS': 90, 'System Design': 75 },
  'Full Stack Developer': { 'Frontend Architecture': 95, 'Backend & APIs': 95, 'Databases & Storage': 85, 'Cloud & DevOps': 80, 'Algorithms & CS': 75, 'System Design': 75 },
  'Frontend Developer': { 'Frontend Architecture': 100, 'Backend & APIs': 60, 'Databases & Storage': 55, 'Cloud & DevOps': 65, 'Algorithms & CS': 70, 'System Design': 60 },
  'Backend Developer': { 'Frontend Architecture': 50, 'Backend & APIs': 100, 'Databases & Storage': 95, 'Cloud & DevOps': 85, 'Algorithms & CS': 85, 'System Design': 90 },
  'Data Scientist': { 'Frontend Architecture': 40, 'Backend & APIs': 85, 'Databases & Storage': 90, 'Cloud & DevOps': 65, 'Algorithms & CS': 95, 'System Design': 65 },
  'DevOps Engineer': { 'Frontend Architecture': 40, 'Backend & APIs': 75, 'Databases & Storage': 80, 'Cloud & DevOps': 100, 'Algorithms & CS': 70, 'System Design': 85 },
};

export default function SkillRadarChart({ targetRole = 'Software Engineer', studentSkills = [] }) {
  const chartData = useMemo(() => {
    const studentSkillsLower = studentSkills.map(s => (typeof s === 'string' ? s.toLowerCase() : ''));
    const roleReq = ROLE_BASELINES[targetRole] || ROLE_BASELINES['Software Engineer'];

    return Object.keys(CATEGORY_MAP).map(catName => {
      const skillsInCat = CATEGORY_MAP[catName];
      const matchCount = skillsInCat.filter(s =>
        studentSkillsLower.some(st => st.includes(s.toLowerCase()) || s.toLowerCase().includes(st))
      ).length;

      // Base student score calculated dynamically (30 base + match proportion)
      const baseStudentScore = Math.min(100, Math.round(35 + (matchCount / Math.max(skillsInCat.length * 0.45, 1)) * 65));
      const targetRequirement = roleReq[catName] || 80;

      return {
        category: catName,
        current: Math.min(100, baseStudentScore),
        required: targetRequirement,
        gap: Math.max(0, targetRequirement - baseStudentScore),
      };
    });
  }, [targetRole, studentSkills]);

  const overallFit = useMemo(() => {
    const totalCurrent = chartData.reduce((acc, d) => acc + d.current, 0);
    const totalReq = chartData.reduce((acc, d) => acc + d.required, 0);
    return Math.round((totalCurrent / totalReq) * 100);
  }, [chartData]);

  return (
    <Card variant="raised" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Competency Radar
            </span>
            <Badge variant="primary" size="sm">
              {targetRole}
            </Badge>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Student Profile vs. Target Benchmark
          </h3>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role Alignment</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: overallFit >= 75 ? 'var(--success)' : 'var(--warning)' }}>
            {overallFit}%
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '300px', width: '100%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
            <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <Radar
              name="Current Profile"
              dataKey="current"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.45}
              isAnimationActive={true}
              animationDuration={600}
            />
            <Radar
              name={`Required for ${targetRole}`}
              dataKey="required"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.15}
              strokeDasharray="4 4"
              isAnimationActive={true}
              animationDuration={600}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      boxShadow: 'var(--shadow-floating)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {data.category}
                    </div>
                    <div style={{ color: '#6366f1', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <span>Current:</span>
                      <strong>{data.current}/100</strong>
                    </div>
                    <div style={{ color: '#06b6d4', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <span>Target:</span>
                      <strong>{data.required}/100</strong>
                    </div>
                    {data.gap > 0 && (
                      <div style={{ color: 'var(--warning)', marginTop: '0.25rem', fontWeight: 600 }}>
                        Gap: -{data.gap} pts
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
              formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
        <Sparkles size={14} color="var(--primary)" />
        <span>
          Dynamic Recharts Radar re-indexes live whenever you switch target roles or acquire verified skills.
        </span>
      </div>
    </Card>
  );
}
