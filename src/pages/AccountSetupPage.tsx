import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Define form schema
const clientFormSchema = z.object({
  restaurant_name: z.string().min(2, 'שם המסעדה חייב להכיל לפחות 2 תווים'),
  contact_name: z.string().min(2, 'שם איש הקשר חייב להכיל לפחות 2 תווים'),
  phone: z.string().min(9, 'מספר הטלפון חייב להכיל לפחות 9 ספרות'),
  email: z.string().email('נא להזין כתובת אימייל תקינה'),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const AccountSetupPage: React.FC = () => {
  const { user, createClientRecord, loading } = useUnifiedAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return path from location state
  const from = location.state?.from?.pathname || "/customer/dashboard";
  
  // Initialize form with default values
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      restaurant_name: '',
      contact_name: '',
      phone: '',
      email: user?.email || '',
    },
  });
  
  const onSubmit = async (values: ClientFormValues) => {
    if (!user) {
      toast.error('יש להתחבר כדי להקים רשומת לקוח');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // We now pass the properly typed values directly - the schema ensures all fields are present
      const result = await createClientRecord({
        restaurant_name: values.restaurant_name,
        contact_name: values.contact_name,
        phone: values.phone,
        email: values.email,
      });
      
      if (result.success) {
        toast.success('רשומת הלקוח נוצרה בהצלחה!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'שגיאה ביצירת רשומת לקוח');
      }
    } catch (error) {
      toast.error('התרחשה שגיאה בלתי צפויה');
      console.error('Error creating client record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>השלמת הקמת חשבון</CardTitle>
          <CardDescription>
            נא למלא את הפרטים הבאים כדי להשלים את הקמת חשבון הלקוח שלכם/ן
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="restaurant_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם המסעדה</FormLabel>
                    <FormControl>
                      <Input placeholder="הזינו את שם המסעדה" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם איש קשר</FormLabel>
                    <FormControl>
                      <Input placeholder="הזינו את שם איש הקשר" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר טלפון</FormLabel>
                    <FormControl>
                      <Input placeholder="הזינו את מספר הטלפון" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>אימייל</FormLabel>
                    <FormControl>
                      <Input placeholder="הזינו את האימייל" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    מעבד...
                  </div>
                ) : (
                  'יצירת רשומת לקוח'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default AccountSetupPage;
