import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  Upload, 
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WireframeTestProps {
  clientId?: string;
  client?: Client;
}

export default function WireframeTest({ clientId, client }: WireframeTestProps = {}) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerValue, setTimerValue] = useState("00:00:00");
  const [showCosts, setShowCosts] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(0);
  const [showBackgroundImages, setShowBackgroundImages] = useState(false);
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeNotesTab, setActiveNotesTab] = useState("self"); // self, client, editor
  const [notesToSelf, setNotesToSelf] = useState("");
  const [notesToClient, setNotesToClient] = useState("");
  const [notesToEditor, setNotesToEditor] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Cost quantities state - initialize from client data
  const [gpt4Quantity, setGpt4Quantity] = useState(client?.ai_training_25_count || 0);
  const [claudeQuantity, setClaudeQuantity] = useState(client?.ai_training_15_count || 0);
  const [dalleQuantity, setDalleQuantity] = useState(client?.ai_training_5_count || 0);
  const [promptsQuantity, setPromptsQuantity] = useState(client?.ai_prompts_count || 0);
  
  // Image navigation state
  const [currentOriginalIndex, setCurrentOriginalIndex] = useState(0);
  const [currentProcessedIndex, setCurrentProcessedIndex] = useState(0);
  
  const queryClient = useQueryClient();

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          // Update display format
          const hours = Math.floor(newSeconds / 3600);
          const minutes = Math.floor((newSeconds % 3600) / 60);
          const seconds = newSeconds % 60;
          setTimerValue(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
          return newSeconds;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Update local state when client data changes
  useEffect(() => {
    if (client) {
      setGpt4Quantity(client.ai_training_25_count || 0);
      setClaudeQuantity(client.ai_training_15_count || 0);
      setDalleQuantity(client.ai_training_5_count || 0);
      setPromptsQuantity(client.ai_prompts_count || 0);
    }
  }, [client]);

  // Function to update client cost data in database
  const updateClientCostField = async (field: string, value: number) => {
    if (!clientId) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('clients')
        .update({ [field]: value })
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      
    } catch (error: any) {
      console.error('Error updating client cost field:', error);
      toast.error(`שגיאה בעדכון נתונים: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Cost update handlers with database synchronization
  const handleGpt4Change = async (newValue: number) => {
    setGpt4Quantity(newValue);
    await updateClientCostField('ai_training_25_count', newValue);
  };

  const handleClaudeChange = async (newValue: number) => {
    setClaudeQuantity(newValue);
    await updateClientCostField('ai_training_15_count', newValue);
  };

  const handleDalleChange = async (newValue: number) => {
    setDalleQuantity(newValue);
    await updateClientCostField('ai_training_5_count', newValue);
  };

  const handlePromptsChange = async (newValue: number) => {
    setPromptsQuantity(newValue);
    await updateClientCostField('ai_prompts_count', newValue);
  };

  // Timer control function
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  // Mock image arrays
  const originalImages = [
    "original1.jpg", "original2.jpg", "original3.jpg"
  ];
  const processedImages = [
    "processed1.jpg", "processed2.jpg"
  ];
  const backgroundImages = [
    "background1.jpg", "background2.jpg"
  ];

  // Mock data
  const submissions = [
    { id: 1, itemName: "חמבורגר טרופי", status: "בתהליך", originalImages: 3, processedImages: 2 },
    { id: 2, itemName: "קוקטייל מוהיטו", status: "הושלם", originalImages: 5, processedImages: 4 },
    { id: 3, itemName: "פיצה מרגריטה", status: "ממתין", originalImages: 2, processedImages: 0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Stats (3 squares) */}
        <div className="grid grid-cols-3 gap-6" data-testid="stats-section">
          <Card data-testid="stats-in-progress">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">בביצוע</div>
            </CardContent>
          </Card>
          <Card data-testid="stats-waiting">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">2</div>
              <div className="text-sm text-gray-600">ממתינות</div>
            </CardContent>
          </Card>
          <Card data-testid="stats-completed">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="text-sm text-gray-600">הושלמו</div>
            </CardContent>
          </Card>
        </div>

        {/* Costs Section - Vertical Layout */}
        <Card data-testid="costs-section">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">עלויות ותזמון</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCosts(!showCosts)}
                data-testid="costs-toggle"
              >
                {showCosts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {showCosts && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* AI Training Costs - Single Row Layout */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col items-center space-y-1" data-testid="gpt4-control">
                    <span className="text-gray-600 text-xs text-center">אימוני AI (2.5$)</span>
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => handleGpt4Change(Math.max(0, gpt4Quantity - 1))}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        data-testid="gpt4-decrement"
                        disabled={isUpdating}
                      >
                        ▼
                      </button>
                      <span className="px-2 py-0.5 text-xs min-w-[30px] text-center" data-testid="gpt4-quantity">{gpt4Quantity}</span>
                      <button 
                        onClick={() => handleGpt4Change(gpt4Quantity + 1)}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        data-testid="gpt4-increment"
                        disabled={isUpdating}
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1" data-testid="claude-control">
                    <span className="text-gray-600 text-xs text-center">אימוני AI (1.5$)</span>
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => handleClaudeChange(Math.max(0, claudeQuantity - 1))}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        disabled={isUpdating}
                        data-testid="claude-decrement"
                      >
                        ▼
                      </button>
                      <span className="px-2 py-0.5 text-xs min-w-[30px] text-center" data-testid="claude-quantity">{claudeQuantity}</span>
                      <button 
                        onClick={() => handleClaudeChange(claudeQuantity + 1)}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        disabled={isUpdating}
                        data-testid="claude-increment"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-1" data-testid="dalle-control">
                    <span className="text-gray-600 text-xs text-center">אימוני AI (5$)</span>
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => handleDalleChange(Math.max(0, dalleQuantity - 1))}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        disabled={isUpdating}
                        data-testid="dalle-decrement"
                      >
                        ▼
                      </button>
                      <span className="px-2 py-0.5 text-xs min-w-[30px] text-center" data-testid="dalle-quantity">{dalleQuantity}</span>
                      <button 
                        onClick={() => handleDalleChange(dalleQuantity + 1)}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        disabled={isUpdating}
                        data-testid="dalle-increment"
                      >
                        ▲
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-1" data-testid="prompts-control">
                    <span className="text-gray-600 text-xs text-center">פרומפטים</span>
                    <div className="flex items-center border rounded">
                      <button 
                        onClick={() => handlePromptsChange(Math.max(0, promptsQuantity - 1))}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        disabled={isUpdating}
                        data-testid="prompts-decrement"
                      >
                        ▼
                      </button>
                      <span className="px-2 py-0.5 text-xs min-w-[30px] text-center" data-testid="prompts-quantity">{promptsQuantity}</span>
                      <button 
                        onClick={() => handlePromptsChange(promptsQuantity + 1)}
                        className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                        disabled={isUpdating}
                        data-testid="prompts-increment"
                      >
                        ▲
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Total Cost */}
                <div className="pt-3 border-t">
                  <div className="text-gray-600 font-medium">
                    סה"כ: ₪{(((gpt4Quantity * 2.5) + (claudeQuantity * 1.5) + (dalleQuantity * 5) + (promptsQuantity * 0.165)) * 3.6).toFixed(2)}
                  </div>
                </div>

                {/* Work Timer */}
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <select className="text-xs px-2 py-1 border rounded">
                      <option>עיצוב</option>
                      <option>עריכה</option>
                      <option>בדיקה</option>
                    </select>
                    <Input 
                      placeholder="תיאור עבודה" 
                      className="text-xs h-8 flex-1"
                    />
                    <Button
                      size="sm"
                      variant={isTimerRunning ? "destructive" : "default"}
                      onClick={toggleTimer}
                      className="text-xs px-2 py-1 h-8"
                      data-testid="timer-toggle"
                    >
                      {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded" data-testid="timer-display">
                      {timerValue}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Main Content - Submissions */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Submissions List (Sidebar) */}
          <Card className="col-span-3" data-testid="submissions-sidebar">
            <CardHeader>
              <CardTitle className="text-lg">הגשות</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {submissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className={`p-3 cursor-pointer border-r-4 ${
                      selectedSubmission === index 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'hover:bg-gray-50 border-transparent'
                    }`}
                    onClick={() => setSelectedSubmission(index)}
                    data-testid={`submission-item-${index}`}
                  >
                    <div className="font-medium text-sm" data-testid={`submission-name-${index}`}>{submission.itemName}</div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs" data-testid={`submission-status-${index}`}>
                        {submission.status}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {submission.originalImages} → {submission.processedImages}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <Card className="col-span-9" data-testid="main-content">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" data-testid="main-title">
                  {submissions[selectedSubmission]?.itemName}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackgroundImages(!showBackgroundImages)}
                    data-testid="background-toggle"
                  >
                    <ImageIcon className="h-4 w-4 ml-2" />
                    {showBackgroundImages ? "הסתר רקעים" : "הצג רקעים"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Images Section - Side by Side */}
              <div className="grid grid-cols-2 gap-8" data-testid="images-section">
                {/* Original Images */}
                <div data-testid="original-images">
                  <h3 className="font-medium mb-3">תמונות מקור</h3>
                  <div className="relative">
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    
                    {/* Navigation arrows for original images */}
                    {originalImages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={() => setCurrentOriginalIndex(currentOriginalIndex === 0 ? originalImages.length - 1 : currentOriginalIndex - 1)}
                          data-testid="original-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={() => setCurrentOriginalIndex(currentOriginalIndex === originalImages.length - 1 ? 0 : currentOriginalIndex + 1)}
                          data-testid="original-next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Image counter */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {currentOriginalIndex + 1} / {originalImages.length}
                    </div>
                  </div>
                </div>

                {/* Processed Images */}
                <div data-testid="processed-images">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">תמונות מעובדות</h3>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 ml-2" />
                      הוסף תמונה
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-green-600" />
                    </div>
                    
                    {/* Navigation arrows for processed images */}
                    {processedImages.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={() => setCurrentProcessedIndex(currentProcessedIndex === 0 ? processedImages.length - 1 : currentProcessedIndex - 1)}
                          data-testid="processed-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={() => setCurrentProcessedIndex(currentProcessedIndex === processedImages.length - 1 ? 0 : currentProcessedIndex + 1)}
                          data-testid="processed-next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {/* Image counter */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {currentProcessedIndex + 1} / {processedImages.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Images Toggle */}
              {showBackgroundImages && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-600">תמונות רקע להשוואה</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {backgroundImages.map((_, i) => (
                      <div key={i} className="aspect-video bg-purple-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-purple-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section - Tabbed */}
              <div data-testid="notes-section">
                <Tabs value={activeNotesTab} onValueChange={setActiveNotesTab} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="self" data-testid="notes-tab-self">הערה לעצמי</TabsTrigger>
                    <TabsTrigger value="client" data-testid="notes-tab-client">הערה ללקוח</TabsTrigger>
                    <TabsTrigger value="editor" data-testid="notes-tab-editor">הערה לעורך</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="self" className="mt-4" data-testid="notes-content-self">
                    <Textarea
                      placeholder="הערות אישיות להגשה..."
                      value={notesToSelf}
                      onChange={(e) => setNotesToSelf(e.target.value)}
                      className="min-h-[80px] resize-none"
                      data-testid="notes-textarea-self"
                    />
                  </TabsContent>
                  
                  <TabsContent value="client" className="mt-4" data-testid="notes-content-client">
                    <Textarea
                      placeholder="הערות ללקוח..."
                      value={notesToClient}
                      onChange={(e) => setNotesToClient(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                  </TabsContent>
                  
                  <TabsContent value="editor" className="mt-4" data-testid="notes-content-editor">
                    <Textarea
                      placeholder="הערות לעורך..."
                      value={notesToEditor}
                      onChange={(e) => setNotesToEditor(e.target.value)}
                      className="min-h-[80px] resize-none"
                      data-testid="notes-textarea-editor"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              {/* LORA Details */}
              <div>
                <h3 className="font-medium mb-3">פרטי LORA</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="שם LORA" />
                  <Input placeholder="מזהה LORA" />
                  <Input placeholder="קישור LORA" className="col-span-2" />
                  <Textarea placeholder="Prompt קבוע" className="col-span-2 min-h-[60px]" />
                </div>
              </div>

              <Separator />

              {/* Collapsible Submission Details */}
              <div data-testid="submission-details-section">
                <Button
                  variant="ghost"
                  onClick={() => setShowSubmissionDetails(!showSubmissionDetails)}
                  className="w-full justify-between p-0 h-auto"
                  data-testid="submission-details-toggle"
                >
                  <span className="font-medium">פרטי הגשה ולקוח</span>
                  {showSubmissionDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showSubmissionDetails && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg" data-testid="submission-details-content">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">פרטי לקוח</div>
                        <div className="text-gray-600 mt-1" data-testid="client-name">שם: מסעדת הגן</div>
                        <div className="text-gray-600" data-testid="client-phone">טלפון: 03-1234567</div>
                      </div>
                      <div>
                        <div className="font-medium">פרטי הגשה</div>
                        <div className="text-gray-600 mt-1">תאריך: 13/06/2025</div>
                        <div className="text-gray-600">סטטוס: בתהליך</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="font-medium text-sm mb-2">היסטוריית סטטוס</div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>• נקלט - 13/06/2025 09:30</div>
                        <div>• בתהליך - 13/06/2025 10:15</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action History */}
              <div>
                <h3 className="font-medium mb-4">היסטוריית פעולות</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">הועלו תמונות מעובדות</span>
                        <span className="text-xs text-gray-500">13/06/2025 14:30</span>
                      </div>
                      <p className="text-xs text-gray-600">הועלו 2 תמונות מעובדות חדשות עבור חמבורגר טרופי</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">סטטוס עודכן</span>
                        <span className="text-xs text-gray-500">13/06/2025 10:15</span>
                      </div>
                      <p className="text-xs text-gray-600">סטטוס ההגשה עודכן מ"ממתין" ל"בתהליך"</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">הגשה נקלטה</span>
                        <span className="text-xs text-gray-500">13/06/2025 09:30</span>
                      </div>
                      <p className="text-xs text-gray-600">הגשה חדשה נקלטה במערכת עם 3 תמונות מקור</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">הערה נוספה</span>
                        <span className="text-xs text-gray-500">13/06/2025 11:45</span>
                      </div>
                      <p className="text-xs text-gray-600">נוספה הערה חדשה ללקוח בנוגע לסגנון הרצוי</p>
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 