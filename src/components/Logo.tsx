import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <img 
      src="/images/logo_anonforge.png" 
      alt="AnonForge" 
      className={cn('object-contain rounded-lg shadow-sm', className || sizeClasses[size])}
      style={{ imageRendering: 'auto' }}
    />
  );
}
