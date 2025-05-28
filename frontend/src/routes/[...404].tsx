/*
 * 404 Not Found page component providing an eerie, contemplative error experience that maintains the dark aesthetic while guiding users back to valid routes.
 * I'm implementing philosophical messaging about digital void and non-existence while providing practical navigation options and maintaining the overall performance showcase theme.
 */

import { Component, createSignal, onMount } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';

export default function NotFound(): Component {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = createSignal(false);
  const [glitchText, setGlitchText] = createSignal('404');

  // I'm implementing a glitch effect for the 404 text
  onMount(() => {
    setIsVisible(true);

    // I'm creating a subtle glitch animation
    const glitchChars = ['4', '0', '4', '▓', '░', '█'];
    let glitchIndex = 0;

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        const originalText = '404';
        const glitched = originalText
          .split('')
          .map(char => Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char)
          .join('');

        setGlitchText(glitched);

        setTimeout(() => setGlitchText('404'), 100);
      }
    }, 2000);

    return () => clearInterval(glitchInterval);
  });

  // I'm implementing auto-redirect after a delay
  const handleAutoRedirect = () => {
    setTimeout(() => {
      navigate('/');
    }, 10000); // Redirect after 10 seconds
  };

  return (
    <div class="min-h-screen bg-black text-neutral-100 flex items-center justify-center relative overflow-hidden">
      {/* Atmospheric background */}
      <div class="absolute inset-0 opacity-5">
        <div class="absolute top-1/3 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/3 right-1/4 w-80 h-80 bg-neutral-900/30 rounded-full blur-3xl animate-pulse" style="animation-delay: 3s"></div>
      </div>

      {/* Grid pattern */}
      <div
        class="absolute inset-0 opacity-[0.02]"
        style={{
          "background-image": `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          "background-size": "50px 50px"
        }}
      ></div>

      <div class={`relative z-10 max-w-2xl mx-auto px-6 text-center transition-all duration-2000 ${isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Main 404 Display */}
        <div class="mb-8">
          <h1 class="text-8xl md:text-9xl font-thin text-neutral-100 mb-4 font-mono tracking-wider">
            {glitchText()}
          </h1>
          <div class="text-xl md:text-2xl font-thin text-neutral-400 tracking-wide mb-2">
            NOT FOUND
          </div>
          <div class="text-sm text-neutral-600 font-mono">
            ERROR_CODE: RESOURCE_DOES_NOT_EXIST
          </div>
        </div>

        {/* Philosophical Message */}
        <div class="mb-12 max-w-lg mx-auto">
          <p class="text-lg text-neutral-400 leading-relaxed mb-6">
            You have ventured into the digital void—a space that exists between intention and reality,
            where requests meet the infinite emptiness of non-existence.
          </p>

          <p class="text-sm text-neutral-500 italic">
            "In the absence of content, we find the presence of possibility."
          </p>
        </div>

        {/* Navigation Options */}
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <A
              href="/"
              class="group px-8 py-3 bg-neutral-100 text-black hover:bg-neutral-200 rounded font-mono text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2"
            >
              RETURN TO ORIGIN
              <div class="w-1 h-1 bg-black rounded-full group-hover:w-2 transition-all duration-300"></div>
            </A>

            <A
              href="/projects"
              class="px-8 py-3 bg-transparent border border-neutral-600 text-neutral-300 hover:border-neutral-400 hover:text-neutral-100 rounded font-mono text-sm tracking-wide transition-all duration-300"
            >
              EXPLORE REPOSITORIES
            </A>
          </div>

          <div class="text-center">
            <button
              onClick={() => window.history.back()}
              class="text-neutral-500 hover:text-neutral-300 text-sm font-mono transition-colors duration-200"
            >
              ← TRAVERSE BACKWARDS
            </button>
          </div>
        </div>

        {/* System Information */}
        <div class="mt-16 pt-8 border-t border-neutral-800">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-neutral-600">
            <div>
              <div class="text-neutral-500 mb-1">TIMESTAMP</div>
              <div>{new Date().toISOString()}</div>
            </div>
            <div>
              <div class="text-neutral-500 mb-1">REQUEST_PATH</div>
              <div class="truncate">{window.location.pathname}</div>
            </div>
            <div>
              <div class="text-neutral-500 mb-1">STATUS_CODE</div>
              <div>404</div>
            </div>
          </div>
        </div>

        {/* Available Routes Hint */}
        <div class="mt-8 p-4 bg-neutral-900/30 border border-neutral-800 rounded">
          <div class="text-xs text-neutral-500 font-mono uppercase mb-2">Available Endpoints</div>
          <div class="text-xs text-neutral-600 space-y-1">
            <div>/ → Performance showcase home</div>
            <div>/projects → GitHub repository exploration</div>
            <div>/performance → System metrics and benchmarks</div>
            <div>/about → Technical architecture details</div>
          </div>
        </div>

        {/* Auto-redirect notice */}
        <div class="mt-6 text-xs text-neutral-700">
          Automatic redirection to home in 10 seconds...
        </div>
      </div>

      {/* Corner accent lines */}
      <div class="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-neutral-800 opacity-30"></div>
      <div class="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-neutral-800 opacity-30"></div>
      <div class="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-neutral-800 opacity-30"></div>
      <div class="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-neutral-800 opacity-30"></div>
    </div>
  );
}
