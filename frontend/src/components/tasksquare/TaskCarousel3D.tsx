import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../../hooks/useTasks';
import { TaskCard3D } from './TaskCard3D';

interface TaskCarousel3DProps {
  tasks: Task[];
}

export function TaskCarousel3D({ tasks }: TaskCarousel3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    const threshold = 50; // Lower threshold for easier triggering
    
    if (diff > threshold && activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (diff < -threshold && activeIndex < tasks.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      } else if (e.key === 'ArrowRight' && activeIndex < tasks.length - 1) {
        setActiveIndex(activeIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, tasks.length]);

  // Wheel navigation with debounce
  useEffect(() => {
    let wheelTimeout: NodeJS.Timeout;
    
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;
      
      e.preventDefault();
      
      // Debounce: avoid triggering too fast
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 20 && activeIndex < tasks.length - 1) {
          setActiveIndex(activeIndex + 1);
        } else if (e.deltaY < -20 && activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        }
      }, 50);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
        clearTimeout(wheelTimeout);
      };
    }
  }, [activeIndex, tasks.length]);

  if (tasks.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🔍</div>
        <h3 style={styles.emptyTitle}>NO TASKS FOUND</h3>
        <p style={styles.emptyText}>
          Try adjusting your filters or be the first to publish a task
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div
        ref={containerRef}
        style={{
          ...styles.carouselWrapper,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={styles.perspective}>
          {tasks.map((task, index) => (
            <TaskCard3D
              key={task.taskId}
              task={task}
              index={index}
              activeIndex={activeIndex}
              totalCards={tasks.length}
            />
          ))}
        </div>
        
        {/* Drag hint */}
        {!isDragging && tasks.length > 1 && (
          <div style={styles.dragHint}>
            ← DRAG TO BROWSE →
          </div>
        )}
      </div>

      {/* Navigation Indicators */}
      <div style={styles.indicators}>
        {tasks.map((_, index) => (
          <button
            key={index}
            style={{
              ...styles.indicator,
              ...(index === activeIndex ? styles.indicatorActive : {}),
            }}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {activeIndex > 0 && (
        <button
          style={{ ...styles.navButton, ...styles.navButtonLeft }}
          onClick={() => setActiveIndex(activeIndex - 1)}
        >
          ‹
        </button>
      )}
      {activeIndex < tasks.length - 1 && (
        <button
          style={{ ...styles.navButton, ...styles.navButtonRight }}
          onClick={() => setActiveIndex(activeIndex + 1)}
        >
          ›
        </button>
      )}

      {/* Counter */}
      <div style={styles.counter}>
        {activeIndex + 1} / {tasks.length}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '600px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 'none',
  },
  carouselWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    userSelect: 'none',
    overflow: 'hidden',
    maxWidth: 'none',
  },
  perspective: {
    position: 'relative',
    width: '360px',
    height: '480px',
    maxWidth: 'none',
  },
  indicators: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    zIndex: 10,
  },
  indicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  indicatorActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: '24px',
    borderRadius: '4px',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '32px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
  },
  navButtonLeft: {
    left: '20px',
  },
  navButtonRight: {
    right: '20px',
  },
  counter: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: 'rgba(255, 255, 255, 0.5)',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '24px',
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: 0,
  },
  dragHint: {
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: 'rgba(255, 255, 255, 0.3)',
    animation: 'pulse 2s ease-in-out infinite',
    pointerEvents: 'none',
  },
};
