import { Molecule } from "./molecule";
export function AnimatedMolecule() {
  return (
    <div
      className="animated-molecule"
      tabIndex={0}
      role="img"
      aria-label="Animated molecule. Focus here to pause the motion."
    >
      <Molecule />
    </div>
  );
}
