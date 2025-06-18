
import { supabase } from "@/integrations/supabase/client";

export type Message = {
  message_id: string;
  submission_id: string;
  sender_type: 'client' | 'team';
  sender_id: string;
  content: string;
  timestamp: string;
  read_status: boolean;
};

// Get all messages for a specific submission
export async function getSubmissionMessages(submissionId: string): Promise<Message[]> {
  try {
    // Use submission_comments table with proper mapping
  const { data, error } = await supabase
      .from("submission_comments")
    .select("*")
    .eq("submission_id", submissionId)
      .in("comment_type", ["client_visible"])
      .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        console.warn('submission_comments table does not exist - returning empty messages');
        return [];
      }
    throw error;
  }

    // Map submission_comments to Message format
    return (data || []).map(comment => ({
      message_id: comment.comment_id,
      submission_id: comment.submission_id,
      sender_type: comment.comment_type === 'client_visible' ? 'client' : 'team',
      sender_id: comment.created_by || '',
      content: comment.comment_text,
      timestamp: comment.created_at,
      read_status: true
    })) as Message[];
  } catch (error) {
    console.error("Error in getSubmissionMessages:", error);
    return [];
  }
}

// Send a new message as client
export async function sendClientMessage(submissionId: string, content: string): Promise<Message> {
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("submission_comments")
    .insert({
      submission_id: submissionId,
      comment_type: 'client_visible',
      comment_text: content,
      visibility: 'admin',
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw error;
  }

  // Map back to Message format
  return {
    message_id: data.comment_id,
    submission_id: data.submission_id,
    sender_type: 'client',
    sender_id: data.created_by || '',
    content: data.comment_text,
    timestamp: data.created_at,
    read_status: true
  } as Message;
}

// Mark message as read
export async function markMessageAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ read_status: true })
    .eq("message_id", messageId);

  if (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}
