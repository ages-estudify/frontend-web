import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { UserFormSheet } from '@/components/users/UserFormSheet';
import { initialUserFormState } from '@/components/users/user-form.constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Title } from '@/components/title';
import { createUser, deleteUser, getUsers, updateUser } from '@/services/user.service';
import type { CreateUserPayload, UpdateUserPayload, User, UserFormData } from '@/types/user.types';
import { formatApiError } from '@/utils/api-error';

const UI_PAGE_SIZE = 20;

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function buildCreatePayload(formData: UserFormData): CreateUserPayload {
  return {
    fullName: formData.full_name.trim(),
    email: formData.email.trim(),
    password: formData.password,
    phone: formData.phone_number.trim(),
    birthDate: formData.birth_date,
  };
}

function buildUpdateDiff(original: User, formData: UserFormData): UpdateUserPayload {
  const payload: UpdateUserPayload = {};

  const fullName = formData.full_name.trim();
  if (fullName && fullName !== (original.full_name ?? '')) payload.fullName = fullName;

  const email = formData.email.trim();
  if (email && email !== (original.email ?? '')) payload.email = email;

  const phone = formData.phone_number.trim();
  if (phone && phone !== (original.phone_number ?? '')) payload.phone = phone;

  if (formData.role && formData.role !== (original.role ?? '')) payload.role = formData.role;

  const originalPlanDate = original.plan_end_date ? original.plan_end_date.split('T')[0] : '';
  if (formData.plan_end_date !== originalPlanDate) {
    payload.planEndDate = formData.plan_end_date
      ? new Date(formData.plan_end_date).toISOString()
      : undefined;
  }

  if (formData.desired_course.trim() !== (original.desired_course ?? ''))
    payload.desiredCourse = formData.desired_course.trim() || undefined;

  if (formData.desired_university.trim() !== (original.desired_university ?? ''))
    payload.desiredUniversity = formData.desired_university.trim() || undefined;

  if (
    formData.preferred_language &&
    formData.preferred_language !== (original.preferred_language ?? '')
  )
    payload.preferredLanguage = formData.preferred_language;

  const originalBirthDate = original.birth_date ? original.birth_date.split('T')[0] : '';
  if (formData.birth_date && formData.birth_date !== originalBirthDate)
    payload.birthDate = formData.birth_date;

  const streak = formData.streak.trim() ? Number(formData.streak) : undefined;
  if (streak !== undefined && !Number.isNaN(streak) && streak !== (original.streak ?? 0))
    payload.streak = streak;

  const coins = formData.coins.trim() ? Number(formData.coins) : undefined;
  if (coins !== undefined && !Number.isNaN(coins) && coins !== (original.coins ?? 0))
    payload.coins = coins;

  return payload;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialUserFormState);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [submitError, setSubmitError] = useState('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const roleOptions = useMemo(() => {
    const roles = users.map((user) => user.role).filter(Boolean) as string[];
    return Array.from(new Set(roles)).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        user.full_name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue);

      const matchesRole = !selectedRole || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, search, selectedRole]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / UI_PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * UI_PAGE_SIZE;
    return filteredUsers.slice(start, start + UI_PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const paginationLabel = useMemo(() => {
    if (filteredUsers.length === 0) return 'Mostrando usuário 0–0 de 0';
    const start = (currentPage - 1) * UI_PAGE_SIZE + 1;
    const end = Math.min(currentPage * UI_PAGE_SIZE, filteredUsers.length);
    return `Mostrando usuário ${start.toLocaleString('pt-BR')}–${end.toLocaleString('pt-BR')} de ${filteredUsers.length.toLocaleString('pt-BR')}`;
  }, [currentPage, filteredUsers.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole]);

  const handleOpenCreateSheet = () => {
    setFormMode('create');
    setSelectedUser(null);
    setFormData(initialUserFormState);
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleOpenEditSheet = (user: User) => {
    setFormMode('edit');
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number ?? '',
      role: user.role,
      plan_end_date: user.plan_end_date ? user.plan_end_date.split('T')[0] : '',
      preferred_language: user.preferred_language ?? '',
      desired_course: user.desired_course ?? '',
      desired_university: user.desired_university ?? '',
      birth_date: user.birth_date ? user.birth_date.split('T')[0] : '',
      streak: String(user.streak ?? 0),
      coins: String(user.coins ?? 0),
    });
    setSubmitError('');
    setIsFormSheetOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    const confirmed = window.confirm('Deseja realmente excluir esse usuário?');
    if (!confirmed) return;

    try {
      await deleteUser(id);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const handleSubmitForm = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');

      if (formMode === 'create') {
        await createUser(buildCreatePayload(data));
      } else if (selectedUser) {
        const diff = buildUpdateDiff(selectedUser, data);
        if (Object.keys(diff).length > 0) {
          await updateUser(selectedUser.id, diff);
        }
      }

      setIsFormSheetOpen(false);
      setSelectedUser(null);
      setFormData(initialUserFormState);
      await loadUsers();
      setCurrentPage(1);
    } catch (error) {
      setSubmitError(formatApiError(error, 'Não foi possível salvar o usuário.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <Title title="Gestão de Usuários" subtitle="Gerencie todos os usuários do Estudify" />

        <section className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="h-12 rounded-xl border-[#E5E7EB] bg-[#F8FAFC] pl-10"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="h-12 min-w-[180px] rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 text-sm outline-none"
              >
                <option value="">Todos os cargos</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              onClick={handleOpenCreateSheet}
              className="h-11 rounded-xl bg-[#A21CAF] px-5 text-white hover:bg-[#86198F]"
            >
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2200px] border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Nome Completo
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    E-mail
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Telefone
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Cargo
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Fim do Plano
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Streak
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Moedas
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Criado em
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Curso Desejado
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Universidade Desejada
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Idioma
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Último Acesso
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={14} className="px-5 py-10 text-center text-sm text-[#64748B]">
                      Carregando usuários...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-5 py-10 text-center text-sm text-[#64748B]">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#E5E7EB] last:border-b-0">
                      <td className="max-w-[200px] px-5 py-4 text-sm font-medium text-[#0F172A]">
                        <span className="line-clamp-1">{user.full_name}</span>
                      </td>

                      <td className="max-w-[220px] px-5 py-4 text-sm text-[#475569]">
                        <span className="line-clamp-1">{user.email}</span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {user.phone_number ?? '-'}
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {formatDate(user.plan_end_date)}
                      </td>

                      <td className="px-5 py-4">
                        <EnableBadge enabled={user.enable} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">{user.streak ?? 0}</td>

                      <td className="px-5 py-4 text-sm text-[#475569]">{user.coins ?? 0}</td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="max-w-[160px] px-5 py-4 text-sm text-[#475569]">
                        <span className="line-clamp-1">{user.desired_course ?? '-'}</span>
                      </td>

                      <td className="max-w-[160px] px-5 py-4 text-sm text-[#475569]">
                        <span className="line-clamp-1">{user.desired_university ?? '-'}</span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {user.preferred_language ?? '-'}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#475569]">
                        {formatDate(user.last_active)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSheet(user)}
                            className="text-[#0F172A] transition hover:opacity-70"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-[#EF4444] transition hover:opacity-70"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-sm text-[#64748B]">{paginationLabel}</p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-[#E5E7EB]"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-[#E5E7EB]"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        </section>
      </div>

      <UserFormSheet
        open={isFormSheetOpen}
        onOpenChange={(open) => {
          setIsFormSheetOpen(open);
          if (!open) {
            setSelectedUser(null);
            setFormData(initialUserFormState);
            setSubmitError('');
          }
        }}
        mode={formMode}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmitForm}
      />
    </>
  );
}

type RoleBadgeProps = { role: string };

function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role?.toUpperCase() === 'ADMIN';
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        isAdmin
          ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]'
          : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
      }`}
    >
      {role}
    </span>
  );
}

type EnableBadgeProps = { enabled: boolean };

function EnableBadge({ enabled }: EnableBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        enabled
          ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]'
          : 'border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]'
      }`}
    >
      {enabled ? 'Ativo' : 'Inativo'}
    </span>
  );
}
