export type QuestionOrigin = 'ORIGINAL' | 'EXTERNAL';

export type QuestionAlternativeLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestionAlternative {
  id?: string;
  letter: QuestionAlternativeLetter;
  text: string;
  is_correct: boolean;
  question_id?: string;
}

export interface QuestionSubject {
  id: string;
  name: string;
  icon_url: string;
}

export interface QuestionPath {
  id: string;
  name: string;
  text: string;
  icon_url: string;
  schedule_position: number;
  trail_position: number;
  subject_id: string;
  subject: QuestionSubject;
}

export interface QuestionExam {
  id: string;
  name: string;
  origin: QuestionOrigin;
  image_url: string;
}

export interface Question {
  id: string;
  text: string;
  origin: QuestionOrigin;
  year: number;
  feedback: string | null;
  day: number | null;
  number: number | null;
  language: string | null;
  image: string | null;
  enable: boolean;
  path_id: string;
  exam_id: string | null;
  alternatives: QuestionAlternative[];
  path: QuestionPath;
  exam: QuestionExam | null;
}

export interface QuestionsListResponse {
  content: Question[];
  page: number;
  size: number;
  totalElements: number;
}

export type AdminQuestionType = 'SIMPLIFIED' | 'ORIGINAL';

export interface AdminQuestionAlternatives {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

export interface AdminQuestionApi {
  id: string;
  discipline: string;
  content: string;
  question: string;
  alternatives?: AdminQuestionAlternatives;
  correctAnswer?: string;
  answerExplanation?: string;
  type?: AdminQuestionType;
  mockExamId?: string | null;
  enable?: boolean;
  year: number;
  number?: number | null;
  bank?: string | null;
  createdAt?: string;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
}

export interface AdminQuestion {
  id: string;
  discipline: string;
  content: string;
  question: string;
  mockExamId: string | null;
  enable: boolean;
  year: number;
  bank: string | null;
  createdAt?: string;
}

export interface AdminQuestionsListResponse {
  content: AdminQuestionApi[];
  page: number;
  size: number;
  totalElements: number;
}

export interface QuestionsFilters {
  path_id?: string;
  exam_id?: string;
  mockExamId?: string;
  discipline?: string;
  content?: string;
  bank?: string;
  origin?: QuestionOrigin | '';
  year?: number | '';
  enable?: 'true' | 'false';
  page?: number;
  size?: number;
}

// export interface QuestionsApiResponse {
//   success: boolean;
//   data: QuestionsListResponse;
// }

export interface QuestionByIdApiResponse {
  success: boolean;
  data: Question;
}

export interface QuestionPathsApiResponse {
  success: boolean;
  data: QuestionPath[];
}

export interface QuestionExamsApiResponse {
  success: boolean;
  data: QuestionExam[];
}

export interface CreateQuestionPayload {
  path_id: string;
  exam_id: string | null;
  text: string;
  feedback: string | null;
  image: File | string | null;
  number: number | null;
  year: number;
  day: number | null;
  language: string | null;
  origin: QuestionOrigin;
  alternatives: QuestionAlternative[];
}

export interface UpdateQuestionPayload {
  path_id: string;
  exam_id: string | null;
  text: string;
  feedback: string | null;
  image: File | string | null;
  number: number | null;
  year: number;
  day: number | null;
  language: string | null;
  origin: QuestionOrigin;
  enable: boolean;
  alternatives: QuestionAlternative[];
}

export interface QuestionFormData {
  path_id: string;
  exam_id: string;
  text: string;
  feedback: string;
  image: string;
  number: string;
  year: string;
  day: string;
  language: string;
  origin: QuestionOrigin;
  enable: boolean;
  alternativeA: string;
  alternativeB: string;
  alternativeC: string;
  alternativeD: string;
  alternativeE: string;
  correctAlternative: QuestionAlternativeLetter;
}

export interface ImportQuestionsResponse {
  success: boolean;
  data: unknown;
}
