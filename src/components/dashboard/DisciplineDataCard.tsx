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
    <section className="w-[1000px] rounded-[28px] bg-white px-16 py-12">
      <h2 className="mb-14 text-[24px] font-semibold text-[#5F5F5F]">Dados por Disciplina</h2>

      <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-[#E1E1E1] pb-3">
        <span className="text-sm font-medium text-[#676767]">MATÉRIA</span>

        <span className="text-sm font-medium text-[#676767]">QNT QUESTÕES</span>

        <span className="text-right text-sm font-medium text-[#676767]">ÚLTIMA ATUALIZAÇÃO</span>
      </div>

      <div className="mt-7 flex flex-col gap-6">
        {subjects.map((item) => (
          <div key={item.subject} className="grid grid-cols-[1.2fr_1fr_1fr] items-center">
            <span className="text-xl font-semibold text-black">{item.subject}</span>

            <span className="text-[16px] font-regular text-black">{item.questionCount}</span>

            <span className="text-right text-[16px] font-regular text-black">
              {formatDate(item.lastUpdated)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
