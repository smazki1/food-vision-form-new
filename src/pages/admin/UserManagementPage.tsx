import React, { useState } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { UserWithRole, UserRole } from "@/types/auth";
import { AlertCircle, Check, UserCog, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/utils/formatDate";

const NO_ROLE_VALUE = "__NO_ROLE__";

const UserManagementPage: React.FC = () => {
  const { userRoles, isLoading, error, assignRole, removeRole } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState("");
  
  if (isLoading) {
    return <div className="flex justify-center p-8">טוען נתוני משתמשים...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto my-8 max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת משתמשים</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "שגיאה לא ידועה"}
        </AlertDescription>
      </Alert>
    );
  }
  
  const users = userRoles?.users || [];
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleRoleChange = (userId: string, roleValue: UserRole | typeof NO_ROLE_VALUE) => {
    if (roleValue === NO_ROLE_VALUE) {
      removeRole.mutate(userId);
    } else {
      assignRole.mutate({ userId, role: roleValue as UserRole });
    }
  };
  
  return (
    <div className="px-4 py-6 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ניהול משתמשים</h1>
          <p className="text-muted-foreground">
            צפייה ועריכת הרשאות משתמשים במערכת
          </p>
        </div>
        <div className="w-full md:w-auto">
          <Input
            placeholder="חיפוש לפי אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">משתמשי המערכת</CardTitle>
          <CardDescription>
            הקצאת תפקידים והרשאות למשתמשים פנימיים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תאריך הצטרפות</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      לא נמצאו משתמשים
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        {user.email_confirmed_at ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <Check className="h-3 w-3" /> מאומת
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit">
                            <X className="h-3 w-3" /> לא מאומת
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || NO_ROLE_VALUE}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole | typeof NO_ROLE_VALUE)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="בחר תפקיד" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>תפקידים</SelectLabel>
                              <SelectItem value={NO_ROLE_VALUE}>ללא תפקיד</SelectItem>
                              <SelectItem value="admin">מנהל מערכת</SelectItem>
                              <SelectItem value="editor">עורך</SelectItem>
                              <SelectItem value="account_manager">מנהל לקוחות</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled
                        >
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">הגדרות משתמש</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;
