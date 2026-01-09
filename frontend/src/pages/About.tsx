/*
 * ©AngelaMos | 2025
 */

import { type Component, createSignal, onMount, Show, For } from 'solid-js';

interface TechStackItem {
  category: string;
  technologies: Array<{
    name: string;
    version: string;
    purpose: string;
    why: string;
  }>;
}

interface ArchitecturalPrinciple {
  title: string;
  description: string;
  implementation: string;
}

export default function About(): Component {
  const [isVisible, setIsVisible] = createSignal(false);
  const [activeSection, setActiveSection] = createSignal('philosophy');

  const techStack: TechStackItem[] = [
    {
      category: 'Backend Runtime',
      technologies: [
        {
          name: 'Rust',
          version: '1.75+',
          purpose: 'Core computational engine',
          why: 'Memory safety without garbage collection. Performance that approaches the machine itself.',
        },
        {
          name: 'Axum',
          version: '0.7',
          purpose: 'Async web framework',
          why: 'Built on Tokio. Ergonomic async handling that scales to thousands of concurrent connections.',
        },
        {
          name: 'Rayon',
          version: '1.8',
          purpose: 'Parallel computation',
          why: 'Data parallelism that harnesses every CPU core. Fractal generation at the speed of thought.',
        },
      ],
    },
    {
      category: 'Frontend Framework',
      technologies: [
        {
          name: 'SolidJS',
          version: '1.9',
          purpose: 'Reactive UI framework',
          why: 'Fine-grained reactivity. No virtual DOM overhead. Updates only what changes.',
        },
        {
          name: 'TypeScript',
          version: '5.x',
          purpose: 'Type safety',
          why: 'Compile-time certainty in an uncertain world. Catching errors before they become reality.',
        },
        {
          name: 'Tailwind CSS',
          version: '4.0',
          purpose: 'Utility-first styling',
          why: 'Atomic design principles. Every pixel deliberate, every spacing intentional.',
        },
      ],
    },
    {
      category: 'Data Layer',
      technologies: [
        {
          name: 'PostgreSQL',
          version: '15',
          purpose: 'Primary database',
          why: 'ACID compliance. Transactional integrity. Data that persists beyond the session.',
        },
        {
          name: 'Redis',
          version: '7',
          purpose: 'Cache and real-time data',
          why: 'In-memory speed. Sub-millisecond access. The bridge between computation and consciousness.',
        },
      ],
    },
  ];

  // I'm defining architectural principles that guide the system design
  const architecturalPrinciples: ArchitecturalPrinciple[] = [
    {
      title: 'Performance as Philosophy',
      description:
        'Every millisecond matters. Not because users are impatient, but because computational efficiency is a meditation on precision itself.',
      implementation:
        'Zero-copy data processing, compile-time optimizations, and parallel algorithms that scale with available hardware.',
    },
    {
      title: 'Deterministic Uncertainty',
      description:
        'Fractal mathematics reveals infinite complexity through simple rules. Our code mirrors this: simple interfaces hiding sophisticated implementation.',
      implementation:
        'Clean API boundaries, robust error handling, and mathematical precision in floating-point operations.',
    },
    {
      title: 'Reactive Minimalism',
      description:
        'Update only what changes. Render only what matters. Every DOM manipulation justified by necessity.',
      implementation:
        'Fine-grained reactivity, efficient reconciliation, and surgical updates to the visual representation.',
    },
    {
      title: 'Existential Debugging',
      description:
        'Errors are not failures but revelations. Performance bottlenecks are not problems but opportunities for deeper understanding.',
      implementation:
        'Comprehensive telemetry, real-time performance monitoring, and graceful degradation under load.',
    },
  ];

  onMount(() => {
    setTimeout(() => setIsVisible(true), 100);
  });

  return (
    <div class="min-h-screen bg-black text-neutral-100">
      {/* Atmospheric background */}
      <div class="absolute inset-0 opacity-5">
        <div
          class="absolute top-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl animate-pulse"
          style="animation-duration: 10s"
        ></div>
        <div
          class="absolute bottom-1/3 left-1/5 w-64 h-64 bg-cyan-900/20 rounded-full blur-3xl animate-pulse"
          style="animation-duration: 8s; animation-delay: 2s"
        ></div>
      </div>

      <div
        class={`relative z-10 transition-all duration-10 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Header Section */}
        <section class="container mx-auto px-6 pt-24 pb-12">
          <div class="max-w-4xl mx-auto text-center mb-16">
            <h1 class="text-5xl md:text-7xl font-thin tracking-wider mb-6 text-neutral-100">
              ARCHITECTURE
            </h1>
            <p class="text-lg text-neutral-400 max-w-3xl mx-auto leading-relaxed mb-8">
              A meditation on computational precision. Where every algorithm
              is a question posed to the machine, and every optimization a
              step deeper into the labyrinth of performance.
            </p>

            {/* Section Navigation */}
            <div class="flex flex-wrap justify-center gap-6 text-sm font-mono">
              {['philosophy', 'stack', 'principles', 'metrics'].map(
                (section) => (
                  <button
                    onClick={() => setActiveSection(section)}
                    class={`px-4 py-2 rounded-sm border transition-all duration-300 ${
                      activeSection() === section
                        ? 'border-neutral-300 bg-neutral-800 text-neutral-100'
                        : 'border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    {section.toUpperCase()}
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <Show when={activeSection() === 'philosophy'}>
          <section class="container mx-auto px-6 py-12">
            <div class="max-w-4xl mx-auto">
              <div class="grid md:grid-cols-2 gap-12 mb-16">
                <div class="space-y-8">
                  <div>
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      ON COMPUTATIONAL PRECISION
                    </h3>
                    <p class="text-neutral-400 leading-relaxed">
                      This application exists as a proof of concept—not just
                      of technical capability, but of the philosophical
                      intersection between human intention and machine
                      execution. Every fractal generated is a question about
                      infinity. Every performance metric a meditation on
                      efficiency.
                    </p>
                  </div>

                  <div>
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      THE AESTHETIC OF ALGORITHMS
                    </h3>
                    <p class="text-neutral-400 leading-relaxed">
                      We chose darkness not for drama, but for honesty. The
                      black background eliminates distractions, focusing
                      attention on the essential: the data, the patterns, the
                      emergent beauty of mathematical visualization. Like
                      staring into the void until the void computes back.
                    </p>
                  </div>
                </div>

                <div class="space-y-8">
                  <div>
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      PERFORMANCE AS POETRY
                    </h3>
                    <p class="text-neutral-400 leading-relaxed">
                      Each millisecond shaved from computation time is not
                      merely optimization—it's approaching something closer
                      to the speed of thought itself. We measure not just
                      throughput, but the elegance of execution. The grace
                      with which silicon and software dance together.
                    </p>
                  </div>

                  <div>
                    <h3 class="text-2xl font-thin text-neutral-200 mb-4">
                      TOOLS AS PHILOSOPHY
                    </h3>
                    <p class="text-neutral-400 leading-relaxed">
                      Rust for memory safety without compromise. SolidJS for
                      reactive precision. PostgreSQL for transactional truth.
                      Each tool chosen not for popularity, but for its
                      philosophical alignment with our core belief: that
                      performance and correctness are not optimizations, but
                      fundamental requirements.
                    </p>
                  </div>
                </div>
              </div>

              <blockquote class="text-center text-xl md:text-2xl font-thin text-neutral-400 italic border-l-2 border-neutral-700 pl-6 max-w-3xl mx-auto">
                "In the precision of algorithms, we find not answers, but the
                quality of our questions. Each optimization strips away
                another layer of assumption, revealing the mathematical truth
                beneath."
              </blockquote>
            </div>
          </section>
        </Show>

        {/* Technical Stack Section */}
        <Show when={activeSection() === 'stack'}>
          <section class="container mx-auto px-6 py-12">
            <div class="max-w-6xl mx-auto">
              <div class="text-center mb-12">
                <h2 class="text-3xl font-thin text-neutral-200 mb-4">
                  TECHNICAL FOUNDATION
                </h2>
                <p class="text-neutral-500 max-w-2xl mx-auto">
                  Every dependency chosen with intention. Every abstraction
                  justified by necessity.
                </p>
              </div>

              <div class="space-y-12">
                <For each={techStack}>
                  {(category) => (
                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
                      <h3 class="text-xl font-mono text-neutral-300 mb-6 text-center">
                        {category.category.toUpperCase()}
                      </h3>

                      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <For each={category.technologies}>
                          {(tech) => (
                            <div class="bg-black/30 border border-neutral-700 rounded-sm p-6 hover:border-neutral-600 transition-colors duration-300">
                              <div class="flex items-center justify-between mb-3">
                                <h4 class="font-mono text-lg text-neutral-100">
                                  {tech.name}
                                </h4>
                                <span class="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded font-mono">
                                  {tech.version}
                                </span>
                              </div>

                              <p class="text-sm text-neutral-400 mb-3">
                                {tech.purpose}
                              </p>

                              <p class="text-xs text-neutral-500 italic leading-relaxed">
                                {tech.why}
                              </p>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </section>
        </Show>

        {/* Architectural Principles Section */}
        <Show when={activeSection() === 'principles'}>
          <section class="container mx-auto px-6 py-12">
            <div class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                <h2 class="text-3xl font-thin text-neutral-200 mb-4">
                  DESIGN PRINCIPLES
                </h2>
                <p class="text-neutral-500 max-w-2xl mx-auto">
                  The philosophical foundations that guide every
                  architectural decision.
                </p>
              </div>

              <div class="space-y-8">
                <For each={architecturalPrinciples}>
                  {(principle) => (
                    <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8 hover:border-neutral-700 transition-colors duration-300">
                      <h3 class="text-xl font-mono text-neutral-200 mb-4">
                        {principle.title}
                      </h3>

                      <p class="text-neutral-400 leading-relaxed mb-6">
                        {principle.description}
                      </p>

                      <div class="border-l-2 border-neutral-700 pl-4">
                        <p class="text-sm text-neutral-500 italic">
                          Implementation: {principle.implementation}
                        </p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </section>
        </Show>

        {/* Metrics Section */}
        <Show when={activeSection() === 'metrics'}>
          <section class="container mx-auto px-6 py-12">
            <div class="max-w-4xl mx-auto">
              <div class="text-center mb-12">
                <h2 class="text-3xl font-thin text-neutral-200 mb-4">
                  PERFORMANCE PHILOSOPHY
                </h2>
                <p class="text-neutral-500 max-w-2xl mx-auto">
                  What we measure and why it matters in the grand scheme of
                  computational existence.
                </p>
              </div>

              <div class="grid md:grid-cols-2 gap-8">
                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 class="text-lg font-mono text-neutral-300 mb-4">
                    FRACTAL GENERATION
                  </h3>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Target Speed:</span>
                      <span class="text-neutral-300 font-mono">
                        &lt; 50ms
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">
                        Parallel Efficiency:
                      </span>
                      <span class="text-neutral-300 font-mono">
                        &gt; 85%
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Memory Usage:</span>
                      <span class="text-neutral-300 font-mono">Minimal</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Precision:</span>
                      <span class="text-neutral-300 font-mono">
                        IEEE 754
                      </span>
                    </div>
                  </div>
                </div>

                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 class="text-lg font-mono text-neutral-300 mb-4">
                    API RESPONSE
                  </h3>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Response Time:</span>
                      <span class="text-neutral-300 font-mono">
                        &lt; 10ms
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Throughput:</span>
                      <span class="text-neutral-300 font-mono">
                        10k+ req/s
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Memory Safety:</span>
                      <span class="text-neutral-300 font-mono">
                        Guaranteed
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Concurrency:</span>
                      <span class="text-neutral-300 font-mono">
                        Async/Await
                      </span>
                    </div>
                  </div>
                </div>

                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 class="text-lg font-mono text-neutral-300 mb-4">
                    FRONTEND REACTIVITY
                  </h3>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-neutral-500">
                        Update Efficiency:
                      </span>
                      <span class="text-neutral-300 font-mono">
                        Surgical
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Bundle Size:</span>
                      <span class="text-neutral-300 font-mono">Minimal</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Reactivity:</span>
                      <span class="text-neutral-300 font-mono">
                        Fine-grained
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Runtime:</span>
                      <span class="text-neutral-300 font-mono">No vDOM</span>
                    </div>
                  </div>
                </div>

                <div class="bg-neutral-900/30 border border-neutral-800 rounded-lg p-6">
                  <h3 class="text-lg font-mono text-neutral-300 mb-4">
                    SYSTEM RESOURCES
                  </h3>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span class="text-neutral-500">CPU Usage:</span>
                      <span class="text-neutral-300 font-mono">
                        Optimized
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Memory Leaks:</span>
                      <span class="text-neutral-300 font-mono">
                        Impossible
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Cache Hit Rate:</span>
                      <span class="text-neutral-300 font-mono">
                        &gt; 95%
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-neutral-500">Uptime:</span>
                      <span class="text-neutral-300 font-mono">99.9%+</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-12 text-center">
                <p class="text-neutral-500 italic max-w-2xl mx-auto">
                  "Performance is not about making things faster. It's about
                  understanding the relationship between intention and
                  execution, between the theoretical and the practical,
                  between what we want to achieve and what the machine can
                  deliver."
                </p>
              </div>
            </div>
          </section>
        </Show>

        {/* Closing Statement */}
        <section class="container mx-auto px-6 py-20">
          <div class="max-w-3xl mx-auto text-center">
            <h2 class="text-3xl font-thin text-neutral-200 mb-8">
              THE INTERSECTION OF CODE AND CONSCIOUSNESS
            </h2>
            <p class="text-lg text-neutral-400 leading-relaxed mb-8">
              This application is more than a technical demonstration. It's
              an exploration of the liminal space between human creativity
              and machine precision. Every optimization is a conversation
              with the hardware. Every algorithm is a question posed to the
              universe about the nature of computation itself.
            </p>
            <p class="text-neutral-500 italic">
              Built with precision. Powered by curiosity. Optimized for the
              inevitable.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
