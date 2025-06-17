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

const EditorDashboardWireframe: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch submissions assigned to the current user
  const { data: editorSubmissions, isLoading, error } = useQuery({
    queryKey: ['editor-submissions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name)
        `)
        .eq('assigned_editor_id', session.user.id)
        .order('uploaded_at', { ascending: false });
        
      if (error) throw error;
      
      return data as Submission[];
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading tasks...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading tasks</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Unknown error"}
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
    
    return matchesSearch && matchesStatus;
  });
  
  const uniqueStatuses = [...new Set(submissions.map(sub => sub.submission_status))];
  
  // Check if there are any past-due submissions (using uploaded_at + 3 days as deadline)
  const now = new Date();
  const overdueSubmissions = submissions.filter(sub => {
    if (!sub.uploaded_at) return false;
    const deadline = new Date(sub.uploaded_at);
    deadline.setDate(deadline.getDate() + 3); // 3 days from upload
    return deadline < now;
  });
  
  // Tasks nearing deadline (within 24 hours)
  const nearingDeadlineSubmissions = submissions.filter(sub => {
    if (!sub.uploaded_at) return false;
    
    const deadline = new Date(sub.uploaded_at);
    deadline.setDate(deadline.getDate() + 3); // 3 days from upload
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
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* WIREFRAME: Header Section */}
      <div className="border-2 border-dashed border-gray-300 bg-white p-6 mb-6 rounded-lg">
        <div className="bg-blue-100 p-2 text-center text-sm font-medium text-blue-800 mb-4">
          WIREFRAME: HEADER SECTION
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and track your editing tasks
            </p>
          </div>
        </div>
      </div>
      
      {/* WIREFRAME: KPI Cards Section */}
      <div className="border-2 border-dashed border-gray-300 bg-white p-6 mb-6 rounded-lg">
        <div className="bg-green-100 p-2 text-center text-sm font-medium text-green-800 mb-4">
          WIREFRAME: KPI METRICS CARDS (4 CARDS GRID)
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-dashed border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <BarChart4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
            </CardContent>
          </Card>
          
          <Card className={`border-2 border-dashed ${overdueSubmissions.length > 0 ? "border-red-300 bg-red-50" : "border-blue-200"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className={`h-4 w-4 ${overdueSubmissions.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overdueSubmissions.length > 0 ? "text-red-500" : ""}`}>
                {overdueSubmissions.length}
              </div>
              <p className="text-xs text-muted-foreground">Tasks past deadline</p>
            </CardContent>
          </Card>
          
          <Card className={`border-2 border-dashed ${nearingDeadlineSubmissions.length > 0 ? "border-yellow-300 bg-yellow-50" : "border-blue-200"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Near Deadline</CardTitle>
              <Clock className={`h-4 w-4 ${nearingDeadlineSubmissions.length > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${nearingDeadlineSubmissions.length > 0 ? "text-yellow-500" : ""}`}>
                {nearingDeadlineSubmissions.length}
              </div>
              <p className="text-xs text-muted-foreground">Tasks due within 24 hours</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-dashed border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Processing</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter(s => s.submission_status === "ממתינה לעיבוד").length}
              </div>
              <p className="text-xs text-muted-foreground">New tasks to complete</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* WIREFRAME: Tasks Table Section */}
      <div className="border-2 border-dashed border-gray-300 bg-white p-6 rounded-lg">
        <div className="bg-purple-100 p-2 text-center text-sm font-medium text-purple-800 mb-4">
          WIREFRAME: TASKS TABLE WITH FILTERS
        </div>
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>
              List of all tasks assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* WIREFRAME: Filters Bar */}
            <div className="border border-dashed border-gray-300 p-4 mb-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2">WIREFRAME: FILTERS BAR</div>
              <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
                <Input
                  placeholder="Search by item name/restaurant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* WIREFRAME: Table */}
            <div className="border border-dashed border-gray-300 bg-gray-50">
              <div className="text-xs text-gray-600 p-2">WIREFRAME: DATA TABLE</div>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No tasks found matching your search
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((submission) => {
                        const deadline = submission.uploaded_at ? 
                          new Date(new Date(submission.uploaded_at).getTime() + 3 * 24 * 60 * 60 * 1000) : null;
                        const isOverdue = deadline && deadline < new Date();
                        
                        return (
                          <TableRow 
                            key={submission.submission_id} 
                            className={`cursor-pointer hover:bg-gray-50 ${isOverdue ? "bg-red-50 hover:bg-red-100" : ""}`}
                            onClick={() => handleProcessItem(submission.submission_id)}
                          >
                            <TableCell className="font-medium">
                              {submission.item_name_at_submission}
                            </TableCell>
                            <TableCell>{submission.clients?.restaurant_name}</TableCell>
                            <TableCell>
                              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                                {deadline ? 
                                  formatDate(deadline.toISOString()) : 
                                  "Not set"}
                              </span>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProcessItem(submission.submission_id);
                                }}
                              >
                                Process Item
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditorDashboardWireframe;
