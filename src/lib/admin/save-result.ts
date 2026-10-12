import { AdminError } from "./errors";
export type SaveResult = {
  success?: boolean;
  message: string;
  fields?: Record<string, string>;
  version?: string;
  postId?: number;
  links?: { href: string; label: string }[];
  image?: { id: number; url: string; title: string };
};
export function saveFailure(error: unknown): SaveResult {
  if (error instanceof AdminError) {
    if (error.kind === "validation")
      return { message: error.message.replace(/WordPress/g, "the site") };
    if (error.kind === "conflict")
      return {
        message:
          "This content changed. Open the editor in a new tab and compare before retrying. Your entries are kept here.",
      };
    if (error.kind === "authentication")
      return {
        message:
          "Sign in again before saving. Your entries are kept on this page.",
      };
    if (error.kind === "permission")
      return { message: "You do not have permission to save these changes." };
  }
  return {
    message: "Could not save. Your entries are kept. Please try again.",
  };
}
