"use client";

/** Shared, accessible form field primitives (booking details + inquiry form). */

export function Label({ htmlFor, children, required, optional }: { htmlFor: string; children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children} {required && <span className="text-accent" aria-hidden>*</span>}
      {optional && <span className="font-normal text-mist">(optional)</span>}
    </label>
  );
}
export function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-err`} className="mt-1 text-sm text-danger">
      {error}
    </p>
  ) : null;
}

export function Input({
  label,
  id,
  value,
  onChange,
  error,
  required,
  optional,
  ...rest
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id">) {
  return (
    <div>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      <input
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function TextArea({
  label,
  id,
  value,
  onChange,
  error,
  optional,
  rows = 4,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  optional?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      <textarea
        id={id}
        rows={rows}
        className="field resize-y"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}
