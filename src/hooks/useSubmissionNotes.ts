import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubmissionNote {
  id: string;
  type: 'admin_internal' | 'client_visible' | 'editor_note';
  text: string;
  created_at: string;
  updated_at: string;
}

export const useSubmissionNotes = (submissionId: string | null) => {
  const [notes, setNotes] = useState<{
    admin_internal: string;
    client_visible: string;
    editor_note: string;
  }>({
    admin_internal: '',
    client_visible: '',
    editor_note: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notes for the submission
  const fetchNotes = async () => {
    if (!submissionId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('submission_comments')
        .select('comment_type, comment_text, updated_at')
        .eq('submission_id', submissionId)
        .in('comment_type', ['admin_internal', 'client_visible', 'editor_note'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get the latest note for each type
      const latestNotes = {
        admin_internal: '',
        client_visible: '',
        editor_note: ''
      };

      data?.forEach(note => {
        if (!latestNotes[note.comment_type as keyof typeof latestNotes]) {
          latestNotes[note.comment_type as keyof typeof latestNotes] = note.comment_text;
        }
      });

      setNotes(latestNotes);
    } catch (error) {
      console.error('Error fetching submission notes:', error);
      toast.error('שגיאה בטעינת הערות');
    } finally {
      setIsLoading(false);
    }
  };

  // Save or update a note
  const saveNote = async (type: 'admin_internal' | 'client_visible' | 'editor_note', text: string) => {
    if (!submissionId) return;
    
    setIsSaving(true);
    try {
      // Check if note already exists
      const { data: existingNote } = await supabase
        .from('submission_comments')
        .select('comment_id')
        .eq('submission_id', submissionId)
        .eq('comment_type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from('submission_comments')
          .update({
            comment_text: text,
            updated_at: new Date().toISOString()
          })
          .eq('comment_id', existingNote.comment_id);

        if (error) throw error;
      } else {
        // Create new note
        const { error } = await supabase
          .from('submission_comments')
          .insert({
            submission_id: submissionId,
            comment_type: type,
            comment_text: text,
            visibility: type === 'client_visible' ? 'client' : 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Update local state
      setNotes(prev => ({
        ...prev,
        [type]: text
      }));

      // Show success message based on note type
      const typeLabels = {
        admin_internal: 'הערה לעצמי',
        client_visible: 'הערה ללקוח', 
        editor_note: 'הערה לעורך'
      };
      
      toast.success(`${typeLabels[type]} נשמרה בהצלחה`);
    } catch (error) {
      console.error('Error saving submission note:', error);
      toast.error('שגיאה בשמירת הערה');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save with debounce
  const [saveTimeouts, setSaveTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({});

  const updateNote = (type: 'admin_internal' | 'client_visible' | 'editor_note', text: string) => {
    // Update local state immediately
    setNotes(prev => ({
      ...prev,
      [type]: text
    }));

    // Clear existing timeout for this note type
    if (saveTimeouts[type]) {
      clearTimeout(saveTimeouts[type]);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      saveNote(type, text);
    }, 1000); // Save after 1 second of no typing

    setSaveTimeouts(prev => ({
      ...prev,
      [type]: timeout
    }));
  };

  // Fetch notes when submission changes
  useEffect(() => {
    fetchNotes();
  }, [submissionId]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [saveTimeouts]);

  return {
    notes,
    isLoading,
    isSaving,
    updateNote,
    saveNote,
    fetchNotes
  };
}; 