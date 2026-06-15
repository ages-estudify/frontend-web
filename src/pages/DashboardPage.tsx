import { useCallback, useEffect, useMemo, useState } from 'react';

import { DisciplineDataCard } from '@/components/dashboard/DisciplineDataCard';
import { ExamUsageCard } from '@/components/dashboard/ExamUsageCard';
import { PlanControlCard } from '@/components/dashboard/PlanControlCard';
import { DashboardSummaryCard } from '@/components/dashboard/SummaryCard';
import { DashboardSummaryCardType } from '@/components/dashboard/summaryCard.types';
import { Title } from '@/components/title';
import { getDashboard } from '@/services/dashboard.service';
import type { DashboardData } from '@/types/dashboard.types';
import { formatApiError } from '@/utils/api-error';

function mapPlans(plans: DashboardData['plans']) {
  return [
    { label: 'Trimestral', count: plans.trimestral.count },
    { label: 'Anual', count: plans.anual.count },
    { label: 'Sem Plano', count: plans.none.count },
  ];
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(formatApiError(err, 'Erro ao carregar dashboard.'));
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const plans = useMemo(() => (dashboard ? mapPlans(dashboard.plans) : []), [dashboard]);

  return (
    <div className="flex flex-col gap-8">
      <Title title="Dashboard" subtitle="Acompanhe as principais métricas do app" />

      {isLoading ? (
        <p className="text-sm text-slate-500">Carregando dashboard...</p>
      ) : error || !dashboard ? (
        <p className="text-sm text-red-600">{error || 'Erro ao carregar dashboard.'}</p>
      ) : (
        <>
          <div className="flex flex-row justify-between">
            <DashboardSummaryCard
              type={DashboardSummaryCardType.ActiveUsers}
              value={dashboard.users.active}
              monthlyChange={dashboard.users.newThisMonth}
            />

            <DashboardSummaryCard
              type={DashboardSummaryCardType.InactiveUsers}
              value={dashboard.users.inactive}
            />

            <DashboardSummaryCard
              type={DashboardSummaryCardType.TotalSimulations}
              value={dashboard.exams.total}
            />

            <DashboardSummaryCard
              type={DashboardSummaryCardType.TotalQuestions}
              value={dashboard.questions.total}
            />
          </div>

          <div className="flex flex-row justify-between gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <PlanControlCard plans={plans} />
              <ExamUsageCard examUsage={dashboard.examUsage} />
            </div>
            <DisciplineDataCard subjects={dashboard.subjects} />
          </div>
        </>
      )}
    </div>
  );
}
