
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
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("submission_id", submissionId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }

  return data as Message[];
}

// Send a new message as client
export async function sendClientMessage(submissionId: string, content: string): Promise<Message> {
  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      submission_id: submissionId,
      sender_type: 'client',
      sender_id: user.id,
      content
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    throw error;
  }

  return data as Message;
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
