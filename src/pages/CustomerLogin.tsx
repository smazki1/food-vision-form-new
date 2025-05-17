
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const formSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים'),
});

type FormValues = z.infer<typeof formSchema>;

const CustomerLogin: React.FC = () => {
  const { signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      const { success, error } = await signIn(values.email, values.password);
      
      if (success) {
        toast.success('התחברת בהצלחה');
        navigate('/customer/dashboard');
      } else {
        toast.error(error || 'שם המשתמש או הסיסמה אינם נכונים');
      }
    } catch (error) {
      toast.error('התרחשה שגיאה בתהליך ההתחברות');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('יש להזין כתובת אימייל');
      return;
    }

    setIsLoading(true);
    
    try {
      const { resetPassword } = useCustomerAuth();
      const { success, error } = await resetPassword(resetEmail);
      
      if (success) {
        toast.success('נשלח לך אימייל עם הוראות לאיפוס הסיסמה');
        setShowResetPassword(false);
      } else {
        toast.error(error || 'לא ניתן לאפס סיסמה לאימייל זה');
      }
    } catch (error) {
      toast.error('התרחשה שגיאה בתהליך איפוס הסיסמה');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">התחברות לפורטל לקוחות</CardTitle>
            <CardDescription className="text-center">
              הזן את פרטי המשתמש שלך להתחברות למערכת Food Vision
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {showResetPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <FormLabel>אימייל</FormLabel>
                  <Input
                    type="email"
                    placeholder="הזן את האימייל שלך"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="w-full" 
                    onClick={handleResetPassword} 
                    disabled={isLoading}
                  >
                    {isLoading ? 'שולח...' : 'שלח הוראות איפוס'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setShowResetPassword(false)} 
                    disabled={isLoading}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>אימייל</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סיסמה</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="******"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'מתחבר...' : 'התחבר'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="link"
              onClick={() => setShowResetPassword(!showResetPassword)}
              className="p-0 h-auto"
            >
              {showResetPassword ? 'חזרה להתחברות' : 'שכחתי סיסמה'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              עדיין לא לקוח שלנו?{' '}
              <Link to="/food-vision-form" className="text-primary hover:underline">
                לחץ כאן להגשת פרטים
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CustomerLogin;
