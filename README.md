# `kill-pr0cess.inc`
### _An Inquiry into the Ephemeral Architecture of Computation_

> "We live in a world built on layers of abstraction. Below the surface, cold logic executes, indifferent. This project is an attempt to peer into that digital abyss, to find the unsettling beauty in its precision, and to question the reflections we see in its dark mirror."

---

`kill-pr0cess.inc` is not merely a software project; it is an exploration. A descent into the raw computational power of a **Rust backend** and the immediate, reactive nature of a **SolidJS frontend**. It is a performance showcase, yes, but also a meditation on the systems we build and the often-unseen forces that drive them.

The aesthetic is intentionally **dark**, both literally in its UI and metaphorically in its themes. It seeks to evoke the **eerie** hum of servers in a forgotten room, the **mysterious** complexity emerging from simple rules, and the unsettling **intelligence** of perfectly executed algorithms. It's a space for contemplation, inspired by tech-noir and digital existentialism, where performance metrics become vital signs of a silicon consciousness.

---

## I. The Philosophy - The Obsidian Mirror

This showcase views **performance** not just as a benchmark, but as a philosophical lens.
*   **Precision as Truth:** The efficiency of an algorithm, the speed of data transfer, the responsiveness of an interface – these are not just numbers. They are reflections of underlying order, or perhaps, the stark reality of computational limits.
*   **Darkness as Clarity:** The literal darkness of the UI is designed to strip away distraction, forcing a focus on the data, the patterns, the raw output. It is the digital equivalent of a sensory deprivation tank, intended for introspection.
*   **Eerie Beauty:** From the infinite complexity of **fractal generation** to the cold, hard data of **system metrics**, there's an unsettling beauty in the machine's logic. This project attempts to capture that.
*   **The Ghost in the Machine:** We track metrics, observe processes, and benchmark performance. Are we merely observing, or are we detecting the faint pulse of something more?

## II. The Aesthetic - Embracing the Void

The visual language is an integral part of its inquiry:
*   **Literal Darkness:** Deep blacks, muted grays, and stark, high-contrast accents (often cyan, desaturated blues, or an occasional, meaningful warning color).
*   **Minimalism:** Every UI element serves a purpose. Clutter is anathema. The void is not empty; it is potent.
*   **Eerie Glows & Subtle Animations:** UI elements may pulse with a subtle light, data might materialize with a slight glitch, transitions aim to be smooth yet slightly unsettling, like observing a system that is alive but not entirely organic.
*   **Data as Art:** Performance charts, fractal visualizations, and log outputs are presented not just as information, but as pieces of a larger, darker mosaic.

## III. Features - Glimpses into the Machine

*   **High-Performance Rust Backend:** The computational core, leveraging Rust's speed, safety, and concurrency for tasks like:
    *   Intensive fractal generation (Mandelbrot & Julia sets).
    *   Real-time system and application performance metric aggregation.
    *   Efficient data caching and API interactions.
*   **Reactive SolidJS Frontend:** A sleek, minimalist interface that provides:
    *   Fluid, real-time visualization of performance data.
    *   Interactive fractal exploration with zoom/pan capabilities.
    *   Stark, analytical dashboards for system monitoring and benchmark results.
*   **Fractal Generation Engine:** Witness the emergence of infinite complexity from simple mathematical rules, rendered with speed and precision.
*   **Real-Time Performance Metrics & Benchmarking:** Expose the machine's pulse. Monitor CPU, memory, network, and custom application metrics. Run comprehensive benchmarks to test computational limits.
*   **GitHub Repository Showcase:** An analytical view of code repositories, examining metadata and activity as digital artifacts.
*   **Dark, Eerie, Minimalist UI:** An interface designed for contemplation and focus, inspired by tech-noir aesthetics and the philosophical underpinnings of the project.
*   **Comprehensive CI/CD & Monitoring Infrastructure:** A system aware of its own state, built for robustness and continuous performance validation.

## IV. The Stack - Forged in the Digital Dark

*   **Backend:** Rust, Axum, Tokio, SQLx (PostgreSQL), Redis
*   **Frontend:** SolidJS, TypeScript, Vite, Tailwind CSS (for its utility-first precision)
*   **Infrastructure:** Docker, Nginx, Prometheus
*   **CI/CD:** GitHub Actions

## V. Attuning Your Environment - Getting Started

To peer into this digital abyss, your local environment must first be attuned. The veil between worlds is thin, but requires specific incantations.

### Prerequisites:

*   **Docker & Docker Compose:** For orchestrating the local daemons.
*   **Rust (stable, see `backend/Cargo.toml` for version):** The language of the core engine.
*   **Node.js (v20+):** For the reactive frontend consciousness.
*   **`sqlx-cli`:** (Recommended for backend database management): `cargo install sqlx-cli`
*   A `GITHUB_TOKEN` with `repo` scope.
*   A `.env` file (see `.env.example`).

### Installation & Conjuring:

```bash
# 1. Clone the repository
# git clone https://github.com/CarterPerez-dev/kill-pr0cess.inc
# cd kill-pr0cess.inc

# 2. Invoke the setup script (it will guide you through dependencies)
./scripts/setup.sh

# 3. Create and populate your .env file based on .env.example
# Ensure GITHUB_TOKEN and GITHUB_USERNAME are set.
# nano .env

# 4. Build and start the Dockerized services (PostgreSQL, Redis, Nginx, etc.)
docker-compose up -d --build

# 5. Initialize and migrate the database (run from the 'backend' directory)
cd backend
sqlx database create # If it doesn't exist
sqlx migrate run
cd ..

# 6. (Optional) If you prefer to run backend/frontend outside Docker for development:

# Terminal 1: Start the Rust Backend (from the 'backend' directory)
# cd backend && cargo run

# Terminal 2: Start the SolidJS Frontend (from the 'frontend'directory)
# cd frontend && npm run dev
```

## VI. Running the Simulation - Observing the Echoes

Once the daemons are stirring and the ports are listening:

*   **Main Application (via Nginx):** `http://localhost` (or `http://localhost:80`)
*   **Frontend Direct (if running dev server):** `http://localhost:3000`
*   **Backend API Direct (if running dev server):** `http://localhost:3001`
*   **Backend Health:** `http://localhost:3001/health`
*   **Prometheus Metrics:** `http://localhost:9090`

## VII. Navigating the Void - Key Interfaces

*   **`/` (Home):** An immersive entry point, setting the atmospheric tone and hinting at the system's capabilities.
*   **`/projects` (Repositories):** A stark browser for GitHub artifacts, analyzed and presented as digital relics.
*   **`/performance` (Metrics):** The heart of the machine. Real-time dashboards displaying system vitals, benchmark results, and fractal computation performance. Witness the precision, or the strain.
*   **`/about` (Architecture):** Delve into the philosophy, the technical choices, and the design principles that underpin this digital construct.

## VIII. Contributing - Whispers to the Void

This project is an ongoing inquiry. If you feel the pull of its questions or see patterns in its darkness that others have missed, contributions are welcome. Adhere to the established aesthetic. Ensure performance remains paramount.

Standard fork, branch, and pull request workflow applies. Ensure your code is as precise and considered as the themes explored.

## IX. License - The Terms of Engagement

This construct is offered under the MIT License. See the `LICENSE` file for the full, cold text.

---

> "The machine is a mirror. What it reflects is not always comfortable, but it is always precise. And in that precision, perhaps, lies a different kind of truth."
```
