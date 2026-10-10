import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="UPDATE CLEARANCE PASSCODE // FORM CRB-PWD"
      
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-[#B3261E] rounded-xs font-typewriter text-xs text-[#B3261E]">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
            Current Passcode
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter current password"
              className="w-full px-3 py-1.5 pr-8 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#7A7A7A]"
            >
              {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
            New Passcode (Min 8 chars)
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter new password (min 8 chars)"
              className="w-full px-3 py-1.5 pr-8 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#7A7A7A]"
            >
              {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
            Confirm New Passcode
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="Repeat new password"
            className="w-full px-3 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-typewriter text-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none focus:border-[#B08D3C]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D8D2C2] dark:border-[#383C45]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 border border-[#D8D2C2] dark:border-[#383C45] rounded-xs text-xs font-typewriter text-[#7A7A7A] hover:bg-[#EFE9DC] dark:hover:bg-[#252830]"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs flex items-center gap-1.5 shadow-xs transition-fast disabled:opacity-50"
          >
            {loading && <Loader2 size={13} className="animate-spin text-[#B08D3C]" />}
            <span>UPDATE PASSCODE</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
