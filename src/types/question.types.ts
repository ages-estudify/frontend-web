export type QuestionAlternativeKey = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestionAlternatives {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

export type QuestionType = 'Simplified' | 'Original';

export interface Question {
  id: string;
  discipline: string;
  content: string;
  question: string;
  alternatives: QuestionAlternatives;
  correctAnswer: QuestionAlternativeKey;
  answerExplanation: string;
  type: QuestionType;
  year: number;
  mockExamId: string | null;
  enable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionsListResponse {
  content: Question[];
  page: number;
  size: number;
  totalElements: number;
}

export interface QuestionsFilters {
  discipline?: string;
  content?: string;
  type?: QuestionType | '';
  year?: number | '';
  mockExamId?: string;
  page?: number;
  size?: number;
}

export interface CreateQuestionPayload {
  discipline: string;
  content: string;
  question: string;
  alternatives: QuestionAlternatives;
  correctAnswer: QuestionAlternativeKey;
  answerExplanation: string;
  type: QuestionType;
  year: number;
  mockExamId: string | null;
}

export interface UpdateQuestionPayload {
  discipline: string;
  content: string;
  question: string;
  alternatives: QuestionAlternatives;
  correctAnswer: QuestionAlternativeKey;
  answerExplanation: string;
  type: QuestionType;
  year: number;
  mockExamId: string | null;
}

export interface CreateQuestionResponse {
  id: string;
  message: string;
}

export interface ImportQuestionsResponseItem {
  row: number;
  success: boolean;
  message: string;
  question?: string;
}

export interface ImportQuestionsResponse {
  message: string;
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  results: ImportQuestionsResponseItem[];
}

export interface QuestionFormData {
  discipline: string;
  content: string;
  question: string;
  alternativeA: string;
  alternativeB: string;
  alternativeC: string;
  alternativeD: string;
  alternativeE: string;
  correctAnswer: QuestionAlternativeKey;
  answerExplanation: string;
  type: QuestionType;
  year: string;
  mockExamId: string;
}
