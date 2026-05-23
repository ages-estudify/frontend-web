import type { ReactNode } from 'react';

type TitleProps = {
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function Title({ title, subtitle, action }: TitleProps) {
  return (
    <header className="pt-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[52px] font-bold leading-none text-[#0F172A]">{title}</h1>
        {action}
      </div>
      <p className="mt-2 text-base text-[#64748B]">{subtitle}</p>
    </header>
  );
}
