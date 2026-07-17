// src/hooks/useSwipeToClose.ts
import { useState, useRef, useEffect } from 'react';

interface UseSwipeToCloseProps {
  isOpen: boolean;
  onClose: () => void;
  threshold?: number; // порог закрытия в пикселях
}

export function useSwipeToClose({ isOpen, onClose, threshold = 100 }: UseSwipeToCloseProps) {
  const [offsetY, setOffsetY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setOffsetY(0);
    }
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startY.current = touch.clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    if (deltaY > 0) {
      setOffsetY(deltaY);
    } else {
      setOffsetY(0);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (offsetY > threshold) {
      onClose();
    } else {
      setOffsetY(0);
    }
  };

  const style = {
    transform: `translateY(${offsetY}px)`,
    transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
  };

  return {
    panelRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    style,
    offsetY,
  };
}