import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import api from '@/services/api';
import { getDashboard } from '@/services/dashboard.service';
import type { DashboardApiResponse } from '@/types/dashboard.types';

describe('dashboard.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getDashboard chama GET em /admin/dashboard e retorna data', async () => {
    const response: DashboardApiResponse = {
      data: {
        users: {
          active: 1234,
          inactive: 132,
          newThisMonth: 14,
        },
        exams: {
          total: 14,
          published: 12,
          draft: 2,
          archived: 0,
        },
        questions: {
          total: 152,
        },
        engagement: {
          totalUsers: 1366,
          last7Days: { count: 80, percentage: 6 },
          last30Days: { count: 410, percentage: 30 },
        },
        plans: {
          trimestral: { count: 40, percentage: 3 },
          anual: { count: 25, percentage: 2 },
          none: { count: 1301, percentage: 95 },
        },
        examUsage: {
          averageTimeSeconds: 9480,
          series: [{ weekStart: '2026-04-20', averageTimeSeconds: 8200 }],
        },
        subjects: [
          {
            subject: 'Química',
            questionCount: 92,
            answerCount: 1840,
            lastUpdated: '2026-06-09T14:32:00.000Z',
          },
        ],
      },
    };

    vi.spyOn(api, 'get').mockResolvedValue(response);

    const dashboard = await getDashboard();

    expect(api.get).toHaveBeenCalledWith('/admin/dashboard');
    expect(dashboard.users.active).toBe(1234);
    expect(dashboard.plans.trimestral.count).toBe(40);
    expect(dashboard.examUsage.series).toHaveLength(1);
    expect(dashboard.subjects[0].subject).toBe('Química');
  });

  it('propaga erro quando getDashboard falha', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('falha de rede'));

    await expect(getDashboard()).rejects.toThrow('falha de rede');
  });
});
