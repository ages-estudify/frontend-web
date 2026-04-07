interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  rightElement?: React.ReactNode;
}

export function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  rightElement,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-black">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[#7B5CC4] focus:ring-1 focus:ring-[#7B5CC4] ${
            error ? 'border-red-400' : 'border-gray-300'
          } ${rightElement ? 'pr-10' : ''}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
