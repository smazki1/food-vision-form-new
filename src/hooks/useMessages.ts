
import { useState, useEffect } from "react";
import { getSubmissionMessages, sendClientMessage, Message } from "@/api/messagesApi";

export function useMessages(submissionId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      if (!submissionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const messagesData = await getSubmissionMessages(submissionId);
        setMessages(messagesData);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch messages"));
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [submissionId]);

  const sendMessage = async (content: string) => {
    if (!submissionId || !content.trim()) return null;

    try {
      const newMessage = await sendClientMessage(submissionId, content);
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err : new Error("Failed to send message"));
      return null;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}
