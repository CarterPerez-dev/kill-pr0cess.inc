// src/routes/[...404].tsx (Temporary Simplification)
import { Component } from 'solid-js';
import { Title } from "@solidjs/meta";

const MinimalNotFound: Component = () => {
  return (
    <>
      <Title>404 - Page Not Found</Title>
      <div>
        <h1>404 - Page Not Found</h1>
        <p>The requested page could not be found.</p>
      </div>
    </>
  );
};

export default MinimalNotFound;
