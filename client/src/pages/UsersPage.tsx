import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { UserPlus, Edit2, ShieldAlert, Key, CheckCircle, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Stamp } from '../components/common/Stamp';
import { useToast } from '../components/common/Toast';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  // Add / Edit Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'viewer' as 'admin' | 'viewer',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Toggle Confirm Dialog
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Reset Password Modal
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  const activeAdminCount = useMemo(() => {
    return users.filter((u) => u.role === 'admin' && u.is_active).length;
  }, [users]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      full_name: '',
      role: 'viewer',
      password: '',
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      password: '',
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editingUser) {
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      }
      if (!formData.password || formData.password.length < 8) {
        errors.password = 'Initial password must be at least 8 characters';
      }
    }
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (editingUser) {
        // Demote check
        if (editingUser.user_id === currentUser?.userId && formData.role !== 'admin') {
          showToast('error', 'Administrators cannot demote their own account.');
          return;
        }
        if (editingUser.role === 'admin' && formData.role !== 'admin' && activeAdminCount <= 1) {
          showToast('error', 'Cannot demote the last active administrator.');
          return;
        }

        await api.updateUser(editingUser.user_id, {
          full_name: formData.full_name.trim(),
          role: formData.role,
        });
        showToast('success', `User ${editingUser.username} successfully updated`);
      } else {
        await api.createUser({
          username: formData.username.trim(),
          full_name: formData.full_name.trim(),
          password: formData.password,
          role: formData.role,
        });
        showToast('success', `User ${formData.username.trim()} created successfully`);
      }
      setIsDrawerOpen(false);
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;

    try {
      setIsUpdatingStatus(true);
      await api.updateUser(statusTarget.user_id, {
        is_active: !statusTarget.is_active,
      });
      showToast('success', `User ${statusTarget.username} ${statusTarget.is_active ? 'deactivated' : 'activated'}`);
      setStatusTarget(null);
      loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update account status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    try {
      setIsResettingPassword(true);
      setPasswordError('');
      await api.updateUser(passwordTarget.user_id, {
        password: newPassword,
      });
      showToast('success', `Password for ${passwordTarget.username} successfully reset`);
      setPasswordTarget(null);
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'user_id',
        header: 'User ID',
        cell: (info) => (
          <span className="font-mono text-xs font-bold text-[#B08D3C]">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Username / Badge',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
              {row.original.username}
            </span>
            {row.original.user_id === currentUser?.userId && (
              <span className="font-mono text-[9px] px-1 py-0.2 bg-[#B08D3C]/20 text-[#B08D3C] border border-[#B08D3C]/40 rounded-xs">
                YOU
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Full Legal Name',
        cell: (info) => (
          <span className="font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Security Role',
        cell: (info) => {
          const role = info.getValue() as string;
          return role === 'admin' ? (
            <span className="inline-block px-1.5 py-0.5 border border-[#B3261E] text-[#B3261E] bg-[#B3261E]/10 font-typewriter text-[10px] font-bold tracking-wider uppercase rounded-xs">
              ADMIN
            </span>
          ) : (
            <span className="inline-block px-1.5 py-0.5 border border-[#1F2D3D] dark:border-[#8C9AA8] text-[#1F2D3D] dark:text-[#8C9AA8] bg-[#1F2D3D]/10 font-typewriter text-[10px] font-bold tracking-wider uppercase rounded-xs">
              VIEWER
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Account Status',
        cell: (info) => {
          const active = info.getValue() as boolean;
          return active ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#386641] bg-[#386641]/15 px-1.5 py-0.5 border border-[#386641]/40 rounded-xs">
              <CheckCircle size={10} />
              ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#B3261E] bg-[#B3261E]/15 px-1.5 py-0.5 border border-[#B3261E]/40 rounded-xs">
              <XCircle size={10} />
              DEACTIVATED
            </span>
          );
        },
      },
      {
        accessorKey: 'last_login',
        header: 'Last Authentication',
        cell: (info) => {
          const val = info.getValue() as string | null;
          return (
            <span className="font-mono text-[11px] text-[#7A7A7A]">
              {val ? new Date(val).toLocaleString() : 'Never logged in'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = u.user_id === currentUser?.userId;
          const isLastAdmin = u.role === 'admin' && u.is_active && activeAdminCount <= 1;

          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(u)}
                className="p-1 rounded-xs text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#EFE9DC] dark:hover:bg-[#2C303A] transition-fast"
                title="Edit User Particulars"
              >
                <Edit2 size={13} />
              </button>

              <button
                onClick={() => {
                  setPasswordTarget(u);
                  setNewPassword('');
                  setPasswordError('');
                }}
                className="p-1 rounded-xs text-[#B08D3C] hover:bg-[#B08D3C]/10 transition-fast"
                title="Reset Password"
              >
                <Key size={13} />
              </button>

              <button
                onClick={() => setStatusTarget(u)}
                disabled={isSelf || (isLastAdmin && u.is_active)}
                className={`p-1 rounded-xs transition-fast ${
                  isSelf || (isLastAdmin && u.is_active)
                    ? 'opacity-30 cursor-not-allowed text-[#7A7A7A]'
                    : u.is_active
                    ? 'text-[#B3261E] hover:bg-red-50 dark:hover:bg-red-950/40'
                    : 'text-[#386641] hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
                title={
                  isSelf
                    ? 'Cannot deactivate own account'
                    : isLastAdmin && u.is_active
                    ? 'Cannot deactivate last active administrator'
                    : u.is_active
                    ? 'Deactivate User'
                    : 'Activate User'
                }
              >
                {u.is_active ? <XCircle size={13} /> : <CheckCircle size={13} />}
              </button>
            </div>
          );
        },
      },
    ],
    [currentUser, activeAdminCount]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D2C2] dark:border-[#383C45]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-typewriter text-lg font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wide">
              Bureau User Roster & Clearance Management
            </h2>
            <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#B3261E]/15 text-[#B3261E] border border-[#B3261E]/40 font-bold uppercase">
              ADMINISTRATIVE REGISTER
            </span>
          </div>
          <p className="font-typewriter text-xs text-[#6B685F] dark:text-[#A09D95] mt-1">
            Manage authenticated department credentials, access tiers, and security statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-typewriter border border-[#D8D2C2] dark:border-[#383C45] bg-[#FAF7F0] dark:bg-[#252830] text-[#1F1F1F] dark:text-[#E2DFD8] hover:border-[#B08D3C] rounded-xs transition-fast"
            title="Reload User Roster"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">REFRESH</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="h-8 px-3 flex items-center gap-1.5 text-xs font-typewriter font-bold bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] rounded-xs shadow-paper transition-fast"
          >
            <UserPlus size={13} className="text-[#B08D3C]" />
            <span>CREATE USER ACCOUNT</span>
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3 bg-[#F6F0E0] dark:bg-[#1E2024] border border-[#B08D3C]/40 rounded-xs flex items-center gap-3">
        <AlertTriangle size={18} className="text-[#B08D3C] shrink-0" />
        <div className="font-typewriter text-xs text-[#6B685F] dark:text-[#A09D95]">
          <span className="font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">Bureau Safety Protocol:</span> Administrators cannot demote or deactivate their own active session. The last active administrator in the registry is permanently protected from removal.
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        emptyTitle="No personnel accounts currently registered."
      />

      {/* Add / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingUser ? `EDIT ACCOUNT // ${editingUser.username}` : 'ENROLL NEW BUREAU PERSONNEL'}
        width="max-w-md"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          {!editingUser && (
            <div className="space-y-1">
              <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
                Username / Badge ID *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. officer_deshmukh"
                className="w-full px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
              />
              {formErrors.username && (
                <p className="text-[11px] text-[#B3261E] font-mono">{formErrors.username}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
              Full Legal Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Rajesh S. Deshmukh"
              className="w-full px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
            />
            {formErrors.full_name && (
              <p className="text-[11px] text-[#B3261E] font-mono">{formErrors.full_name}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
              Security Role Tier *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
            >
              <option value="viewer">VIEWER — Read-Only Dossier Access & Reports</option>
              <option value="admin">ADMIN — Full CRUD, Console, & User Management</option>
            </select>
          </div>

          {!editingUser && (
            <div className="space-y-1">
              <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
                Initial Passcode (Min 8 chars) *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 8 characters"
                className="w-full px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
              />
              {formErrors.password && (
                <p className="text-[11px] text-[#B3261E] font-mono">{formErrors.password}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D8D2C2] dark:border-[#383C45]">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="px-3 py-1.5 border border-[#D8D2C2] dark:border-[#383C45] rounded-xs text-xs font-typewriter text-[#7A7A7A] hover:bg-[#EFE9DC] dark:hover:bg-[#252830]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs flex items-center gap-1.5 shadow-xs transition-fast disabled:opacity-50"
            >
              <span>{editingUser ? 'SAVE ACCOUNT CHANGES' : 'CREATE ACCOUNT'}</span>
            </button>
          </div>
        </form>
      </Drawer>

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        title={statusTarget?.is_active ? 'DEACTIVATE USER ACCOUNT' : 'REACTIVATE USER ACCOUNT'}
        message={`Are you sure you want to ${
          statusTarget?.is_active ? 'deactivate' : 'reactivate'
        } user "${statusTarget?.username}"? Deactivated users are rejected immediately from all operational endpoints.`}
        confirmText={statusTarget?.is_active ? 'DEACTIVATE ACCOUNT' : 'REACTIVATE ACCOUNT'}
        
        
      />

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(passwordTarget)}
        onClose={() => setPasswordTarget(null)}
        title={`RESET PASSCODE // ${passwordTarget?.username}`}
        
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {passwordError && (
            <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-[#B3261E] rounded-xs font-typewriter text-xs text-[#B3261E]">
              {passwordError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
              New Passcode for {passwordTarget?.username}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 8 characters"
              className="w-full px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D8D2C2] dark:border-[#383C45]">
            <button
              type="button"
              onClick={() => setPasswordTarget(null)}
              className="px-3 py-1.5 border border-[#D8D2C2] dark:border-[#383C45] rounded-xs text-xs font-typewriter text-[#7A7A7A]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isResettingPassword}
              className="px-4 py-1.5 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs"
            >
              CONFIRM RESET
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
