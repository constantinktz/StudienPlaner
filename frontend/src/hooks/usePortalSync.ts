import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { ModuleSyncResult } from '@/types/modules';

export function usePortalSync() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ModuleSyncResult>('/api/portal/sync');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'modules'] });
      qc.invalidateQueries({ queryKey: ['planner', 'recommendations'] });
      toast.success('Synchronisierung erfolgreich');
    },
    onError: () => {
      toast.error('Synchronisierung fehlgeschlagen');
    },
  });
}
