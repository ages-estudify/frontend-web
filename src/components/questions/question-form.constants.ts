import type { QuestionFormData } from '@/types/question.types';

export const initialQuestionFormState: QuestionFormData = {
  path_id: '',
  exam_id: '',
  text: '',
  feedback: '',
  image: '',
  number: '',
  year: '',
  day: '',
  language: '',
  origin: 'ORIGINAL',
  enable: true,
  alternativeA: '',
  alternativeB: '',
  alternativeC: '',
  alternativeD: '',
  alternativeE: '',
  correctAlternative: 'A',
};
