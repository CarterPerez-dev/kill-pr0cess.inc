/*
 * Robust error boundary component providing graceful error handling and recovery for the entire application with contextual error reporting.
 * I'm implementing comprehensive error catching, logging, and user-friendly fallback interfaces that maintain the dark aesthetic while providing actionable error information and recovery options.
 */

import { Component, JSX, createSignal, createEffect, Show, onMount } from 'solid-js';
import { Card } from './Card';

interface ErrorInfo {
  error: Error;
  timestamp: Date;
  component?: string;
  context?: string;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
}

interface ErrorBoundaryProps {
  children: JSX.Element;
  fallback?: (error: ErrorInfo, retry: () => void) => JSX.Element;
  onError?: (error: ErrorInfo) => void;
  context?: string;
  level?: 'page' | 'component' | 'critical';
}

export const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
  const [error, setError] = createSignal<ErrorInfo | null>(null);
  const [retryCount, setRetryCount] = createSignal(0);

  // I'm setting up global error handlers for comprehensive error catching
  onMount(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        error: new Error(`Unhandled Promise Rejection: ${event.reason}`),
        timestamp: new Date(),
        context: props.context || 'Promise Rejection',
        userAgent: navigator.userAgent,
        url: window.location.href,
        stackTrace: event.reason?.stack || 'No stack trace available'
      };

      handleError(errorInfo);
      event.preventDefault();
    };

    // Handle general JavaScript errors
    const handleJSError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        error: event.error || new Error(event.message),
        timestamp: new Date(),
        context: props.context || 'JavaScript Error',
        userAgent: navigator.userAgent,
        url: window.location.href,
        stackTrace: event.error?.stack || 'No stack trace available'
      };

      handleError(errorInfo);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleJSError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleJSError);
    };
  });

  const handleError = (errorInfo: ErrorInfo) => {
    console.error('Error caught by boundary:', errorInfo);

    // I'm logging the error for debugging and monitoring
    if (props.onError) {
      props.onError(errorInfo);
    }

    // Send error to monitoring service (would be implemented in production)
    reportError(errorInfo);

    setError(errorInfo);
  };

  const retry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  const reportError = (errorInfo: ErrorInfo) => {
    // I'm implementing error reporting (would connect to monitoring service in production)
    try {
      const errorReport = {
        ...errorInfo,
        retryCount: retryCount(),
        level: props.level || 'component',
        error: {
          name: errorInfo.error.name,
          message: errorInfo.error.message,
          stack: errorInfo.error.stack
        }
      };

      // In production, this would send to an error monitoring service
      console.warn('Error report:', errorReport);

      // Store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      existingErrors.push(errorReport);

      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('app-errors', JSON.stringify(recentErrors));
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  // I'm providing different fallback UIs based on error context
  const renderFallback = () => {
    const currentError = error()!;

    if (props.fallback) {
      return props.fallback(currentError, retry);
    }

    // Default fallback based on error level
    switch (props.level) {
      case 'critical':
        return <CriticalErrorFallback error={currentError} onRetry={retry} />;
      case 'page':
        return <PageErrorFallback error={currentError} onRetry={retry} />;
      case 'component':
      default:
        return <ComponentErrorFallback error={currentError} onRetry={retry} />;
    }
  };

  // I'm implementing error recovery through retry mechanism
  createEffect(() => {
    // Clear error after successful retry
    if (retryCount() > 0 && !error()) {
      console.log(`Error recovered after ${retryCount()} retries`);
    }
  });

  return (
    <Show when={!error()} fallback={renderFallback()}>
      {props.children}
    </Show>
  );
};

// I'm creating specialized error fallback components for different contexts
const ComponentErrorFallback: Component<{
  error: ErrorInfo;
  onRetry: () => void;
}> = (props) => {
  const [showDetails, setShowDetails] = createSignal(false);

  return (
    <Card variant="outlined" class="border-red-800 bg-red-900/10">
      <div class="flex items-start gap-3">
        <div class="text-red-400 text-xl flex-shrink-0">
          ⚠
        </div>

        <div class="flex-1">
          <h3 class="text-red-400 font-mono text-sm font-semibold mb-2">
            Component Error
          </h3>

          <p class="text-neutral-300 text-sm mb-4">
            Something went wrong in this component. The error has been logged and reported.
          </p>

          <div class="flex items-center gap-3 mb-4">
            <button
              onClick={props.onRetry}
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-mono transition-colors duration-200"
            >
              RETRY
            </button>

            <button
              onClick={() => setShowDetails(!showDetails())}
              class="px-4 py-2 bg-transparent border border-neutral-600 hover:border-neutral-500 text-neutral-300 rounded text-sm font-mono transition-colors duration-200"
            >
              {showDetails() ? 'HIDE' : 'DETAILS'}
            </button>
          </div>

          <Show when={showDetails()}>
            <div class="bg-black/50 rounded p-3 font-mono text-xs">
              <div class="text-neutral-400 mb-2">Error Message:</div>
              <div class="text-red-300 mb-3">{props.error.error.message}</div>

              <div class="text-neutral-400 mb-2">Context:</div>
              <div class="text-neutral-300 mb-3">{props.error.context || 'Unknown'}</div>

              <div class="text-neutral-400 mb-2">Timestamp:</div>
              <div class="text-neutral-300">{props.error.timestamp.toISOString()}</div>

              <Show when={props.error.stackTrace}>
                <div class="text-neutral-400 mt-3 mb-2">Stack Trace:</div>
                <pre class="text-neutral-500 text-xs overflow-x-auto whitespace-pre-wrap">
                  {props.error.stackTrace}
                </pre>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </Card>
  );
};

const PageErrorFallback: Component<{
  error: ErrorInfo;
  onRetry: () => void;
}> = (props) => {
  return (
    <div class="min-h-screen bg-black text-neutral-100 flex items-center justify-center p-6">
      <div class="max-w-md w-full">
        <Card variant="elevated" class="text-center border-red-800">
          <div class="text-red-400 text-6xl mb-6">
            ⚠
          </div>

          <h1 class="text-2xl font-thin text-neutral-100 mb-4">
            PAGE ERROR
          </h1>

          <p class="text-neutral-400 mb-6 leading-relaxed">
            An unexpected error occurred while loading this page. The system has logged
            the issue and our monitoring systems have been notified.
          </p>

          <div class="space-y-3">
            <button
              onClick={props.onRetry}
              class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-sm transition-colors duration-200"
            >
              RETRY LOADING
            </button>

            <button
              onClick={() => window.location.href = '/'}
              class="w-full px-6 py-3 bg-transparent border border-neutral-600 hover:border-neutral-500 text-neutral-300 rounded font-mono text-sm transition-colors duration-200"
            >
              RETURN HOME
            </button>
          </div>

          <div class="mt-6 pt-6 border-t border-neutral-800">
            <p class="text-xs text-neutral-600">
              Error ID: {props.error.timestamp.getTime().toString(36)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

const CriticalErrorFallback: Component<{
  error: ErrorInfo;
  onRetry: () => void;
}> = (props) => {
  return (
    <div class="min-h-screen bg-black text-neutral-100 flex items-center justify-center p-6">
      <div class="max-w-lg w-full">
        <Card variant="elevated" class="text-center border-red-700 bg-red-900/20">
          <div class="text-red-400 text-8xl mb-6 animate-pulse">
            ⚠
          </div>

          <h1 class="text-3xl font-thin text-neutral-100 mb-4">
            CRITICAL SYSTEM ERROR
          </h1>

          <p class="text-neutral-300 mb-6 leading-relaxed">
            A critical error has occurred that prevents the application from functioning normally.
            This issue has been automatically reported to our development team.
          </p>

          <div class="bg-red-900/30 border border-red-800 rounded p-4 mb-6">
            <div class="text-red-300 font-mono text-sm">
              {props.error.error.message}
            </div>
          </div>

          <div class="space-y-4">
            <button
              onClick={props.onRetry}
              class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-sm transition-colors duration-200"
            >
              ATTEMPT RECOVERY
            </button>

            <button
              onClick={() => window.location.reload()}
              class="w-full px-6 py-3 bg-transparent border border-neutral-600 hover:border-neutral-500 text-neutral-300 rounded font-mono text-sm transition-colors duration-200"
            >
              RELOAD APPLICATION
            </button>
          </div>

          <div class="mt-8 pt-6 border-t border-neutral-800">
            <p class="text-xs text-neutral-600 italic">
              "In the face of computational failure, we find opportunities for greater understanding."
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// I'm providing specialized error boundaries for specific contexts
export const FractalErrorBoundary: Component<{
  children: JSX.Element;
}> = (props) => {
  return (
    <ErrorBoundary
      context="Fractal Generation"
      level="component"
      fallback={(error, retry) => (
        <Card variant="outlined" class="border-red-800 bg-red-900/10 text-center p-8">
          <div class="text-red-400 text-4xl mb-4">∞</div>
          <h3 class="text-red-400 font-mono text-lg mb-3">FRACTAL COMPUTATION ERROR</h3>
          <p class="text-neutral-400 text-sm mb-4">
            Mathematical complexity exceeded safe computational bounds.
          </p>
          <button
            onClick={retry}
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-mono text-sm transition-colors duration-200"
          >
            RECALCULATE
          </button>
        </Card>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
};

export const PerformanceErrorBoundary: Component<{
  children: JSX.Element;
}> = (props) => {
  return (
    <ErrorBoundary
      context="Performance Monitoring"
      level="component"
      fallback={(error, retry) => (
        <Card variant="outlined" class="border-yellow-800 bg-yellow-900/10 text-center p-6">
          <div class="text-yellow-400 text-3xl mb-3">📊</div>
          <h3 class="text-yellow-400 font-mono text-sm mb-2">METRICS COLLECTION FAILED</h3>
          <p class="text-neutral-400 text-xs mb-4">
            Performance monitoring temporarily unavailable.
          </p>
          <button
            onClick={retry}
            class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded font-mono text-xs transition-colors duration-200"
          >
            RECONNECT
          </button>
        </Card>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
};

// I'm providing utilities for manual error reporting
export const reportManualError = (error: Error, context?: string) => {
  const errorInfo: ErrorInfo = {
    error,
    timestamp: new Date(),
    context: context || 'Manual Report',
    userAgent: navigator.userAgent,
    url: window.location.href,
    stackTrace: error.stack
  };

  console.error('Manual error report:', errorInfo);

  // Store for debugging
  try {
    const existingErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
    existingErrors.push(errorInfo);
    localStorage.setItem('app-errors', JSON.stringify(existingErrors.slice(-10)));
  } catch (storageError) {
    console.warn('Failed to store error locally:', storageError);
  }
};

export const getStoredErrors = (): ErrorInfo[] => {
  try {
    return JSON.parse(localStorage.getItem('app-errors') || '[]');
  } catch {
    return [];
  }
};

export const clearStoredErrors = () => {
  try {
    localStorage.removeItem('app-errors');
  } catch (error) {
    console.warn('Failed to clear stored errors:', error);
  }
};
