import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Client } from '@/types/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientUpdate } from '@/hooks/useClientUpdate';

interface ClientPaymentStatusProps {
  clientId: string;
  client: Client;
}

const paymentStatusOptions = [
  { value: "שולם תשלום מלא", label: "שולם תשלום מלא" },
  { value: "תשלום חלקי", label: "תשלום חלקי" },
  { value: "עדיין לא שולם", label: "עדיין לא שולם" },
  { value: "לא מוגדר", label: "לא מוגדר" }
];

export const ClientPaymentStatus: React.FC<ClientPaymentStatusProps> = ({
  clientId,
  client
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localAmount, setLocalAmount] = useState(client.payment_amount_ils?.toString() || '');
  const updateClient = useClientUpdate();

  // Sync local amount with client data changes
  useEffect(() => {
    setLocalAmount(client.payment_amount_ils?.toString() || '');
  }, [client.payment_amount_ils]);

  const handlePaymentStatusChange = async (status: string) => {
    try {
      setIsUpdating(true);
      await updateClient.mutateAsync({
        clientId,
        updates: { payment_status: status }
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDueDateChange = async (date: string) => {
    try {
      setIsUpdating(true);
      await updateClient.mutateAsync({
        clientId,
        updates: { payment_due_date: date || null }
      });
    } catch (error) {
      console.error('Error updating due date:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAmountChange = (amount: string) => {
    setLocalAmount(amount);
  };

  const handleAmountSave = async (amount: string) => {
    try {
      setIsUpdating(true);
      const numericAmount = amount ? parseFloat(amount) : null;
      await updateClient.mutateAsync({
        clientId,
        updates: { payment_amount_ils: numericAmount }
      });
    } catch (error) {
      console.error('Error updating payment amount:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          סטטוס תשלומים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status */}
        <div className="space-y-2">
          <Label htmlFor="payment-status">סטטוס תשלום</Label>
          <Select
            value={client.payment_status || "לא מוגדר"}
            onValueChange={handlePaymentStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger id="payment-status">
              <SelectValue placeholder="בחר סטטוס תשלום" />
            </SelectTrigger>
            <SelectContent>
              {paymentStatusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="due-date">תאריך פירעון</Label>
          <Input
            id="due-date"
            type="date"
            value={client.payment_due_date || ''}
            onChange={(e) => handleDueDateChange(e.target.value)}
            disabled={isUpdating}
            className="w-full"
          />
        </div>

        {/* Amount in Shekels */}
        <div className="space-y-2">
          <Label htmlFor="amount">סכום בשקלים</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={localAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onBlur={(e) => handleAmountSave(e.target.value)}
            disabled={isUpdating}
            placeholder="0.00"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}; 