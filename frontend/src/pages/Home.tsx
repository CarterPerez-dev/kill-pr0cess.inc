/*
 * ©AngelaMos | 2025
 */

import { type Component, For } from 'solid-js';
import { A } from '@solidjs/router';

export default function Home(): Component {
  const features = [
    {
      title: 'Rust Backend',
      description: 'Zero-cost abstractions with memory safety guarantees',
      icon: (
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: 'Real-time Metrics',
      description: 'Live system monitoring and performance tracking',
      icon: (
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      title: 'API First',
      description: 'RESTful endpoints with comprehensive documentation',
      icon: (
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={1.5}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  const stats = [
    { value: '<10ms', label: 'Response' },
    { value: '99.9%', label: 'Uptime' },
    { value: '100k+', label: 'Req/sec' },
  ];

  return (
    <div class="min-h-screen pt-14">
      <section
        class="py-16 md:py-24"
        style={{
          'background-color': 'hsl(0, 0%, 7.1%)',
          'background-image':
            'radial-gradient(circle, hsl(0, 0%, 11%) 1px, transparent 1px)',
          'background-size': '22px 22px',
        }}
      >
        <div class="container-custom">
          <div class="max-w-4xl">
            <div class="inline-block mb-6">
              <span class="px-2.5 py-1 bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded text-xs font-mono text-[hsl(0,0%,53.7%)]">
                Performance Showcase
              </span>
            </div>

            <h1 class="text-2xl md:text-3xl font-semibold text-[hsl(0,0%,98%)] mb-4">
              High-Performance Infrastructure
            </h1>

            <p class="text-sm text-[hsl(0,0%,70.6%)] max-w-xl mb-8 leading-relaxed">
              A descent into the raw computational power of a Rust backend
              and the immediate, reactive nature of a SolidJS frontend. It is
              a performance showcase, yes, but also a meditation on the
              systems we build and the often-unseen forces that drive them.
            </p>

            <div class="flex flex-wrap gap-3 mb-10">
              <A
                href="/performance"
                class="btn btn-primary"
              >
                Explore Performance
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </A>
              <A
                href="/projects"
                class="btn btn-secondary"
              >
                View Projects
              </A>
            </div>

            <div class="flex items-center gap-8">
              <For each={stats}>
                {(stat) => (
                  <div>
                    <div class="text-lg font-mono font-semibold text-[hsl(0,0%,98%)]">
                      {stat.value}
                    </div>
                    <div class="text-xs text-[hsl(0,0%,53.7%)]">
                      {stat.label}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </section>

      <section
        class="border-t border-[hsl(0,0%,18%)]"
        style={{
          'background-color': 'hsl(0, 0%, 9%)',
          'background-image':
            'radial-gradient(circle, hsl(0, 0%, 12.2%) 1px, transparent 1px)',
          'background-size': '20px 20px',
        }}
      >
        <div class="container-custom py-16">
          <div class="mb-10">
            <h2 class="text-lg font-semibold text-[hsl(0,0%,98%)] mb-2">
              Built for Performance
            </h2>
            <p class="text-sm text-[hsl(0,0%,53.7%)]">
              Every component optimized for speed and reliability
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <For each={features}>
              {(feature) => (
                <div class="bg-[hsl(0,0%,12.2%)] border border-[hsl(0,0%,18%)] rounded-md p-4 transition-[filter] duration-100 hover:brightness-110">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="text-[#C15F3C]">{feature.icon}</div>
                    <h3 class="text-sm font-medium text-[hsl(0,0%,98%)]">
                      {feature.title}
                    </h3>
                  </div>
                  <p class="text-xs text-[hsl(0,0%,53.7%)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )}
            </For>
          </div>
        </div>
      </section>

      <section
        class="border-t border-[hsl(0,0%,18%)]"
        style={{
          'background-color': 'hsl(0, 0%, 5.9%)',
          'background-image':
            'radial-gradient(circle, hsl(0, 0%, 9%) 1px, transparent 1px)',
          'background-size': '22px 22px',
        }}
      >
        <div class="container-custom py-16">
          <div class="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 class="text-lg font-semibold text-[hsl(0,0%,98%)] mb-3">
                System Insights
              </h2>
              <p class="text-sm text-[hsl(0,0%,53.7%)] mb-6 leading-relaxed">
                Real-time performance metrics showcase the power of
                Rust-powered backend infrastructure.
              </p>
              <A
                href="/projects"
                class="inline-flex items-center gap-2 text-sm text-[hsl(0,0%,70.6%)] hover:text-[hsl(0,0%,98%)] transition-colors duration-100"
              >
                <span>View Projects</span>
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </A>
            </div>

            <div
              class="border border-[hsl(0,0%,18%)] rounded-md p-4"
              style={{
                'background-color': 'hsl(0, 0%, 7.1%)',
                'background-image':
                  'radial-gradient(circle, hsl(0, 0%, 10%) 1px, transparent 1px)',
                'background-size': '18px 18px',
              }}
            >
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs text-[hsl(0,0%,53.7%)]">
                  Backend Status
                </span>
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[hsl(0,0%,14.1%)] border border-[hsl(0,0%,18%)] rounded text-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#C15F3C]"></span>
                  <span class="text-[hsl(0,0%,70.6%)]">Healthy</span>
                </span>
              </div>
              <div class="h-px bg-[hsl(0,0%,18%)] mb-4"></div>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-[hsl(0,0%,53.7%)]">
                    Response Time
                  </span>
                  <span class="text-xs font-mono text-[hsl(0,0%,70.6%)]">
                    8ms
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-[hsl(0,0%,53.7%)]">
                    Requests/sec
                  </span>
                  <span class="text-xs font-mono text-[hsl(0,0%,70.6%)]">
                    102.4k
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-[hsl(0,0%,53.7%)]">
                    Memory Usage
                  </span>
                  <span class="text-xs font-mono text-[hsl(0,0%,70.6%)]">
                    42.3 MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="border-t border-[hsl(0,0%,18%)]"
        style={{
          'background-color': 'hsl(0, 0%, 7.1%)',
          'background-image':
            'radial-gradient(circle, hsl(0, 0%, 11%) 1px, transparent 1px)',
          'background-size': '22px 22px',
        }}
      >
        <div class="container-custom py-16 text-center">
          <h2 class="text-lg font-semibold text-[hsl(0,0%,98%)] mb-2">
            Ready to explore?
          </h2>
          <p class="text-sm text-[hsl(0,0%,53.7%)] mb-6 max-w-md mx-auto">
            Dive into high-performance computation and real-time monitoring
          </p>
          <div class="flex justify-center gap-3">
            <A
              href="/performance"
              class="btn btn-primary"
            >
              _INQUIRE_
            </A>
          </div>
        </div>
      </section>
    </div>
  );
}
