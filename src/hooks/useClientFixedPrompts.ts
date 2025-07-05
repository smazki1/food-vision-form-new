import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FixedPrompt {
  id: string;
  title: string;
  content: string;
  isVisible: boolean;
  createdAt: string;
}

interface UseClientFixedPromptsResult {
  fixedPrompts: FixedPrompt[];
  combinedPrompt: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useClientFixedPrompts = (clientId: string): UseClientFixedPromptsResult => {
  const { data: clientData, isLoading, error, refetch } = useQuery({
    queryKey: ['client-fixed-prompts', clientId],
    queryFn: async () => {
      if (!clientId) {
        return { fixedPrompts: [], combinedPrompt: '' };
      }

      const { data, error } = await supabase
        .from('clients')
        .select('internal_notes')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;

      let fixedPrompts: FixedPrompt[] = [];
      
      if (data?.internal_notes) {
        try {
          const parsed = JSON.parse(data.internal_notes);
          if (parsed.fixedPrompts && Array.isArray(parsed.fixedPrompts)) {
            fixedPrompts = parsed.fixedPrompts;
          }
        } catch (e) {
          console.warn('Failed to parse client internal_notes:', e);
        }
      }

      // Create combined prompt from all visible prompts
      const visiblePrompts = fixedPrompts.filter(prompt => prompt.isVisible && prompt.content.trim());
      const combinedPrompt = visiblePrompts
        .map(prompt => {
          const header = prompt.title ? `// ${prompt.title}\n` : '';
          return header + prompt.content.trim();
        })
        .join('\n\n');

      return {
        fixedPrompts,
        combinedPrompt
      };
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    fixedPrompts: clientData?.fixedPrompts || [],
    combinedPrompt: clientData?.combinedPrompt || '',
    isLoading,
    error: error as Error | null,
    refetch
  };
}; 