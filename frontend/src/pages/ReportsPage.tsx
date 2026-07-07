import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileBarChart, Download, FileText, ChevronLeft, ChevronRight,
  RefreshCw, CheckCircle, XCircle, Loader2, Clock,
  FileSpreadsheet, FileType2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { logsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle className="w-4 h-4 text-success" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-danger" />;
  if (status === 'processing') return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
  return <Clock className="w-4 h-4 text-text-muted" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function downloadBlob(uploadId: string, type: 'csv' | 'pdf') {
  try {
    toast.loading(`Preparing ${type.toUpperCase()}…`, { id: `export-${uploadId}` });
    const res = type === 'csv'
      ? await logsApi.exportCsv(uploadId)
      : await logsApi.exportPdf(uploadId);
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'csv' ? `logs_${uploadId}.csv` : `report_${uploadId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type.toUpperCase()} downloaded!`, { id: `export-${uploadId}` });
  } catch {
    toast.error(`Failed to export ${type.toUpperCase()}`, { id: `export-${uploadId}` });
  }
}

export default function ReportsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['uploads-reports', page],
    queryFn: () => logsApi.listUploads(page, 20),
  });

  const uploads = data?.data.data ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = data?.data.total_pages ?? 1;

  // Only show completed uploads (can actually export)
  const completedCount = uploads.filter(u => u.status === 'completed').length;

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Reports' },
      ]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports & Exports</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Download your log analyses as CSV or PDF
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-icon btn-secondary" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Info banner */}
      {!isLoading && uploads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-6 flex items-center gap-3 border-primary-500/20"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <FileBarChart className="w-4 h-4 text-primary-400" />
          </div>
          <div className="flex-1 text-sm">
            <span className="text-text-primary font-medium">{completedCount}</span>
            <span className="text-text-muted"> of {total} upload{total !== 1 ? 's' : ''} ready for export</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
              <span>CSV — raw data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileType2 className="w-3.5 h-3.5 text-danger" />
              <span>PDF — formatted report</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Log File</th>
              <th>Type</th>
              <th>Size</th>
              <th>Entries</th>
              <th>Status</th>
              <th>Date</th>
              <th className="text-center">Export</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : uploads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <FileBarChart className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary font-medium mb-1">No logs to export</p>
                  <p className="text-text-muted text-sm">Upload some log files to generate reports</p>
                </td>
              </tr>
            ) : (
              uploads.map((upload, i) => (
                <motion.tr
                  key={upload.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary-400" />
                      </div>
                      <p className="text-sm font-medium text-text-primary truncate max-w-[180px]">
                        {upload.original_filename}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info uppercase">.{upload.file_type}</span>
                  </td>
                  <td className="text-text-secondary text-sm">{formatSize(upload.file_size)}</td>
                  <td>
                    <span className="text-sm text-text-primary">{upload.parsed_lines.toLocaleString()}</span>
                    <span className="text-text-muted text-xs"> / {upload.total_lines.toLocaleString()}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={upload.status} />
                      <span className={`text-xs font-medium capitalize ${
                        upload.status === 'completed' ? 'text-success' :
                        upload.status === 'failed' ? 'text-danger' :
                        upload.status === 'processing' ? 'text-warning' : 'text-text-muted'
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                  </td>
                  <td className="text-text-muted text-xs">
                    {format(new Date(upload.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => downloadBlob(upload.id, 'csv')}
                        disabled={upload.status !== 'completed'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                          bg-success/10 text-success hover:bg-success/20 transition-colors
                          disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Download CSV"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                      <button
                        onClick={() => downloadBlob(upload.id, 'pdf')}
                        disabled={upload.status !== 'completed'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                          bg-danger/10 text-danger hover:bg-danger/20 transition-colors
                          disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Download PDF"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-icon btn-secondary btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    pg === page ? 'bg-primary-500 text-white' : 'hover:bg-bg-elevated text-text-secondary'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-icon btn-secondary btn-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
