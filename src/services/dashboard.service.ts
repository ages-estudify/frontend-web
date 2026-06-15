import api, { handleApiError } from './api';
import type { DashboardApiResponse, DashboardData } from '@/types/dashboard.types';

const DASHBOARD_BASE_PATH = '/admin/dashboard';

/** GET /admin/dashboard — métricas agregadas do painel admin. */
export const getDashboard = async (): Promise<DashboardData> => {
  try {
    const response = (await api.get(DASHBOARD_BASE_PATH)) as DashboardApiResponse;
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
