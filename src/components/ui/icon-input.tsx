import React, { ReactNode, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classnames

interface IconInputProps extends React.ComponentProps<"input"> {
  id: string;
  name: string;
  label: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  containerClassName?: string;
  labelClassName?: string;
  inputWrapperClassName?: string;
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>((
  { id, name, label, error, icon, iconPosition = 'right', className, containerClassName, labelClassName, inputWrapperClassName, type = 'text', onFocus, onBlur, ...props }, 
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const iconPaddingClass = iconPosition === 'left' ? 'pl-10' : 'pr-10';
  const iconAbsoluteClass = iconPosition === 'left' ? 'left-3' : 'right-3';

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e); // Call original onFocus if it exists
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e); // Call original onBlur if it exists
  };

  let iconColorClass = "text-gray-400";
  if (error) {
    iconColorClass = "text-red-500";
  } else if (isFocused) {
    iconColorClass = "text-primary"; // Change to primary color on focus (and not error)
  }

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Label htmlFor={id} className={cn("font-medium text-gray-700", labelClassName, error && "text-red-600")}>
        {label}
      </Label>
      <div className={cn("relative flex items-center", inputWrapperClassName)}>
        {icon && (
          <div className={cn("absolute inset-y-0 flex items-center pointer-events-none", iconAbsoluteClass)}>
            {React.cloneElement(icon as React.ReactElement, { 
              className: cn("h-5 w-5 transition-colors duration-150 ease-in-out", iconColorClass) // Apply dynamic color, add transition
            })}
          </div>
        )}
        <Input
          id={id}
          name={name}
          type={type}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "w-full h-12 px-4 py-3 rounded-md border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors duration-150 ease-in-out",
            icon ? iconPaddingClass : "px-4", // Apply padding only if icon exists
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/50 text-red-700 placeholder-red-400",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

IconInput.displayName = 'IconInput';

export { IconInput }; 