import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Upload, FileText, AlertTriangle, AlertCircle, Info,
  Activity, FolderOpen, TrendingUp, TrendingDown, ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { analyticsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import { StatCardSkeleton, ChartSkeleton, UploadCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import type { DashboardSummary, AnalyticsTrends } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  ERROR: '#ef4444',
  CRITICAL: '#dc2626',
  WARNING: '#f59e0b',
  INFO: '#6366f1',
  DEBUG: '#94a3b8',
  UNKNOWN: '#64748b',
};

function StatCard({
  icon: Icon, label, value, color, change, loading,
}: {
  icon: React.ElementType; label: string; value: number | string;
  color: string; change?: string; loading?: boolean;
}) {
  if (loading) return <StatCardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="stat-card cursor-default"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className="text-xs text-success flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
        <p className="text-sm text-text-secondary">{label}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-bg-border shadow-card text-xs">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-secondary capitalize">{entry.name}:</span>
          <span className="text-text-primary font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => analyticsApi.getSummary(),
    refetchInterval: 30000,
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsApi.getTrends(),
    refetchInterval: 60000,
  });

  const summary: DashboardSummary | undefined = summaryData?.data.data;
  const trends: AnalyticsTrends | undefined = trendsData?.data.data;

  const statCards = [
    { icon: Upload, label: 'Total Uploads', value: summary?.total_uploads ?? 0, color: 'bg-primary-500/10 text-primary-400' },
    { icon: FileText, label: 'Parsed Logs', value: summary?.total_parsed_logs ?? 0, color: 'bg-accent/10 text-accent' },
    { icon: AlertCircle, label: 'Errors', value: summary?.total_errors ?? 0, color: 'bg-danger/10 text-danger' },
    { icon: AlertTriangle, label: 'Warnings', value: summary?.total_warnings ?? 0, color: 'bg-warning/10 text-warning' },
    { icon: Activity, label: 'Critical', value: summary?.total_critical ?? 0, color: 'bg-critical/10 text-critical' },
    { icon: Info, label: 'Info Logs', value: summary?.total_info ?? 0, color: 'bg-primary-500/10 text-primary-300' },
    { icon: FolderOpen, label: 'Projects', value: summary?.total_projects ?? 0, color: 'bg-success/10 text-success' },
  ];

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard' },
      ]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here's what's happening with your logs
          </p>
        </div>
        <Link to="/upload" className="btn-primary btn hidden sm:flex">
          <Upload className="w-4 h-4" /> Upload Logs
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} loading={summaryLoading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Error Trend (Area chart) */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Error Trends</h2>
              <p className="text-sm text-text-muted">Last 30 days</p>
            </div>
            <TrendingUp className="w-4 h-4 text-text-muted" />
          </div>
          {trendsLoading ? (
            <ChartSkeleton height={240} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends?.daily ?? []}>
                <defs>
                  <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="warnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="infoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#errGrad)" strokeWidth={2} name="Errors" />
                <Area type="monotone" dataKey="warnings" stroke="#f59e0b" fill="url(#warnGrad)" strokeWidth={2} name="Warnings" />
                <Area type="monotone" dataKey="info" stroke="#6366f1" fill="url(#infoGrad)" strokeWidth={2} name="Info" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Level Distribution (Pie) */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Log Distribution</h2>
              <p className="text-sm text-text-muted">By level</p>
            </div>
          </div>
          {trendsLoading ? (
            <ChartSkeleton height={200} />
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={trends?.level_distribution ?? []}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="count"
                    nameKey="level"
                    strokeWidth={2}
                    stroke="#0f0f1a"
                  >
                    {(trends?.level_distribution ?? []).map((entry, i) => (
                      <Cell key={i} fill={LEVEL_COLORS[entry.level] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="glass-card p-2 text-xs border border-bg-border">
                        <Badge level={payload[0].name as any} />
                        <p className="text-text-primary mt-1">{payload[0].value} logs ({payload[0].payload.percentage}%)</p>
                      </div>
                    ) : null}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {(trends?.level_distribution ?? []).map((item) => (
                  <div key={item.level} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: LEVEL_COLORS[item.level] }} />
                      <span className="text-text-secondary">{item.level}</span>
                    </div>
                    <span className="text-text-primary font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Errors */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Top Errors</h2>
          {trendsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : (trends?.top_errors?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">No errors found 🎉</div>
          ) : (
            <div className="space-y-3">
              {trends?.top_errors?.slice(0, 5).map((err, i) => (
                <div key={i} className="p-3 bg-danger/5 border border-danger/10 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs text-text-primary line-clamp-2 flex-1">{err.message}</p>
                    <span className="text-xs text-danger font-bold flex-shrink-0">{err.count}×</span>
                  </div>
                  <div className="progress-bar mt-2">
                    <div className="progress-fill bg-danger/60" style={{ width: `${err.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Sources (Bar chart) */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Active Sources</h2>
          {trendsLoading ? (
            <ChartSkeleton height={160} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trends?.top_sources?.slice(0, 6) ?? []} layout="vertical" margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="source" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Logs" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Recent Uploads</h2>
            <Link to="/logs" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {summaryLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <UploadCardSkeleton key={i} />)}</div>
          ) : (summary?.recent_uploads?.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">No uploads yet</p>
              <Link to="/upload" className="text-xs text-primary-400 hover:underline mt-1 block">Upload your first log</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.recent_uploads?.map((upload) => (
                <Link
                  key={upload.id}
                  to={`/logs/${upload.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-card transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary-300 transition-colors">
                      {upload.original_filename}
                    </p>
                    <p className="text-xs text-text-muted">
                      {upload.parsed_lines} entries · {formatFileSize(upload.file_size)}
                    </p>
                  </div>
                  <Badge
                    variant={upload.status === 'completed' ? 'success' : upload.status === 'failed' ? 'error' : 'warning'}
                  >
                    {upload.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
