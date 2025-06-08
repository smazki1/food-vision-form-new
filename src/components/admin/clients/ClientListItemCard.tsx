import React, { useState } from 'react';
import { Client } from '@/types/client'; // Assuming this path is correct
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Assuming Avatar components are available
import { Briefcase, Users, Package, Star, AlertTriangle, CheckCircle2, XCircle, Archive, RotateCcw } from 'lucide-react'; // Example icons
import { ClientDetailPanel } from '@/components/admin/client-details/ClientDetailPanel';
import { useClientStatusUpdate } from '@/hooks/useClientUpdate';
import { toast } from 'sonner';

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
      case 'מושהה':
        return { text: 'מושהה', Icon: AlertTriangle, color: 'text-orange-700', bgColor: 'bg-orange-100' };
      case 'ארכיון':
        return { text: 'ארכיון', Icon: AlertTriangle, color: 'text-gray-700', bgColor: 'bg-gray-100' };
      default:
        return { text: status, Icon: AlertTriangle, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };


export const ClientListItemCard: React.FC<ClientListItemCardProps> = ({ client }) => {
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const { initials, color } = getAvatarData(client.restaurant_name);
  const statusInfo = getStatusInfo(client.client_status);
  const clientStatusUpdate = useClientStatusUpdate();

  const handleRowClick = () => {
    setShowDetailPanel(true);
  };

  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking the button
    
    try {
      const newStatus = client.client_status === 'ארכיון' ? 'פעיל' : 'ארכיון';
      const actionText = newStatus === 'ארכיון' ? 'הועבר לארכיון' : 'הוחזר מהארכיון';
      
      await clientStatusUpdate.mutateAsync({
        clientId: client.client_id,
        status: newStatus
      });
      
      toast.success(`לקוח "${client.restaurant_name}" ${actionText} בהצלחה`);
    } catch (error) {
      console.error('Error updating client status:', error);
      // Error toast is handled by the hook
    }
  };

  return (
    <>
      <div 
        className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 rtl:space-x-reverse hover:shadow-lg transition-shadow duration-200 ease-in-out mb-3 border border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={handleRowClick}
      >
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
        onClick={handleArchiveClick}
        disabled={clientStatusUpdate.isPending}
        className={
          client.client_status === 'ארכיון' 
            ? "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 whitespace-nowrap"
            : "text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700 whitespace-nowrap"
        }
      >
        {clientStatusUpdate.isPending ? (
          "מעבד..."
        ) : client.client_status === 'ארכיון' ? (
          <>
            <RotateCcw className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
            החזר
          </>
        ) : (
          <>
            <Archive className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
            ארכיון
          </>
        )}
      </Button>
    </div>

      {/* Client Detail Panel */}
      {showDetailPanel && (
        <ClientDetailPanel
          clientId={client.client_id}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
    </>
  );
}; 