
import { useState, useEffect, useCallback } from 'react';

export type LoadingPhase = 'initial' | 'authenticating' | 'fetching' | 'processing' | 'complete' | 'error';

interface UseProgressiveLoadingOptions {
  phases: LoadingPhase[];
  phaseDurations?: Record<LoadingPhase, number>;
  onPhaseChange?: (phase: LoadingPhase) => void;
  autoAdvance?: boolean;
}

export function useProgressiveLoading({
  phases,
  phaseDurations = {
    initial: 500,
    authenticating: 1000,
    fetching: 1500,
    processing: 2000,
    complete: 0,
    error: 0
  },
  onPhaseChange,
  autoAdvance = false
}: UseProgressiveLoadingOptions) {
  const [currentPhase, setCurrentPhase] = useState<LoadingPhase>(phases[0] || 'initial');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const messages: Record<LoadingPhase, string> = {
    initial: 'מאתחל...',
    authenticating: 'מאמת זהות...',
    fetching: 'טוען נתונים...',
    processing: 'מעבד מידע...',
    complete: 'הושלם',
    error: 'שגיאה'
  };

  const nextPhase = useCallback(() => {
    if (phaseIndex < phases.length - 1) {
      const newIndex = phaseIndex + 1;
      const newPhase = phases[newIndex];
      setPhaseIndex(newIndex);
      setCurrentPhase(newPhase);
      setProgress((newIndex / (phases.length - 1)) * 100);
      onPhaseChange?.(newPhase);
    }
  }, [phaseIndex, phases, onPhaseChange]);

  const goToPhase = useCallback((phase: LoadingPhase) => {
    const index = phases.indexOf(phase);
    if (index !== -1) {
      setPhaseIndex(index);
      setCurrentPhase(phase);
      setProgress((index / (phases.length - 1)) * 100);
      onPhaseChange?.(phase);
      
      if (phase === 'complete' || phase === 'error') {
        setIsLoading(false);
      }
    }
  }, [phases, onPhaseChange]);

  const reset = useCallback(() => {
    setCurrentPhase(phases[0] || 'initial');
    setPhaseIndex(0);
    setProgress(0);
    setIsLoading(true);
  }, [phases]);

  // Auto-advance through phases if enabled
  useEffect(() => {
    if (!autoAdvance || !isLoading) return;

    const duration = phaseDurations[currentPhase];
    if (duration > 0 && phaseIndex < phases.length - 1) {
      const timer = setTimeout(nextPhase, duration);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, phaseIndex, autoAdvance, isLoading, nextPhase, phaseDurations, phases.length]);

  return {
    currentPhase,
    phaseIndex,
    progress,
    isLoading,
    message: messages[currentPhase],
    nextPhase,
    goToPhase,
    reset,
    isLastPhase: phaseIndex >= phases.length - 1
  };
}
