import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps extends React.ComponentPropsWithoutRef<'svg'> {
  name: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

export default function Icon({ name, className, size = 20, style, ...props }: IconProps) {
  // Safe mapping of icon name strings to Lucide icon components
  const LucideIcon = (Icons as Record<string, React.ComponentType<{ className?: string; size?: number | string; style?: React.CSSProperties }>>)[name];
  
  if (!LucideIcon) {
    return <Icons.HelpCircle className={className} size={size} style={style} {...props} />;
  }
  
  return <LucideIcon className={className} size={size} style={style} {...props} />;
}
