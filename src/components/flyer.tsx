import Image from "next/image";
export function Flyer({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="event-flyer">
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open full-size flyer: ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={836}
          height={1080}
          sizes="(max-width: 600px) 90vw, 450px"
        />
      </a>
      <figcaption>View full-size flyer ↗</figcaption>
    </figure>
  );
}
