/*
 * ©AngelaMos | 2025
 * Build script for compile time optimizations and environment configuration
 */

use std::env;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-env-changed=DATABASE_URL");
    println!("cargo:rerun-if-env-changed=REDIS_URL");

    let build_time = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC");
    println!("cargo:rustc-env=BUILD_TIME={}", build_time);

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

        let target_arch = env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
        let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();

        println!("cargo:rustc-env=TARGET_ARCH={}", target_arch);
        println!("cargo:rustc-env=TARGET_OS={}", target_os);

        match target_arch.as_str() {
            "x86_64" => {
                println!("cargo:rustc-cfg=has_avx2");
                println!("cargo:rustc-cfg=has_sse4_2");

                if env::var("CARGO_CFG_TARGET_FEATURE").unwrap_or_default().contains("avx512") {
                    println!("cargo:rustc-cfg=has_avx512");
                }
            }
            "aarch64" => {
                println!("cargo:rustc-cfg=has_neon");
            }
            _ => {}
        }

        if cfg!(feature = "jemalloc") {
            println!("cargo:rustc-cfg=allocator_jemalloc");
        } else if cfg!(feature = "mimalloc") {
            println!("cargo:rustc-cfg=allocator_mimalloc");
        }

        if cfg!(feature = "postgres") {
            println!("cargo:rustc-cfg=database_postgres");
        }
        if cfg!(feature = "redis") {
            println!("cargo:rustc-cfg=cache_redis");
        }

        let profile = env::var("PROFILE").unwrap_or_default();
        match profile.as_str() {
            "release" | "production" => {
                println!("cargo:rustc-cfg=optimized_build");

                if target_os == "linux" {
                    println!("cargo:rustc-link-arg=-Wl,--strip-all");
                }
            }
            "dev" | "debug" => {
                println!("cargo:rustc-cfg=debug_build");
            }
            _ => {}
        }

        if is_simd_supported(&target_arch) {
            println!("cargo:rustc-cfg=simd_enabled");
        }

        setup_fractal_optimizations();
        setup_database_migrations();
        setup_performance_monitoring();

    let rustc_version_output = std::process::Command::new("rustc")
        .arg("--version")
        .output()
        .expect("Failed to get rustc version");
    let rustc_version_str = String::from_utf8(rustc_version_output.stdout)
        .expect("rustc --version output is not valid UTF-8");
    let rust_version_short = rustc_version_str.split_whitespace().nth(1).unwrap_or("unknown");
    println!("cargo:rustc-env=BUILD_RUST_VERSION={}", rust_version_short);

    println!("cargo:rerun-if-changed=build.rs");
}

fn is_simd_supported(target_arch: &str) -> bool {
    match target_arch {
        "x86_64" => true,  // SSE2 is guaranteed on x86_64
        "aarch64" => true, // NEON is standard on AArch64
        _ => false,
    }
}

fn setup_fractal_optimizations() {
    let num_cpus = std::thread::available_parallelism()
    .map(|n| n.get())
    .unwrap_or(4);

    println!("cargo:rustc-env=NUM_CPUS={}", num_cpus);

    let optimal_threads = if num_cpus > 8 {
        num_cpus - 2 // Leave some cores for other tasks
    } else {
        num_cpus
    };

    println!("cargo:rustc-env=RAYON_NUM_THREADS={}", optimal_threads);

    if cfg!(target_feature = "fma") {
        println!("cargo:rustc-cfg=has_fused_multiply_add");
    }
}

fn setup_database_migrations() {
    let migrations_dir = "database/migrations";

    if std::path::Path::new(migrations_dir).exists() {
        println!("cargo:rerun-if-changed={}", migrations_dir);

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

fn setup_performance_monitoring() {

    if cfg!(feature = "metrics") {
        println!("cargo:rustc-cfg=metrics_enabled");

        let profile = env::var("PROFILE").unwrap_or_default();
        let metrics_interval = match profile.as_str() {
            "release" | "production" => 60,  // 1 minute in production
            _ => 10,  // 10 seconds in development
        };

        println!("cargo:rustc-env=METRICS_INTERVAL_SECONDS={}", metrics_interval);
    }

    if cfg!(feature = "tracing") {
        println!("cargo:rustc-cfg=tracing_enabled");
    }
}

#[cfg(feature = "docker-build")]
fn configure_docker_build() {
    println!("cargo:rustc-cfg=docker_deployment");
    println!("cargo:rustc-env=CONTAINER_BUILD=true");
}

#[cfg(feature = "cloud-build")]
fn configure_cloud_build() {
    println!("cargo:rustc-cfg=cloud_deployment");

    if env::var("GOOGLE_CLOUD_PROJECT").is_ok() {
        println!("cargo:rustc-cfg=google_cloud");
    }

    if env::var("AWS_REGION").is_ok() {
        println!("cargo:rustc-cfg=aws_deployment");
    }
}
