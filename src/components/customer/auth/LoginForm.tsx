
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginFormProps {
  onLoginStart?: () => void;
  onLoginComplete?: () => void;
}

const loginSchema = z.object({
  email: z.string().email("נא להזין כתובת אימייל תקינה"),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC<LoginFormProps> = ({ onLoginStart, onLoginComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useUnifiedAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      onLoginStart?.();

      const { success, error } = await signIn(data.email, data.password);

      if (!success) {
        toast.error(error || "התרחשה שגיאה בתהליך ההתחברות");
        console.error("[LoginForm] Login error:", error);
        return;
      }

      toast.success("התחברת בהצלחה!");
    } catch (error) {
      console.error("[LoginForm] Login exception:", error);
      toast.error("התרחשה שגיאה בלתי צפויה");
    } finally {
      setIsLoading(false);
      onLoginComplete?.();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          type="email"
          placeholder="הכנס את האימייל שלך"
          {...register("email")}
          disabled={isLoading}
          dir="ltr"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          type="password"
          placeholder="הכנס את הסיסמה שלך"
          {...register("password")}
          disabled={isLoading}
          dir="ltr"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            מתחבר...
          </div>
        ) : (
          "התחבר"
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
