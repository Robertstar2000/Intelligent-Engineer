import React from 'react';

export const Hero = () => {
  return (
    <section className="py-20 md:py-32 text-center">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4">
          Intelligent Engineering
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
          An AI-powered companion that guides you through the full lifecycle of engineering development.
        </p>
        <a
          href="#"
          className="bg-cyan-500 text-charcoal-900 font-bold py-3 px-8 rounded-md hover:bg-cyan-600 transition-all text-lg"
        >
          Start New Project
        </a>
      </div>
    </section>
  );
};
