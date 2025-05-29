// src/routes/projects.tsx
import { Component } from "solid-js";
import { Title, Meta } from "@solidjs/meta";
import ProjectsPageContent from "../pages/Projects";

const ProjectsRoute: Component = () => {
  console.log("[routes/projects.tsx] ProjectsRoute rendering for FileRoutes.");
  return (
    <>
      <Title>Projects - Performance Showcase</Title>
      <Meta name="description" content="Explore GitHub repositories related to the performance showcase." />
      <ProjectsPageContent />
    </>
  );
};
export default ProjectsRoute;
