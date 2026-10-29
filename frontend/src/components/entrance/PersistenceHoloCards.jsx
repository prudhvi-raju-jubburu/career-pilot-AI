import React from 'react';
import { Sparkles, Briefcase, BookOpen, TrendingUp, CheckCircle2 } from 'lucide-react';

/**
 * PersistenceHoloCards
 * Renders real physical 3D cards with photorealistic 3D Pixar sample images
 * (mirroring the sample objects/obstacles from Scene 2) that float with
 * smooth physics-based levitation on both sides of the staircase during Scene 5.
 */
export default function PersistenceHoloCards() {
  return (
    <div className="cpe-holo-cards-container" aria-hidden="true">
      {/* ===================================================================
          LEFT SIDE REAL PHYSICAL 3D CARDS
          =================================================================== */}

      {/* 1. Left Upper Card: Personalized Guidance */}
      <div className="cpe-holo-card cpe-holo-card-left-top">
        <div className="cpe-holo-glint" />

        {/* Real 3D Pixar Sample Image Viewport */}
        <div className="cpe-holo-thumb-frame">
          <img
            src="/entrance/cards/guidance.jpg"
            alt="Personalized Guidance"
            className="cpe-holo-thumb-img"
          />
          <div className="cpe-holo-thumb-sheen" />
          <div className="cpe-holo-badge cpe-badge-cyan cpe-thumb-floating-badge">
            <Sparkles size={11} className="cpe-holo-icon-spin" />
            <span>AI ENGINE • 98% MATCH</span>
          </div>
        </div>

        <div className="cpe-holo-body">
          <div className="cpe-holo-header-row">
            <h4 className="cpe-holo-title">Personalized Guidance</h4>
            <div className="cpe-holo-dots">
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
            </div>
          </div>
          <p className="cpe-holo-sub">Adaptive Career Path Optimization</p>

          <div className="cpe-holo-meta">
            <div className="cpe-holo-progress-wrap">
              <div className="cpe-holo-progress-bar" style={{ width: '94%' }} />
            </div>
            <span className="cpe-holo-meta-label">Optimal Trajectory Active</span>
          </div>
        </div>
      </div>

      {/* 2. Left Lower Card: Curated Resources */}
      <div className="cpe-holo-card cpe-holo-card-left-bottom">
        <div className="cpe-holo-glint" />

        {/* Real 3D Pixar Sample Image Viewport */}
        <div className="cpe-holo-thumb-frame">
          <img
            src="/entrance/cards/resources.jpg"
            alt="Curated Resources"
            className="cpe-holo-thumb-img"
          />
          <div className="cpe-holo-thumb-sheen" />
          <div className="cpe-holo-badge cpe-badge-cyan cpe-thumb-floating-badge">
            <BookOpen size={11} />
            <span>LEARNING VAULT</span>
          </div>
        </div>

        <div className="cpe-holo-body">
          <div className="cpe-holo-header-row">
            <h4 className="cpe-holo-title">Curated Resources</h4>
            <div className="cpe-holo-dots">
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
            </div>
          </div>
          <p className="cpe-holo-sub">120+ Verified Roadmaps & Guides</p>

          <div className="cpe-holo-tags">
            <span className="cpe-holo-tag">System Design</span>
            <span className="cpe-holo-tag">Algorithms</span>
            <span className="cpe-holo-tag">AI / ML</span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          RIGHT SIDE REAL PHYSICAL 3D CARDS
          =================================================================== */}

      {/* 3. Right Upper Card: Verified Opportunities */}
      <div className="cpe-holo-card cpe-holo-card-right-top">
        <div className="cpe-holo-glint" />

        {/* Real 3D Pixar Sample Image Viewport */}
        <div className="cpe-holo-thumb-frame">
          <img
            src="/entrance/cards/opportunities.jpg"
            alt="Verified Opportunities"
            className="cpe-holo-thumb-img"
          />
          <div className="cpe-holo-thumb-sheen" />
          <div className="cpe-holo-badge cpe-badge-amber cpe-thumb-floating-badge">
            <Briefcase size={11} />
            <span>VERIFIED ROLES</span>
          </div>
        </div>

        <div className="cpe-holo-body">
          <div className="cpe-holo-header-row">
            <h4 className="cpe-holo-title">Verified Opportunities</h4>
            <div className="cpe-holo-dots">
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
            </div>
          </div>
          <p className="cpe-holo-sub">183+ Active High-Impact Openings</p>

          <div className="cpe-holo-tags">
            <span className="cpe-holo-tag cpe-tag-live">● Live Today</span>
            <span className="cpe-holo-tag">Direct Referral</span>
          </div>
        </div>
      </div>

      {/* 4. Right Lower Card: Skill Development */}
      <div className="cpe-holo-card cpe-holo-card-right-bottom">
        <div className="cpe-holo-glint" />

        {/* Real 3D Pixar Sample Image Viewport */}
        <div className="cpe-holo-thumb-frame">
          <img
            src="/entrance/cards/skills.jpg"
            alt="Skill Development"
            className="cpe-holo-thumb-img"
          />
          <div className="cpe-holo-thumb-sheen" />
          <div className="cpe-holo-badge cpe-badge-emerald cpe-thumb-floating-badge">
            <TrendingUp size={11} />
            <span>MASTERY ENGINE</span>
          </div>
        </div>

        <div className="cpe-holo-body">
          <div className="cpe-holo-header-row">
            <h4 className="cpe-holo-title">Skill Development</h4>
            <div className="cpe-holo-dots">
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
              <span className="cpe-holo-dot" />
            </div>
          </div>
          <div className="cpe-holo-verified-row">
            <div className="cpe-holo-check-badge">
              <CheckCircle2 size={15} />
              <span>Competencies Verified</span>
            </div>
            <span className="cpe-holo-score">96%</span>
          </div>
          <p className="cpe-holo-sub" style={{ marginTop: '0.3rem' }}>
            Production-Grade Portfolio Approved
          </p>
        </div>
      </div>
    </div>
  );
}
