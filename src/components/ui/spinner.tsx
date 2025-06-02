import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClass = 
    size === 'sm' ? 'w-4 h-4' : 
    size === 'lg' ? 'w-8 h-8' : 
    'w-6 h-6';
    
  return (
    <Loader2 
      className={cn(
        `animate-spin text-primary ${sizeClass}`, 
        className
      )} 
    />
  );
}; 