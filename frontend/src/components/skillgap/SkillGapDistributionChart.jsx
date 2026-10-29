import React from 'react';
import { motion } from 'framer-motion';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { Target, Zap, Clock, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import '../../pages/SkillGapPage.css';

export default function SkillGapDistributionChart({
  missingSkills = [],
  partialSkills = [],
  futureSkills = [],
  onOpenAllGaps
}) {
  const allGaps = [...partialSkills, ...missingSkills];

  const highPriority = allGaps.filter(s => s.priority === 'Critical' || s.priority === 'High');
  const mediumPriority = allGaps.filter(s => s.priority === 'Medium' || s.priority === 'Low');
  const exploratory = futureSkills || [];

  const total = highPriority.length + mediumPriority.length + exploratory.length;

  const highPct = total > 0 ? Math.round((highPriority.length / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((mediumPriority.length / total) * 100) : 0;
  const expPct = total > 0 ? Math.max(0, 100 - highPct - medPct) : 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '10px', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold" style={{ margin: 0 }}>Skill Gap Priority Distribution</CardTitle>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                Deterministic rules-based gap classification & roadmap scoping
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {total} Total Gaps & Paths
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-2">
        <div className="skillgap-dist-container">
          {/* Animated Stacked Distribution Bar */}
          {total > 0 ? (
            <div className="skillgap-dist-bar-wrapper">
              <div className="skillgap-dist-track">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${highPct}%` }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  className="skillgap-dist-segment rose"
                  title={`High Priority Gaps: ${highPriority.length} (${highPct}%)`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${medPct}%` }}
                  transition={{ duration: 1.2, delay: 0.1, ease: 'easeOut' }}
                  className="skillgap-dist-segment amber"
                  title={`Medium Priority Gaps: ${mediumPriority.length} (${medPct}%)`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${expPct}%` }}
                  transition={{ duration: 1.3, delay: 0.2, ease: 'easeOut' }}
                  className="skillgap-dist-segment violet"
                  title={`Exploratory & Emerging: ${exploratory.length} (${expPct}%)`}
                />
              </div>

              <div className="skillgap-dist-labels-row">
                <span>0%</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{total} Total Competencies Mapped</span>
                <span>100% of Career Roadmap Scope</span>
              </div>

              {/* Legend Row */}
              <div className="skillgap-dist-legend-row">
                <div className="skillgap-dist-legend-item">
                  <span className="skillgap-dist-legend-dot rose" />
                  <span>High Priority ({highPriority.length} • {highPct}%)</span>
                </div>
                <div className="skillgap-dist-legend-item">
                  <span className="skillgap-dist-legend-dot amber" />
                  <span>Medium Priority ({mediumPriority.length} • {medPct}%)</span>
                </div>
                <div className="skillgap-dist-legend-item">
                  <span className="skillgap-dist-legend-dot violet" />
                  <span>Emerging Scope ({exploratory.length} • {expPct}%)</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Zero unmet skill gaps detected for current target role!</span>
            </div>
          )}

          {/* Staggered Animated Priority Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="skillgap-dist-cards-grid"
          >
            {/* Card 1: High Priority (Core Requirements) */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="skillgap-dist-tier-card rose"
            >
              <div className="skillgap-dist-card-header">
                <div className="skillgap-dist-header-left">
                  <span className="skillgap-dist-dot rose" />
                  <h4 className="skillgap-dist-card-title">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>High Priority Gaps</span>
                  </h4>
                  <span className="skillgap-dist-count-badge rose">
                    {highPriority.length}
                  </span>
                </div>
                <span className="skillgap-dist-tier-label rose">
                  Core Requirements
                </span>
              </div>
              <p className="skillgap-dist-card-desc">
                Mandatory skills explicitly requested by target hiring pipelines with foundational prerequisites satisfied.
              </p>
              <div className="skillgap-dist-pills-row">
                {highPriority.slice(0, 6).map((s, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="skillgap-dist-pill rose"
                    title={`Domain: ${s.category || 'Core'} | Priority: ${s.priority || 'High'}`}
                  >
                    <span className="skillgap-dist-pill-dot" />
                    <span>{s.name}</span>
                  </motion.span>
                ))}
                {highPriority.length > 6 && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenAllGaps}
                    className="skillgap-dist-pill rose"
                    style={{ fontWeight: 700, cursor: 'pointer', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#f43f5e' }}
                    title="View all high priority gaps in drawer"
                  >
                    <span>+{highPriority.length - 6} more</span>
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Card 2: Medium Priority (Preferred Qualifications) */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="skillgap-dist-tier-card amber"
            >
              <div className="skillgap-dist-card-header">
                <div className="skillgap-dist-header-left">
                  <span className="skillgap-dist-dot amber" />
                  <h4 className="skillgap-dist-card-title">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Medium Priority Gaps</span>
                  </h4>
                  <span className="skillgap-dist-count-badge amber">
                    {mediumPriority.length}
                  </span>
                </div>
                <span className="skillgap-dist-tier-label amber">
                  Preferred Qualifications
                </span>
              </div>
              <p className="skillgap-dist-card-desc">
                Secondary tools or preferred qualifications that differentiate competitive candidates.
              </p>
              <div className="skillgap-dist-pills-row">
                {mediumPriority.map((s, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="skillgap-dist-pill amber"
                    title={`Domain: ${s.category || 'Preferred'} | Priority: ${s.priority || 'Medium'}`}
                  >
                    <span className="skillgap-dist-pill-dot" />
                    <span>{s.name}</span>
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Card 3: Emerging & Growth Scope (Future Technology) */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="skillgap-dist-tier-card violet"
            >
              <div className="skillgap-dist-card-header">
                <div className="skillgap-dist-header-left">
                  <span className="skillgap-dist-dot violet" />
                  <h4 className="skillgap-dist-card-title">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>Emerging & Growth Scope</span>
                  </h4>
                  <span className="skillgap-dist-count-badge violet">
                    {exploratory.length}
                  </span>
                </div>
                <span className="skillgap-dist-tier-label violet">
                  Future Technology
                </span>
              </div>
              <p className="skillgap-dist-card-desc">
                Forward-looking architecture and generative AI skills for long-term career growth.
              </p>
              <div className="skillgap-dist-pills-row">
                {exploratory.map((s, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className="skillgap-dist-pill violet"
                    title={`Domain: ${s.category || 'Emerging'} | Scope: Future Innovation`}
                  >
                    <span className="skillgap-dist-pill-dot" />
                    <span>{s.name}</span>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
