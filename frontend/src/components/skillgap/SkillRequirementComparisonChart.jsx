import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { Scale, CheckCircle2, AlertCircle, BookmarkCheck, FileQuestion } from 'lucide-react';

export default function SkillRequirementComparisonChart({ skillComparison = {} }) {
  const summary = skillComparison.summary || {
    demonstratedSkills: 0,
    listedOnResume: 0,
    needsVerification: 0,
    explicitlyRequired: 0,
    preferredQualifications: 0,
  };

  const chartData = [
    {
      group: 'Current Profile Evidence',
      demonstrated: summary.demonstratedSkills || 0,
      listed: summary.listedOnResume || 0,
      unverified: summary.needsVerification || 0,
    },
    {
      group: 'Target Requirements',
      required: summary.explicitlyRequired || 0,
      preferred: summary.preferredQualifications || 0,
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="skillgap-recharts-tooltip">
          <p className="skillgap-recharts-tooltip-title">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="skillgap-recharts-tooltip-row">
              <span className="skillgap-recharts-tooltip-label">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }} />
                {entry.name}:
              </span>
              <span className="skillgap-recharts-tooltip-value">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Current Skills vs Target Requirements</CardTitle>
              <p className="text-xs text-secondary">Evidence breakdown: demonstrated mastery vs requested qualifications</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Grounded Qualification Audit
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-2">
        <div style={{ width: '100%', height: '320px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color, #e2e8f0)" opacity={0.6} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--text-secondary, #64748b)' }}
                axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
              />
              <YAxis
                type="category"
                dataKey="group"
                width={140}
                tick={{ fontSize: 11, fill: 'var(--text-primary, #1e293b)' }}
                axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />
              <Bar
                dataKey="demonstrated"
                name="Demonstrated (Projects/Work)"
                fill="#10b981"
                stackId="current"
                radius={[0, 0, 0, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1100}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="listed"
                name="Listed on Resume"
                fill="#38bdf8"
                stackId="current"
                radius={[0, 0, 0, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="unverified"
                name="Needs Verification"
                fill="#f59e0b"
                stackId="current"
                radius={[0, 6, 6, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1300}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="required"
                name="Explicitly Required"
                fill="#3b82f6"
                stackId="target"
                radius={[0, 0, 0, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1100}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="preferred"
                name="Preferred / Optional"
                fill="#8b5cf6"
                stackId="target"
                radius={[0, 6, 6, 0]}
                barSize={20}
                isAnimationActive={true}
                animationDuration={1300}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evidence Status Legend & Explanations */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border mt-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-secondary">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span><strong className="text-text-primary">{summary.demonstratedSkills}</strong> Demonstrated</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary">
            <BookmarkCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span><strong className="text-text-primary">{summary.listedOnResume}</strong> Listed on Resume</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary">
            <FileQuestion className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span><strong className="text-text-primary">{summary.needsVerification}</strong> Needs Verification</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span><strong className="text-text-primary">{summary.explicitlyRequired}</strong> Mandatory Target</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
