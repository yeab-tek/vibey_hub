"use client";

import { useRef, useCallback } from "react";

interface UseCompositionOptions<T extends HTMLElement> {
  onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  onCompositionStart?: (e: React.CompositionEvent<T>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<T>) => void;
}

/**
 * Handles IME (Input Method Editor) composition events for CJK languages.
 * Prevents Enter key from firing during or just after composition.
 */
export function useComposition<T extends HTMLElement>({
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
}: UseCompositionOptions<T>) {
  const isComposing = useRef(false);

  const handleCompositionStart = useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposing.current = true;
      onCompositionStart?.(e);
    },
    [onCompositionStart]
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposing.current = false;
      onCompositionEnd?.(e);
    },
    [onCompositionEnd]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<T>) => {
      if (isComposing.current) return;
      onKeyDown?.(e);
    },
    [onKeyDown]
  );

  return {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  };
}
