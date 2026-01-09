/*
 * ©AngelaMos | 2025
 */

import { type Component, createSignal, onMount, onCleanup } from 'solid-js';

export const Footer: Component = () => {
  const [currentYear] = createSignal(new Date().getFullYear());
  const [currentTime, setCurrentTime] = createSignal(new Date());

  onMount(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/CarterPerez-dev/',
      icon: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
    },
    {
      name: 'Twitter',
      url: 'https://x.com/CertsGamified',
      icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
    },
  ];

  const techStack = [
    { label: 'Backend', value: 'Rust + Axum' },
    { label: 'Frontend', value: 'SolidJS' },
    { label: 'Database', value: 'PostgreSQL' },
  ];

  return (
    <footer class="bg-[hsl(0,0%,5.9%)] border-t border-[hsl(0,0%,18%)] mt-auto">
      <div class="container-custom py-10">
        <div class="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 bg-[#C15F3C] rounded flex items-center justify-center">
                <span class="text-[hsl(0,0%,98%)] font-semibold text-sm">
                  K
                </span>
              </div>
              <span class="text-sm font-medium text-[hsl(0,0%,98%)]">
                Kill-Pr0cess
              </span>
            </div>
            <p class="text-[hsl(0,0%,53.7%)] text-sm leading-relaxed mb-4 max-w-xs">
              High-performance computational showcase.
            </p>
            <div class="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="p-1.5 text-[hsl(0,0%,30.2%)] hover:text-[hsl(0,0%,98%)] transition-colors duration-100"
                  aria-label={link.name}
                >
                  <svg
                    class="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d={link.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-[hsl(0,0%,53.7%)] uppercase tracking-wider mb-3">
              Stack
            </h3>
            <div class="space-y-2">
              {techStack.map((tech) => (
                <div class="flex justify-between items-center text-sm">
                  <span class="text-[hsl(0,0%,30.2%)]">{tech.label}</span>
                  <span class="text-[hsl(0,0%,53.7%)] font-mono text-xs">
                    {tech.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 class="text-xs font-medium text-[hsl(0,0%,53.7%)] uppercase tracking-wider mb-3">
              System
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center text-sm">
                <span class="text-[hsl(0,0%,30.2%)]">Time</span>
                <span class="text-[hsl(0,0%,53.7%)] font-mono text-xs">
                  {currentTime().toLocaleTimeString('en-US', {
                    hour12: false,
                  })}
                </span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-[hsl(0,0%,30.2%)]">Status</span>
                <div class="flex items-center gap-1.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-[#C15F3C]"></div>
                  <span class="text-[hsl(0,0%,53.7%)] font-mono text-xs">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="h-px bg-[hsl(0,0%,14.1%)] mb-6"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[hsl(0,0%,30.2%)]">
          <div class="font-mono">{currentYear()} Kill-Pr0cess.inc</div>
          <div class="flex items-center gap-4 font-mono">
            <a
              href="/privacy"
              class="hover:text-[hsl(0,0%,98%)] transition-colors duration-100"
            >
              Privacy
            </a>
            <a
              href="/terms"
              class="hover:text-[hsl(0,0%,98%)] transition-colors duration-100"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
