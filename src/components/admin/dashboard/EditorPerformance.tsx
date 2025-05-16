
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EditorPerformanceProps {
  data: Array<{
    editor_id: string;
    editor_name: string;
    completed: number;
    avg_time: number;
    edit_rate: number;
  }>;
  loading: boolean;
}

export function EditorPerformance({ data, loading }: EditorPerformanceProps) {
  const sortedData = [...data].sort((a, b) => b.completed - a.completed);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">ביצועי עורכים</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        ) : sortedData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>עורך</TableHead>
                <TableHead className="text-right">מנות שהושלמו</TableHead>
                <TableHead className="text-right">זמן עיבוד ממוצע</TableHead>
                <TableHead className="text-right">שיעור תיקונים</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((editor) => (
                <TableRow key={editor.editor_id}>
                  <TableCell>{editor.editor_name}</TableCell>
                  <TableCell className="text-right">{editor.completed}</TableCell>
                  <TableCell className="text-right">{editor.avg_time.toFixed(1)} ימים</TableCell>
                  <TableCell className="text-right">{editor.edit_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <p className="text-muted-foreground">אין נתוני ביצועי עורכים להצגה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
