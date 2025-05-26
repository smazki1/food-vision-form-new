import React, { ReactNode, useState } from 'react';
import { Textarea, TextareaProps } from '@/components/ui/textarea'; // Use exported TextareaProps
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Prefer React.ComponentProps<"textarea"> if TextareaProps is not exported from ui/textarea
interface IconTextareaProps extends TextareaProps { // Use TextareaProps directly
  id: string; // Explicitly require id for the label
  name: string;
  label: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: 'top-left' | 'top-right'; // Adjusted for textarea, typically icon is at top
  containerClassName?: string;
  labelClassName?: string;
  textareaWrapperClassName?: string;
}

const IconTextarea = React.forwardRef<HTMLTextAreaElement, IconTextareaProps>((
  { id, name, label, error, icon, iconPosition = 'top-right', className, containerClassName, labelClassName, textareaWrapperClassName, onFocus, onBlur, ...props }, 
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  // Adjust icon positioning classes for textarea. Icon usually outside, or absolutely positioned near corner.
  // For this example, let's assume icon is meant to be near the label or corner, not inside like input.
  // Simplified icon positioning for now, as it's less common to have icons *inside* textareas.
  // This might need specific CSS if an in-field icon is desired for Textarea.

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e); 
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  let iconColorClass = "text-gray-400";
  if (error) {
    iconColorClass = "text-red-500";
  } else if (isFocused) {
    iconColorClass = "text-primary";
  }

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <div className="flex items-center justify-between"> 
        <Label htmlFor={id} className={cn("font-medium text-gray-700", labelClassName, error && "text-red-600")}>
          {label}
        </Label>
        {icon && (
            <div className={cn("flex items-center", iconPosition === 'top-left' ? "mr-2" : "ml-2")}> {/* Simple positioning next to label */}
                {React.cloneElement(icon as React.ReactElement, {
                className: cn("h-5 w-5 transition-colors duration-150 ease-in-out", iconColorClass)
                })}
            </div>
        )}
      </div>
      <div className={cn("relative", textareaWrapperClassName)}> {/* Removed flex items-center if icon is not inside */}
        <Textarea
          id={id}
          name={name}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "w-full min-h-[100px] px-4 py-3 rounded-md border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors duration-150 ease-in-out",
            // No specific icon padding like input, as icon is outside or handled differently
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

IconTextarea.displayName = 'IconTextarea';

export { IconTextarea };
export type { TextareaProps }; // Re-export TextareaProps if needed elsewhere 