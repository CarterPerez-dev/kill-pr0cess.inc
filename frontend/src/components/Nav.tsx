/*
 * Navigation component providing clean, minimal navigation links with dark styling and active state indicators.
 * I'm implementing router-aware navigation with hover effects and active states that complement the overall eerie aesthetic while maintaining excellent accessibility and keyboard navigation support.
 */

import { Component } from 'solid-js';
import { A, useLocation } from '@solidjs/router';

interface NavItem {
  href: string;
  label: string;
  description?: string;
}

interface NavProps {
  variant?: 'horizontal' | 'vertical';
  className?: string;
}

export const Nav: Component<NavProps> = (props) => {
  const location = useLocation();

  // I'm defining the navigation structure with philosophical descriptions
  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'HOME',
      description: 'Return to the digital void'
    },
    {
      href: '/projects',
      label: 'REPOSITORIES',
      description: 'Explore code artifacts'
    },
    {
      href: '/performance',
      label: 'METRICS',
      description: 'Witness computational precision'
    },
    {
      href: '/about',
      label: 'ARCHITECTURE',
      description: 'Understand the foundation'
    }
  ];

  // I'm implementing intelligent active state detection
  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const variant = props.variant || 'horizontal';

  return (
    <nav class={`${props.className || ''}`}>
      <ul class={`flex ${variant === 'vertical' ? 'flex-col space-y-1' : 'items-center space-x-8'}`}>
        {navItems.map((item) => (
          <li class="relative group">
            <A
              href={item.href}
              class={`
                block px-3 py-2 font-mono text-sm tracking-wide transition-all duration-300 relative
                ${isActive(item.href)
                  ? 'text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
                }
              `}
            >
              {item.label}

              {/* Active indicator line */}
              <div class={`
                absolute bottom-0 left-0 h-px bg-cyan-400 transition-all duration-300
                ${isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'}
              `}></div>

              {/* Active indicator dot for vertical layout */}
              {variant === 'vertical' && (
                <div class={`
                  absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-1 h-1 bg-cyan-400 rounded-full transition-opacity duration-300
                  ${isActive(item.href) ? 'opacity-100' : 'opacity-0'}
                `}></div>
              )}

              {/* Hover tooltip with description */}
              {item.description && (
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-black/90 backdrop-blur-sm border border-neutral-700 rounded text-xs text-neutral-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                  {item.description}
                </div>
              )}
            </A>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// I'm also exporting a minimal version for specific use cases
export const SimpleNav: Component = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  return (
    <nav class="flex items-center space-x-6">
      <A
        href="/"
        class={`text-sm font-mono transition-colors duration-200 ${
          isActive('/') ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        HOME
      </A>
      <A
        href="/projects"
        class={`text-sm font-mono transition-colors duration-200 ${
          isActive('/projects') ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        PROJECTS
      </A>
      <A
        href="/performance"
        class={`text-sm font-mono transition-colors duration-200 ${
          isActive('/performance') ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        PERFORMANCE
      </A>
      <A
        href="/about"
        class={`text-sm font-mono transition-colors duration-200 ${
          isActive('/about') ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        ABOUT
      </A>
    </nav>
  );
};
