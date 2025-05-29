// src/components/Layout/Layout.tsx (No longer the main layout provider)
import { Component, JSX } from 'solid-js';
import { ErrorBoundary } from '../UI/ErrorBoundary'; // Your custom UI ErrorBoundary
// Removed imports for Header, Footer, performanceMonitor, isServer, etc. as they are in _layout.tsx

// PageLayout variant - this component is now simpler as _layout.tsx handles the shell
export const PageLayout: Component<{
  children: JSX.Element;
  // Title and description should be set by the route component using @solidjs/meta
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}> = (props) => {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none'
  };

  return (
    // This div provides padding and max-width *within* the main content area
    // defined by src/routes/_layout.tsx
    <div class={`${maxWidthClasses[props.maxWidth || 'lg']} mx-auto px-6 py-12`}>
      <ErrorBoundary context="PageLayout Content" level="page">
        {props.children}
      </ErrorBoundary>
    </div>
  );
};

// FullscreenLayout variant
export const FullscreenLayout: Component<{
  children: JSX.Element;
  // Title should be set by the route component using @solidjs/meta
}> = (props) => {
  // This layout variant might imply that src/routes/_layout.tsx should *not* render
  // its Header/Footer. This requires more advanced conditional logic in _layout.tsx
  // based on route metadata, or a different _layout file for fullscreen routes.
  // For now, it will just render children directly within the main _layout structure.
  return (
    <div class="w-full h-full"> {/* Occupy full space given by parent */}
       <ErrorBoundary context="FullscreenLayout Content" level="page">
        {props.children}
      </ErrorBoundary>
    </div>
  );
};

// MinimalLayout variant
export const MinimalLayout: Component<{
  children: JSX.Element;
  // Title should be set by the route component using @solidjs/meta
}> = (props) => {
  // This component is intended to be used *instead* of the main _layout.tsx
  // for routes that need a completely different shell.
  // This requires route-specific layout configuration in SolidStart.
  // For now, if used, it would still be wrapped by _layout.tsx unless configured otherwise.
  return (
    <div class="min-h-screen bg-black text-neutral-100 flex items-center justify-center p-6">
      <ErrorBoundary context="Minimal Layout" level="page">
        {props.children}
      </ErrorBoundary>
    </div>
  );
};
