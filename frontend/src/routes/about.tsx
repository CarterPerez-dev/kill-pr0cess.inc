import { type Component } from 'solid-js';
import { Title, Meta } from '@solidjs/meta';
import About from '../pages/About';

const AboutRoute: Component = () => {
  return (
    <>
      <Title>Architecture | Performance Showcase</Title>
      <Meta
        name="description"
        content="Technical architecture, design principles, and philosophical foundations of the performance showcase application."
      />
      <Meta
        name="keywords"
        content="architecture, rust, solidjs, design principles, technical stack"
      />
      <About />
    </>
  );
};

export default AboutRoute;
