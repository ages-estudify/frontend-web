import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { UserFormData } from '@/types/user.types';
import { ROLE_OPTIONS, LANGUAGE_OPTIONS } from './user-form.constants';

type UserFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  isSubmitting?: boolean;
  submitError?: string;
  onSubmit: (formData: UserFormData) => Promise<void> | void;
};

export function UserFormSheet({
  open,
  onOpenChange,
  mode,
  formData,
  setFormData,
  isSubmitting = false,
  submitError = '',
  onSubmit,
}: UserFormSheetProps) {
  const [errors, setErrors] = React.useState<Partial<Record<keyof UserFormData, string>>>({});

  const title = mode === 'create' ? 'Novo Usuário' : 'Editar Usuário';

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateField = (field: 'email' | 'password' | 'phone_number', value: string) => {
    setErrors((prev) => {
      const next = { ...prev };

      if (field === 'email') {
        const v = value.trim();
        if (!v) next.email = 'Informe o e-mail.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) next.email = 'E-mail inválido.';
        else if (v.length > 320) next.email = 'E-mail deve ter no máximo 320 caracteres.';
        else next.email = undefined;
      }

      if (field === 'password') {
        if (!value) next.password = 'Informe a senha.';
        else if (value.length < 8) next.password = 'A senha deve ter no mínimo 8 caracteres.';
        else if (value.length > 128) next.password = 'A senha deve ter no máximo 128 caracteres.';
        else next.password = undefined;
      }

      if (field === 'phone_number') {
        const v = value.trim();
        if (!v) {
          next.phone_number = mode === 'create' ? 'Informe o telefone.' : undefined;
        } else if (!/^\d+$/.test(v)) {
          next.phone_number = 'Telefone deve conter apenas dígitos.';
        } else if (v.length < 10 || v.length > 13) {
          next.phone_number = 'Informe um número válido (10 a 13 dígitos).';
        } else {
          next.phone_number = undefined;
        }
      }

      return next;
    });
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Informe o nome completo.';

    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Informe o e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido.';
    } else if (email.length > 320) {
      newErrors.email = 'E-mail deve ter no máximo 320 caracteres.';
    }

    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Informe a senha.';
      } else if (formData.password.length < 8) {
        newErrors.password = 'A senha deve ter no mínimo 8 caracteres.';
      } else if (formData.password.length > 128) {
        newErrors.password = 'A senha deve ter no máximo 128 caracteres.';
      }

      const phone = formData.phone_number.trim();
      if (!phone) {
        newErrors.phone_number = 'Informe o telefone.';
      } else if (!/^\d+$/.test(phone)) {
        newErrors.phone_number = 'Telefone deve conter apenas dígitos.';
      } else if (phone.length < 10 || phone.length > 13) {
        newErrors.phone_number = 'Informe um número válido (10 a 13 dígitos).';
      }

      if (!formData.birth_date) newErrors.birth_date = 'Informe a data de nascimento.';
    } else {
      if (!formData.role) newErrors.role = 'Selecione um cargo.';

      const phone = formData.phone_number.trim();
      if (phone) {
        if (!/^\d+$/.test(phone)) {
          newErrors.phone_number = 'Telefone deve conter apenas dígitos.';
        } else if (phone.length < 10 || phone.length > 13) {
          newErrors.phone_number = 'Informe um número válido (10 a 13 dígitos).';
        }
      }

      if (formData.streak && Number.isNaN(Number(formData.streak)))
        newErrors.streak = 'Informe um número válido.';
      if (formData.coins && Number.isNaN(Number(formData.coins)))
        newErrors.coins = 'Informe um número válido.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setErrors({});
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="center"
        className="!left-1/2 !top-1/2 !h-auto !max-h-[90vh] !w-[min(92vw,640px)] !max-w-[640px] !translate-x-[-50%] !translate-y-[-50%] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl"
      >
        <div className="flex max-h-[90vh] flex-col bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-[18px] font-bold leading-none text-gray-900">{title}</h2>
          </div>

          <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 px-6 py-4">
              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField label="Nome Completo *" error={errors.full_name}>
                  <TextInput
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="Ex: João da Silva"
                    hasError={!!errors.full_name}
                  />
                </FormField>

                <FormField label="E-mail *" error={errors.email}>
                  <TextInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    onBlur={(e) => validateField('email', e.target.value)}
                    placeholder="joao@exemplo.com"
                    hasError={!!errors.email}
                  />
                </FormField>
              </div>

              {mode === 'create' ? (
                <>
                  <FormField label="Senha *" error={errors.password}>
                    <TextInput
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      onBlur={(e) => validateField('password', e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      hasError={!!errors.password}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Telefone *" error={errors.phone_number}>
                      <TextInput
                        value={formData.phone_number}
                        onChange={(e) => updateField('phone_number', e.target.value)}
                        onBlur={(e) => validateField('phone_number', e.target.value)}
                        placeholder="5551999999999"
                        hasError={!!errors.phone_number}
                      />
                    </FormField>

                    <FormField label="Data de Nascimento *" error={errors.birth_date}>
                      <TextInput
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => updateField('birth_date', e.target.value)}
                        hasError={!!errors.birth_date}
                      />
                    </FormField>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Telefone" error={errors.phone_number}>
                      <TextInput
                        value={formData.phone_number}
                        onChange={(e) => updateField('phone_number', e.target.value)}
                        onBlur={(e) => validateField('phone_number', e.target.value)}
                        placeholder="5551999999999"
                        hasError={!!errors.phone_number}
                      />
                    </FormField>

                    <FormField label="Cargo *" error={errors.role}>
                      <select
                        value={formData.role}
                        onChange={(e) => updateField('role', e.target.value)}
                        className={inputClassName(!!errors.role)}
                      >
                        <option value="">Selecione um cargo</option>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Idioma Preferido">
                      <select
                        value={formData.preferred_language}
                        onChange={(e) => updateField('preferred_language', e.target.value)}
                        className={inputClassName(false)}
                      >
                        <option value="">Selecione um idioma</option>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Data de Nascimento">
                      <TextInput
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => updateField('birth_date', e.target.value)}
                        hasError={false}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Curso Desejado">
                      <TextInput
                        value={formData.desired_course}
                        onChange={(e) => updateField('desired_course', e.target.value)}
                        placeholder="Ex: Medicina"
                        hasError={false}
                      />
                    </FormField>

                    <FormField label="Universidade Desejada">
                      <TextInput
                        value={formData.desired_university}
                        onChange={(e) => updateField('desired_university', e.target.value)}
                        placeholder="Ex: USP"
                        hasError={false}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Streak" error={errors.streak}>
                      <TextInput
                        type="number"
                        min="0"
                        value={formData.streak}
                        onChange={(e) => updateField('streak', e.target.value)}
                        placeholder="0"
                        hasError={!!errors.streak}
                      />
                    </FormField>

                    <FormField label="Moedas" error={errors.coins}>
                      <TextInput
                        type="number"
                        min="0"
                        value={formData.coins}
                        onChange={(e) => updateField('coins', e.target.value)}
                        placeholder="0"
                        hasError={!!errors.coins}
                      />
                    </FormField>
                  </div>

                  <FormField label="Data de Expiração do Plano">
                    <TextInput
                      type="date"
                      value={formData.plan_end_date}
                      onChange={(e) => updateField('plan_end_date', e.target.value)}
                      hasError={false}
                    />
                  </FormField>
                </>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="h-10 rounded-lg border-gray-300 px-5 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-lg bg-[#A21CAF] px-5 text-sm font-medium text-white hover:bg-[#86198F]"
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : mode === 'create'
                      ? 'Criar Usuário'
                      : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

function TextInput({ hasError = false, className = '', ...props }: TextInputProps) {
  return <input {...props} className={`${inputClassName(hasError)} ${className}`} />;
}

function inputClassName(hasError: boolean) {
  return [
    'h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-900 outline-none transition-all',
    'placeholder:text-gray-400',
    'focus:border-[#A21CAF] focus:ring-2 focus:ring-[#A21CAF]/20',
    hasError ? 'border-red-400' : 'border-gray-300',
  ].join(' ');
}
