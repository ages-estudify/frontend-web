export type DashboardEngagementPeriod = {
  count: number;
  percentage: number;
};

export type DashboardPlanItem = {
  count: number;
  percentage: number;
};

export type DashboardExamUsageSeriesItem = {
  weekStart: string;
  averageTimeSeconds: number;
};

export type DashboardSubject = {
  subject: string;
  questionCount: number;
  answerCount: number;
  lastUpdated: string;
};

export type DashboardData = {
  users: {
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  exams: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  questions: {
    total: number;
  };
  engagement: {
    totalUsers: number;
    last7Days: DashboardEngagementPeriod;
    last30Days: DashboardEngagementPeriod;
  };
  plans: {
    trimestral: DashboardPlanItem;
    anual: DashboardPlanItem;
    none: DashboardPlanItem;
  };
  examUsage: {
    averageTimeSeconds: number;
    series: DashboardExamUsageSeriesItem[];
  };
  subjects: DashboardSubject[];
};

export type DashboardApiResponse = {
  data: DashboardData;
};
