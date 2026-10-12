import Image from "next/image";
import type { AlbumPhoto } from "@/lib/content/albums";
export function AlbumCard({ photo }: { photo: AlbumPhoto }) {
  return (
    <figure className="album-photo">
      <a
        href={photo.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open full image: ${photo.alt} (opens in a new tab)`}
      >
        <Image
          src={photo.url}
          alt={photo.alt}
          width={1000}
          height={750}
          sizes="(max-width:640px) 90vw, 45vw"
        />
      </a>
      <figcaption>
        <strong>{photo.album}</strong>
        {photo.date && <p>{photo.date}</p>}
        {photo.caption && <p>{photo.caption}</p>}
      </figcaption>
    </figure>
  );
}
