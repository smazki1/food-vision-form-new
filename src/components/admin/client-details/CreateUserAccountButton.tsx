
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUserAccountForClient, checkEmailExists } from "@/api/clientApi";
import { Client } from "@/types/client";
import { toast } from "sonner";

interface CreateUserAccountButtonProps {
  client: Client;
}

export function CreateUserAccountButton({ client }: CreateUserAccountButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check if email exists mutation
  const checkEmailMutation = useMutation({
    mutationFn: () => checkEmailExists(client.email),
    onSuccess: (exists) => {
      if (exists) {
        toast.error("כתובת האימייל כבר רשומה במערכת");
      } else {
        // If email doesn't exist, proceed to create user
        createUserMutation.mutate();
      }
    },
    onError: (error) => {
      console.error("Error checking email existence:", error);
      toast.error("שגיאה בבדיקת כתובת האימייל");
    },
  });

  // Create user account mutation
  const createUserMutation = useMutation({
    mutationFn: () => createUserAccountForClient(client.client_id, client.email),
    onSuccess: (data) => {
      queryClient.setQueryData(["client", client.client_id], data.client);
      setTempPassword(data.tempPassword);
      toast.success("חשבון משתמש נוצר בהצלחה");
    },
    onError: (error) => {
      console.error("Error creating user account:", error);
      toast.error("שגיאה ביצירת חשבון משתמש");
    },
  });

  const handleCreateUser = () => {
    setIsDialogOpen(true);
  };

  const confirmCreateUser = () => {
    checkEmailMutation.mutate();
  };

  const isLoading = checkEmailMutation.isPending || createUserMutation.isPending;

  return (
    <>
      <Button 
        variant="outline" 
        onClick={handleCreateUser}
        className="flex items-center"
      >
        <UserPlus className="ml-2 h-4 w-4" />
        צור חשבון משתמש ללקוח
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>יצירת חשבון משתמש</DialogTitle>
            <DialogDescription>
              {tempPassword ? (
                <div className="mt-4">
                  <p className="mb-2">חשבון המשתמש נוצר בהצלחה!</p>
                  <p className="mb-2">סיסמה זמנית: <strong>{tempPassword}</strong></p>
                  <p>יש להעביר את הסיסמה ללקוח ולהנחות אותו לשנות אותה בהתחברות הראשונה.</p>
                </div>
              ) : (
                <div className="mt-4">
                  <p>האם אתה בטוח שברצונך ליצור חשבון משתמש עבור הלקוח?</p>
                  <p className="mb-2">כתובת אימייל: <strong>{client.email}</strong></p>
                  <p>חשבון המשתמש יווצר עם סיסמה זמנית שתוצג לאחר היצירה.</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {!tempPassword && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                ביטול
              </Button>
              <Button onClick={confirmCreateUser} disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                צור חשבון
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
