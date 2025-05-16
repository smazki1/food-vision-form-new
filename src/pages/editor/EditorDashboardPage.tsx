
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";
import { Clock, AlertCircle, Filter, BarChart4 } from "lucide-react";
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
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/utils/formatDate";
import { useQuery } from "@tanstack/react-query";

const EditorDashboardPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch submissions assigned to the current user
  const { data: editorSubmissions, isLoading, error } = useQuery({
    queryKey: ['editor-submissions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("לא מחובר");
      }
      
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name)
        `)
        .eq('assigned_editor_id', session.user.id)
        .order('target_completion_date', { ascending: true });
        
      if (error) throw error;
      
      return data as Submission[];
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-8">טוען משימות...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto my-8 max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת משימות</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "שגיאה לא ידועה"}
        </AlertDescription>
      </Alert>
    );
  }
  
  const submissions = editorSubmissions || [];
  
  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = (
      submission.item_name_at_submission?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.clients?.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter ? submission.submission_status === statusFilter : true;
    const matchesPriority = priorityFilter ? submission.priority === priorityFilter : true;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  const uniqueStatuses = [...new Set(submissions.map(sub => sub.submission_status))];
  const uniquePriorities = [...new Set(submissions.map(sub => sub.priority).filter(Boolean))];
  
  // Check if there are any past-due submissions
  const now = new Date();
  const overdueSubmissions = submissions.filter(sub => 
    sub.target_completion_date && new Date(sub.target_completion_date) < now
  );
  
  // Tasks nearing deadline (within 24 hours)
  const nearingDeadlineSubmissions = submissions.filter(sub => {
    if (!sub.target_completion_date) return false;
    
    const deadline = new Date(sub.target_completion_date);
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff > 0 && hoursDiff <= 24;
  });
  
  const handleProcessItem = (submissionId: string) => {
    navigate(`/editor/submissions/${submissionId}`);
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ממתינה לעיבוד":
        return "warning";
      case "בעיבוד":
        return "blue";
      case "מוכנה להצגה":
        return "success";
      case "הערות התקבלו":
        return "purple";
      case "הושלמה ואושרה":
        return "secondary";
      default:
        return "default";
    }
  };
  
  const getPriorityBadgeVariant = (priority: string | null) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "yellow";
      case "Low":
        return "green";
      default:
        return "secondary";
    }
  };
  
  return (
    <div className="px-4 py-6 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">דאשבורד עורך</h1>
          <p className="text-muted-foreground">
            ניהול ומעקב אחר משימות העריכה שלך
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך הכול משימות</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">משימות מוקצות לך</p>
          </CardContent>
        </Card>
        
        <Card className={overdueSubmissions.length > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות באיחור</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueSubmissions.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueSubmissions.length > 0 ? "text-red-500" : ""}`}>
              {overdueSubmissions.length}
            </div>
            <p className="text-xs text-muted-foreground">משימות שעברו את הדדליין</p>
          </CardContent>
        </Card>
        
        <Card className={nearingDeadlineSubmissions.length > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">קרובות לדדליין</CardTitle>
            <Clock className={`h-4 w-4 ${nearingDeadlineSubmissions.length > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${nearingDeadlineSubmissions.length > 0 ? "text-yellow-500" : ""}`}>
              {nearingDeadlineSubmissions.length}
            </div>
            <p className="text-xs text-muted-foreground">משימות לסיום בתוך 24 שעות</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינות לעיבוד</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submissions.filter(s => s.submission_status === "ממתינה לעיבוד").length}
            </div>
            <p className="text-xs text-muted-foreground">משימות חדשות לביצוע</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>משימות שלי</CardTitle>
            <CardDescription>
              רשימת כל המשימות המוקצות לך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between mb-4">
              <Input
                placeholder="חיפוש לפי שם פריט/מסעדה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter || ''} onValueChange={(value) => setStatusFilter(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="סנן לפי סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל הסטטוסים</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={priorityFilter || ''} onValueChange={(value) => setPriorityFilter(value || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="סנן לפי עדיפות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כל העדיפויות</SelectItem>
                    {uniquePriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                לא נמצאו משימות מתאימות לחיפוש שלך
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>פריט</TableHead>
                      <TableHead>מסעדה</TableHead>
                      <TableHead>תאריך יעד</TableHead>
                      <TableHead>עדיפות</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => {
                      const isOverdue = submission.target_completion_date && 
                        new Date(submission.target_completion_date) < new Date();
                      
                      return (
                        <TableRow key={submission.submission_id}>
                          <TableCell className="font-medium">
                            {submission.item_name_at_submission}
                          </TableCell>
                          <TableCell>{submission.clients?.restaurant_name}</TableCell>
                          <TableCell>
                            <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                              {submission.target_completion_date ? 
                                formatDate(submission.target_completion_date) : 
                                "לא הוגדר"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityBadgeVariant(submission.priority)}>
                              {submission.priority || "Medium"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(submission.submission_status)}>
                              {submission.submission_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleProcessItem(submission.submission_id)}
                            >
                              עבד על מנה
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditorDashboardPage;
