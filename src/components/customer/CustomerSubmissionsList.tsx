
import React, { useState } from "react";
import { useSubmissions } from "@/hooks/useSubmissions";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/formatDate";
import { Link, useSearchParams } from "react-router-dom";
import { Submission } from "@/api/submissionApi";
import { EyeIcon, FilterIcon } from "lucide-react";

// Map status to badge variants
const statusBadgeVariant: Record<string, string> = {
  "ממתינה לעיבוד": "yellow",
  "בעיבוד": "blue",
  "מוכנה להצגה": "purple",
  "הערות התקבלו": "warning",
  "הושלמה ואושרה": "green"
};

// Valid statuses for filtering
const validStatuses = [
  "ממתינה לעיבוד",
  "בעיבוד",
  "מוכנה להצגה",
  "הערות התקבלו",
  "הושלמה ואושרה"
];

// Map item types to display text
const itemTypeDisplay: Record<string, string> = {
  "dish": "מנה",
  "cocktail": "קוקטייל",
  "drink": "משקה"
};

export function CustomerSubmissionsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const initialType = searchParams.get("type") || "all";

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Use client id from authenticated user
  const { submissions, loading, error } = useSubmissions();

  // Filter submissions based on filters
  const filteredSubmissions = submissions.filter((sub) => {
    return (
      (statusFilter === "all" ? true : sub.submission_status === statusFilter) &&
      (typeFilter === "all" ? true : sub.item_type === typeFilter) &&
      (searchTerm
        ? sub.item_name_at_submission.toLowerCase().includes(searchTerm.toLowerCase())
        : true)
    );
  });

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    searchParams.set("status", value);
    setSearchParams(searchParams);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    searchParams.set("type", value);
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchTerm("");
    setSearchParams({});
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>שגיאה בטעינת הגשות</CardTitle>
          <CardDescription>
            אירעה שגיאה בעת טעינת רשימת ההגשות שלך. אנא נסה שוב מאוחר יותר.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>רשימת מנות</CardTitle>
        <CardDescription>רשימת כל המנות שהועלו לעיבוד</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="חיפוש לפי שם מנה..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="ממתינה לעיבוד">ממתינה לעיבוד</SelectItem>
                <SelectItem value="בעיבוד">בעיבוד</SelectItem>
                <SelectItem value="מוכנה להצגה">מוכנה להצגה</SelectItem>
                <SelectItem value="הערות התקבלו">הערות התקבלו</SelectItem>
                <SelectItem value="הושלמה ואושרה">הושלמה ואושרה</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="סוג פריט" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="dish">מנה</SelectItem>
                <SelectItem value="cocktail">קוקטייל</SelectItem>
                <SelectItem value="drink">משקה</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter !== "all" || typeFilter !== "all" || searchTerm) && (
              <Button variant="ghost" onClick={clearFilters}>
                נקה סינונים
              </Button>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        {filteredSubmissions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם פריט</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>תאריך העלאה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead className="text-right">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.submission_id}>
                    <TableCell className="font-medium">
                      {submission.item_name_at_submission}
                    </TableCell>
                    <TableCell>
                      {itemTypeDisplay[submission.item_type] || submission.item_type}
                    </TableCell>
                    <TableCell>{formatDate(submission.uploaded_at)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[submission.submission_status] as any}>
                        {submission.submission_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={`/customer/submissions/${submission.submission_id}`}>
                          <EyeIcon className="h-4 w-4 ml-2" />
                          צפה ועריכה
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground mb-4">
              {statusFilter || typeFilter || searchTerm
                ? "לא נמצאו מנות התואמות את הסינונים שבחרת"
                : "אין מנות שהועלו עדיין"}
            </p>
            {statusFilter || typeFilter || searchTerm ? (
              <Button onClick={clearFilters}>נקה סינונים</Button>
            ) : (
              <Button asChild>
                <Link to="/food-vision-form">העלה מנות חדשות</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
