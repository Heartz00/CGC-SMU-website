import photos from "../../content/acs-photo-import.json";
export const importedAlbumPhotos = photos;
export const albumImportVersion = "acs-october-2026";
const paths = new Set(photos.map((photo) => photo.url));
export const isImportedAlbumPhoto = (url: string) => paths.has(url);
