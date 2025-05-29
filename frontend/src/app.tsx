/*
 * Root application component that serves as the main entry point for SolidStart.
 * This file is required by SolidStart and provides the app shell that wraps all routes automatically.
 */

import { FileRoutes } from "@solidjs/start/router";
import "./app.css";

export default function App() {
  console.log("[App.tsx] SolidStart App component rendering with FileRoutes");

  return (
    <>
      <FileRoutes />
    </>
  );
}
