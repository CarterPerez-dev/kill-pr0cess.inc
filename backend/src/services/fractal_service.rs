/*
 * Core fractal generation service showcasing Rust's computational performance.
 * I'm implementing both Mandelbrot and Julia set generation with deep zoom capabilities and parallel processing to really demonstrate speed.
 */

use num_complex::Complex;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::time::Instant;

#[derive(Debug, Clone)]
pub struct FractalRequest {
    pub width: u32,
    pub height: u32,
    pub center_x: f64,
    pub center_y: f64,
    pub zoom: f64,
    pub max_iterations: u32,
    pub fractal_type: FractalType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FractalType {
    Mandelbrot,
    Julia { c_real: f64, c_imag: f64 },
}

#[derive(Debug, Serialize)]
pub struct FractalResponse {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub computation_time_ms: u128,
    pub zoom_level: f64,
}

#[derive(Clone)]
pub struct FractalService;

impl FractalService {
    pub fn new() -> Self {
        Self
    }

    // Here I'm generating Mandelbrot fractals with parallel processing for maximum performance
    pub fn generate_mandelbrot(&self, request: FractalRequest) -> FractalResponse {
        let start_time = Instant::now();

        let scale = 4.0 / request.zoom;
        let data: Vec<u8> = (0..request.height)
        .into_par_iter()
        .flat_map(|y| {
            (0..request.width).into_par_iter().map(move |x| {
                let cx = request.center_x + (x as f64 - request.width as f64 / 2.0) * scale / request.width as f64;
                let cy = request.center_y + (y as f64 - request.height as f64 / 2.0) * scale / request.height as f64;

                let c = Complex::new(cx, cy);
                let iterations = self.mandelbrot_iterations(c, request.max_iterations);

                self.iteration_to_dark_color(iterations, request.max_iterations)
            }).collect::<Vec<_>>()
        })
        .flatten()
        .collect();

        FractalResponse {
            data,
            width: request.width,
            height: request.height,
            computation_time_ms: start_time.elapsed().as_millis(),
            zoom_level: request.zoom,
        }
    }

    // Julia set generation with similar parallel approach
    pub fn generate_julia(&self, request: FractalRequest, c: Complex<f64>) -> FractalResponse {
        let start_time = Instant::now();

        let scale = 4.0 / request.zoom;
        let data: Vec<u8> = (0..request.height)
        .into_par_iter()
        .flat_map(|y| {
            (0..request.width).into_par_iter().map(move |x| {
                let zx = request.center_x + (x as f64 - request.width as f64 / 2.0) * scale / request.width as f64;
                let zy = request.center_y + (y as f64 - request.height as f64 / 2.0) * scale / request.height as f64;

                let z = Complex::new(zx, zy);
                let iterations = self.julia_iterations(z, c, request.max_iterations);

                self.iteration_to_dark_color(iterations, request.max_iterations)
            }).collect::<Vec<_>>()
        })
        .flatten()
        .collect();

        FractalResponse {
            data,
            width: request.width,
            height: request.height,
            computation_time_ms: start_time.elapsed().as_millis(),
            zoom_level: request.zoom,
        }
    }

    // Core Mandelbrot iteration calculation - this is where Rust's speed really shows
    fn mandelbrot_iterations(&self, c: Complex<f64>, max_iterations: u32) -> u32 {
        let mut z = Complex::new(0.0, 0.0);

        for i in 0..max_iterations {
            if z.norm_sqr() > 4.0 {
                return i;
            }
            z = z * z + c;
        }

        max_iterations
    }

    // Julia set iteration calculation
    fn julia_iterations(&self, mut z: Complex<f64>, c: Complex<f64>, max_iterations: u32) -> u32 {
        for i in 0..max_iterations {
            if z.norm_sqr() > 4.0 {
                return i;
            }
            z = z * z + c;
        }

        max_iterations
    }

    // I'm creating a dark, eerie color palette that fits the Mr. Robot theme
    fn iteration_to_dark_color(&self, iterations: u32, max_iterations: u32) -> [u8; 4] {
        if iterations == max_iterations {
            // Deep black for points in the set
            [0, 0, 0, 255]
        } else {
            // Cool, dark gradient for escape points
            let t = iterations as f64 / max_iterations as f64;
            let r = (t * 30.0) as u8;  // Very dark red
            let g = (t * 50.0) as u8;  // Slightly more green for that eerie glow
            let b = (t * 80.0) as u8;  // Cool blue tones
            [r, g, b, 255]
        }
    }

    // Benchmark function to showcase computational speed
    pub fn benchmark_generation(&self, iterations: u32) -> serde_json::Value {
        let mut results = Vec::new();

        // I'm testing different complexity levels to show performance scaling
        let test_cases = vec![
            (512, 512, 100),
            (1024, 1024, 200),
            (2048, 2048, 400),
        ];

        for (width, height, max_iter) in test_cases {
            let request = FractalRequest {
                width,
                height,
                center_x: -0.5,
                center_y: 0.0,
                zoom: 1.0,
                max_iterations: max_iter,
                fractal_type: FractalType::Mandelbrot,
            };

            let response = self.generate_mandelbrot(request);
            results.push(serde_json::json!({
                "resolution": format!("{}x{}", width, height),
                                           "max_iterations": max_iter,
                                           "computation_time_ms": response.computation_time_ms,
                                           "pixels_per_ms": (width * height) as f64 / response.computation_time_ms as f64
            }));
        }

        serde_json::json!({
            "benchmark_results": results,
            "total_iterations": iterations,
            "language": "Rust",
            "parallel_processing": true
        })
    }
}
