"use client";
import { useState } from "react";
import { Molecule } from "./molecule";
export function AnimatedMolecule() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`animated-molecule ${paused ? "is-paused" : ""}`}>
      <Molecule />
      <button
        type="button"
        className="molecule-motion-toggle"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? "Resume animation" : "Pause animation"}
      </button>
    </div>
  );
}
