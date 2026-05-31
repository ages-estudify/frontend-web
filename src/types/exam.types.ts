export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ExamDay {
  day: number;
  totalQuestions: number;
}

export interface ExamListItem {
  id: string;
  title: string;
  origin: string;
  imageUrl?: string | null;
  totalQuestions: number;
  status: ExamStatus;
  days: ExamDay[];
}

export interface ExamsApiResponse {
  data: ExamListItem[];
}

export interface UpdateExamPayload {
  title?: string;
  origin?: string;
  image?: File | string | null;
}

export interface UpdateExamResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    origin: string;
    imageUrl?: string | null;
    status: ExamStatus;
  };
}

export interface ImportExamResponse {
  success: boolean;
  data: {
    examId: string;
    status: ExamStatus;
    daysCreated: number;
    importedQuestions: number;
    failed: number;
    errors: Array<{ line: number; error: string }>;
  };
}

export interface ExamFormData {
  name: string;
  origin: string;
  day: string;
  imageFile: File | null;
  documentFile: File | null;
  imageUrl?: string | null;
}
