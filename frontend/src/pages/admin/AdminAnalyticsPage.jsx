import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw,
  Info,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAdminAnalytics } from '../../services/adminService';

const FUNNEL_COLORS = {
  Saved: '#64748b',
  Applied: '#3b82f6',
  Assessment: '#8b5cf6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
  Withdrawn: '#94a3b8'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await getAdminAnalytics(period);
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      setError(err.message || 'Failed to retrieve analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const kpis = data?.kpis;
  const charts = data?.charts;

  // Prepare Application Funnel data
  const funnelData = kpis?.applications?.by_status
    ? Object.entries(kpis.applications.by_status).map(([stage, count]) => ({
        stage,
        count,
        fill: FUNNEL_COLORS[stage] || '#3b82f6',
      }))
    : [];

  return (
    <AdminLayout
      title="Platform Analytics & Funnel Quality"
      subtitle="Examine student interaction signals, application funnels, and recommendation accuracy."
    >
      {/* Top Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Date Range:</span>
          <div className="admin-pill-group">
            {[7, 30, 90, 180].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriod(d)}
                className={`admin-pill-btn ${period === d ? 'active' : ''}`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={refreshing}
          className="admin-btn admin-btn-secondary"
          title="Refresh analytics telemetry"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#b91c1c',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Product Telemetry Disclaimer Alert */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          color: '#1e293b',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
        }}
      >
        <Info size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: '#0f172a' }}>Operational Data Integrity Notice:</strong> Application records displayed represent student-confirmed tracker entries recorded on CareerPilot AI. A tracked entry reflects candidate-reported progression through interview pipelines rather than verified employer backend confirmations.
        </div>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Application Funnel Breakdown */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Application Pipeline Funnel</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', marginBottom: '1rem' }}>
            Distribution of student tracked stages (Saved → Applied → Assessment → Interview → Offer)
          </p>
          <div style={{ height: '260px', width: '100%' }}>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Zero application records found.
              </div>
            )}
          </div>
        </div>

        {/* Feedback Reason Distribution */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Recommendation Feedback Breakdown</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', marginBottom: '1rem' }}>
            Student-submitted feedback rationale for opportunity ranking adjustments
          </p>
          <div style={{ height: '260px', width: '100%' }}>
            {charts?.feedback_reasons?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.feedback_reasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis
                    dataKey="reason"
                    type="category"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(r) => r.replace('_', ' ')}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No feedback interactions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Opportunity Freshness Distribution */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Opportunity Lifecycle & Freshness</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', marginBottom: '1rem' }}>
            Database records categorized by active, expired, retired, or scam flagged
          </p>
          <div style={{ height: '260px', width: '100%' }}>
            {charts?.opportunity_freshness?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.opportunity_freshness}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {charts.opportunity_freshness.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No opportunity lifecycle records.
              </div>
            )}
          </div>
        </div>

        {/* Ingestion Connector Yield */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Connector Yield & Acceptance</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem', marginBottom: '1rem' }}>
            Accepted opportunities vs duplicates filtered per external source
          </p>
          <div style={{ height: '260px', width: '100%' }}>
            {charts?.connector_stats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.connector_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="source_name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(s) => s.slice(0, 10)} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      color: '#0f172a',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="accepted" name="Accepted" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="duplicates" name="Duplicates" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No connector telemetry available.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
