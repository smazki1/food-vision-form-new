import React from "react";
import { Badge } from "@/components/ui/badge";

interface PackageFeaturesTagsProps {
  tags?: string[];
}

const PackageFeaturesTags: React.FC<PackageFeaturesTagsProps> = ({ tags = [] }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground text-sm">אין תגים</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default PackageFeaturesTags;
