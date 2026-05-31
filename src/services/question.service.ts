import api, { handleApiError } from './api';
import { readFileAsBase64 } from '@/utils/file.utils';
import {
  buildAdminCreatePayload,
  buildAdminUpdatePayload,
  mapAdminQuestionToQuestion,
} from './question.mapper';
import type {
  AdminQuestionApi,
  AdminQuestionsListResponse,
  CreateQuestionPayload,
  ImportQuestionsResponse,
  Question,
  QuestionByIdApiResponse,
  QuestionExam,
  QuestionPath,
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

function normalizeArrayResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: T[] }).data;
    return Array.isArray(data) ? data : [];
  }

  return [];
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

async function mapQuestionsListResponse(
  adminList: AdminQuestionsListResponse
): Promise<QuestionsListResponse> {
  const paths = await getQuestionPaths();

  return {
    ...adminList,
    content: adminList.content.map((item) => mapAdminQuestionToQuestion(item, paths)),
  };
}

export const getQuestions = async (filters?: QuestionsFilters): Promise<QuestionsListResponse> => {
  try {
    const response = await api.get(QUESTIONS_BASE_PATH, {
      params: buildQuestionsParams(filters),
    });

    const adminList = normalizeAdminQuestionsList(response);
    return mapQuestionsListResponse(adminList);
  } catch (error) {
    return handleApiError(error);
  }
};

async function fetchAllAdminQuestions(filters?: QuestionsFilters): Promise<AdminQuestionApi[]> {
  let page = 0;
  let allQuestions: AdminQuestionApi[] = [];
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
): Promise<AdminQuestionApi[]> => {
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

export const getQuestionById = async (id: string): Promise<Question> => {
  try {
    const response = (await api.get(`${QUESTIONS_BASE_PATH}/${id}`)) as unknown;

    if (response && typeof response === 'object' && 'data' in response) {
      return (response as QuestionByIdApiResponse).data;
    }

    const paths = await getQuestionPaths();
    return mapAdminQuestionToQuestion(response as AdminQuestionApi, paths);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionPaths = async (): Promise<QuestionPath[]> => {
  try {
    const response = await api.get(`${QUESTIONS_BASE_PATH}/paths`);
    return normalizeArrayResponse<QuestionPath>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const getQuestionExams = async (): Promise<QuestionExam[]> => {
  try {
    const response = await api.get(`${QUESTIONS_BASE_PATH}/exams`);
    return normalizeArrayResponse<QuestionExam>(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export type CreateQuestionResult = { id: string | number };

export const createQuestion = async (
  payload: CreateQuestionPayload
): Promise<CreateQuestionResult | undefined> => {
  try {
    const paths = await getQuestionPaths();
    let adminPayload = buildAdminCreatePayload(payload, paths);

    if (payload.image && payload.image instanceof File) {
      adminPayload = {
        ...adminPayload,
        image: await readFileAsBase64(payload.image),
      };
    } else if (payload.image) {
      adminPayload = {
        ...adminPayload,
        image: payload.image,
      };
    }

    const data = await api.post(QUESTIONS_BASE_PATH, adminPayload);

    if (data && typeof data === 'object' && 'id' in data) {
      return { id: (data as { id: string | number }).id };
    }

    return undefined;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateQuestion = async (id: string, payload: UpdateQuestionPayload): Promise<void> => {
  try {
    const paths = await getQuestionPaths();
    let adminPayload = buildAdminUpdatePayload(payload, paths);

    if (payload.image && payload.image instanceof File) {
      adminPayload = {
        ...adminPayload,
        image: await readFileAsBase64(payload.image),
      };
    } else if (payload.image) {
      adminPayload = {
        ...adminPayload,
        image: payload.image,
      };
    }

    await api.put(`${QUESTIONS_BASE_PATH}/${id}`, adminPayload);
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
