type PlanControlItem = {
  label: string;
  count: number;
};

type PlanControlCardProps = {
  plans: PlanControlItem[];
};

function getPercentage(value: number, total: number) {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}

export function PlanControlCard({ plans }: PlanControlCardProps) {
  const total = plans.reduce((acc, plan) => acc + plan.count, 0);

  return (
    <section className="w-full rounded-[24px] bg-white px-7 py-7">
      <h2 className="mb-[27px] text-2xl font-semibold text-[#646464]">Controle de Planos</h2>

      <div className="flex flex-col gap-5">
        {plans.map((plan) => {
          const percentage = getPercentage(plan.count, total);

          return (
            <div key={plan.label} className="grid grid-cols-[1fr_auto_48px] items-center gap-6">
              <span className="text-2xl font-semibold text-black">{plan.label}</span>

              <strong className="text-2xl font-bold text-black">{plan.count}</strong>

              <span className="text-right text-base font-semibold text-[#5C5C5C]">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
