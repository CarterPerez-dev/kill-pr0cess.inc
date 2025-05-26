/*
 * Main navigation header component embodying the dark, minimal aesthetic with sophisticated interactions.
 * I'm implementing a clean, contemplative navigation experience that maintains the eerie atmosphere while providing intuitive functionality.
 */

import { Component, createSignal, createEffect, onMount } from 'solid-js';
import { A, useLocation } from '@solidjs/router';

interface NavItem {
  path: string;
  label: string;
  description: string;
}

export const Header: Component = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = createSignal(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false);
  const [systemStatus, setSystemStatus] = createSignal<'healthy' | 'degraded' | 'unhealthy'>('healthy');

  // I'm defining the navigation structure with philosophical undertones
  const navItems: NavItem[] = [
    {
      path: '/',
      label: 'HOME',
      description: 'Return to the beginning'
    },
    {
      path: '/projects',
      label: 'REPOSITORIES',
      description: 'Explore the digital artifacts'
    },
    {
      path: '/performance',
      label: 'METRICS',
      description: 'Witness computational precision'
    },
    {
      path: '/about',
      label: 'ARCHITECTURE',
      description: 'Understand the foundation'
    }
  ];

  onMount(() => {
    // I'm implementing scroll detection for dynamic header behavior
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Fetch system status for the status indicator
    fetchSystemStatus();
    const statusInterval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(statusInterval);
    };
  });

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.status === 'Healthy' ? 'healthy' :
                      data.status === 'Degraded' ? 'degraded' : 'unhealthy');
      }
    } catch (error) {
      setSystemStatus('unhealthy');
    }
  };

  const isActiveRoute = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getStatusColor = () => {
    switch (systemStatus()) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
    }
  };

  const getStatusPulse = () => {
    return systemStatus() !== 'healthy' ? 'animate-pulse' : '';
  };

  return (
    <>
      <header class={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled()
          ? 'bg-black/90 backdrop-blur-md border-b border-neutral-800/50'
          : 'bg-transparent'
      }`}>
        <div class="container mx-auto px-6">
          <div class="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <A
              href="/"
              class="group flex items-center gap-3 text-neutral-100 hover:text-white transition-colors duration-300"
            >
              <div class="relative">
                <div class={`w-2 h-2 rounded-full ${getStatusColor()} ${getStatusPulse()}`}></div>
                <div class="absolute inset-0 w-2 h-2 rounded-full bg-white/20 animate-ping"></div>
              </div>
              <span class="font-mono text-sm tracking-wider">
                PERFORMANCE.SHOWCASE
              </span>
            </A>

            {/* Desktop Navigation */}
            <nav class="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <A
                  href={item.path}
                  class={`group relative font-mono text-xs tracking-wider transition-all duration-300 ${
                    isActiveRoute(item.path)
                      ? 'text-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {item.label}

                  {/* Active indicator */}
                  <div class={`absolute -bottom-1 left-0 h-px bg-neutral-100 transition-all duration-300 ${
                    isActiveRoute(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></div>

                  {/* Hover description */}
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-black/90 backdrop-blur-sm border border-neutral-700 rounded text-xs text-neutral-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    {item.description}
                  </div>
                </A>
              ))}
            </nav>

            {/* System Status & Mobile Menu Button */}
            <div class="flex items-center gap-4">
              {/* System Status Indicator */}
              <div class="hidden lg:flex items-center gap-2 px-3 py-1 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-sm">
                <div class={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`}></div>
                <span class="text-xs font-mono text-neutral-400 tracking-wide">
                  {systemStatus().toUpperCase()}
                </span>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen())}
                class="md:hidden p-2 text-neutral-400 hover:text-neutral-100 transition-colors duration-300"
                aria-label="Toggle mobile menu"
              >
                <div class="w-5 h-5 flex flex-col justify-center gap-1">
                  <div class={`h-px bg-current transition-all duration-300 ${
                    isMobileMenuOpen() ? 'rotate-45 translate-y-1' : ''
                  }`}></div>
                  <div class={`h-px bg-current transition-all duration-300 ${
                    isMobileMenuOpen() ? 'opacity-0' : ''
                  }`}></div>
                  <div class={`h-px bg-current transition-all duration-300 ${
                    isMobileMenuOpen() ? '-rotate-45 -translate-y-1' : ''
                  }`}></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div class={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
        isMobileMenuOpen()
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Menu Content */}
        <div class={`absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-neutral-800 transition-all duration-500 ${
          isMobileMenuOpen() ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <nav class="container mx-auto px-6 py-8">
            <div class="space-y-6">
              {navItems.map((item) => (
                <A
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  class={`block group transition-all duration-300 ${
                    isActiveRoute(item.path)
                      ? 'text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div class="flex items-center justify-between py-2">
                    <div>
                      <div class="font-mono text-sm tracking-wider mb-1">
                        {item.label}
                      </div>
                      <div class="text-xs text-neutral-600">
                        {item.description}
                      </div>
                    </div>
                    <div class={`w-1 h-6 bg-neutral-100 transition-all duration-300 ${
                      isActiveRoute(item.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                    }`}></div>
                  </div>
                </A>
              ))}
            </div>

            {/* Mobile System Status */}
            <div class="mt-8 pt-6 border-t border-neutral-800">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono text-neutral-500 tracking-wide">
                  SYSTEM STATUS
                </span>
                <div class="flex items-center gap-2">
                  <div class={`w-2 h-2 rounded-full ${getStatusColor()} ${getStatusPulse()}`}></div>
                  <span class="text-xs font-mono text-neutral-400">
                    {systemStatus().toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};
