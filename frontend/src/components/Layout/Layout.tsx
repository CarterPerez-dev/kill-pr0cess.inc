/*
 * Main layout wrapper component that provides consistent page structure, theme application, and responsive behavior throughout the application.
 * I'm implementing comprehensive layout management with accessibility features, responsive design, and seamless integration with the dark theme system.
 */

import { Component, JSX, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
    children: JSX.Element;
    title?: string;
    description?: string;
    showHeader?: boolean;
    showFooter?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export const Layout: Component<LayoutProps> = (props) => {
    const [isScrolled, setIsScrolled] = createSignal(false);
    const [scrollProgress, setScrollProgress] = createSignal(0);

    // I'm setting up scroll tracking for progressive enhancement
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        setIsScrolled(scrollTop > 50);
        setScrollProgress(scrollPercent);
    };

    onMount(() => {
        // I'm setting up document title and meta description
        if (props.title) {
            document.title = `${props.title} | Performance Showcase`;
        }

        if (props.description) {
            let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                document.head.appendChild(metaDescription);
            }
            metaDescription.content = props.description;
        }

        // I'm adding scroll event listener for enhanced UI
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial call
    });

    onCleanup(() => {
        window.removeEventListener('scroll', handleScroll);
    });

    return (
        <div class="min-h-screen bg-black text-neutral-100 font-sans antialiased">
        {/* Atmospheric background elements */}
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-black"></div>

        {/* Subtle animated background pattern */}
        <div
        class="absolute inset-0 opacity-[0.02]"
        style={{
            "background-image": `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
            "background-size": "50px 50px",
            "animation": "drift 60s ease-in-out infinite"
        }}
        ></div>

        {/* Floating orbs for atmosphere */}
        <div class="absolute top-1/4 left-1/6 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl animate-pulse" style="animation-duration: 8s"></div>
        <div class="absolute bottom-1/3 right-1/5 w-48 h-48 bg-purple-900/5 rounded-full blur-3xl animate-pulse" style="animation-duration: 12s; animation-delay: 4s"></div>
        <div class="absolute top-2/3 left-2/3 w-32 h-32 bg-cyan-900/5 rounded-full blur-3xl animate-pulse" style="animation-duration: 10s; animation-delay: 2s"></div>
        </div>

        {/* Scroll progress indicator */}
        <div
        class="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress()}%` }}
        ></div>

        {/* Main application structure */}
        <div class="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Show when={props.showHeader !== false}>
        <Header isScrolled={isScrolled()} />
        </Show>

        {/* Main content area */}
        <main
        class={`flex-1 ${props.fullWidth ? '' : 'container mx-auto px-6'} ${props.className || ''}`}
        role="main"
        >
        {/* Skip to content link for accessibility */}
        <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-neutral-100 text-black px-4 py-2 rounded-sm font-mono text-sm z-50"
        >
        Skip to main content
        </a>

        <div id="main-content" tabindex="-1">
        {props.children}
        </div>
        </main>

        {/* Footer */}
        <Show when={props.showFooter !== false}>
        <Footer />
        </Show>
        </div>

        {/* Global styles and animations */}
        <style jsx>{`
            @keyframes drift {
                0%, 100% { transform: translateX(0) translateY(0); }
                25% { transform: translateX(2px) translateY(-2px); }
                50% { transform: translateX(-1px) translateY(1px); }
                75% { transform: translateX(1px) translateY(-1px); }
            }

            /* Smooth scrolling behavior */
            html {
                scroll-behavior: smooth;
            }

            /* Custom scrollbar styling */
            ::-webkit-scrollbar {
                width: 8px;
            }

            ::-webkit-scrollbar-track {
                background: #0a0a0a;
            }

            ::-webkit-scrollbar-thumb {
                background: #404040;
                border-radius: 4px;
            }

            ::-webkit-scrollbar-thumb:hover {
                background: #525252;
            }

            /* Focus styles for accessibility */
            *:focus-visible {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }

            /* Enhanced text rendering */
            body {
                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            `}</style>
            </div>
    );
};
