

import { useRef, useState, useCallback, useEffect } from 'react';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  itemWidth?: number; // scroll amount per arrow click
  showArrows?: boolean;
}

export default function HorizontalScroll({
  children,
  className = '',
  itemWidth = 300,
  showArrows = true,
}: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkScroll]);

  const scrollBy = (dir: number) => {
    containerRef.current?.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
  };

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX;
    scrollLeft.current = containerRef.current?.scrollLeft ?? 0;
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 3) hasMoved.current = true;
    containerRef.current.scrollLeft = scrollLeft.current - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Prevent click after drag
  const onClickCapture = (e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-neon-border shadow-md text-neon-text hover:bg-white transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
          aria-label="왼쪽으로 스크롤"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scroll Container */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-neon-border shadow-md text-neon-text hover:bg-white transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
          aria-label="오른쪽으로 스크롤"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Hide scrollbar CSS */}
      <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
}

export function ScrollItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-none snap-start ${className}`}>
      {children}
    </div>
  );
}
