type TitleProps = {
  title: string;
  subtitle: string;
};

export function Title({ title, subtitle }: TitleProps) {
  return (
    <header className="pt-8">
      <h1 className="text-[52px] font-bold leading-none text-[#0F172A]">{title}</h1>
      <p className="mt-2 text-base text-[#64748B]">{subtitle}</p>
    </header>
  );
}
