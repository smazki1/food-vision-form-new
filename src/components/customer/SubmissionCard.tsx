
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';

interface SubmissionCardProps {
  id: string;
  imageUrl: string;
  name: string;
  category: string;
  status: string;
  statusStyle: string;
  variations: number;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ id, imageUrl, name, category, status, statusStyle, variations }) => {
  return (
    <Link to={`/submissions/${id}`} className="block group">
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-strong hover:-translate-y-1">
        <div className="relative">
          <img src={imageUrl} alt={name} className="aspect-square w-full object-cover" />
          <Badge className={`absolute top-3 right-3 border-transparent ${statusStyle}`}>{status}</Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">{name}</h3>
          <p className="text-sm text-muted-foreground">{category}</p>
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <span>{variations} וריאציות</span>
            <MoreHorizontal className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SubmissionCard;
