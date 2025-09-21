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
      const response = await fetch('/v1/health');
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
      <header class={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
        isScrolled()
          ? 'glass-dark border-b border-neutral-800/30 shadow-lg'
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
                <div class={`w-2 h-2 rounded-full ${getStatusColor()} ${getStatusPulse()} shadow-[0_0_10px_currentColor]`}></div>
                <div class="absolute inset-0 w-2 h-2 rounded-full bg-white/20 animate-ping"></div>
              </div>
              <span class="font-mono text-sm tracking-wider text-gradient-animate">
                PERFORMANCE.SHOWCASE
              </span>
            </A>

            {/* Desktop Navigation */}
            <nav class="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <A
                  href={item.path}
                  class={`group relative font-mono text-xs tracking-wider transition-all duration-500 ease-out ${
                    isActiveRoute(item.path)
                      ? 'text-neutral-100 text-shadow-glow'
                      : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                >
                  <span class="relative z-10">{item.label}</span>

                  {/* Active/hover glow effect */}
                  <div class={`absolute inset-0 rounded transition-all duration-500 ${
                    isActiveRoute(item.path) 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-100' 
                      : 'bg-gradient-to-r from-cyan-500/0 to-blue-500/0 opacity-0 group-hover:opacity-100 group-hover:from-cyan-500/10 group-hover:to-blue-500/10'
                  }`}></div>

                  {/* Active indicator */}
                  <div class={`absolute -bottom-1 left-0 h-px transition-all duration-500 ease-out ${
                    isActiveRoute(item.path) 
                      ? 'w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent' 
                      : 'w-0 bg-neutral-400 group-hover:w-full'
                  }`}></div>

                  {/* Hover description */}
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 px-4 py-2 glass-effect border border-neutral-700/50 rounded-md text-xs text-neutral-300 whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none shadow-xl">
                    {item.description}
                    <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-inherit border-l border-t border-neutral-700/50 rotate-45"></div>
                  </div>
                </A>
              ))}
            </nav>

            {/* System Status & Mobile Menu Button */}
            <div class="flex items-center gap-4">
              {/* System Status Indicator */}
              <div class="hidden lg:flex items-center gap-2 px-4 py-2 glass-effect border border-neutral-800/50 rounded-full hover:border-neutral-700/50 transition-all duration-300">
                <div class={`w-1.5 h-1.5 rounded-full ${getStatusColor()} shadow-[0_0_8px_currentColor]`}></div>
                <span class="text-xs font-mono text-neutral-300 tracking-wide">
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
                  <div class={`h-px bg-current transition-all duration-500 ease-out origin-center ${
                    isMobileMenuOpen() ? 'rotate-45 translate-y-1.5' : ''
                  }`}></div>
                  <div class={`h-px bg-current transition-all duration-300 ${
                    isMobileMenuOpen() ? 'opacity-0 scale-0' : ''
                  }`}></div>
                  <div class={`h-px bg-current transition-all duration-500 ease-out origin-center ${
                    isMobileMenuOpen() ? '-rotate-45 -translate-y-1.5' : ''
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
        <div class={`absolute top-16 left-0 right-0 glass-dark border-b border-neutral-800/50 transition-all duration-700 ease-out shadow-2xl ${
          isMobileMenuOpen() ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}>
          <nav class="container mx-auto px-6 py-8">
            <div class="space-y-6">
              {navItems.map((item) => (
                <A
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  class={`block group transition-all duration-500 ease-out hover-lift ${
                    isActiveRoute(item.path)
                      ? 'text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div class="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-neutral-900/50 transition-all duration-300">
                    <div>
                      <div class="font-mono text-sm tracking-wider mb-1 group-hover:text-shadow-glow transition-all duration-300">
                        {item.label}
                      </div>
                      <div class="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors duration-300">
                        {item.description}
                      </div>
                    </div>
                    <div class={`w-1 h-8 rounded-full transition-all duration-500 ease-out ${
                      isActiveRoute(item.path) 
                        ? 'opacity-100 bg-gradient-to-b from-cyan-400 to-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' 
                        : 'opacity-0 bg-neutral-100 group-hover:opacity-30'
                    }`}></div>
                  </div>
                </A>
              ))}
            </div>

            {/* Mobile System Status */}
            <div class="mt-8 pt-6 border-t border-neutral-800/50">
              <div class="flex items-center justify-between px-2">
                <span class="text-xs font-mono text-neutral-500 tracking-wide">
                  SYSTEM STATUS
                </span>
                <div class="flex items-center gap-2 px-3 py-1.5 glass-effect rounded-full">
                  <div class={`w-2 h-2 rounded-full ${getStatusColor()} ${getStatusPulse()} shadow-[0_0_8px_currentColor]`}></div>
                  <span class="text-xs font-mono text-neutral-300">
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
