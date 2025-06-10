
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  onClick: () => void;
}

const WhatsAppButton = ({ onClick }: WhatsAppButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed left-6 bottom-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
      aria-label="צור קשר בוואטסאפ"
    >
      <MessageCircle className="w-6 h-6" />
      <div className="absolute left-full ml-3 bottom-1/2 translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        צור קשר בוואטסאפ
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
      </div>
    </button>
  );
};

export default WhatsAppButton;
