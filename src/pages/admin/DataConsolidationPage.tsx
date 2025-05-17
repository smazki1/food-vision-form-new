
import React from "react";
import { DataConsolidationTool } from "@/components/editor/submission-processing/components";

export default function DataConsolidationPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">כלי איחוד נתונים</h1>
      <DataConsolidationTool />
    </div>
  );
}
