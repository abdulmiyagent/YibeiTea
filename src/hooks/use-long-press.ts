import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // ms before triggering long press
  hapticFeedback?: boolean;
}

interface UseLongPressResult {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  isPressed: boolean;
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 300,
  hapticFeedback = true,
}: UseLongPressOptions): UseLongPressResult {
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressed(false);

      // Trigger haptic feedback on supported devices
      if (hapticFeedback && "vibrate" in navigator) {
        navigator.vibrate(10);
      }

      onLongPress();
    }, threshold);
  }, [onLongPress, threshold, hapticFeedback]);

  const stop = useCallback(
    (shouldTriggerClick = true) => {
      setIsPressed(false);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (shouldTriggerClick && !isLongPressRef.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  const cancel = useCallback(() => {
    stop(false);
  }, [stop]);

  return {
    onMouseDown: start,
    onMouseUp: () => stop(true),
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: () => stop(true),
    isPressed,
  };
}
