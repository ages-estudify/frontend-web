import { AlertCircle, BarChart3, ClipboardList, Users, type LucideIcon } from 'lucide-react';

import {
  DashboardSummaryCardType,
  type DashboardSummaryCardType as DashboardSummaryCardTypeValue,
} from './summaryCard.types';

type DashboardSummaryCardProps =
  | {
      type: typeof DashboardSummaryCardType.ActiveUsers;
      value: number;
      monthlyChange: number;
    }
  | {
      type: typeof DashboardSummaryCardType.InactiveUsers;
      value: number;
      monthlyChange?: number;
    }
  | {
      type: typeof DashboardSummaryCardType.TotalSimulations;
      value: number;
      monthlyChange?: never;
    }
  | {
      type: typeof DashboardSummaryCardType.TotalQuestions;
      value: number;
      monthlyChange?: never;
    };

type CardConfig = {
  title: string;
  icon: LucideIcon;
  cardWidth: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  changeColor?: string;
};

const cardConfig: Record<DashboardSummaryCardTypeValue, CardConfig> = {
  [DashboardSummaryCardType.ActiveUsers]: {
    title: 'Total de usuários ativos',
    icon: Users,
    cardWidth: 'w-[400px]',
    iconBg: 'bg-[#D9B9E8]',
    iconColor: 'text-[#3E2B5C]',
    valueColor: 'text-[#4AA33D]',
    changeColor: 'text-[#4AA33D]',
  },
  [DashboardSummaryCardType.InactiveUsers]: {
    title: 'Total de usuários inativos',
    icon: AlertCircle,
    cardWidth: 'w-[400px]',
    iconBg: 'bg-[#F9DCDC]',
    iconColor: 'text-[#D93A42]',
    valueColor: 'text-[#D93A42]',
    changeColor: 'text-[#D93A42]',
  },
  [DashboardSummaryCardType.TotalSimulations]: {
    title: 'Total simulados',
    icon: ClipboardList,
    cardWidth: 'w-[280px]',
    iconBg: 'bg-[#D9B9E8]',
    iconColor: 'text-[#3E2B5C]',
    valueColor: 'text-black',
  },
  [DashboardSummaryCardType.TotalQuestions]: {
    title: 'Total questões',
    icon: BarChart3,
    cardWidth: 'w-[280px]',
    iconBg: 'bg-[#D9B9E8]',
    iconColor: 'text-[#3E2B5C]',
    valueColor: 'text-black',
  },
};

export function DashboardSummaryCard(props: DashboardSummaryCardProps) {
  const config = cardConfig[props.type];
  const Icon = config.icon;

  const formattedValue = props.value.toLocaleString('pt-BR');

  const showMonthlyChange =
    props.type === DashboardSummaryCardType.ActiveUsers ||
    (props.type === DashboardSummaryCardType.InactiveUsers && props.monthlyChange !== undefined);

  return (
    <div className={`${config.cardWidth} h-[136px] rounded-2xl bg-white px-6 py-5`}>
      <div className="flex items-start justify-between">
        <p className="text-base font-medium text-[#7A7A7A]">{config.title}</p>

        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.iconBg}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} strokeWidth={2.5} />
        </div>
      </div>

      <div className="mt-6 flex items-end gap-4">
        <strong className={`text-[40px] font-bold leading-none ${config.valueColor}`}>
          {formattedValue}
        </strong>

        {showMonthlyChange && (
          <span className={`pb-1 text-base font-bold ${config.changeColor}`}>
            +{props.monthlyChange} este mês
          </span>
        )}
      </div>
    </div>
  );
}
