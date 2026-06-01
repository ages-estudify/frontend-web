import { describe, expect, it } from 'vitest';

import {
  buildAdminCreatePayload,
  mapAdminQuestionToQuestion,
  originToAdminType,
} from '@/services/question.mapper';
import type { CreateQuestionPayload, QuestionPath } from '@/types/question.types';

const mockPath: QuestionPath = {
  id: 'path-1',
  name: 'Álgebra',
  text: '',
  icon_url: '',
  schedule_position: 0,
  trail_position: 1,
  subject_id: 'sub-1',
  subject: { id: 'sub-1', name: 'Matemática', icon_url: '' },
};

describe('question.mapper', () => {
  it('mapeia questão admin para o formato da UI', () => {
    const mapped = mapAdminQuestionToQuestion(
      {
        id: 'q-1',
        discipline: 'Matemática',
        content: 'Álgebra',
        question: 'Qual é o valor de x?',
        alternatives: { A: '1', B: '2', C: '3', D: '4', E: '5' },
        correctAnswer: 'C',
        answerExplanation: 'Explicação',
        type: 'ORIGINAL',
        year: 2024,
        mockExamId: null,
        enable: true,
      },
      [mockPath]
    );

    expect(mapped.text).toBe('Qual é o valor de x?');
    expect(mapped.path_id).toBe('path-1');
    expect(mapped.path.name).toBe('Álgebra');
    expect(mapped.path.subject.name).toBe('Matemática');
  });

  it('mapeia image, imageUrl e image_url da API admin', () => {
    const withImage = mapAdminQuestionToQuestion(
      {
        id: 'q-img',
        discipline: 'Matemática',
        content: 'Álgebra',
        question: 'Com imagem',
        year: 2024,
        imageUrl: 'https://cdn.example.com/q.png',
      },
      [mockPath]
    );

    expect(withImage.image).toBe('https://cdn.example.com/q.png');

    const withSnakeCase = mapAdminQuestionToQuestion(
      {
        id: 'q-img-2',
        discipline: 'Matemática',
        content: 'Álgebra',
        question: 'Com imagem snake',
        year: 2024,
        image_url: 'https://cdn.example.com/q2.png',
      },
      [mockPath]
    );

    expect(withSnakeCase.image).toBe('https://cdn.example.com/q2.png');

    const withoutImage = mapAdminQuestionToQuestion(
      {
        id: 'q-no-img',
        discipline: 'Matemática',
        content: 'Álgebra',
        question: 'Sem imagem',
        year: 2024,
      },
      [mockPath]
    );

    expect(withoutImage.image).toBeNull();
  });

  it('monta payload admin no create', () => {
    const payload: CreateQuestionPayload = {
      path_id: 'path-1',
      exam_id: null,
      text: 'Enunciado teste',
      feedback: 'Feedback',
      image: null,
      number: 1,
      year: 2024,
      day: null,
      language: null,
      origin: 'ORIGINAL',
      alternatives: [
        { letter: 'A', text: 'A', is_correct: false },
        { letter: 'B', text: 'B', is_correct: true },
        { letter: 'C', text: 'C', is_correct: false },
        { letter: 'D', text: 'D', is_correct: false },
        { letter: 'E', text: 'E', is_correct: false },
      ],
    };

    const adminPayload = buildAdminCreatePayload(payload, [mockPath]);

    expect(adminPayload).toMatchObject({
      discipline: 'Matemática',
      content: 'Álgebra',
      question: 'Enunciado teste',
      correctAnswer: 'B',
      type: originToAdminType('ORIGINAL'),
      pathId: 'path-1',
    });
  });

  it('resolve trilha pelo nome no enunciado quando discipline/content estão vazios', () => {
    const mapped = mapAdminQuestionToQuestion(
      {
        id: 'q-2',
        discipline: '',
        content: '',
        question: 'Questão ORIGINAL sobre Geometria: Qual dos seguintes conceitos é fundamental?',
        alternatives: { A: '1', B: '2', C: '3', D: '4', E: '5' },
        correctAnswer: 'A',
        type: 'ORIGINAL',
        year: 2024,
        mockExamId: null,
        enable: true,
      },
      [
        mockPath,
        {
          ...mockPath,
          id: 'path-geo',
          name: 'Geometria',
          trail_position: 3,
          subject: { id: 'sub-1', name: 'Matemática', icon_url: '' },
        },
      ]
    );

    expect(mapped.path.name).toBe('Geometria');
    expect(mapped.path.subject.name).toBe('Matemática');
    expect(mapped.path_id).toBe('path-geo');
  });
});
