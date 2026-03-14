import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-neon-primary to-neon-primary-dark text-white hover:from-neon-primary-light hover:to-neon-primary shadow-lg shadow-neon-primary/20',
  secondary:
    'border border-neon-primary/40 text-neon-primary-light hover:bg-neon-primary/10',
  ghost:
    'text-neon-text-muted hover:bg-neon-surface-2 hover:text-neon-text',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-7 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center font-medium transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { href: _, ...buttonProps } = props as ButtonAsButton;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
