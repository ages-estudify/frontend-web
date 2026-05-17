import { ExamCard } from '@/components/examsCards';
import { Title } from '@/components/title';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';

export function ExamsPage() {
  const [search, setSearch] = useState('');

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <Title
          title="Gestão de Simulados"
          subtitle="Organize as trilhas de aprendizado e a ordem das questões"
        />
        <button
          onClick={() => {}}
          className="bg-[#9810FA] h-[36px] w-[143px] text-[#FFFFFF] text-[14px] rounded-[8px]"
        >
          + Novo Simulado
        </button>
      </div>

      {/* arrumar o botao */}
      <div className="flex flex-row items-center justify-between">
        <div className="h-[36px] w-[565px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar questões..."
              className="h-[36px] rounded-xl border-[#E5E7EB] bg-[#F8FAFC] pl-10"
            />
          </div>
        </div>

        <button
          onClick={() => {}}
          className="bg-[#FFFFFF] h-[36px] w-[143px] text-[#0A0A0A] text-[14px] rounded-[8px]"
        >
          Todas as categorias
        </button>
      </div>

      <ExamCard
        logoSrc="/enem-logo.svg"
        logoAlt="Logo ENEM"
        title="Simulado ENEM | Janeiro - 2021"
        metadata={['75 questões', 'ENEM', 'Dia 1']}
        questions={[
          {
            id: '1',
            title: 'Interpretação de texto sobre Machado de Assis...',
          },
          {
            id: '2',
            title: 'Análise de poema de Carlos Drummond...',
          },
          {
            id: '3',
            title: 'Compreensão de texto jornalístico...',
          },
        ]}
        labels={{
          expand: 'Expandir',
          collapse: 'Recolher',
          questionsTitle: 'Questões neste simulado:',
          addQuestion: 'Adicionar Questão',
          editAriaLabel: 'Editar simulado',
          deleteAriaLabel: 'Excluir simulado',
          deleteQuestionAriaLabel: 'Excluir questão',
        }}
        onEdit={() => console.log('editar')}
        onDelete={() => console.log('excluir simulado')}
        onAddQuestion={() => console.log('adicionar questão')}
        onDeleteQuestion={(questionId) => console.log('excluir questão', questionId)}
      />
    </>
  );
}
