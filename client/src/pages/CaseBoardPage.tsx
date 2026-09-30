import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Criminal, Police } from '../types';
import { CaseBoard } from '../components/board/CaseBoard';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';

export const CaseBoardPage: React.FC = () => {
  const [criminals, setCriminals] = useState<Criminal[]>([]);
  const [officers, setOfficers] = useState<Police[]>([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [crmRes, offRes] = await Promise.all([
        api.getCriminals({ limit: 100 }),
        api.getPoliceList({ limit: 100 }),
      ]);
      setCriminals(crmRes.data);
      setOfficers(offRes.data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load case files for board');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <CaseBoard criminals={criminals} officers={officers} loading={loading} />
    </div>
  );
};
