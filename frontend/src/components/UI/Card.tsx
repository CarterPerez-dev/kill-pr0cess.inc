/*
 * Versatile card component providing consistent dark-themed containers with hover effects and multiple variants for content organization.
 * I'm implementing flexible styling options, interactive states, and accessibility features that align with the eerie, contemplative aesthetic while maintaining semantic HTML structure.
 */

import { type Component, type JSX, splitProps, createMemo } from 'solid-js';

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  interactive?: boolean;
  children: JSX.Element;
}

export const Card: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'padding',
    'hover',
    'glow',
    'interactive',
    'children',
    'class',
  ]);

  // I'm computing the classes based on props for optimal performance
  const cardClasses = createMemo(() => {
    const baseClasses = 'rounded-lg transition-all duration-300 ease-in-out';

    const variantClasses = {
      default: 'bg-neutral-900/30 border border-neutral-800',
      elevated: 'bg-neutral-900/50 border border-neutral-700 shadow-lg',
      outlined: 'bg-transparent border-2 border-neutral-700',
      ghost: 'bg-neutral-900/10 border border-transparent',
      glass:
        'bg-neutral-900/20 backdrop-blur-md border border-neutral-700/50',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    const hoverClasses =
      local.hover !== false ? 'hover:border-neutral-600' : '';
    const glowClasses = local.glow
      ? 'hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]'
      : '';
    const interactiveClasses = local.interactive
      ? 'cursor-pointer hover:transform hover:scale-[1.01]'
      : '';

    return [
      baseClasses,
      variantClasses[local.variant || 'default'],
      paddingClasses[local.padding || 'md'],
      hoverClasses,
      glowClasses,
      interactiveClasses,
      local.class || '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  return (
    <div
      {...others}
      class={cardClasses()}
    >
      {local.children}
    </div>
  );
};

// I'm also creating specialized card variants for common use cases
export const MetricCard: Component<{
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  icon?: JSX.Element;
}> = (props) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-neutral-400',
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '⟷',
  };

  return (
    <Card
      variant="elevated"
      hover
      glow
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            {props.icon && <div class="text-neutral-400">{props.icon}</div>}
            <h3 class="text-xs font-mono text-neutral-500 uppercase tracking-wide">
              {props.title}
            </h3>
          </div>

          <div class="flex items-baseline gap-1 mb-2">
            <span class="text-2xl font-mono text-neutral-100 font-semibold">
              {props.value}
            </span>
            {props.unit && (
              <span class="text-sm text-neutral-400">{props.unit}</span>
            )}
          </div>

          {props.description && (
            <p class="text-xs text-neutral-600 leading-relaxed">
              {props.description}
            </p>
          )}
        </div>

        {props.trend && (
          <div
            class={`flex items-center gap-1 text-sm ${trendColors[props.trend]}`}
          >
            <span class="font-mono">{trendIcons[props.trend]}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export const CodeCard: Component<{
  title?: string;
  language?: string;
  children: JSX.Element;
}> = (props) => {
  return (
    <Card
      variant="glass"
      padding="none"
    >
      {props.title && (
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-700">
          <h3 class="text-sm font-mono text-neutral-300">{props.title}</h3>
          {props.language && (
            <span class="text-xs bg-neutral-800 text-neutral-500 px-2 py-1 rounded font-mono">
              {props.language}
            </span>
          )}
        </div>
      )}
      <div class="p-4 font-mono text-sm">{props.children}</div>
    </Card>
  );
};

export const StatusCard: Component<{
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  title: string;
  message?: string;
  lastUpdated?: string;
}> = (props) => {
  const statusConfig = {
    healthy: {
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-800',
      icon: '●',
    },
    warning: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800',
      icon: '▲',
    },
    error: {
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800',
      icon: '✕',
    },
    unknown: {
      color: 'text-neutral-400',
      bg: 'bg-neutral-900/20',
      border: 'border-neutral-700',
      icon: '?',
    },
  };

  const config = statusConfig[props.status];

  return (
    <Card class={`${config.bg} ${config.border}`}>
      <div class="flex items-start gap-3">
        <div class={`text-lg ${config.color} mt-0.5`}>{config.icon}</div>

        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-mono text-sm text-neutral-200">{props.title}</h3>
            <span class={`text-xs font-mono uppercase ${config.color}`}>
              {props.status}
            </span>
          </div>

          {props.message && (
            <p class="text-sm text-neutral-400 mb-2">{props.message}</p>
          )}

          {props.lastUpdated && (
            <p class="text-xs text-neutral-600 font-mono">
              Updated: {props.lastUpdated}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export const LinkCard: Component<{
  href: string;
  title: string;
  description?: string;
  external?: boolean;
  children?: JSX.Element;
}> = (props) => {
  return (
    <a
      href={props.href}
      target={props.external ? '_blank' : '_self'}
      rel={props.external ? 'noopener noreferrer' : undefined}
      class="block no-underline"
    >
      <Card
        interactive
        hover
        glow
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-mono text-lg text-neutral-200 mb-2 group-hover:text-neutral-100">
              {props.title}
            </h3>

            {props.description && (
              <p class="text-sm text-neutral-400 leading-relaxed">
                {props.description}
              </p>
            )}

            {props.children}
          </div>

          <div class="text-neutral-600 ml-4">
            {props.external ? '↗' : '→'}
          </div>
        </div>
      </Card>
    </a>
  );
};
