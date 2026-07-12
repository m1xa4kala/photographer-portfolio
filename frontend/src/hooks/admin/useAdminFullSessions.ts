import { useAdminCrud } from '../useAdminCrud';
import type { FullSession } from '../../types';

export const useAdminFullSessions = () => useAdminCrud<FullSession>('/admin/full-sessions');