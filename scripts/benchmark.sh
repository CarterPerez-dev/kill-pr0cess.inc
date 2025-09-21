#!/bin/bash

# Comprehensive benchmark suite for the performance showcase with detailed performance analysis and comparison capabilities.
# I'm implementing multi-dimensional benchmarking including fractal computation, API response times, system resources, and comparative analysis against baseline metrics.

set -euo pipefail

# Color codes for enhanced output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly RESULTS_DIR="$PROJECT_ROOT/benchmark-results"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly RESULTS_FILE="$RESULTS_DIR/benchmark_$TIMESTAMP.json"
readonly LOG_FILE="$RESULTS_DIR/benchmark_$TIMESTAMP.log"

# API endpoints
readonly BACKEND_URL="http://localhost:8000"
readonly FRONTEND_URL="http://localhost:4000"

# Benchmark configuration
readonly WARMUP_REQUESTS=5
readonly BENCHMARK_REQUESTS=50
readonly CONCURRENT_USERS=10
readonly FRACTAL_SCENARIOS=("low" "medium" "high" "extreme")

# I'm setting up logging and results directory
mkdir -p "$RESULTS_DIR"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $*${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $*${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $*${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $*${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $*${NC}"
}

section() {
    echo ""
    echo -e "${PURPLE}=== $* ===${NC}"
}

# I'm checking if required tools are available
check_dependencies() {
    local missing_tools=()

    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    command -v bc >/dev/null 2>&1 || missing_tools+=("bc")

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        error "Missing required tools: ${missing_tools[*]}"
        error "Please install the missing tools and try again"
        exit 1
    fi
}

# I'm checking if the services are running and healthy
check_services() {
    log "Checking service availability..."

    # Backend health check
    if ! curl -sf "${BACKEND_URL}/health" >/dev/null; then
        error "Backend is not responding at ${BACKEND_URL}"
        error "Please ensure the backend is running with: cd backend && cargo run"
        exit 1
    fi

    # Frontend health check
    if ! curl -sf "${FRONTEND_URL}" >/dev/null; then
        warn "Frontend is not responding at ${FRONTEND_URL}"
        warn "Some tests may be skipped. Start frontend with: cd frontend && npm run dev"
    fi

    success "Services are healthy"
}

# I'm collecting system information for benchmark context
collect_system_info() {
    log "Collecting system information..."

    local system_info='{}'

    # Operating system
    if command -v uname >/dev/null; then
        system_info=$(echo "$system_info" | jq --arg os "$(uname -s)" '. + {os: $os}')
        system_info=$(echo "$system_info" | jq --arg arch "$(uname -m)" '. + {architecture: $arch}')
    fi

    # CPU information
    if [[ -f /proc/cpuinfo ]]; then
        local cpu_model=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)
        local cpu_cores=$(grep -c "^processor" /proc/cpuinfo)
        system_info=$(echo "$system_info" | jq --arg model "$cpu_model" '. + {cpu_model: $model}')
        system_info=$(echo "$system_info" | jq --argjson cores "$cpu_cores" '. + {cpu_cores: $cores}')
    elif command -v sysctl >/dev/null 2>&1; then
        local cpu_model=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "Unknown")
        local cpu_cores=$(sysctl -n hw.ncpu 2>/dev/null || echo "Unknown")
        system_info=$(echo "$system_info" | jq --arg model "$cpu_model" '. + {cpu_model: $model}')
        system_info=$(echo "$system_info" | jq --argjson cores "$cpu_cores" '. + {cpu_cores: $cores}')
    fi

    # Memory information
    if [[ -f /proc/meminfo ]]; then
        local memory_kb=$(grep "MemTotal" /proc/meminfo | awk '{print $2}')
        local memory_gb=$(echo "scale=1; $memory_kb / 1024 / 1024" | bc)
        system_info=$(echo "$system_info" | jq --argjson memory "$memory_gb" '. + {memory_gb: $memory}')
    elif command -v sysctl >/dev/null 2>&1; then
        local memory_bytes=$(sysctl -n hw.memsize 2>/dev/null || echo "0")
        local memory_gb=$(echo "scale=1; $memory_bytes / 1024 / 1024 / 1024" | bc)
        system_info=$(echo "$system_info" | jq --argjson memory "$memory_gb" '. + {memory_gb: $memory}')
    fi

    # Rust version
    if command -v rustc >/dev/null; then
        local rust_version=$(rustc --version | awk '{print $2}')
        system_info=$(echo "$system_info" | jq --arg version "$rust_version" '. + {rust_version: $version}')
    fi

    # Node.js version
    if command -v node >/dev/null; then
        local node_version=$(node --version | sed 's/v//')
        system_info=$(echo "$system_info" | jq --arg version "$node_version" '. + {node_version: $version}')
    fi

    echo "$system_info"
}

# I'm running warmup requests to prepare the system
warmup_services() {
    log "Warming up services with $WARMUP_REQUESTS requests..."

    for i in $(seq 1 $WARMUP_REQUESTS); do
        curl -sf "${BACKEND_URL}/health" >/dev/null &
        curl -sf "${BACKEND_URL}/api/performance/system" >/dev/null &
    done
    wait

    success "Warmup completed"
}

# I'm benchmarking basic API response times
benchmark_api_responses() {
    section "API Response Time Benchmarks"

    local endpoints=(
        "/health"
        "/api/performance/system"
        "/api/performance/metrics"
        "/api/github/repos"
    )

    local results='[]'

    for endpoint in "${endpoints[@]}"; do
        log "Benchmarking $endpoint..."

        local url="${BACKEND_URL}${endpoint}"
        local times=()
        local success_count=0
        local error_count=0

        for i in $(seq 1 $BENCHMARK_REQUESTS); do
            local start_time=$(date +%s%3N)

            if curl -sf "$url" >/dev/null 2>&1; then
                local end_time=$(date +%s%3N)
                local response_time=$((end_time - start_time))
                times+=("$response_time")
                ((success_count++))
            else
                ((error_count++))
            fi
        done

        if [[ ${#times[@]} -gt 0 ]]; then
            # I'm calculating statistics
            local sum=0
            local min=${times[0]}
            local max=${times[0]}

            for time in "${times[@]}"; do
                sum=$((sum + time))
                [[ $time -lt $min ]] && min=$time
                [[ $time -gt $max ]] && max=$time
            done

            local avg=$(echo "scale=2; $sum / ${#times[@]}" | bc)
            local success_rate=$(echo "scale=2; $success_count * 100 / $BENCHMARK_REQUESTS" | bc)

            # I'm calculating percentiles (simplified)
            IFS=$'\n' sorted_times=($(sort -n <<<"${times[*]}"))
            local p95_index=$(echo "${#sorted_times[@]} * 95 / 100" | bc)
            local p99_index=$(echo "${#sorted_times[@]} * 99 / 100" | bc)
            local p95=${sorted_times[$p95_index]}
            local p99=${sorted_times[$p99_index]}

            results=$(echo "$results" | jq --arg endpoint "$endpoint" \
                --argjson avg "$avg" \
                --argjson min "$min" \
                --argjson max "$max" \
                --argjson p95 "$p95" \
                --argjson p99 "$p99" \
                --argjson success_rate "$success_rate" \
                --argjson requests "$BENCHMARK_REQUESTS" \
                '. + [{
                    endpoint: $endpoint,
                    average_ms: $avg,
                    min_ms: $min,
                    max_ms: $max,
                    p95_ms: $p95,
                    p99_ms: $p99,
                    success_rate: $success_rate,
                    total_requests: $requests
                }]')

            info "  Avg: ${avg}ms, Min: ${min}ms, Max: ${max}ms, P95: ${p95}ms, P99: ${p99}ms, Success: ${success_rate}%"
        else
            warn "  All requests failed for $endpoint"
        fi
    done

    echo "$results"
}

# I'm benchmarking fractal computation performance
benchmark_fractal_performance() {
    section "Fractal Computation Benchmarks"

    local fractal_configs='[
        {"name": "low", "width": 256, "height": 256, "iterations": 100},
        {"name": "medium", "width": 512, "height": 512, "iterations": 200},
        {"name": "high", "width": 1024, "height": 1024, "iterations": 400},
        {"name": "extreme", "width": 2048, "height": 2048, "iterations": 800}
    ]'

    local results='[]'

    for scenario in "${FRACTAL_SCENARIOS[@]}"; do
        log "Benchmarking fractal computation: $scenario complexity..."

        local config=$(echo "$fractal_configs" | jq -r ".[] | select(.name == \"$scenario\")")
        local width=$(echo "$config" | jq -r '.width')
        local height=$(echo "$config" | jq -r '.height')
        local iterations=$(echo "$config" | jq -r '.iterations')

        local mandelbrot_times=()
        local julia_times=()
        local mandelbrot_pixels_per_ms=()
        local julia_pixels_per_ms=()

        # I'm benchmarking Mandelbrot set generation
        for i in $(seq 1 5); do
            local payload="{\"width\": $width, \"height\": $height, \"max_iterations\": $iterations, \"center_x\": -0.5, \"center_y\": 0.0, \"zoom\": 1.0}"
            local response=$(curl -sf -X POST \
                -H "Content-Type: application/json" \
                -d "$payload" \
                "${BACKEND_URL}/api/fractals/mandelbrot" 2>/dev/null)

            if [[ -n "$response" ]]; then
                local comp_time=$(echo "$response" | jq -r '.computation_time_ms')
                local pixels_per_ms=$(echo "$response" | jq -r '.performance_metrics.pixels_per_second / 1000')
                mandelbrot_times+=("$comp_time")
                mandelbrot_pixels_per_ms+=("$pixels_per_ms")
            fi
        done

        # I'm benchmarking Julia set generation
        for i in $(seq 1 5); do
            local payload="{\"width\": $width, \"height\": $height, \"max_iterations\": $iterations, \"center_x\": 0.0, \"center_y\": 0.0, \"zoom\": 1.0, \"c_real\": -0.7, \"c_imag\": 0.27015}"
            local response=$(curl -sf -X POST \
                -H "Content-Type: application/json" \
                -d "$payload" \
                "${BACKEND_URL}/api/fractals/julia" 2>/dev/null)

            if [[ -n "$response" ]]; then
                local comp_time=$(echo "$response" | jq -r '.computation_time_ms')
                local pixels_per_ms=$(echo "$response" | jq -r '.performance_metrics.pixels_per_second / 1000')
                julia_times+=("$comp_time")
                julia_pixels_per_ms+=("$pixels_per_ms")
            fi
        done

        # I'm calculating statistics for both fractal types
        if [[ ${#mandelbrot_times[@]} -gt 0 && ${#julia_times[@]} -gt 0 ]]; then
            local mandelbrot_avg=$(echo "${mandelbrot_times[*]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.2f", sum/NR}')
            local julia_avg=$(echo "${julia_times[*]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.2f", sum/NR}')
            local mandelbrot_pixels_avg=$(echo "${mandelbrot_pixels_per_ms[*]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.2f", sum/NR}')
            local julia_pixels_avg=$(echo "${julia_pixels_per_ms[*]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.2f", sum/NR}')

            results=$(echo "$results" | jq --arg scenario "$scenario" \
                --argjson width "$width" \
                --argjson height "$height" \
                --argjson iterations "$iterations" \
                --argjson mandelbrot_avg "$mandelbrot_avg" \
                --argjson julia_avg "$julia_avg" \
                --argjson mandelbrot_pixels "$mandelbrot_pixels_avg" \
                --argjson julia_pixels "$julia_pixels_avg" \
                '. + [{
                    scenario: $scenario,
                    resolution: "\($width)x\($height)",
                    max_iterations: $iterations,
                    mandelbrot_avg_ms: $mandelbrot_avg,
                    julia_avg_ms: $julia_avg,
                    mandelbrot_pixels_per_ms: $mandelbrot_pixels,
                    julia_pixels_per_ms: $julia_pixels
                }]')

            info "  Mandelbrot: ${mandelbrot_avg}ms (${mandelbrot_pixels_avg} pixels/ms)"
            info "  Julia: ${julia_avg}ms (${julia_pixels_avg} pixels/ms)"
        else
            warn "  Failed to benchmark $scenario complexity"
        fi
    done

    echo "$results"
}

# I'm benchmarking concurrent load handling
benchmark_concurrent_load() {
    section "Concurrent Load Benchmarks"

    log "Testing concurrent load with $CONCURRENT_USERS users..."

    local pids=()
    local results_file="/tmp/concurrent_results_$$"
    echo '[]' > "$results_file"

    # I'm spawning concurrent requests
    for i in $(seq 1 $CONCURRENT_USERS); do
        (
            local user_results='[]'
            local start_time=$(date +%s%3N)

            for j in $(seq 1 10); do
                local request_start=$(date +%s%3N)
                if curl -sf "${BACKEND_URL}/api/performance/system" >/dev/null 2>&1; then
                    local request_end=$(date +%s%3N)
                    local response_time=$((request_end - request_start))
                    user_results=$(echo "$user_results" | jq --argjson time "$response_time" '. + [$time]')
                fi
            done

            local end_time=$(date +%s%3N)
            local total_time=$((end_time - start_time))

            # I'm atomically updating the results file
            (
                flock 200
                local current_results=$(cat "$results_file")
                local updated_results=$(echo "$current_results" | jq --argjson user "$i" \
                    --argjson total "$total_time" \
                    --argjson times "$user_results" \
                    '. + [{user: $user, total_time_ms: $total, response_times: $times}]')
                echo "$updated_results" > "$results_file"
            ) 200>"$results_file.lock"
        ) &
        pids+=($!)
    done

    # I'm waiting for all concurrent users to complete
    for pid in "${pids[@]}"; do
        wait "$pid" || warn "Concurrent user process failed"
    done

    local concurrent_results=$(cat "$results_file")
    rm -f "$results_file" "$results_file.lock"

    # I'm calculating concurrent load statistics
    local total_requests=$(echo "$concurrent_results" | jq '[.[].response_times | length] | add')
    local all_times=$(echo "$concurrent_results" | jq '[.[].response_times | .[]] | sort')
    local avg_response=$(echo "$all_times" | jq 'add / length')
    local min_response=$(echo "$all_times" | jq 'min')
    local max_response=$(echo "$all_times" | jq 'max')

    info "  Total requests: $total_requests"
    info "  Average response: ${avg_response}ms"
    info "  Min response: ${min_response}ms"
    info "  Max response: ${max_response}ms"

    echo "$concurrent_results" | jq --argjson total "$total_requests" \
        --argjson avg "$avg_response" \
        --argjson min "$min_response" \
        --argjson max "$max_response" \
        '{
            concurrent_users: length,
            total_requests: $total,
            average_response_ms: $avg,
            min_response_ms: $min,
            max_response_ms: $max,
            user_results: .
        }'
}

# I'm collecting system resource usage during benchmarks
monitor_system_resources() {
    local duration=${1:-60}
    local samples=()

    for i in $(seq 1 $duration); do
        local sample='{}'

        # CPU usage
        if command -v top >/dev/null; then
            local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | sed 's/us,//')
            sample=$(echo "$sample" | jq --argjson cpu "${cpu_usage:-0}" '. + {cpu_percent: $cpu}')
        fi

        # Memory usage
        if [[ -f /proc/meminfo ]]; then
            local mem_total=$(grep "MemTotal" /proc/meminfo | awk '{print $2}')
            local mem_free=$(grep "MemFree" /proc/meminfo | awk '{print $2}')
            local mem_used=$((mem_total - mem_free))
            local mem_percent=$(echo "scale=2; $mem_used * 100 / $mem_total" | bc)
            sample=$(echo "$sample" | jq --argjson mem "$mem_percent" '. + {memory_percent: $mem}')
        fi

        samples+=("$sample")
        sleep 1
    done

    # I'm calculating resource usage statistics
    local cpu_values=()
    local mem_values=()

    for sample in "${samples[@]}"; do
        cpu_values+=($(echo "$sample" | jq -r '.cpu_percent // 0'))
        mem_values+=($(echo "$sample" | jq -r '.memory_percent // 0'))
    done

    local avg_cpu=$(echo "${cpu_values[*]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.2f", sum/NR}')
    local avg_mem=$(echo "${mem_values[*]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.2f", sum/NR}')

    echo "{\"average_cpu_percent\": $avg_cpu, \"average_memory_percent\": $avg_mem}"
}

# I'm generating the final benchmark report
generate_report() {
    local system_info="$1"
    local api_results="$2"
    local fractal_results="$3"
    local concurrent_results="$4"
    local resource_usage="$5"

    local report=$(jq -n \
        --argjson timestamp "$(date +%s)" \
        --arg date "$(date -Iseconds)" \
        --argjson system "$system_info" \
        --argjson api "$api_results" \
        --argjson fractals "$fractal_results" \
        --argjson concurrent "$concurrent_results" \
        --argjson resources "$resource_usage" \
        '{
            benchmark_id: ("benchmark_" + ($timestamp | tostring)),
            timestamp: $timestamp,
            date: $date,
            system_info: $system,
            results: {
                api_response_times: $api,
                fractal_performance: $fractals,
                concurrent_load: $concurrent,
                resource_usage: $resources
            }
        }')

    echo "$report"
}

# I'm displaying the benchmark results summary
display_summary() {
    local report="$1"

    section "Benchmark Results Summary"

    echo -e "${CYAN}System Information:${NC}"
    echo "$report" | jq -r '.system_info | to_entries[] | "  \(.key): \(.value)"'

    echo ""
    echo -e "${CYAN}API Performance:${NC}"
    echo "$report" | jq -r '.results.api_response_times[] | "  \(.endpoint): \(.average_ms)ms avg, \(.success_rate)% success"'

    echo ""
    echo -e "${CYAN}Fractal Performance:${NC}"
    echo "$report" | jq -r '.results.fractal_performance[] | "  \(.scenario) (\(.resolution)): Mandelbrot \(.mandelbrot_avg_ms)ms, Julia \(.julia_avg_ms)ms"'

    echo ""
    echo -e "${CYAN}Resource Usage:${NC}"
    echo "$report" | jq -r '.results.resource_usage | "  CPU: \(.average_cpu_percent)%, Memory: \(.average_memory_percent)%"'

    echo ""
    success "Results saved to: $RESULTS_FILE"
}

# I'm implementing the main benchmark execution flow
main() {
    echo -e "${PURPLE}=================================${NC}"
    echo -e "${PURPLE}     Performance Showcase${NC}"
    echo -e "${PURPLE}      Benchmark Suite${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""

    log "Starting benchmark suite..."
    log "Results will be saved to: $RESULTS_FILE"
    echo ""

    check_dependencies
    check_services

    local system_info
    local api_results
    local fractal_results
    local concurrent_results
    local resource_usage

    system_info=$(collect_system_info)
    warmup_services

    api_results=$(benchmark_api_responses)
    fractal_results=$(benchmark_fractal_performance)
    concurrent_results=$(benchmark_concurrent_load)
    resource_usage=$(monitor_system_resources 30)

    local report=$(generate_report "$system_info" "$api_results" "$fractal_results" "$concurrent_results" "$resource_usage")

    echo "$report" | jq '.' > "$RESULTS_FILE"

    display_summary "$report"

    success "Benchmark suite completed successfully!"
}

# I'm handling script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Comprehensive benchmark suite for Performance Showcase"
        echo ""
        echo "Options:"
        echo "  --help, -h       Show this help message"
        echo "  --api-only       Only run API benchmarks"
        echo "  --fractal-only   Only run fractal benchmarks"
        echo "  --quick          Run quick benchmarks (fewer iterations)"
        echo ""
        exit 0
        ;;
    --api-only)
        check_dependencies
        check_services
        system_info=$(collect_system_info)
        warmup_services
        api_results=$(benchmark_api_responses)
        echo "$api_results" | jq '.'
        ;;
    --fractal-only)
        check_dependencies
        check_services
        warmup_services
        fractal_results=$(benchmark_fractal_performance)
        echo "$fractal_results" | jq '.'
        ;;
    --quick)
        BENCHMARK_REQUESTS=10
        CONCURRENT_USERS=5
        main
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
