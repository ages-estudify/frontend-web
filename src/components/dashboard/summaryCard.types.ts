export const DashboardSummaryCardType = {
  ActiveUsers: 'ACTIVE_USERS',
  InactiveUsers: 'INACTIVE_USERS',
  TotalSimulations: 'TOTAL_SIMULATIONS',
  TotalQuestions: 'TOTAL_QUESTIONS',
} as const;

export type DashboardSummaryCardType =
  (typeof DashboardSummaryCardType)[keyof typeof DashboardSummaryCardType];
