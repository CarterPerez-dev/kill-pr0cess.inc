// src/app.tsx
import { Suspense, Component, createSignal, onMount, Show } from "solid-js";
import { MetaProvider, Title, Meta, Link as MetaLink } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes, Scripts } from "@solidjs/start/router";
import "./app.css";

import { Layout } from './components/Layout/Layout';
import { ErrorBoundary } from './components/UI/ErrorBoundary';

const App: Component = () => {
  console.log("[app.tsx] App component function executed (using components/Layout/Layout.tsx).");


  return (
    <Router
      root={(props) => (
        <MetaProvider>

          <Title>Performance Showcase - SolidStart</Title>
          <Meta name="description" content="A dark, contemplative performance showcase application using SolidStart." />
          <MetaLink rel="icon" href="/favicon.ico" />
          <MetaLink rel="preconnect" href="https://fonts.googleapis.com" />
          <MetaLink rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

          <Layout
            showHeader={true}
            showFooter={true}
          >
            <ErrorBoundary context="FileRoutes Content" level="page">
              <Suspense fallback={
                <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000;">
                  <div style="width: 50px; height: 50px; border: 4px solid #555; border-top-color: #0af; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                  <p style="color: #777; margin-top: 15px; font-family: monospace;">Loading Route Content...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              }>
                {props.children}
              </Suspense>
            </ErrorBoundary>
          </Layout>

          {import.meta.env.DEV && (
            <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #aaa; padding: 5px 10px; font-size: 10px; font-family: monospace; z-index: 1000;">
              <div>SolidStart (Layout in app.tsx)</div>
              <div>Mode: {typeof window !== 'undefined' ? 'Hydrated' : 'SSR'}</div>
            </div>
          )}
          <Scripts />
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
};

export default App;
