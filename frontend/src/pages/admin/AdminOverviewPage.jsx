import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Layers,
  Activity,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  FileCheck,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAdminOverview, getAdminCharts, triggerAdminSourceSync } from '../../services/adminService';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function AdminOverviewPage() {
  const [period, setPeriod] = useState(30);
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [kpiRes, chartRes] = await Promise.all([
        getAdminOverview(period),
        getAdminCharts(period)
      ]);
      if (kpiRes?.success) setKpis(kpiRes.data);
      if (chartRes?.success) setCharts(chartRes.data);
    } catch (err) {
      console.error('Error loading admin overview telemetry:', err);
      setError(err.message || 'Failed to retrieve administrative analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await triggerAdminSourceSync();
      if (res?.success) {
        setSyncMessage(`Opportunity sync finished: ${res.data?.total_accepted || 0} accepted, ${res.data?.total_duplicates || 0} duplicates.`);
        loadData();
      }
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout
      title="Platform Operations & Analytics"
      subtitle="Real-time telemetry, database aggregations, and ingestion health across CareerPilot AI."
    >
      {/* Top Controls & Period Selector */}
      {/* Top Filter & Operations Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Analysis Window:</span>
          <div className="admin-pill-group">
            {[7, 30, 90].map((d) => (
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

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="admin-btn admin-btn-secondary"
            title="Refresh database metrics"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="admin-btn admin-btn-primary"
            title="Run immediate connector ingestion"
          >
            <Activity size={15} />
            <span>{syncing ? 'Ingesting...' : 'Sync Connectors'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            color: '#1d4ed8',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} />
          <span>{syncMessage}</span>
        </div>
      )}

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

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Users */}
        <div className="admin-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="admin-kpi-label">Total Registered Users</span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-kpi-value admin-kpi-cyan">
            {loading ? '...' : kpis?.users?.total?.toLocaleString() ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            <span style={{ color: '#059669', fontWeight: 700 }}>+{kpis?.users?.new_in_period ?? 0}</span> new in last {period}d
          </div>
        </div>

        {/* Active vs Suspended */}
        <div className="admin-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="admin-kpi-label">Active / Suspended</span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: kpis?.users?.suspended > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: kpis?.users?.suspended > 0 ? '#dc2626' : '#059669' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="admin-kpi-value admin-kpi-emerald">
            {loading ? '...' : `${kpis?.users?.active ?? 0} / ${kpis?.users?.suspended ?? 0}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {kpis?.users?.completed_profiles ?? 0} profiles verified
          </div>
        </div>

        {/* Active Opportunities */}
        <div className="admin-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="admin-kpi-label">Active Opportunities</span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div className="admin-kpi-value admin-kpi-emerald">
            {loading ? '...' : kpis?.opportunities?.active?.toLocaleString() ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{kpis?.opportunities?.india_eligible ?? 0}</span> India-eligible
          </div>
        </div>

        {/* Moderation Pending / Duplicates */}
        <div className="admin-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="admin-kpi-label">Awaiting Review</span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="admin-kpi-value admin-kpi-amber">
            {loading ? '...' : kpis?.opportunities?.pending_review ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {kpis?.opportunities?.duplicate_candidates ?? 0} duplicate candidates
          </div>
        </div>

        {/* Tracked Applications */}
        <div className="admin-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="admin-kpi-label">Applications Tracked</span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="admin-kpi-value admin-kpi-purple">
            {loading ? '...' : kpis?.applications?.total?.toLocaleString() ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            +{kpis?.applications?.new_in_period ?? 0} in last {period}d
          </div>
        </div>

        {/* Source Health */}
        <div className="admin-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="admin-kpi-label">Connector Status</span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', backgroundColor: kpis?.sources?.system_status === 'healthy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: kpis?.sources?.system_status === 'healthy' ? '#059669' : '#d97706' }}>
              <Activity size={18} />
            </div>
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              marginTop: '0.65rem',
              textTransform: 'uppercase',
              color: kpis?.sources?.system_status === 'healthy' ? '#059669' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className={`admin-live-dot ${kpis?.sources?.system_status === 'healthy' ? '' : 'degraded'}`} />
            <span>{loading ? '...' : kpis?.sources?.system_status ?? 'HEALTHY'}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {kpis?.sources?.healthy ?? 6}/{kpis?.sources?.total_connectors ?? 6} active
          </div>
        </div>
      </div>

      {/* Visualizations Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* User Registration Trend */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>User Registration Volume</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Daily student signups recorded in database
              </p>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {charts?.user_registrations_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.user_registrations_trend}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
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
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReg)" activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No registration records in this period window.
              </div>
            )}
          </div>
        </div>

        {/* Opportunities by Category */}
        <div className="admin-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Active Opportunities by Category</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Distribution across engineering & tech specializations
              </p>
            </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {charts?.opportunity_categories?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.opportunity_categories.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(c) => c.replace('_', ' ').slice(0, 10)} />
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
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                No active categories found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <Link
          to="/admin/users"
          className="admin-card"
          style={{
            padding: '1.25rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: '#2563eb' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Manage Accounts</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Suspend or review user permissions</div>
            </div>
          </div>
          <ArrowRight size={16} color="#94a3b8" />
        </Link>

        <Link
          to="/admin/opportunities"
          className="admin-card"
          style={{
            padding: '1.25rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}>
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Opportunity Moderation</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verify listings & merge duplicate candidates</div>
            </div>
          </div>
          <ArrowRight size={16} color="#94a3b8" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="admin-card"
          style={{
            padding: '1.25rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '10px', backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Audit Trail</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Inspect immutable administrative actions</div>
            </div>
          </div>
          <ArrowRight size={16} color="#94a3b8" />
        </Link>
      </div>
    </AdminLayout>
  );
}
