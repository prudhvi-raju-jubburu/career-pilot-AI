import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { Layers, Info } from 'lucide-react';

export default function SkillCategoryCoverageChart({ categoryBreakdown = [], targetRole = 'Software Engineer' }) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" />
            <CardTitle>Skill Coverage by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center text-secondary">
            <Info className="w-8 h-8 text-secondary mb-2 opacity-50" />
            <p className="text-sm font-medium">Insufficient category data to render chart.</p>
            <p className="text-xs text-secondary mt-1">Select a target role or verify profile skills to view category breakdown.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for horizontal bar chart
  const data = categoryBreakdown.map(item => ({
    category: item.category,
    targetCount: item.targetCount || 0,
    studentCount: item.studentCount || 0,
    coveragePct: item.coveragePct || 0,
    matchedSkills: item.matchedSkills || [],
    missingSkills: item.missingSkills || [],
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload;
      return (
        <div className="skillgap-recharts-tooltip">
          <p className="skillgap-recharts-tooltip-title">{itemData.category}</p>
          <div className="skillgap-recharts-tooltip-row">
            <span className="skillgap-recharts-tooltip-label">Category Coverage:</span>
            <span className="skillgap-recharts-tooltip-value" style={{ color: '#38bdf8' }}>{itemData.coveragePct}%</span>
          </div>
          <div className="skillgap-recharts-tooltip-row">
            <span className="skillgap-recharts-tooltip-label">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Verified Skills:
            </span>
            <span className="skillgap-recharts-tooltip-value" style={{ color: '#34d399' }}>{itemData.studentCount}</span>
          </div>
          <div className="skillgap-recharts-tooltip-row">
            <span className="skillgap-recharts-tooltip-label">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
              Target Required:
            </span>
            <span className="skillgap-recharts-tooltip-value" style={{ color: '#60a5fa' }}>{itemData.targetCount}</span>
          </div>
          {itemData.missingSkills && itemData.missingSkills.length > 0 && (
            <div className="skillgap-recharts-tooltip-gaps">
              <span className="skillgap-recharts-tooltip-gaps-label">Top Priority Gaps:</span>
              <div className="skillgap-recharts-tooltip-tags">
                {itemData.missingSkills.slice(0, 3).map((s, idx) => (
                  <span key={idx} className="skillgap-recharts-tooltip-tag">
                    {s}
                  </span>
                ))}
                {itemData.missingSkills.length > 3 && (
                  <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>+{itemData.missingSkills.length - 3} more</span>
                )}
              </div>
            </div>
          )}
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
            <div className="p-2 bg-primary-500/10 rounded-lg text-primary-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Skill Coverage by Category</CardTitle>
              <p className="text-xs text-secondary">Verified student skills vs target requirements across domains</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {targetRole}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-2">
        <div style={{ width: '100%', height: '320px', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color, #e2e8f0)" opacity={0.6} />
              <XAxis
                type="number"
                domain={[0, 'dataMax + 1']}
                tick={{ fontSize: 11, fill: 'var(--text-secondary, #64748b)' }}
                axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={185}
                tick={{ fontSize: 11, fill: 'var(--text-primary, #1e293b)' }}
                axisLine={{ stroke: 'var(--border-color, #e2e8f0)' }}
                tickFormatter={(val) => val.length > 28 ? `${val.substring(0, 26)}…` : val}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-xs text-text-primary" style={{ fontWeight: 600 }}>
                    {value === 'studentCount' ? 'Verified Skills' : 'Target Required'}
                  </span>
                )}
              />
              <Bar
                dataKey="studentCount"
                name="studentCount"
                fill="#10b981"
                radius={[0, 6, 6, 0]}
                barSize={13}
                isAnimationActive={true}
                animationDuration={1100}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="targetCount"
                name="targetCount"
                fill="#3b82f6"
                radius={[0, 6, 6, 0]}
                barSize={13}
                isAnimationActive={true}
                animationDuration={1300}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-xs text-secondary">
          <span>Target role requirements compared to profile evidence.</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Green = Matched</span>
        </div>
      </CardContent>
    </Card>
  );
}
