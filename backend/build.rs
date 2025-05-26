/*
 * Build script for compile-time optimizations and environment configuration.
 * I'm setting up build-time constants, feature detection, and performance optimization flags for maximum runtime performance.
 */

use std::env;
use std::process::Command;

fn main() {
    // I'm setting up build-time environment variables for runtime access
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-env-changed=DATABASE_URL");
    println!("cargo:rerun-if-env-changed=REDIS_URL");

    // Capture build timestamp for version information
    let build_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
    println!("cargo:rustc-env=BUILD_TIME={}", build_time);

    // Capture git commit hash if available
    if let Ok(output) = Command::new("git")
        .args(&["rev-parse", "--short", "HEAD"])
        .output()
        {
            if let Ok(git_hash) = String::from_utf8(output.stdout) {
                let git_hash = git_hash.trim();
                println!("cargo:rustc-env=GIT_COMMIT={}", git_hash);
            } else {
                println!("cargo:rustc-env=GIT_COMMIT=unknown");
            }
        } else {
            println!("cargo:rustc-env=GIT_COMMIT=unknown");
        }

        // Detect CPU features for optimization
        let target_arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
        let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();

        println!("cargo:rustc-env=TARGET_ARCH={}", target_arch);
        println!("cargo:rustc-env=TARGET_OS={}", target_os);

        // Enable CPU-specific optimizations based on target
        match target_arch.as_str() {
            "x86_64" => {
                println!("cargo:rustc-cfg=has_avx2");
                println!("cargo:rustc-cfg=has_sse4_2");

                // Check for AVX-512 support if building for native target
                if env::var("CARGO_CFG_TARGET_FEATURE").unwrap_or_default().contains("avx512") {
                    println!("cargo:rustc-cfg=has_avx512");
                }
            }
            "aarch64" => {
                println!("cargo:rustc-cfg=has_neon");
            }
            _ => {}
        }

        // Configure memory allocator based on features
        if cfg!(feature = "jemalloc") {
            println!("cargo:rustc-cfg=allocator_jemalloc");
        } else if cfg!(feature = "mimalloc") {
            println!("cargo:rustc-cfg=allocator_mimalloc");
        }

        // Database feature detection for conditional compilation
        if cfg!(feature = "postgres") {
            println!("cargo:rustc-cfg=database_postgres");
        }
        if cfg!(feature = "redis") {
            println!("cargo:rustc-cfg=cache_redis");
        }

        // Performance optimization flags based on profile
        let profile = env::var("PROFILE").unwrap_or_default();
        match profile.as_str() {
            "release" | "production" => {
                // I'm enabling maximum optimizations for production builds
                println!("cargo:rustc-cfg=optimized_build");

                // Link-time optimization settings are handled in Cargo.toml
                // but I can add additional flags here if needed
                if target_os == "linux" {
                    println!("cargo:rustc-link-arg=-Wl,--strip-all");
                }
            }
            "dev" | "debug" => {
                println!("cargo:rustc-cfg=debug_build");
            }
            _ => {}
        }

        // Enable SIMD optimizations if supported
        if is_simd_supported(&target_arch) {
            println!("cargo:rustc-cfg=simd_enabled");
        }

        // Configure fractal computation optimizations
        setup_fractal_optimizations();

        // Set up database migration embedding if needed
        setup_database_migrations();

        // Configure performance monitoring
        setup_performance_monitoring();
}

/// Check if SIMD instructions are supported for the target architecture
fn is_simd_supported(target_arch: &str) -> bool {
    match target_arch {
        "x86_64" => true,  // SSE2 is guaranteed on x86_64
        "aarch64" => true, // NEON is standard on AArch64
        _ => false,
    }
}

/// Set up fractal computation optimizations based on available CPU features
fn setup_fractal_optimizations() {
    // I'm configuring parallel processing parameters based on CPU capabilities
    let num_cpus = std::thread::available_parallelism()
    .map(|n| n.get())
    .unwrap_or(4);

    println!("cargo:rustc-env=NUM_CPUS={}", num_cpus);

    // Configure optimal thread count for Rayon
    let optimal_threads = if num_cpus > 8 {
        num_cpus - 2 // Leave some cores for other tasks
    } else {
        num_cpus
    };

    println!("cargo:rustc-env=RAYON_NUM_THREADS={}", optimal_threads);

    // Set up mathematical precision based on target
    if cfg!(target_feature = "fma") {
        println!("cargo:rustc-cfg=has_fused_multiply_add");
    }
}

/// Set up database migration embedding for production builds
fn setup_database_migrations() {
    // I'm embedding migration files into the binary for production deployment
    let migrations_dir = "database/migrations";

    if std::path::Path::new(migrations_dir).exists() {
        println!("cargo:rerun-if-changed={}", migrations_dir);

        // Walk through migration files and set up rerun triggers
        if let Ok(entries) = std::fs::read_dir(migrations_dir) {
            for entry in entries.flatten() {
                if let Some(path) = entry.path().to_str() {
                    if path.ends_with(".sql") {
                        println!("cargo:rerun-if-changed={}", path);
                    }
                }
            }
        }
    }
}

/// Configure performance monitoring and metrics collection
fn setup_performance_monitoring() {
    // I'm setting up compile-time configuration for metrics collection
    if cfg!(feature = "metrics") {
        println!("cargo:rustc-cfg=metrics_enabled");

        // Configure metrics collection interval based on build type
        let profile = env::var("PROFILE").unwrap_or_default();
        let metrics_interval = match profile.as_str() {
            "release" | "production" => 60,  // 1 minute in production
            _ => 10,  // 10 seconds in development
        };

        println!("cargo:rustc-env=METRICS_INTERVAL_SECONDS={}", metrics_interval);
    }

    // Configure tracing based on environment
    if cfg!(feature = "tracing") {
        println!("cargo:rustc-cfg=tracing_enabled");
    }
}

// Custom build configuration for different deployment targets
#[cfg(feature = "docker-build")]
fn configure_docker_build() {
    // I'm setting up Docker-specific optimizations
    println!("cargo:rustc-cfg=docker_deployment");

    // Configure for container resource limits
    println!("cargo:rustc-env=CONTAINER_BUILD=true");
}

#[cfg(feature = "cloud-build")]
fn configure_cloud_build() {
    // I'm setting up cloud deployment optimizations
    println!("cargo:rustc-cfg=cloud_deployment");

    // Configure for cloud-specific features
    if env::var("GOOGLE_CLOUD_PROJECT").is_ok() {
        println!("cargo:rustc-cfg=google_cloud");
    }

    if env::var("AWS_REGION").is_ok() {
        println!("cargo:rustc-cfg=aws_deployment");
    }
}
