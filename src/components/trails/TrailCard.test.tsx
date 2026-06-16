import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TrailCard } from './TrailCard';
import type { TrailQuestion } from '@/types/trail.types';

const defaultLabels = {
  expand: 'Expandir',
  collapse: 'Recolher',
  questionsTitle: 'Questões nesta trilha:',
  editAriaLabel: 'Editar trilha',
  deleteAriaLabel: 'Excluir trilha',
};

const sampleQuestions: TrailQuestion[] = [
  {
    id: 'q-1',
    title: 'Qual é o valor de x?',
    discipline: 'Matemática',
    content: 'Álgebra',
    year: 2024,
  },
];

function renderCard(overrides: Partial<Parameters<typeof TrailCard>[0]> = {}) {
  return render(
    <TrailCard
      iconUrl=""
      iconAlt="Ícone Álgebra"
      title="Álgebra"
      description="Equações e funções"
      metadata={['Ordem 1', 'Subject ID subject-math']}
      questions={sampleQuestions}
      labels={defaultLabels}
      {...overrides}
    />
  );
}

describe('TrailCard', () => {
  it('mostra questões não carregadas antes de receber contagem real', () => {
    renderCard({ questions: [] });

    expect(screen.getByText(/Questões: —/)).toBeInTheDocument();
  });

  it('mostra quantidade real quando as questões foram carregadas', () => {
    renderCard({ questions: sampleQuestions, questionsLoaded: true });

    expect(screen.getByText(/1 questão/)).toBeInTheDocument();
  });

  it('mostra 0 questões quando a trilha carregada está vazia', () => {
    renderCard({ questions: [], questionsLoaded: true });

    expect(screen.getByText(/0 questões/)).toBeInTheDocument();
  });

  it('alterna entre expandir e recolher e dispara onExpandChange', () => {
    const onExpandChange = vi.fn();
    renderCard({ onExpandChange });

    expect(screen.queryByText('Qual é o valor de x?')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));

    expect(onExpandChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Questões nesta trilha:')).toBeInTheDocument();
    expect(screen.getByText('Qual é o valor de x?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recolher' }));

    expect(onExpandChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText('Qual é o valor de x?')).not.toBeInTheDocument();
  });

  it('exibe estado de loading de questões', () => {
    renderCard({ questions: [], isLoadingQuestions: true });

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));

    expect(screen.getByText('Carregando questões...')).toBeInTheDocument();
  });

  it('exibe erro ao carregar questões', () => {
    renderCard({ questions: [], questionsError: 'Falha ao carregar questões.' });

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));

    expect(screen.getByText('Falha ao carregar questões.')).toBeInTheDocument();
  });

  it('exibe empty state quando não há questões', () => {
    renderCard({ questions: [] });

    fireEvent.click(screen.getByRole('button', { name: 'Expandir' }));

    expect(screen.getByText('Nenhuma questão nesta trilha.')).toBeInTheDocument();
  });

  it('chama ações de editar e excluir', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderCard({ onEdit, onDelete });

    fireEvent.click(screen.getByRole('button', { name: 'Editar trilha' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir trilha' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('desabilita o botão de excluir quando isDeleting está ativo', () => {
    renderCard({ isDeleting: true, onDelete: vi.fn() });

    expect(screen.getByRole('button', { name: 'Excluir trilha' })).toBeDisabled();
  });
});
