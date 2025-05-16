
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Instagram, Mail, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  itemName: string;
}

export function ShareDialog({ open, onOpenChange, imageUrl, itemName }: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast({
        title: "הקישור הועתק",
        description: "הקישור לתמונה הועתק ללוח",
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: "שגיאה בהעתקת הקישור",
        description: "אירעה שגיאה בעת העתקת הקישור. נסה להעתיק באופן ידני.",
        variant: "destructive",
      });
    }
  };
  
  const handleSocialShare = (platform: string) => {
    let shareUrl = "";
    const encodedImageUrl = encodeURIComponent(imageUrl);
    const encodedTitle = encodeURIComponent(`תמונה של ${itemName} מעובדת על-ידי Food Vision AI`);
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedImageUrl}`;
        break;
      case "instagram":
        toast({
          title: "שיתוף באינסטגרם",
          description: "לא ניתן לשתף ישירות לאינסטגרם דרך האתר. אנא הורד את התמונה ושתף באפליקציה.",
        });
        return;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedImageUrl}`;
        break;
      case "mail":
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedImageUrl}`;
        break;
      default:
        return;
    }
    
    // Open share URL in new tab/window
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>שתף תמונה</DialogTitle>
          <DialogDescription>
            שתף תמונה זו ברשתות החברתיות או באמצעות קישור ישיר
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="aspect-square w-full max-w-[250px] h-[250px] mx-auto mb-6 rounded-md overflow-hidden">
            <img 
              src={imageUrl} 
              alt="תמונה לשיתוף" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <Tabs defaultValue="social">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="social">רשתות חברתיות</TabsTrigger>
              <TabsTrigger value="link">קישור ישיר</TabsTrigger>
            </TabsList>
            
            <TabsContent value="social" className="py-4">
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-[100px] flex flex-col gap-1 h-auto py-4"
                  onClick={() => handleSocialShare("facebook")}
                >
                  <Facebook className="h-8 w-8" />
                  <span>פייסבוק</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-[100px] flex flex-col gap-1 h-auto py-4"
                  onClick={() => handleSocialShare("whatsapp")}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-8 w-8"
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                    <path d="M9 10a.5.5 0 0 1 1 0V16a.5.5 0 0 1-1 0v-6Z" />
                    <path d="M14 10a.5.5 0 0 1 1 0V16a.5.5 0 0 1-1 0v-6Z" />
                    <path d="M9 10a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z" />
                  </svg>
                  <span>ואטסאפ</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-[100px] flex flex-col gap-1 h-auto py-4"
                  onClick={() => handleSocialShare("instagram")}
                >
                  <Instagram className="h-8 w-8" />
                  <span>אינסטגרם</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-[100px] flex flex-col gap-1 h-auto py-4"
                  onClick={() => handleSocialShare("mail")}
                >
                  <Mail className="h-8 w-8" />
                  <span>אימייל</span>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="link" className="py-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input value={imageUrl} readOnly className="flex-1" />
                  <Button onClick={handleCopyLink} variant="secondary">
                    {copied ? "הועתק!" : "העתק"}
                  </Button>
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  ניתן לשלוח את הקישור ישירות או להטמיע את התמונה באתר
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
