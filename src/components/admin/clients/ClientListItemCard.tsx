import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@/types/client'; // Assuming this path is correct
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Assuming Avatar components are available
import { Briefcase, Users, Package, Star, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'; // Example icons

interface ClientListItemCardProps {
  client: Client;
}

// Helper to get initials and a color for the avatar
const getAvatarData = (name: string | undefined | null) => {
  if (!name) {
    return { initials: '?', color: 'bg-gradient-to-br from-gray-400 to-gray-600' };
  }
  const initials = name.charAt(0).toUpperCase();
  // Simple hash function for color variety (can be improved)
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-gradient-to-br from-blue-500 to-indigo-600',
    'bg-gradient-to-br from-green-500 to-emerald-600',
    'bg-gradient-to-br from-yellow-500 to-amber-600',
    'bg-gradient-to-br from-red-500 to-rose-600',
    'bg-gradient-to-br from-purple-500 to-violet-600',
    'bg-gradient-to-br from-pink-500 to-fuchsia-600',
    'bg-gradient-to-br from-teal-500 to-cyan-600',
  ];
  return { initials, color: colors[Math.abs(hash) % colors.length] };
};

const getStatusInfo = (status: string | undefined | null) => {
    if (!status) return { text: 'לא ידוע', Icon: AlertTriangle, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    switch (status.toLowerCase()) {
      case 'פעיל':
      case 'active':
        return { text: 'פעיל', Icon: CheckCircle2, color: 'text-green-700', bgColor: 'bg-green-100' };
      case 'לא פעיל':
      case 'inactive':
        return { text: 'לא פעיל', Icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-100' };
      case 'בהמתנה':
      case 'pending':
        return { text: 'בהמתנה', Icon: AlertTriangle, color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
      default:
        return { text: status, Icon: AlertTriangle, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };


export const ClientListItemCard: React.FC<ClientListItemCardProps> = ({ client }) => {
  const navigate = useNavigate();
  const { initials, color } = getAvatarData(client.restaurant_name);
  const statusInfo = getStatusInfo(client.client_status);

  const handleViewClient = () => {
    navigate(`/admin/clients/${client.client_id}`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 rtl:space-x-reverse hover:shadow-lg transition-shadow duration-200 ease-in-out mb-3 border border-gray-200">
      <Avatar className={`h-16 w-16 text-white text-2xl font-semibold ${color}`}>
        <AvatarFallback className="bg-transparent">{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-gray-800">{client.restaurant_name || 'שם עסק לא זמין'}</h3>
        <p className="text-sm text-gray-600">
          {client.contact_name || 'איש קשר לא זמין'} - {client.email || 'אימייל לא זמין'}
        </p>
        
        <div className="mt-2 flex items-center space-x-3 rtl:space-x-reverse text-xs text-gray-500">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            <statusInfo.Icon className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
            {statusInfo.text}
          </span>
          {client.service_packages && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              <Package className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
              {client.service_packages.package_name || 'חבילה לא זמינה'}
            </span>
          )}
          {client.remaining_servings !== null && client.remaining_servings !== undefined && (
             <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${client.remaining_servings > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Star className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
              מנות שנותרו: {client.remaining_servings}
            </span>
          )}
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleViewClient}
        className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap"
      >
        צפייה
      </Button>
    </div>
  );
}; 