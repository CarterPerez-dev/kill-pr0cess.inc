/*
 * Fractal computation models defining data structures for mathematical visualization and performance tracking in the showcase.
 * I'm implementing comprehensive fractal parameter management, result handling, and benchmark structures that integrate seamlessly with the high-performance Rust computation engine.
 */

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use validator::{Validate, ValidationError};

/// Core fractal generation request with comprehensive parameter validation
/// I'm ensuring all fractal parameters are within safe computational bounds
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct FractalRequest {
    #[validate(range(min = 64, max = 4096, message = "Width must be between 64 and 4096 pixels"))]
    pub width: u32,

    #[validate(range(min = 64, max = 4096, message = "Height must be between 64 and 4096 pixels"))]
    pub height: u32,

    #[validate(range(min = -2.0, max = 2.0, message = "Center X must be between -2.0 and 2.0"))]
    pub center_x: f64,

    #[validate(range(min = -2.0, max = 2.0, message = "Center Y must be between -2.0 and 2.0"))]
    pub center_y: f64,

    #[validate(range(min = 0.1, max = 1e15, message = "Zoom must be between 0.1 and 1e15"))]
    pub zoom: f64,

    #[validate(range(min = 50, max = 10000, message = "Max iterations must be between 50 and 10000"))]
    pub max_iterations: u32,

    pub fractal_type: FractalType,
}

/// Fractal computation response with comprehensive performance metrics
/// I'm providing detailed performance analysis alongside the computational results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FractalResponse {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub computation_time_ms: u128,
    pub zoom_level: f64,
    pub parameters: FractalParameters,
    pub performance_metrics: FractalPerformanceMetrics,
    pub metadata: FractalMetadata,
}

/// Fractal type enumeration supporting Mandelbrot and Julia sets
/// I'm implementing type-safe fractal variants with specific parameters
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FractalType {
    Mandelbrot,
    Julia { c_real: f64, c_imag: f64 },
}

impl FractalType {
    pub fn name(&self) -> &'static str {
        match self {
            FractalType::Mandelbrot => "mandelbrot",
            FractalType::Julia { .. } => "julia",
        }
    }

    pub fn is_julia(&self) -> bool {
        matches!(self, FractalType::Julia { .. })
    }

    pub fn julia_constant(&self) -> Option<(f64, f64)> {
        match *self {
            FractalType::Julia { c_real, c_imag } => Some((c_real, c_imag)),
            _ => None,
        }
    }
}

/// Fractal computation parameters for result tracking
/// I'm preserving all parameters used in fractal generation for reproducibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FractalParameters {
    pub fractal_type: String,
    pub center_x: f64,
    pub center_y: f64,
    pub zoom_level: f64,
    pub max_iterations: u32,
    pub julia_constant: Option<(f64, f64)>,
    pub color_palette: String,
    pub escape_radius: f64,
}

impl FractalParameters {
    pub fn from_request(request: &FractalRequest) -> Self {
        Self {
            fractal_type: request.fractal_type.name().to_string(),
            center_x: request.center_x,
            center_y: request.center_y,
            zoom_level: request.zoom,
            max_iterations: request.max_iterations,
            julia_constant: request.fractal_type.julia_constant(),
            color_palette: "dark_theme".to_string(),
            escape_radius: 4.0,
        }
    }
}

/// Comprehensive performance metrics for fractal computations
/// I'm tracking detailed performance data for optimization and showcase purposes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FractalPerformanceMetrics {
    pub pixels_per_second: f64,
    pub parallel_efficiency: f64,
    pub memory_usage_mb: f64,
    pub cpu_utilization: f64,
    pub cache_hit_rate: f64,
    pub optimization_flags: Vec<String>,
    pub simd_acceleration: bool,
    pub thread_count: u32,
    pub computation_complexity: ComputationComplexity,
}

/// Computation complexity classification for performance analysis
/// I'm categorizing fractal computations by their computational demands
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComputationComplexity {
    Low,
    Medium,
    High,
    Extreme,
}

impl ComputationComplexity {
    pub fn from_parameters(width: u32, height: u32, iterations: u32, zoom: f64) -> Self {
        let pixel_count = width * height;
        let complexity_score = (pixel_count as f64 * iterations as f64 * zoom.log10().max(0.0)) / 1_000_000.0;

        match complexity_score {
            x if x < 1.0 => ComputationComplexity::Low,
            x if x < 10.0 => ComputationComplexity::Medium,
            x if x < 100.0 => ComputationComplexity::High,
            _ => ComputationComplexity::Extreme,
        }
    }
}

/// Fractal computation metadata for tracking and analytics
/// I'm providing comprehensive metadata for fractal generation tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FractalMetadata {
    pub generation_id: uuid::Uuid,
    pub timestamp: DateTime<Utc>,
    pub request_source: String,
    pub computation_method: String,
    pub quality_metrics: QualityMetrics,
    pub version_info: VersionInfo,
}

/// Quality assessment metrics for fractal visualizations
/// I'm implementing quality analysis for fractal rendering assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityMetrics {
    pub detail_level: f64,
    pub convergence_rate: f64,
    pub edge_definition: f64,
    pub color_distribution: f64,
    pub overall_quality: QualityRating,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QualityRating {
    Excellent,
    Good,
    Fair,
    Poor,
}

/// Version information for reproducible computations
/// I'm tracking software versions for computational reproducibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionInfo {
    pub engine_version: String,
    pub rust_version: String,
    pub algorithm_version: String,
    pub optimization_level: String,
}

/// Database model for fractal computation logging
/// I'm implementing comprehensive fractal computation tracking in the database
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FractalComputationLog {
    pub id: uuid::Uuid,
    pub fractal_type: String,
    pub width: i32,
    pub height: i32,
    pub center_x: f64,
    pub center_y: f64,
    pub zoom_level: f64,
    pub max_iterations: i32,
    pub julia_c_real: Option<f64>,
    pub julia_c_imag: Option<f64>,
    pub computation_time_ms: i32,
    pub memory_used_bytes: Option<i64>,
    pub cpu_cores_used: Option<i32>,
    pub parallel_threads: Option<i32>,
    pub pixels_computed: i64,
    pub pixels_per_ms: f64,
    pub session_id: Option<uuid::Uuid>,
    pub ip_address: Option<std::net::IpAddr>,
    pub user_agent: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub iteration_efficiency: Option<f64>,
    pub cache_hit: bool,
    pub optimization_flags: Option<Vec<String>>,
}

impl FractalComputationLog {
    pub fn from_request_and_response(
        request: &FractalRequest,
        response: &FractalResponse,
        session_id: Option<uuid::Uuid>,
        ip_address: Option<std::net::IpAddr>,
        user_agent: Option<String>,
    ) -> Self {
        let (julia_c_real, julia_c_imag) = match &request.fractal_type {
            FractalType::Julia { c_real, c_imag } => (Some(*c_real), Some(*c_imag)),
            _ => (None, None),
        };

        Self {
            id: uuid::Uuid::new_v4(),
            fractal_type: request.fractal_type.name().to_string(),
            width: request.width as i32,
            height: request.height as i32,
            center_x: request.center_x,
            center_y: request.center_y,
            zoom_level: request.zoom,
            max_iterations: request.max_iterations as i32,
            julia_c_real,
            julia_c_imag,
            computation_time_ms: response.computation_time_ms as i32,
            memory_used_bytes: Some((response.performance_metrics.memory_usage_mb * 1024.0 * 1024.0) as i64),
            cpu_cores_used: Some(response.performance_metrics.thread_count as i32),
            parallel_threads: Some(response.performance_metrics.thread_count as i32),
            pixels_computed: (request.width * request.height) as i64,
            pixels_per_ms: response.performance_metrics.pixels_per_second / 1000.0,
            session_id,
            ip_address,
            user_agent,
            timestamp: Utc::now(),
            iteration_efficiency: Some(calculate_iteration_efficiency(&response)),
            cache_hit: response.performance_metrics.cache_hit_rate > 0.0,
            optimization_flags: Some(response.performance_metrics.optimization_flags.clone()),
        }
    }
}

/// Benchmark request structure for performance testing
/// I'm implementing comprehensive benchmark configuration for performance analysis
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct BenchmarkRequest {
    #[validate(range(min = 1, max = 100, message = "Iterations must be between 1 and 100"))]
    pub iterations: u32,

    pub test_scenarios: Vec<BenchmarkScenario>,
    pub include_system_info: bool,
    pub include_comparison: bool,
    pub parallel_execution: bool,
}

/// Individual benchmark scenario configuration
/// I'm defining specific test cases for comprehensive performance evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkScenario {
    pub name: String,
    pub description: String,
    pub fractal_request: FractalRequest,
    pub expected_performance: Option<ExpectedPerformance>,
}

/// Expected performance baseline for regression testing
/// I'm implementing performance regression detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpectedPerformance {
    pub max_computation_time_ms: u128,
    pub min_pixels_per_second: f64,
    pub max_memory_usage_mb: f64,
    pub min_parallel_efficiency: f64,
}

/// Comprehensive benchmark response with detailed analysis
/// I'm providing thorough benchmark results for performance evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkResponse {
    pub benchmark_id: uuid::Uuid,
    pub timestamp: DateTime<Utc>,
    pub total_duration_ms: u128,
    pub scenarios: Vec<BenchmarkScenarioResult>,
    pub system_context: SystemContext,
    pub performance_analysis: PerformanceAnalysis,
    pub comparison_results: Option<ComparisonResults>,
}

/// Individual benchmark scenario results
/// I'm tracking detailed results for each benchmark scenario
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BenchmarkScenarioResult {
    pub scenario_name: String,
    pub iterations_completed: u32,
    pub fractal_results: Vec<FractalResponse>,
    pub average_computation_time_ms: f64,
    pub average_pixels_per_second: f64,
    pub performance_variance: f64,
    pub passed_expectations: bool,
    pub performance_rating: String,
}

/// System context information for benchmark analysis
/// I'm capturing system state during benchmark execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemContext {
    pub cpu_model: String,
    pub cpu_cores: u32,
    pub memory_total_gb: f64,
    pub rust_version: String,
    pub compiler_flags: Vec<String>,
    pub parallel_processing: bool,
    pub simd_support: Vec<String>,
    pub system_load: f64,
}

/// Performance analysis summary
/// I'm providing comprehensive performance insights
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAnalysis {
    pub overall_rating: String,
    pub performance_grade: char,
    pub strengths: Vec<String>,
    pub bottlenecks: Vec<String>,
    pub recommendations: Vec<String>,
    pub efficiency_score: f64,
}

/// Comparison results against baseline performance
/// I'm implementing performance comparison for continuous improvement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComparisonResults {
    pub baseline_system: String,
    pub relative_performance: f64,
    pub performance_delta: f64,
    pub regression_detected: bool,
    pub improvement_areas: Vec<String>,
}

// Helper functions for fractal computations and analysis

fn calculate_iteration_efficiency(response: &FractalResponse) -> f64 {
    let total_pixels = response.width as f64 * response.height as f64;
    let max_possible_iterations = response.parameters.max_iterations as f64 * total_pixels;
    let computation_time_seconds = response.computation_time_ms as f64 / 1000.0;

    // Estimate actual iterations based on computation time and complexity
    let estimated_iterations = response.performance_metrics.pixels_per_second * computation_time_seconds;

    if max_possible_iterations > 0.0 {
        (estimated_iterations / max_possible_iterations).min(1.0)
    } else {
        0.0
    }
}

impl Default for BenchmarkRequest {
    fn default() -> Self {
        Self {
            iterations: 5,
            test_scenarios: vec![
                BenchmarkScenario {
                    name: "low_complexity".to_string(),
                    description: "Low complexity Mandelbrot set".to_string(),
                    fractal_request: FractalRequest {
                        width: 512,
                        height: 512,
                        center_x: -0.5,
                        center_y: 0.0,
                        zoom: 1.0,
                        max_iterations: 100,
                        fractal_type: FractalType::Mandelbrot,
                    },
                    expected_performance: None,
                },
                BenchmarkScenario {
                    name: "medium_complexity".to_string(),
                    description: "Medium complexity Julia set".to_string(),
                    fractal_request: FractalRequest {
                        width: 1024,
                        height: 1024,
                        center_x: 0.0,
                        center_y: 0.0,
                        zoom: 1.0,
                        max_iterations: 200,
                        fractal_type: FractalType::Julia { c_real: -0.7, c_imag: 0.27015 },
                    },
                    expected_performance: None,
                },
            ],
            include_system_info: true,
            include_comparison: false,
            parallel_execution: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fractal_type_properties() {
        let mandelbrot = FractalType::Mandelbrot;
        let julia = FractalType::Julia { c_real: -0.7, c_imag: 0.27015 };

        assert_eq!(mandelbrot.name(), "mandelbrot");
        assert_eq!(julia.name(), "julia");
        assert!(!mandelbrot.is_julia());
        assert!(julia.is_julia());
        assert_eq!(julia.julia_constant(), Some((-0.7, 0.27015)));
    }

    #[test]
    fn test_computation_complexity_classification() {
        let low = ComputationComplexity::from_parameters(256, 256, 50, 1.0);
        let high = ComputationComplexity::from_parameters(2048, 2048, 1000, 1000.0);

        assert!(matches!(low, ComputationComplexity::Low));
        assert!(matches!(high, ComputationComplexity::Extreme));
    }

    #[test]
    fn test_fractal_request_validation() {
        let valid_request = FractalRequest {
            width: 800,
            height: 600,
            center_x: -0.5,
            center_y: 0.0,
            zoom: 1.0,
            max_iterations: 100,
            fractal_type: FractalType::Mandelbrot,
        };

        assert!(valid_request.validate().is_ok());

        let invalid_request = FractalRequest {
            width: 5000, // Too large
            height: 600,
            center_x: -0.5,
            center_y: 0.0,
            zoom: 1.0,
            max_iterations: 100,
            fractal_type: FractalType::Mandelbrot,
        };

        assert!(invalid_request.validate().is_err());
    }
}
