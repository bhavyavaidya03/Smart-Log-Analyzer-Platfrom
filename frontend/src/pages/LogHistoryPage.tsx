import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, Trash2, Eye, Search, Filter, Upload, ChevronLeft, ChevronRight,
  RefreshCw, Clock, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { logsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import type { UploadedLog } from '@/types';

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

export default function LogHistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<UploadedLog | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['uploads', page],
    queryFn: () => logsApi.listUploads(page, 20),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => logsApi.deleteUpload(id),
    onSuccess: () => {
      toast.success('Log deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['uploads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete log'),
  });

  const uploads = data?.data.data ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = data?.data.total_pages ?? 1;

  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Log History' }]}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Log History</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {total} uploaded file{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-icon btn-secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link to="/upload" className="btn-primary btn">
            <Upload className="w-4 h-4" /> Upload New
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Size</th>
              <th>Parsed</th>
              <th>Status</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : uploads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary font-medium mb-1">No logs uploaded yet</p>
                  <p className="text-text-muted text-sm mb-4">Upload your first log file to get started</p>
                  <Link to="/upload" className="btn-primary btn btn-sm inline-flex">
                    <Upload className="w-3.5 h-3.5" /> Upload Logs
                  </Link>
                </td>
              </tr>
            ) : (
              uploads.map((upload) => (
                <motion.tr
                  key={upload.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate max-w-[200px]">
                          {upload.original_filename}
                        </p>
                      </div>
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
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/logs/${upload.id}`}
                        className="btn-icon btn-ghost btn-sm"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(upload)}
                        className="btn-icon btn-ghost btn-sm hover:text-danger hover:bg-danger/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Log File"
        size="sm"
      >
        <p className="text-text-secondary text-sm mb-4">
          Are you sure you want to delete{' '}
          <strong className="text-text-primary">{deleteTarget?.original_filename}</strong>?
          This will permanently remove all parsed log entries.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
