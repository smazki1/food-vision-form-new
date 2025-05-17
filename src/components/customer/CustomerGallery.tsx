
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUserId } from "@/hooks/useSupabaseUserId";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Share2, Search, Filter } from "lucide-react";
import { ShareDialog } from "./ShareDialog";

export function CustomerGallery() {
  const { userId } = useSupabaseUserId();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageToShare, setImageToShare] = useState<string | null>(null);
  const [itemNameToShare, setItemNameToShare] = useState<string>("");

  // Fetch approved submissions for the gallery
  const { data: galleryItems, isLoading } = useQuery({
    queryKey: ["gallery-items", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: client } = await supabase
        .from("clients")
        .select("client_id")
        .eq("user_auth_id", userId)
        .single();
      
      if (!client) return [];
      
      const { data: submissions } = await supabase
        .from("customer_submissions")
        .select("*")
        .eq("client_id", client.client_id)
        .eq("submission_status", "הושלמה ואושרה")
        .order("final_approval_timestamp", { ascending: false });
      
      return submissions || [];
    },
    enabled: !!userId
  });

  const handleShare = (imageUrl: string, itemName: string) => {
    setImageToShare(imageUrl);
    setItemNameToShare(itemName);
    setShareDialogOpen(true);
  };

  const handleDownload = (imageUrl: string, itemName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${itemName || 'food-vision-image'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort the gallery items
  const filteredItems = galleryItems?.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.item_name_at_submission.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || item.item_type === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  // Sort the filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.final_approval_timestamp || b.uploaded_at).getTime() - 
        new Date(a.final_approval_timestamp || a.uploaded_at).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.final_approval_timestamp || a.uploaded_at).getTime() - 
        new Date(b.final_approval_timestamp || b.uploaded_at).getTime();
    } else if (sortBy === "name-asc") {
      return a.item_name_at_submission.localeCompare(b.item_name_at_submission);
    } else if (sortBy === "name-desc") {
      return b.item_name_at_submission.localeCompare(a.item_name_at_submission);
    }
    return 0;
  });

  // Get unique item types for filter
  const itemTypes = Array.from(new Set(galleryItems?.map(item => item.item_type) || []));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הגלריה שלי</h1>
        <p className="text-muted-foreground">כל התמונות המאושרות שלך במקום אחד</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-auto flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש לפי שם מנה..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedType || ""}
            onValueChange={(value) => setSelectedType(value || null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="סנן לפי סוג" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              {itemTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="מיין לפי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">החדש ביותר</SelectItem>
              <SelectItem value="oldest">הישן ביותר</SelectItem>
              <SelectItem value="name-asc">לפי שם (א-ת)</SelectItem>
              <SelectItem value="name-desc">לפי שם (ת-א)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square w-full bg-muted"></div>
              <CardFooter className="p-4">
                <div className="w-2/3 h-4 bg-muted rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sortedItems.map((item) => (
            <Card key={item.submission_id} className="overflow-hidden group">
              <div className="relative aspect-square w-full">
                <img
                  src={item.main_processed_image_url || (item.processed_image_urls?.[0] || "")}
                  alt={item.item_name_at_submission}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(item.main_processed_image_url || (item.processed_image_urls?.[0] || ""))}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleDownload(
                      item.main_processed_image_url || (item.processed_image_urls?.[0] || ""), 
                      item.item_name_at_submission
                    )}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleShare(
                      item.main_processed_image_url || (item.processed_image_urls?.[0] || ""),
                      item.item_name_at_submission
                    )}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardFooter className="p-3 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{item.item_name_at_submission}</h3>
                  <p className="text-sm text-muted-foreground">{item.item_type}</p>
                </div>
                {item.processed_image_urls && item.processed_image_urls.length > 1 && (
                  <div className="text-xs text-muted-foreground">
                    +{item.processed_image_urls.length - 1} תמונות נוספות
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <h3 className="text-lg font-medium">אין תמונות בגלריה</h3>
          <p className="text-muted-foreground mt-2">
            עדיין אין מנות מאושרות בגלריה שלך. לאחר שתאשר את המנות המעובדות, הן יופיעו כאן.
          </p>
        </div>
      )}

      {/* Image preview dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="sm:max-w-[900px] p-1">
            <img
              src={selectedImage}
              alt="תמונה מוגדלת"
              className="w-full h-full object-contain max-h-[80vh]"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Share dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        imageUrl={imageToShare || ""}
        itemName={itemNameToShare}
      />
    </div>
  );
}
