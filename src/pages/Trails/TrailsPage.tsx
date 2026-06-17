import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

import { TrailCard } from '@/components/trails/TrailCard';
import { TrailFormSheet } from '@/components/trails/TrailFormSheet';
import { Title } from '@/components/title';
import { Input } from '@/components/ui/input';
import { colors } from '@/constants/colors';
import {
  createTrail,
  deleteTrail,
  getTrailQuestionPaths,
  getTrailQuestions,
  getTrails,
  updateTrail,
} from '@/services/trail.service';
import type {
  Trail,
  TrailFormData,
  TrailPayload,
  TrailQuestion,
  TrailSubjectOption,
} from '@/types/trail.types';
import { formatApiError } from '@/utils/api-error';

type PageMessage = {
  type: 'success' | 'error';
  text: string;
};

function buildTrailMetadata(trail: Trail, subjectNameById: Map<string, string>): string[] {
  const subjectName = subjectNameById.get(trail.subjectId);
  return [
    `Ordem ${trail.order}`,
    subjectName ? `Disciplina ${subjectName}` : `Subject ID ${trail.subjectId}`,
  ];
}

function sortTrailsByOrder(trails: Trail[]): Trail[] {
  return [...trails].sort((first, second) => {
    if (first.order !== second.order) {
      return first.order - second.order;
    }

    return first.name.localeCompare(second.name);
  });
}

export function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingTrailId, setDeletingTrailId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [formInitialValues, setFormInitialValues] = useState<Partial<TrailFormData>>({});
  const [submitError, setSubmitError] = useState('');
  const [pageMessage, setPageMessage] = useState<PageMessage | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<TrailSubjectOption[]>([]);

  const [trailQuestionsById, setTrailQuestionsById] = useState<Record<string, TrailQuestion[]>>({});
  const [questionErrorsByTrailId, setQuestionErrorsByTrailId] = useState<Record<string, string>>(
    {}
  );
  const [loadingQuestionsTrailId, setLoadingQuestionsTrailId] = useState<string | null>(null);

  const loadTrails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTrails();
      setTrails(sortTrailsByOrder(data));
    } catch (error) {
      setPageMessage({
        type: 'error',
        text: formatApiError(error, 'Não foi possível carregar as trilhas.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSubjectOptions = useCallback(async () => {
    try {
      setIsLoadingSubjects(true);
      const paths = await getTrailQuestionPaths();
      const subjectsById = new Map<string, TrailSubjectOption>();

      paths.forEach((path) => {
        if (!path.subject) return;

        subjectsById.set(path.subject.id, {
          id: path.subject.id,
          name: path.subject.name,
        });
      });

      setSubjectOptions(
        Array.from(subjectsById.values()).sort((first, second) =>
          first.name.localeCompare(second.name)
        )
      );
    } catch (error) {
      setPageMessage({
        type: 'error',
        text: formatApiError(error, 'Não foi possível carregar as disciplinas.'),
      });
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    loadTrails();
    loadSubjectOptions();
  }, [loadTrails, loadSubjectOptions]);

  const subjectNameById = useMemo(() => {
    return new Map(subjectOptions.map((subject) => [subject.id, subject.name]));
  }, [subjectOptions]);

  const trailSubjectOptions = useMemo(() => {
    const subjects = trails.map((trail) => trail.subjectId).filter(Boolean);
    return Array.from(new Set(subjects))
      .map((subjectId) => ({
        id: subjectId,
        name: subjectNameById.get(subjectId) ?? subjectId,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [trails, subjectNameById]);

  const filteredTrails = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return trails.filter((trail) => {
      const matchesSearch = !searchValue || trail.name.toLowerCase().includes(searchValue);
      const matchesSubject = !selectedSubjectId || trail.subjectId === selectedSubjectId;

      return matchesSearch && matchesSubject;
    });
  }, [trails, search, selectedSubjectId]);

  const handleOpenCreateSheet = () => {
    setFormMode('create');
    setSelectedTrail(null);
    setFormInitialValues({});
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleOpenEditTrail = (trail: Trail) => {
    setFormMode('edit');
    setSelectedTrail(trail);
    setFormInitialValues({
      name: trail.name,
      text: trail.text,
      iconUrl: trail.iconUrl,
      order: String(trail.order),
      subjectId: trail.subjectId,
    });
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleSubmitForm = async (payload: TrailPayload) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      setPageMessage(null);

      if (formMode === 'create') {
        await createTrail(payload);
        setPageMessage({ type: 'success', text: 'Trilha criada com sucesso.' });
      } else if (selectedTrail) {
        await updateTrail(selectedTrail.id, payload);
        setPageMessage({ type: 'success', text: 'Trilha atualizada com sucesso.' });
      }

      setIsFormSheetOpen(false);
      setSelectedTrail(null);
      setFormInitialValues({});
      await loadTrails();
    } catch (error) {
      setSubmitError(formatApiError(error, 'Não foi possível salvar a trilha.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTrailQuestions = useCallback(async (trail: Trail) => {
    try {
      setLoadingQuestionsTrailId(trail.id);
      setQuestionErrorsByTrailId((current) => {
        const next = { ...current };
        delete next[trail.id];
        return next;
      });

      const questions = await getTrailQuestions(trail.id);

      setTrailQuestionsById((current) => ({
        ...current,
        [trail.id]: questions,
      }));
    } catch (error) {
      setQuestionErrorsByTrailId((current) => ({
        ...current,
        [trail.id]: formatApiError(error, 'Não foi possível carregar as questões da trilha.'),
      }));
    } finally {
      setLoadingQuestionsTrailId(null);
    }
  }, []);

  const handleExpandChange = (trail: Trail, expanded: boolean) => {
    if (expanded && !Object.prototype.hasOwnProperty.call(trailQuestionsById, trail.id)) {
      void loadTrailQuestions(trail);
    }
  };

  const handleDeleteTrail = async (trail: Trail) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a trilha "${trail.name}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setDeletingTrailId(trail.id);
      setPageMessage(null);

      await deleteTrail(trail.id);
      await loadTrails();

      setTrailQuestionsById((current) => {
        const next = { ...current };
        delete next[trail.id];
        return next;
      });
      setQuestionErrorsByTrailId((current) => {
        const next = { ...current };
        delete next[trail.id];
        return next;
      });
      setPageMessage({ type: 'success', text: 'Trilha excluída com sucesso.' });
    } catch (error) {
      setPageMessage({
        type: 'error',
        text: formatApiError(error, 'Não foi possível excluir a trilha.'),
      });
    } finally {
      setDeletingTrailId(null);
    }
  };

  return (
    <>
      <Title
        title="Gestão de Trilhas"
        subtitle="Organize trilhas de aprendizado sem vincular questões automaticamente"
        action={
          <button
            type="button"
            onClick={handleOpenCreateSheet}
            className="h-[36px] w-[132px] shrink-0 rounded-[8px] text-[14px] text-primary-foreground"
            style={{ backgroundColor: colors.buttonQuestion }}
          >
            + Nova Trilha
          </button>
        }
      />

      <div className="mt-8 flex flex-col gap-4">
        {pageMessage && (
          <p
            className={
              pageMessage.type === 'success'
                ? 'rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700'
                : 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
            }
          >
            {pageMessage.text}
          </p>
        )}

        <div className="flex flex-row items-center justify-between">
          <div className="h-[36px] w-[565px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar trilhas..."
                className="h-[36px] rounded-[8px] border border-input bg-background pl-10"
              />
            </div>
          </div>

          <div className="relative h-[36px] w-[220px]">
            <select
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              className="h-[36px] w-full appearance-none rounded-[8px] border border-input bg-background px-4 pr-10 text-[14px] text-foreground outline-none"
              disabled={isLoading}
            >
              <option value="">Todas as disciplinas</option>
              {trailSubjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando trilhas...</p>
        ) : filteredTrails.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma trilha encontrada.</p>
        ) : (
          filteredTrails.map((trail) => (
            <TrailCard
              key={trail.id}
              iconUrl={trail.iconUrl}
              iconAlt={`Ícone ${trail.name}`}
              title={trail.name}
              description={trail.text}
              metadata={buildTrailMetadata(trail, subjectNameById)}
              questions={trailQuestionsById[trail.id] ?? []}
              questionsLoaded={Object.prototype.hasOwnProperty.call(trailQuestionsById, trail.id)}
              questionsError={questionErrorsByTrailId[trail.id]}
              isLoadingQuestions={loadingQuestionsTrailId === trail.id}
              isDeleting={deletingTrailId === trail.id}
              labels={{
                expand: 'Expandir',
                collapse: 'Recolher',
                questionsTitle: 'Questões nesta trilha:',
                editAriaLabel: 'Editar trilha',
                deleteAriaLabel: 'Excluir trilha',
              }}
              onExpandChange={(expanded) => handleExpandChange(trail, expanded)}
              onEdit={() => handleOpenEditTrail(trail)}
              onDelete={() => handleDeleteTrail(trail)}
            />
          ))
        )}
      </div>

      <TrailFormSheet
        key={formMode === 'edit' ? (selectedTrail?.id ?? 'edit') : 'create'}
        open={isFormSheetOpen}
        onOpenChange={(open) => {
          setIsFormSheetOpen(open);

          if (!open) {
            setSelectedTrail(null);
            setFormInitialValues({});
            setSubmitError('');
          }
        }}
        mode={formMode}
        initialValues={formInitialValues}
        subjectOptions={subjectOptions}
        isLoadingSubjects={isLoadingSubjects}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmitForm}
      />
    </>
  );
}
