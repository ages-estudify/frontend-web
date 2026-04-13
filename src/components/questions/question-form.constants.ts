import type { QuestionFormData } from '@/types/question.types';

export const initialQuestionFormState: QuestionFormData = {
  discipline: '',
  content: '',
  question: '',
  alternativeA: '',
  alternativeB: '',
  alternativeC: '',
  alternativeD: '',
  alternativeE: '',
  correctAnswer: 'A',
  answerExplanation: '',
  type: 'Original',
  year: '',
  mockExamId: '',
};
