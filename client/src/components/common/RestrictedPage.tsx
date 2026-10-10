import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Stamp } from './Stamp';
import { PushPin } from './PushPin';
import { useAuth } from '../../context/AuthContext';

export const RestrictedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#FAF7F0] dark:bg-[#1E2024] border-2 border-[#D8D2C2] dark:border-[#383C45] p-8 shadow-paper rounded-xs text-center space-y-6">
        <div className="absolute top-3 left-4">
          <PushPin color="red" size={22} />
        </div>

        <div className="flex justify-center pt-2">
          <Stamp
            text="RESTRICTED ACCESS"
            variant="classified"
            size="lg"
            rotateDeg={-3}
            animateSlam
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#B3261E]">
            <ShieldAlert size={18} />
            <h2 className="font-typewriter text-base sm:text-lg font-bold tracking-wider uppercase text-[#1F1F1F] dark:text-[#E2DFD8]">
              Security Clearance Insufficient
            </h2>
          </div>
          <p className="font-typewriter text-xs text-[#6B685F] dark:text-[#A09D95] leading-relaxed">
            This administrative register and operational console is restricted strictly to Bureau Personnel with <span className="font-bold text-[#B3261E]">ADMIN</span> security clearance.
          </p>
        </div>

        <div className="p-3 bg-[#F6F0E0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs font-mono text-xs text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-[#7A7A7A]">Authenticated User:</span>
            <span className="font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">{user?.username} ({user?.fullName})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7A7A]">Active Clearance Role:</span>
            <span className="font-bold text-[#B08D3C] uppercase">{user?.role || 'UNSPECIFIED'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#7A7A7A]">Required Level:</span>
            <span className="font-bold text-[#B3261E]">ADMINISTRATOR (FULL CRUD)</span>
          </div>
        </div>

        <div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs inline-flex items-center gap-2 shadow-xs transition-fast"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO CASE DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
