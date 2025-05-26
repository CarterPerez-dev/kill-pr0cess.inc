/*
 * Interactive fractal canvas component showcasing real-time Rust backend performance.
 * I'm implementing smooth zoom, pan controls, and real-time performance metrics display to create an engaging demonstration.
 */

import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { useFractals } from '../../hooks/useFractals';

interface FractalCanvasProps {
    width?: number;
    height?: number;
}

export const FractalCanvas: Component<FractalCanvasProps> = (props) => {
    const { generateFractal, benchmarkFractals, isLoading, performance } = useFractals();

    let canvasRef: HTMLCanvasElement | undefined;
    let animationFrame: number | undefined;

    const [zoom, setZoom] = createSignal(1.0);
    const [centerX, setCenterX] = createSignal(-0.5);
    const [centerY, setCenterY] = createSignal(0.0);
    const [isDragging, setIsDragging] = createSignal(false);
    const [lastMousePos, setLastMousePos] = createSignal({ x: 0, y: 0 });
    const [currentPerf, setCurrentPerf] = createSignal<any>(null);

    const width = () => props.width || 800;
    const height = () => props.height || 600;

    // Here I'm setting up the initial fractal render
    onMount(async () => {
        if (canvasRef) {
            await renderFractal();
        }
    });

    onCleanup(() => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    });

    // Core fractal rendering function - this calls our blazing-fast Rust backend
    const renderFractal = async () => {
        if (!canvasRef) return;

        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;

        try {
            const startTime = performance.now();

            const response = await generateFractal({
                width: width(),
                                                   height: height(),
                                                   center_x: centerX(),
                                                   center_y: centerY(),
                                                   zoom: zoom(),
                                                   max_iterations: Math.min(100 + Math.floor(zoom() * 50), 1000),
                                                   fractal_type: 'Mandelbrot'
            });

            // I'm converting the raw pixel data from Rust into ImageData
            const imageData = new ImageData(
                new Uint8ClampedArray(response.data),
                                            response.width,
                                            response.height
            );

            ctx.putImageData(imageData, 0, 0);

            const totalTime = performance.now() - startTime;

            // Update performance metrics for real-time display
            setCurrentPerf({
                computation_time: response.computation_time_ms,
                network_time: totalTime - response.computation_time_ms,
                total_time: totalTime,
                zoom_level: zoom(),
                           pixels_computed: response.width * response.height
            });

        } catch (error) {
            console.error('Fractal generation failed:', error);
        }
    };

    // Mouse wheel zooming - I want this to feel smooth and responsive
    const handleWheel = async (e: WheelEvent) => {
        e.preventDefault();

        const rect = canvasRef!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom center based on mouse position
        const zoomFactor = e.deltaY > 0 ? 0.8 : 1.2;
        const newZoom = zoom() * zoomFactor;

        // Limit zoom to prevent infinite recursion and maintain performance
        if (newZoom < 0.1 || newZoom > 1000000) return;

        // Adjust center point to zoom toward mouse cursor
        const scale = 4.0 / zoom();
        const mouseWorldX = centerX() + (mouseX - width() / 2) * scale / width();
        const mouseWorldY = centerY() + (mouseY - height() / 2) * scale / height();

        const newCenterX = mouseWorldX - (mouseX - width() / 2) * (4.0 / newZoom) / width();
        const newCenterY = mouseWorldY - (mouseY - height() / 2) * (4.0 / newZoom) / height();

        setZoom(newZoom);
        setCenterX(newCenterX);
        setCenterY(newCenterY);

        // Debounced re-render for smooth interaction
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(renderFractal);
    };

    // Mouse dragging for panning
    const handleMouseDown = (e: MouseEvent) => {
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging()) return;

        const deltaX = e.clientX - lastMousePos().x;
        const deltaY = e.clientY - lastMousePos().y;

        const scale = 4.0 / zoom();
        const worldDeltaX = -deltaX * scale / width();
        const worldDeltaY = -deltaY * scale / height();

        setCenterX(centerX() + worldDeltaX);
        setCenterY(centerY() + worldDeltaY);
        setLastMousePos({ x: e.clientX, y: e.clientY });

        // Real-time panning
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(renderFractal);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div class="relative bg-black rounded-lg overflow-hidden border border-gray-800">
        {/* Canvas for fractal rendering */}
        <canvas
        ref={canvasRef}
        width={width()}
        height={height()}
        class="cursor-crosshair block"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        />

        {/* Loading overlay */}
        <div class={`absolute inset-0 bg-black/80 flex items-center justify-center transition-opacity duration-300 ${
            isLoading() ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
        <div class="text-center">
        <div class="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <div class="text-sm text-gray-400">Computing fractal...</div>
        </div>
        </div>

        {/* Performance display overlay */}
        <div class="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded border border-gray-700 p-3 text-xs font-mono">
        <div class="text-blue-400 font-semibold mb-1">PERFORMANCE METRICS</div>
        {currentPerf() && (
            <>
            <div class="text-gray-300">Rust Backend: <span class="text-green-400">{currentPerf().computation_time}ms</span></div>
            <div class="text-gray-300">Network: <span class="text-yellow-400">{Math.round(currentPerf().network_time)}ms</span></div>
            <div class="text-gray-300">Zoom: <span class="text-purple-400">{zoom().toExponential(2)}</span></div>
            <div class="text-gray-300">Pixels: <span class="text-cyan-400">{currentPerf().pixels_computed.toLocaleString()}</span></div>
            </>
        )}
        </div>

        {/* Control instructions */}
        <div class="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm rounded border border-gray-700 p-3 text-xs text-gray-400">
        <div>Scroll: Zoom • Drag: Pan</div>
        <div class="text-blue-400 mt-1">Powered by Rust + Axum</div>
        </div>
        </div>
    );
};
