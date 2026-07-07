import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight, X,
  Clock, Globe, Activity, Hash, FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { logsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import type { LogLevel } from '@/types';

const LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

export default function LogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState<LogLevel | ''>('');
  const [source, setSource] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: uploadData } = useQuery({
    queryKey: ['upload', id],
    queryFn: () => logsApi.getUpload(id!),
    enabled: !!id,
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['parsed-logs', id, page, keyword, level, source],
    queryFn: () => logsApi.getParsedLogs(id!, {
      page,
      page_size: 50,
      keyword: keyword || undefined,
      level: (level as LogLevel) || undefined,
      source: source || undefined,
    }),
    enabled: !!id,
  });

  const upload = uploadData?.data.data;
  const logs = logsData?.data.data ?? [];
  const total = logsData?.data.total ?? 0;
  const totalPages = logsData?.data.total_pages ?? 1;

  const handleExportCsv = async () => {
    if (!id) return;
    const res = await logsApi.exportCsv(id);
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url; a.download = `logs_${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!id) return;
    const res = await logsApi.exportPdf(id);
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = keyword || level || source;

  return (
    <AppLayout breadcrumbs={[
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Log History', path: '/logs' },
      { label: upload?.original_filename || 'Log Detail' },
    ]}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            {upload?.original_filename || 'Log Detail'}
          </h1>
          {upload && (
            <p className="text-text-muted text-sm mt-0.5">
              {upload.parsed_lines.toLocaleString()} entries · {upload.status} ·{' '}
              {format(new Date(upload.created_at), 'MMM d, yyyy HH:mm')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCsv} leftIcon={<Download className="w-3.5 h-3.5" />}>
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportPdf} leftIcon={<Download className="w-3.5 h-3.5" />}>
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search messages..."
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              className="input pl-9 text-sm py-2"
              id="log-search"
            />
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-1.5">
            {LEVELS.map(lvl => (
              <button
                key={lvl}
                onClick={() => { setLevel(level === lvl ? '' : lvl); setPage(1); }}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                  level === lvl ? 'ring-2 ring-offset-1 ring-offset-bg-elevated ring-primary-500' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Badge level={lvl} />
              </button>
            ))}
          </div>

          {/* Source filter */}
          <input
            type="text"
            placeholder="Source..."
            value={source}
            onChange={e => { setSource(e.target.value); setPage(1); }}
            className="input text-sm py-2 w-32"
            id="source-filter"
          />

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setKeyword(''); setLevel(''); setSource(''); setPage(1); }}
              className="btn-ghost btn btn-sm text-text-muted"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
          <Filter className="w-3 h-3" />
          Showing {total.toLocaleString()} results
        </div>
      </div>

      {/* Log entries table */}
      <div className="table-container">
        <table className="table text-xs">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Timestamp</th>
              <th>Level</th>
              <th>Source</th>
              <th>IP</th>
              <th>Status</th>
              <th className="w-1/2">Message</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-muted">
                  {hasFilters ? 'No entries match your filters' : 'No log entries found'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="text-text-muted">{log.line_number}</td>
                    <td className="text-text-muted whitespace-nowrap">
                      {log.timestamp ? format(new Date(log.timestamp), 'MM-dd HH:mm:ss') : '—'}
                    </td>
                    <td><Badge level={log.level} /></td>
                    <td className="text-text-secondary max-w-[80px] truncate">{log.source || '—'}</td>
                    <td className="text-text-secondary">{log.ip_address || '—'}</td>
                    <td>
                      {log.status_code ? (
                        <span className={`font-mono font-bold ${
                          log.status_code >= 500 ? 'text-danger' :
                          log.status_code >= 400 ? 'text-warning' : 'text-success'
                        }`}>{log.status_code}</span>
                      ) : '—'}
                    </td>
                    <td className="max-w-0">
                      <p className="truncate text-text-primary">{log.message}</p>
                    </td>
                  </motion.tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-expanded`}>
                      <td colSpan={7} className="bg-bg-base/50 px-4 py-4">
                        <div className="code-block">{log.raw_line}</div>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-muted">
                          {log.module && <span><strong>Module:</strong> {log.module}</span>}
                          {log.response_time && <span><strong>Response:</strong> {log.response_time.toFixed(1)}ms</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-muted">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-icon btn-secondary btn-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-icon btn-secondary btn-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
