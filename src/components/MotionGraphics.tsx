import React, { useEffect, useRef, useState } from 'react';

/**
 * 1. ScrollReveal — Pro IntersectionObserver Scroll-Triggered Entrance Animation
 * Animates children with spring physics (fade-up, fade-left, fade-right, zoom-in)
 * and optional blur-to-crisp transition when scrolled into the viewport.
 */
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-up';
  delayMs?: number;
  durationMs?: number;
  threshold?: number;
}> = ({
  children,
  className = '',
  variant = 'fade-up',
  delayMs = 0,
  durationMs = 800,
  threshold = 0.14,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState<boolean>(() => {
      if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
        return true;
      }
      return false;
    });

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      if (typeof IntersectionObserver === 'undefined') {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold, rootMargin: '0px 0px -40px 0px' }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [threshold]);

    const hiddenTransform = {
      'fade-up': 'translate3d(0, 36px, 0) scale(0.985)',
      'fade-left': 'translate3d(-36px, 0, 0) scale(0.985)',
      'fade-right': 'translate3d(36px, 0, 0) scale(0.985)',
      'scale-up': 'translate3d(0, 20px, 0) scale(0.94)',
    }[variant];

    return (
      <div
        ref={ref}
        className={className}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : hiddenTransform,
          filter: isVisible ? 'blur(0px)' : 'blur(4px)',
          transitionProperty: 'opacity, transform, filter',
          transitionDuration: `${durationMs}ms`,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: `${delayMs}ms`,
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </div>
    );
  };

/**
 * 2. AnimatedCounter — Smoothly counts numbers up with easing when scrolled into view
 */
export const AnimatedCounter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  durationMs = 1350,
  className = '',
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [displayValue, setDisplayValue] = useState<number>(value);
    const [hasAnimated, setHasAnimated] = useState<boolean>(false);

    useEffect(() => {
      const el = ref.current;
      if (!el || typeof IntersectionObserver === 'undefined' || hasAnimated) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setHasAnimated(true);
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [hasAnimated]);

    useEffect(() => {
      if (!hasAnimated) return;
      let animationFrameId: number;
      const startTime = performance.now();
      const startVal = 0;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease-out expo curve for pro financial counter feel
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setDisplayValue(startVal + (value - startVal) * eased);
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(tick);
        } else {
          setDisplayValue(value);
        }
      };

      animationFrameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animationFrameId);
    }, [hasAnimated, value, durationMs]);

    const formatted = displayValue.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return (
      <span ref={ref} className={`tabular-nums ${className}`}>
        {prefix}
        {formatted}
        {suffix}
      </span>
    );
  };

/**
 * 3. Interactive3DTiltCard — Subtle Pro 3D Perspective Hover & Soft Spotlight Glare
 */
export const Interactive3DTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}> = ({ children, className = '', intensity = 4.5 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>(
    'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  );
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    setTransformStyle(
      `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`
    );
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.14,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.6), transparent 60%)`,
        }}
      />
    </div>
  );
};
