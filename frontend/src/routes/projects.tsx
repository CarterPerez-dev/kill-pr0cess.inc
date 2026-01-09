// === frontend/src/routes/projects.tsx ===
/*
 * Projects route component for displaying GitHub repositories and code artifacts at "/projects".
 * I'm ensuring proper meta tags for SEO and integrating with the file-based routing system.
 */

import { type Component } from 'solid-js';
import { Title, Meta } from '@solidjs/meta';
import Projects from '../pages/Projects';

const ProjectsRoute: Component = () => {
  return (
    <>
      <Title>Repositories | Performance Showcase</Title>
      <Meta
        name="description"
        content="Explore GitHub repositories, code artifacts, and technical projects showcasing computational precision and performance optimization."
      />
      <Meta
        name="keywords"
        content="github, repositories, projects, code, rust, typescript, performance"
      />
      <Projects />
    </>
  );
};

export default ProjectsRoute;
