import api, { handleApiError } from './api';
import type {
  AdminQuestion,
  AdminQuestionsListResponse,
  CreateQuestionPayload,
  ImportQuestionsResponse,
  QuestionByIdApiResponse,
  QuestionExam,
  QuestionExamsApiResponse,
  QuestionPath,
  QuestionPathsApiResponse,
  QuestionsFilters,
  QuestionsListResponse,
  UpdateQuestionPayload,
} from '@/types/question.types';

const QUESTIONS_BASE_PATH = '/admin/questions';

const PAGE_SIZE = 100;

function normalizeAdminQuestionsList(response: unknown): AdminQuestionsListResponse {
  if (response && typeof response === 'object' && 'content' in response) {
    return response as AdminQuestionsListResponse;
  }

  const wrapped = response as { data?: AdminQuestionsListResponse };
  if (wrapped.data?.content) {
    return wrapped.data;
  }

  return { content: [], page: 0, size: PAGE_SIZE, totalElements: 0 };
}

const buildQuestionsParams = (filters?: QuestionsFilters) => {
  if (!filters) return {};

  return {
    mockExamId: filters.mockExamId || filters.exam_id || undefined,
    discipline: filters.discipline || undefined,
    content: filters.content || undefined,
    bank: filters.bank || undefined,
    origin: filters.origin || undefined,
    year: filters.year || undefined,
    enable: filters.enable || undefined,
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  };
};

export const getQuestions = async (filters?: QuestionsFilters): Promise<QuestionsListResponse> => {
  try {
    const response = await api.get(QUESTIONS_BASE_PATH, {
      params: buildQuestionsParams(filters),
    });

    const adminList = normalizeAdminQuestionsList(response);
    return adminList as unknown as QuestionsListResponse;
  } catch (error) {
    return handleApiError(error);
  }
};

async function fetchAllAdminQuestions(filters?: QuestionsFilters): Promise<AdminQuestion[]> {
  let page = 0;
  let allQuestions: AdminQuestion[] = [];
  let totalElements = 0;

  do {
    const response = await api.get(QUESTIONS_BASE_PATH, {
      params: {
        ...buildQuestionsParams({ ...filters, page, size: PAGE_SIZE }),
      },
    });

    const data = normalizeAdminQuestionsList(response);
    allQuestions = allQuestions.concat(data.content);
    totalElements = data.totalElements;
    page += 1;
  } while (allQuestions.length < totalElements);

  return allQuestions;
}

/** Import CSV grava questões só com exam_day_id; o filtro mockExamId usa exam_id. */
export const linkUnlinkedQuestionsToExam = async (
  examId: string,
  count: number
): Promise<number> => {
  if (count <= 0) return 0;

  const allQuestions = await fetchAllAdminQuestions({ enable: 'true' });
  const unlinked = allQuestions
    .filter((question) => !question.mockExamId)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, count);

  await Promise.all(
    unlinked.map((question) =>
      api.put(`${QUESTIONS_BASE_PATH}/${question.id}`, { mockExamId: examId })
    )
  );

  return unlinked.length;
};

export const getQuestionsByMockExamId = async (
  mockExamId: string,
  options?: { expectedCount?: number }
): Promise<AdminQuestion[]> => {
  try {
    let questions = await fetchAllAdminQuestions({
      mockExamId,
      enable: 'true',
    });

    const expectedCount = options?.expectedCount ?? 0;

    if (questions.length === 0 && expectedCount > 0) {
      const linked = await linkUnlinkedQuestionsToExam(mockExamId, expectedCount);

      if (linked > 0) {
        questions = await fetchAllAdminQuestions({
          mockExamId,
          enable: 'true',
        });
      }
    }

    return questions;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionById = async (id: string) => {
  try {
    const response = await api.get<QuestionByIdApiResponse>(`${QUESTIONS_BASE_PATH}/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionPaths = async (): Promise<QuestionPath[]> => {
  try {
    const response = (await api.get(`${QUESTIONS_BASE_PATH}/paths`)) as QuestionPathsApiResponse;
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionExams = async (): Promise<QuestionExam[]> => {
  try {
    const response = (await api.get(`${QUESTIONS_BASE_PATH}/exams`)) as QuestionExamsApiResponse;
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createQuestion = async (payload: CreateQuestionPayload): Promise<void> => {
  try {
    await api.post(QUESTIONS_BASE_PATH, payload);
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateQuestion = async (id: string, payload: UpdateQuestionPayload): Promise<void> => {
  try {
    await api.put(`${QUESTIONS_BASE_PATH}/${id}`, payload);
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    await api.delete(`${QUESTIONS_BASE_PATH}/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
};

export const importQuestions = async (file: File): Promise<ImportQuestionsResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    return await api.post(`${QUESTIONS_BASE_PATH}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
