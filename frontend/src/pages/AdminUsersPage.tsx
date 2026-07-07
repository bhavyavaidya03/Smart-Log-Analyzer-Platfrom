import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield, Users, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, RefreshCw, Search, Crown,
} from 'lucide-react';
import { format } from 'date-fns';
import { usersApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Badge from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Guard: only admin can access this page
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => usersApi.listUsers(page, 20),
  });

  const users = data?.data.data ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = data?.data.total_pages ?? 1;

  // Client-side filtering by search term
  const filtered = searchTerm
    ? users.filter(
        u =>
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Admin — Users' },
      ]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              {total} registered user{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn-icon btn-secondary" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Admin notice */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-3.5 mb-5 flex items-center gap-3 border-warning/20"
      >
        <Crown className="w-4 h-4 text-warning flex-shrink-0" />
        <p className="text-xs text-text-secondary">
          <span className="text-warning font-medium">Admin view</span> — You are viewing all registered users. Handle with care.
        </p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          id="admin-user-search"
          placeholder="Search by name, email, or username…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="input pl-9 text-sm py-2 w-full"
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Active</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-14">
                  <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">
                    {searchTerm ? 'No users match your search' : 'No users found'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* User */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 object-cover" />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {u.full_name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate max-w-[160px] flex items-center gap-1.5">
                          {u.full_name}
                          {u.role === 'admin' && (
                            <Crown className="w-3 h-3 text-warning flex-shrink-0" />
                          )}
                        </p>
                        <p className="text-xs text-text-muted truncate max-w-[160px]">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Username */}
                  <td className="text-text-secondary text-sm font-mono">@{u.username}</td>

                  {/* Role */}
                  <td>
                    <span className={`badge capitalize ${u.role === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Verified */}
                  <td>
                    {u.is_verified ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <XCircle className="w-3.5 h-3.5" />
                        Unverified
                      </span>
                    )}
                  </td>

                  {/* Active */}
                  <td>
                    <span className={`inline-flex w-2 h-2 rounded-full ${u.is_active ? 'bg-success' : 'bg-danger'}`} />
                  </td>

                  {/* Joined */}
                  <td className="text-text-muted text-xs">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
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
