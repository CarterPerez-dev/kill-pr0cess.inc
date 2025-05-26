/*
 * Main application component that orchestrates the dark, performance-focused UI.
 * I'm using SolidJS for fine-grained reactivity and implementing the eerie Mr. Robot aesthetic throughout.
 */

import { Component, createSignal, onMount } from 'solid-js';
import { Router, Route, Routes } from '@solidjs/router';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Performance from './pages/Performance';
import About from './pages/About';
import { useWebVitals } from './hooks/useWebVitals';
import './styles/global.css';

const App: Component = () => {
  const [isLoading, setIsLoading] = createSignal(true);
  
  // I'm tracking web vitals from the start to showcase real-time performance
  useWebVitals();

  onMount(() => {
    // Simulating a brief loading state for that dramatic entrance effect
    setTimeout(() => setIsLoading(false), 1000);
  });

  return (
    <div class="min-h-screen bg-black text-gray-100 overflow-x-hidden">
      {/* Loading overlay with eerie animation */}
      <div 
        class={`fixed inset-0 bg-black z-50 transition-opacity duration-1000 ${
          isLoading() ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-16 h-16 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>

      {/* Main application */}
      <Router>
        <div class="flex flex-col min-h-screen">
          <Header />
          
          <main class="flex-1 relative">
            {/* Subtle background pattern for that tech noir feel */}
            <div class="absolute inset-0 opacity-5">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent"></div>
              <div class="absolute inset-0" style={{
                "background-image": `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.1) 1px, transparent 0)`,
                "background-size": "20px 20px"
              }}></div>
            </div>
            
            <Routes>
              <Route path="/" component={Home} />
              <Route path="/projects" component={Projects} />
              <Route path="/performance" component={Performance} />
              <Route path="/about" component={About} />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </div>
  );
};

export default App;
