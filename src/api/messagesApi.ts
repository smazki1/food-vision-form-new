// This file has been temporarily disabled due to missing tables
// Will be restored when the messages table is created in the database

export interface Message {
  id: string;
  submission_id: string;
  content: string;
  sender_type: 'client' | 'admin';
  created_at: string;
}

export async function getSubmissionMessages(submissionId: string): Promise<Message[]> {
  // Placeholder implementation - will be connected to real API later
  console.warn('Messages API not implemented yet');
  return [];
}

export async function sendClientMessage(submissionId: string, content: string): Promise<Message> {
  // Placeholder implementation - will be connected to real API later
  console.warn('Messages API not implemented yet');
  return {
    id: Date.now().toString(),
    submission_id: submissionId,
    content,
    sender_type: 'client',
    created_at: new Date().toISOString()
  };
}

export const messagesAPI = {
  async placeholder() {
    return { success: true, message: 'Messages API placeholder' };
  }
};
