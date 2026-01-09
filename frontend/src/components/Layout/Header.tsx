/*
 * ©AngelaMos | 2025
 */

import { type Component, createSignal, Show } from 'solid-js';
import { A } from '@solidjs/router';

export const Header: Component = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/performance', label: 'Performance' },
    { path: '/projects', label: 'Projects' },
    { path: '/about', label: 'About' },
  ];

  return (
    <header class="fixed top-0 left-0 right-0 z-50 bg-[hsl(0,0%,5.9%)] border-b border-[hsl(0,0%,14.1%)]">
      <div class="container-custom">
        <div class="flex items-center justify-between h-14">
          <A
            href="/"
            class="flex items-center gap-2"
          >
            <div class="w-7 h-7 bg-[#C15F3C] rounded flex items-center justify-center">
              <span class="text-[hsl(0,0%,98%)] font-semibold text-sm">
                K
              </span>
            </div>
            <span class="text-sm font-medium hidden sm:block text-[hsl(0,0%,98%)]">
              Kill-Pr0cess
            </span>
          </A>

          <nav class="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <A
                href={link.path}
                class="text-xs text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)] transition-colors duration-100"
                activeClass="text-[hsl(0,0%,98%)]"
                end={link.path === '/'}
              >
                {link.label}
              </A>
            ))}
          </nav>

          <a
            href="https://github.com/CarterPerez-dev/"
            target="_blank"
            rel="noopener noreferrer"
            class="hidden md:flex p-1.5 text-[hsl(0,0%,30.2%)] hover:text-[hsl(0,0%,70.6%)] transition-colors duration-100"
            aria-label="GitHub"
          >
            <svg
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
            class="md:hidden p-1.5 text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)] transition-colors duration-100"
            aria-label="Menu"
          >
            <Show
              when={!mobileMenuOpen()}
              fallback={
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              }
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Show>
          </button>
        </div>
      </div>

      <Show when={mobileMenuOpen()}>
        <div class="md:hidden bg-[hsl(0,0%,5.9%)] border-t border-[hsl(0,0%,14.1%)]">
          <nav class="container-custom py-2 flex flex-col">
            {navLinks.map((link) => (
              <A
                href={link.path}
                class="px-3 py-2 text-xs text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)] hover:bg-[hsl(0,0%,9%)] rounded transition-colors duration-100"
                activeClass="text-[hsl(0,0%,98%)] bg-[hsl(0,0%,9%)]"
                end={link.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </A>
            ))}
            <div class="h-px bg-[hsl(0,0%,14.1%)] my-2"></div>
            <a
              href="https://github.com/CarterPerez-dev/"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-2 text-xs text-[hsl(0,0%,53.7%)] hover:text-[hsl(0,0%,98%)] hover:bg-[hsl(0,0%,9%)] rounded transition-colors duration-100 flex items-center gap-2"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </nav>
        </div>
      </Show>
    </header>
  );
};
