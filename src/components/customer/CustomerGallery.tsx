
import React, { useState, useMemo } from "react";
import { useSubmissions } from "@/hooks/useSubmissions";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formatDate";
import { Download, Share2, Maximize, Search } from "lucide-react";
import { ShareDialog } from "./ShareDialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function CustomerGallery() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submissions, loading, error } = useSubmissions();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageToShare, setImageToShare] = useState<string | null>(null);
  const [itemNameToShare, setItemNameToShare] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Filter for approved items only
  const approvedItems = useMemo(() => {
    const filtered = submissions?.filter(
      (sub) => sub.submission_status === "הושלמה ואושרה" && sub.main_processed_image_url
    ) || [];
    
    // Apply search filter
    const searched = searchTerm 
      ? filtered.filter(item => 
          item.item_name_at_submission.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filtered;
    
    // Apply type filter
    const typeFiltered = filterType 
      ? searched.filter(item => item.item_type === filterType)
      : searched;
    
    // Apply sorting
    switch (sortBy) {
      case "newest":
        return [...typeFiltered].sort(
          (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
      case "oldest":
        return [...typeFiltered].sort(
          (a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
        );
      case "alphabetical":
        return [...typeFiltered].sort(
          (a, b) => a.item_name_at_submission.localeCompare(b.item_name_at_submission)
        );
      default:
        return typeFiltered;
    }
  }, [submissions, searchTerm, filterType, sortBy]);
  
  const handleShareImage = (imageUrl: string, itemName: string) => {
    setImageToShare(imageUrl);
    setItemNameToShare(itemName);
    setShareDialogOpen(true);
  };
  
  const handleDownloadImage = (imageUrl: string, itemName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${itemName || 'food-vision-image'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "הורדת תמונה",
      description: "התמונה מורדת למחשב שלך",
    });
  };
  
  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "dish": return "מנה";
      case "cocktail": return "קוקטייל";
      case "drink": return "משקה";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>שגיאה בטעינת הגלריה</CardTitle>
        </CardHeader>
        <CardContent>
          <p>אירעה שגיאה בטעינת תמונות המנות שלך. אנא נסה שוב מאוחר יותר.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">הגלריה שלי</h1>
        
        {approvedItems.length > 0 && (
          <p className="text-muted-foreground">
            סך הכל {approvedItems.length} מנות מעובדות
          </p>
        )}
      </div>
      
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="gallery">תצוגת גלריה</TabsTrigger>
          <TabsTrigger value="grid">תצוגת רשת</TabsTrigger>
        </TabsList>
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם מנה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          
          <Select value={filterType || ""} onValueChange={(value) => setFilterType(value || null)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="סנן לפי סוג" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="dish">מנות</SelectItem>
              <SelectItem value="cocktail">קוקטיילים</SelectItem>
              <SelectItem value="drink">משקאות</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={sortBy} 
            onValueChange={(value) => setSortBy(value as "newest" | "oldest" | "alphabetical")}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="מיון לפי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">החדש ביותר</SelectItem>
              <SelectItem value="oldest">הישן ביותר</SelectItem>
              <SelectItem value="alphabetical">סדר אלפביתי</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {approvedItems.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>אין עדיין מנות מאושרות</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                טרם אושרו תמונות סופיות למנות שלך. כאשר תאשר את התוצרים המעובדים, הם יופיעו כאן בגלריה.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => navigate("/customer/submissions")}>
                לצפייה בהגשות שלך
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <TabsContent value="gallery" className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedItems.map((item) => (
                  <Card key={item.submission_id} className="overflow-hidden flex flex-col h-full">
                    <div 
                      className="aspect-square cursor-pointer relative"
                      onClick={() => navigate(`/customer/submissions/${item.submission_id}`)}
                    >
                      <img 
                        src={item.main_processed_image_url!}
                        alt={item.item_name_at_submission}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2">
                        {getItemTypeLabel(item.item_type)}
                      </Badge>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{item.item_name_at_submission}</CardTitle>
                    </CardHeader>
                    
                    <CardFooter className="pt-0 mt-auto flex justify-between">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.uploaded_at)}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => setSelectedImage(item.main_processed_image_url!)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDownloadImage(
                            item.main_processed_image_url!, 
                            item.item_name_at_submission
                          )}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleShareImage(
                            item.main_processed_image_url!,
                            item.item_name_at_submission
                          )}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="grid">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                {approvedItems.map((item) => (
                  <div 
                    key={item.submission_id} 
                    className="aspect-square relative group cursor-pointer rounded-md overflow-hidden"
                    onClick={() => setSelectedImage(item.main_processed_image_url!)}
                  >
                    <img 
                      src={item.main_processed_image_url!} 
                      alt={item.item_name_at_submission}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div>
                        <Badge className="mb-1" variant="secondary">
                          {getItemTypeLabel(item.item_type)}
                        </Badge>
                        <h3 className="text-white text-sm font-medium truncate">
                          {item.item_name_at_submission}
                        </h3>
                      </div>
                      
                      <div className="flex gap-1 self-end mt-auto">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(
                              item.main_processed_image_url!, 
                              item.item_name_at_submission
                            );
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareImage(
                              item.main_processed_image_url!,
                              item.item_name_at_submission
                            );
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
      
      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-[900px] p-1">
          <img 
            src={selectedImage!} 
            alt="תמונה מוגדלת"
            className="w-full h-full object-contain max-h-[80vh]"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                if (selectedImage) {
                  const item = approvedItems.find(i => i.main_processed_image_url === selectedImage);
                  if (item) {
                    handleDownloadImage(selectedImage, item.item_name_at_submission);
                  }
                }
              }}
            >
              <Download className="ml-2 h-4 w-4" />
              הורד
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                if (selectedImage) {
                  const item = approvedItems.find(i => i.main_processed_image_url === selectedImage);
                  if (item) {
                    handleShareImage(selectedImage, item.item_name_at_submission);
                    setSelectedImage(null);
                  }
                }
              }}
            >
              <Share2 className="ml-2 h-4 w-4" />
              שתף
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <ShareDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen}
        imageUrl={imageToShare || ''}
        itemName={itemNameToShare}
      />
    </div>
  );
}
