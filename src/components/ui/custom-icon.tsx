import { cn } from '@/lib/utils';

interface CustomIconProps {
  name: string;
  className?: string;
  size?: number | string;
}

/**
 * CustomIcon - Renders icons from the public/icons/ directory
 * 
 * Usage:
 * <CustomIcon name="home" className="h-5 w-5" />
 * <CustomIcon name="wallet" size={24} />
 * 
 * Icons should be placed in public/icons/ as SVG files.
 * Icon names are kebab-case (e.g., "arrow-right", "check-circle").
 */
export function CustomIcon({ name, className, size = 24 }: CustomIconProps) {
  const sizeValue = typeof size === 'string' ? size : `${size}px`;
  
  return (
    <img 
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
      className={cn("inline-block icon-inherit", className)}
      style={{ 
        width: sizeValue,
        height: sizeValue,
      }}
      draggable={false}
    />
  );
}
