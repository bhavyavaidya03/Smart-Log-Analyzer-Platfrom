import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { useState } from 'react';
import { analyticsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import type { AnalyticsTrends } from '@/types';

const LEVEL_COLORS: Record<string, string> = {
  ERROR: '#ef4444', CRITICAL: '#dc2626', WARNING: '#f59e0b',
  INFO: '#6366f1', DEBUG: '#94a3b8', UNKNOWN: '#64748b',
};

type Period = 'daily' | 'weekly' | 'monthly';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs border border-bg-border shadow-card">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span className="text-text-secondary capitalize">{e.name}:</span>
          <span className="text-text-primary font-medium">{e.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('daily');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsApi.getTrends(),
  });

  const trends: AnalyticsTrends | undefined = data?.data.data;
  const chartData = trends?.[period] ?? [];

  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Analytics' }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-0.5">Insights across all your log data</p>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-1 mb-6 bg-bg-elevated border border-bg-border rounded-xl p-1 w-fit">
        {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              period === p ? 'bg-primary-500 text-white shadow-glow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Main trend chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary capitalize">
              {period} Log Activity
            </h2>
            <p className="text-sm text-text-muted">Error, warning, and info trends</p>
          </div>
          <TrendingUp className="w-4 h-4 text-text-muted" />
        </div>
        {isLoading ? <ChartSkeleton height={280} /> : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                {Object.entries(LEVEL_COLORS).map(([lvl, color]) => (
                  <linearGradient key={lvl} id={`grad-${lvl}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="url(#grad-ERROR)" strokeWidth={2} name="Errors" />
              <Area type="monotone" dataKey="warnings" stroke="#f59e0b" fill="url(#grad-WARNING)" strokeWidth={2} name="Warnings" />
              <Area type="monotone" dataKey="info" stroke="#6366f1" fill="url(#grad-INFO)" strokeWidth={2} name="Info" />
              <Area type="monotone" dataKey="critical" stroke="#dc2626" fill="url(#grad-CRITICAL)" strokeWidth={2} name="Critical" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom charts row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Level distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Level Distribution</h2>
          {isLoading ? <ChartSkeleton height={220} /> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={trends?.level_distribution ?? []} cx="50%" cy="50%" outerRadius={75} dataKey="count" nameKey="level" stroke="#0f0f1a" strokeWidth={2}>
                    {(trends?.level_distribution ?? []).map((_, i) => (
                      <Cell key={i} fill={LEVEL_COLORS[_?.level] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="glass-card p-2 text-xs border border-bg-border">
                        <Badge level={payload[0].name as any} />
                        <p className="mt-1">{payload[0].value} ({payload[0].payload.percentage}%)</p>
                      </div>
                    ) : null
                  } />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {(trends?.level_distribution ?? []).map(item => (
                  <div key={item.level} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LEVEL_COLORS[item.level] }} />
                    <span className="text-text-secondary">{item.level}</span>
                    <span className="ml-auto text-text-primary font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Sources bar */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Top Sources</h2>
          {isLoading ? <ChartSkeleton height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends?.top_sources?.slice(0, 8) ?? []} layout="vertical" margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="source" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Logs" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Errors */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Top Error Patterns</h2>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : (trends?.top_errors?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">No errors found 🎉</div>
          ) : (
            <div className="space-y-3">
              {trends?.top_errors?.slice(0, 6).map((err, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-danger/5 border border-danger/10 rounded-xl"
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <p className="text-xs text-text-primary line-clamp-2 flex-1">{err.message}</p>
                    <span className="text-xs font-bold text-danger flex-shrink-0">{err.count}×</span>
                  </div>
                  <div className="h-1 bg-bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-danger/60 rounded-full" style={{ width: `${err.percentage}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
