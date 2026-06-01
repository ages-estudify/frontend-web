import type {
  AdminQuestionAlternatives,
  AdminQuestionApi,
  AdminQuestionType,
  CreateQuestionPayload,
  Question,
  QuestionAlternativeLetter,
  QuestionOrigin,
  QuestionPath,
  UpdateQuestionPayload,
} from '@/types/question.types';

const LETTERS: QuestionAlternativeLetter[] = ['A', 'B', 'C', 'D', 'E'];

export function adminTypeToOrigin(type?: AdminQuestionType): QuestionOrigin {
  return type === 'SIMPLIFIED' ? 'EXTERNAL' : 'ORIGINAL';
}

export function originToAdminType(origin: QuestionOrigin): AdminQuestionType {
  return origin === 'EXTERNAL' ? 'SIMPLIFIED' : 'ORIGINAL';
}

function findPathForAdminQuestion(
  admin: Pick<AdminQuestionApi, 'discipline' | 'content' | 'question'>,
  paths: QuestionPath[]
): QuestionPath | undefined {
  if (admin.discipline && admin.content) {
    const exactMatch = paths.find(
      (path) => path.name === admin.content && path.subject?.name === admin.discipline
    );
    if (exactMatch) return exactMatch;
  }

  if (admin.content) {
    const contentMatches = paths.filter((path) => path.name === admin.content);
    if (contentMatches.length === 1) return contentMatches[0];
  }

  const questionText = admin.question ?? '';
  let bestMatch: QuestionPath | undefined;
  let bestLength = 0;

  for (const path of paths) {
    if (!path.name) continue;

    if (questionText.includes(path.name) && path.name.length > bestLength) {
      bestMatch = path;
      bestLength = path.name.length;
    }
  }

  return bestMatch;
}

function buildAlternativesArray(
  alternatives?: AdminQuestionAlternatives,
  correctAnswer?: string
): Question['alternatives'] {
  const correct = (correctAnswer ?? '').trim().toUpperCase();

  return LETTERS.map((letter) => ({
    letter,
    text: alternatives?.[letter] ?? '',
    is_correct: letter === correct,
  }));
}

function buildAlternativesObject(alternatives: CreateQuestionPayload['alternatives']) {
  const byLetter = alternatives.reduce<AdminQuestionAlternatives>(
    (acc, alternative) => ({
      ...acc,
      [alternative.letter]: alternative.text,
    }),
    { A: '', B: '', C: '', D: '', E: '' }
  );

  return {
    A: byLetter.A ?? '',
    B: byLetter.B ?? '',
    C: byLetter.C ?? '',
    D: byLetter.D ?? '',
    E: byLetter.E ?? '',
  };
}

function getCorrectAnswerLetter(alternatives: CreateQuestionPayload['alternatives']): string {
  return alternatives.find((alternative) => alternative.is_correct)?.letter ?? 'A';
}

function resolveAdminQuestionImage(
  admin: Pick<AdminQuestionApi, 'image' | 'imageUrl' | 'image_url'>
): string | null {
  const value = admin.image ?? admin.imageUrl ?? admin.image_url;

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapAdminQuestionToQuestion(
  admin: AdminQuestionApi,
  paths: QuestionPath[]
): Question {
  const matchedPath = findPathForAdminQuestion(admin, paths);
  const discipline = admin.discipline || matchedPath?.subject?.name || '-';
  const content = admin.content || matchedPath?.name || '-';

  const fallbackPath: QuestionPath = matchedPath ?? {
    id: '',
    name: content,
    text: '',
    icon_url: '',
    schedule_position: 0,
    trail_position: 0,
    subject_id: '',
    subject: {
      id: '',
      name: discipline,
      icon_url: '',
    },
  };

  return {
    id: admin.id,
    text: admin.question ?? '',
    origin: adminTypeToOrigin(admin.type),
    year: admin.year,
    feedback: admin.answerExplanation ?? null,
    day: null,
    number: admin.number ?? null,
    language: null,
    image: resolveAdminQuestionImage(admin),
    enable: admin.enable ?? true,
    path_id: matchedPath?.id ?? '',
    exam_id: admin.mockExamId ?? null,
    alternatives: buildAlternativesArray(admin.alternatives, admin.correctAnswer),
    path: matchedPath ?? fallbackPath,
    exam: null,
  };
}

export function buildAdminCreatePayload(
  payload: CreateQuestionPayload,
  paths: QuestionPath[]
): Record<string, unknown> {
  const path = paths.find((item) => item.id === payload.path_id);

  if (!path) {
    throw new Error('Trilha não encontrada.');
  }

  return {
    discipline: path.subject.name,
    content: path.name,
    question: payload.text,
    alternatives: buildAlternativesObject(payload.alternatives),
    correctAnswer: getCorrectAnswerLetter(payload.alternatives),
    answerExplanation: payload.feedback || 'Sem explicação informada.',
    type: originToAdminType(payload.origin),
    year: payload.year,
    pathId: path.id,
    mockExamId: payload.exam_id || undefined,
  };
}

export function buildAdminUpdatePayload(
  payload: UpdateQuestionPayload,
  paths: QuestionPath[]
): Record<string, unknown> {
  const path = paths.find((item) => item.id === payload.path_id);

  if (!path) {
    throw new Error('Trilha não encontrada.');
  }

  return {
    discipline: path.subject.name,
    content: path.name,
    question: payload.text,
    alternatives: buildAlternativesObject(payload.alternatives),
    correctAnswer: getCorrectAnswerLetter(payload.alternatives),
    answerExplanation: payload.feedback || 'Sem explicação informada.',
    type: originToAdminType(payload.origin),
    year: payload.year,
    pathId: path.id,
    mockExamId: payload.exam_id || null,
    enable: payload.enable,
  };
}
