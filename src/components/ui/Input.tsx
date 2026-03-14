import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search';
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', label, error, className = '', ...props }, ref) => {
    const baseStyles =
      'w-full rounded-lg border bg-neon-surface text-neon-text placeholder-neon-text-muted/50 outline-none transition-colors focus:border-neon-primary';

    const variantStyles =
      variant === 'search'
        ? 'border-neon-border pl-10 pr-4 py-2.5'
        : 'border-neon-border px-4 py-2.5';

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-neon-text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {variant === 'search' && (
            <svg
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neon-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
          <input
            ref={ref}
            className={`${baseStyles} ${variantStyles} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-neon-red">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
