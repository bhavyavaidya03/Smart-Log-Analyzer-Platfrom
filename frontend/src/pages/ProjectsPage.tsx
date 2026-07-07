import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, Pencil, Trash2, FileText, ChevronRight,
  ChevronLeft, RefreshCw, FolderPlus, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { projectsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import type { Project } from '@/types';

interface ProjectFormData {
  name: string;
  description: string;
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => projectsApi.list(page, 20),
  });

  const projects = data?.data.data ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = data?.data.total_pages ?? 1;

  // ── Create ────────────────────────────────────────────────────────────────
  const {
    register: regCreate,
    handleSubmit: handleCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<ProjectFormData>();

  const createMutation = useMutation({
    mutationFn: (d: ProjectFormData) =>
      projectsApi.create({ name: d.name, description: d.description || undefined }),
    onSuccess: () => {
      toast.success('Project created!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setCreateOpen(false);
      resetCreate();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'Failed to create project'),
  });

  // ── Edit ──────────────────────────────────────────────────────────────────
  const {
    register: regEdit,
    handleSubmit: handleEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<ProjectFormData>();

  const openEdit = (p: Project) => {
    setEditTarget(p);
    resetEdit({ name: p.name, description: p.description || '' });
  };

  const editMutation = useMutation({
    mutationFn: (d: ProjectFormData) =>
      projectsApi.update(editTarget!.id, { name: d.name, description: d.description || undefined }),
    onSuccess: () => {
      toast.success('Project updated!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditTarget(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'Failed to update project'),
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete project'),
  });

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Projects' },
      ]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {total} project{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-icon btn-secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => { setCreateOpen(true); resetCreate(); }}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Project grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-5">
            <FolderPlus className="w-9 h-9 text-primary-400" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">No projects yet</h2>
          <p className="text-text-muted text-sm mb-6 max-w-sm">
            Organise your log files by project to keep things tidy and filter your analytics.
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create your first project
          </Button>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card-hover p-5 flex flex-col gap-4"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(project)}
                      className="btn-icon btn-ghost btn-sm hover:text-primary-400"
                      title="Edit project"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(project)}
                      className="btn-icon btn-ghost btn-sm hover:text-danger"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary truncate mb-1">
                    {project.name}
                  </h3>
                  {project.description ? (
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-xs text-text-disabled italic">No description</p>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{(project.log_count ?? 0).toLocaleString()} log{project.log_count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* View link */}
                <Link
                  to={`/logs?project_id=${project.id}`}
                  className="btn-secondary btn btn-sm w-full justify-center"
                >
                  View Logs
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
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

      {/* ── Create Modal ── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Project" size="md">
        <form onSubmit={handleCreate(d => createMutation.mutate(d))} className="space-y-4">
          <Input
            label="Project Name"
            id="create-project-name"
            placeholder="e.g. Production API"
            error={createErrors.name?.message}
            {...regCreate('name', { required: 'Project name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
          />
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              id="create-project-desc"
              placeholder="Describe this project..."
              {...regCreate('description')}
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={createMutation.isPending}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Project" size="md">
        <form onSubmit={handleEdit(d => editMutation.mutate(d))} className="space-y-4">
          <Input
            label="Project Name"
            id="edit-project-name"
            placeholder="Project name"
            error={editErrors.name?.message}
            {...regEdit('name', { required: 'Project name is required', maxLength: { value: 100, message: 'Max 100 characters' } })}
          />
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              id="edit-project-desc"
              placeholder="Describe this project..."
              {...regEdit('description')}
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" type="button" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={editMutation.isPending}
              leftIcon={<Pencil className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="sm">
        <p className="text-text-secondary text-sm mb-2">
          Are you sure you want to delete{' '}
          <strong className="text-text-primary">{deleteTarget?.name}</strong>?
        </p>
        <p className="text-xs text-warning mb-5">
          ⚠ All log files associated with this project will be unassigned (not deleted).
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
