/*
 * ©AngelaMos | 2025
 */

interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fill?: 'forwards' | 'backwards' | 'both' | 'none';
}

interface SpringConfig {
  tension: number;
  friction: number;
  mass?: number;
}

export const fadeInUp = (
  element: HTMLElement,
  config: Partial<AnimationConfig> = {},
) => {
  const defaultConfig: AnimationConfig = {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0,
    fill: 'forwards',
  };

  const finalConfig = { ...defaultConfig, ...config };

  const keyframes = [
    {
      opacity: 0,
      transform: 'translateY(20px)',
      filter: 'blur(2px)',
    },
    {
      opacity: 1,
      transform: 'translateY(0px)',
      filter: 'blur(0px)',
    },
  ];

  return element.animate(keyframes, {
    duration: finalConfig.duration,
    easing: finalConfig.easing,
    delay: finalConfig.delay,
    fill: finalConfig.fill,
  });
};

// I'm implementing staggered animations for list items and grids
export const staggeredFadeIn = (
  elements: HTMLElement[],
  staggerDelay: number = 100,
) => {
  return elements.map((element, index) =>
    fadeInUp(element, { delay: index * staggerDelay }),
  );
};

// I'm creating eerie glow effects for interactive elements
export const pulseGlow = (
  element: HTMLElement,
  color: string = '#22d3ee',
) => {
  const keyframes = [
    {
      boxShadow: `0 0 0 0 ${color}00`,
      transform: 'scale(1)',
    },
    {
      boxShadow: `0 0 0 8px ${color}40`,
      transform: 'scale(1.02)',
    },
    {
      boxShadow: `0 0 0 16px ${color}00`,
      transform: 'scale(1)',
    },
  ];

  return element.animate(keyframes, {
    duration: 2000,
    easing: 'ease-in-out',
    iterations: Infinity,
  });
};

// I'm implementing smooth morphing transitions
export const morphTransition = (
  element: HTMLElement,
  fromState: Partial<CSSStyleDeclaration>,
  toState: Partial<CSSStyleDeclaration>,
  config: Partial<AnimationConfig> = {},
) => {
  const defaultConfig: AnimationConfig = {
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards',
  };

  const finalConfig = { ...defaultConfig, ...config };

  // I'm building keyframes from the state objects
  const keyframes = [
    Object.fromEntries(
      Object.entries(fromState).map(([key, value]) => [key, value]),
    ),
    Object.fromEntries(
      Object.entries(toState).map(([key, value]) => [key, value]),
    ),
  ];

  return element.animate(keyframes, finalConfig);
};

// I'm creating typing animation for code/terminal effects
export const typewriterEffect = async (
  element: HTMLElement,
  text: string,
  speed: number = 50,
  cursor: boolean = true,
) => {
  element.textContent = '';

  if (cursor) {
    element.style.borderRight = '2px solid #22d3ee';
    element.style.animation = 'blink 1s infinite';
  }

  for (let i = 0; i <= text.length; i++) {
    element.textContent = text.slice(0, i);
    await new Promise((resolve) => setTimeout(resolve, speed));
  }

  if (cursor) {
    setTimeout(() => {
      element.style.borderRight = 'none';
      element.style.animation = 'none';
    }, 500);
  }
};

// I'm implementing parallax scroll effects for depth
export const createParallaxScroll = (
  elements: { element: HTMLElement; speed: number }[],
) => {
  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.pageYOffset;

    elements.forEach(({ element, speed }) => {
      const yPos = -(scrollY * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });

    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });

  return () => window.removeEventListener('scroll', requestTick);
};

// I'm creating smooth spring animations for interactive feedback
export const springAnimation = (
  element: HTMLElement,
  property: string,
  targetValue: number,
  config: SpringConfig = { tension: 280, friction: 60, mass: 1 },
) => {
  const { tension, friction, mass = 1 } = config;

  let currentValue = 0;
  let velocity = 0;
  let startTime: number;

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp;

    const spring = -tension * (currentValue - targetValue);
    const damper = -friction * velocity;
    const acceleration = (spring + damper) / mass;

    velocity += acceleration * 0.016; // 60fps
    currentValue += velocity * 0.016;

    // I'm applying the animated value to the element
    (element.style as any)[property] = `${currentValue}px`;

    // Continue animation if not settled
    if (
      Math.abs(velocity) > 0.01 ||
      Math.abs(currentValue - targetValue) > 0.01
    ) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

// I'm creating matrix-style digital rain effect for backgrounds
export const createMatrixRain = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!;

  // I'm setting up the matrix configuration
  const matrix =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}';
  const matrixArray = matrix.split('');

  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops: number[] = Array(Math.floor(columns)).fill(1);

  const draw = () => {
    // I'm creating the trailing effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#22d3ee';
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text =
        matrixArray[Math.floor(Math.random() * matrixArray.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  };

  const interval = setInterval(draw, 35);

  return () => clearInterval(interval);
};

// I'm implementing smooth page transitions
export const pageTransition = {
  enter: (element: HTMLElement) => {
    return fadeInUp(element, { duration: 600, delay: 100 });
  },

  exit: (element: HTMLElement) => {
    const keyframes = [
      {
        opacity: 1,
        transform: 'translateY(0px)',
        filter: 'blur(0px)',
      },
      {
        opacity: 0,
        transform: 'translateY(-20px)',
        filter: 'blur(1px)',
      },
    ];

    return element.animate(keyframes, {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    });
  },
};

// I'm creating hover animations for interactive elements
export const hoverAnimations = {
  lift: (element: HTMLElement) => {
    element.style.transition = 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

    const handleMouseEnter = () => {
      element.style.transform = 'translateY(-2px)';
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translateY(0px)';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  },

  glow: (element: HTMLElement, color: string = '#22d3ee') => {
    element.style.transition = 'box-shadow 0.3s ease-in-out';

    const handleMouseEnter = () => {
      element.style.boxShadow = `0 0 20px ${color}40`;
    };

    const handleMouseLeave = () => {
      element.style.boxShadow = 'none';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  },
};

// I'm adding global CSS animations via JavaScript
export const injectGlobalAnimations = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blink {
        0%, 50% { border-color: transparent; }
        51%, 100% { border-color: #22d3ee; }
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }

    @keyframes pulse-slow {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 0.4; }
    }

    @keyframes slide-in-left {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slide-in-right {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
    .animate-slide-in-left { animation: slide-in-left 0.5s ease-out forwards; }
    .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
    `;

  document.head.appendChild(style);
};

// I'm providing animation utilities for SolidJS components
export const solidAnimations = {
  // For use with SolidJS createEffect
  onMount: (element: HTMLElement, animation: string = 'fadeInUp') => {
    switch (animation) {
      case 'fadeInUp':
        return fadeInUp(element);
      case 'pulseGlow':
        return pulseGlow(element);
      default:
        return fadeInUp(element);
    }
  },

  // For conditional animations
  toggle: (
    element: HTMLElement,
    condition: boolean,
    trueAnimation: string,
    falseAnimation: string,
  ) => {
    if (condition) {
      return solidAnimations.onMount(element, trueAnimation);
    } else {
      return solidAnimations.onMount(element, falseAnimation);
    }
  },
};

// I'm exporting performance-optimized animation frame utilities
export const animationFrame = {
  throttle: (callback: () => void, delay: number = 16) => {
    let lastTime = 0;

    return () => {
      const currentTime = Date.now();
      if (currentTime - lastTime >= delay) {
        callback();
        lastTime = currentTime;
      }
    };
  },

  debounce: (callback: () => void, delay: number = 16) => {
    let timeoutId: number;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },
};
