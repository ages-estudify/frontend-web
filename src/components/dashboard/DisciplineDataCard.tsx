// components/dashboard/DisciplineDataCard.tsx

type SubjectData = {
  subject: string;
  questionCount: number;
  answerCount?: number;
  lastUpdated: string;
};

type DisciplineDataCardProps = {
  subjects: SubjectData[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export function DisciplineDataCard({ subjects }: DisciplineDataCardProps) {
  return (
    <section className="w-full min-w-0 rounded-[28px] bg-white px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
      <h2 className="mb-8 text-xl font-semibold text-[#5F5F5F] sm:mb-14 sm:text-2xl">
        Dados por Disciplina
      </h2>

      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-2 border-b border-[#E1E1E1] pb-3 sm:gap-4">
        <span className="text-xs font-medium text-[#676767] sm:text-sm">MATÉRIA</span>

        <span className="text-xs font-medium text-[#676767] sm:text-sm">QNT QUESTÕES</span>

        <span className="text-right text-xs font-medium text-[#676767] sm:text-sm">
          ÚLTIMA ATUALIZAÇÃO
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:mt-7 sm:gap-6">
        {subjects.map((item) => (
          <div
            key={item.subject}
            className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)] items-center gap-2 sm:gap-4"
          >
            <span className="truncate text-base font-semibold text-black sm:text-xl">
              {item.subject}
            </span>

            <span className="text-sm text-black sm:text-base">{item.questionCount}</span>

            <span className="text-right text-sm text-black sm:text-base">
              {formatDate(item.lastUpdated)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
