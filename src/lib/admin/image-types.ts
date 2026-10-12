export type LibraryImage = {
  id: number;
  url: string;
  thumbnail: string;
  title: string;
  description: string;
  searchText: string;
};

export function searchImages(images: LibraryImage[], query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return images.filter((image) =>
    words.every((word) => image.searchText.toLocaleLowerCase().includes(word)),
  );
}
