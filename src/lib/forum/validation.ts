import { forumCategories } from "./types";
export class ForumError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function studentEmail(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@smu\.edu$/i.test(value.trim())
  )
    throw new ForumError("Use your SMU email address ending in @smu.edu.");
  return value.trim().toLowerCase();
}
export function forumPassword(value: unknown, creating = false) {
  if (
    typeof value !== "string" ||
    value.length > 128 ||
    value.length < (creating ? 10 : 1)
  )
    throw new ForumError(
      creating
        ? "Choose a forum password of 10–128 characters."
        : "Enter your forum password.",
    );
  return value;
}
export function forumText(
  value: unknown,
  label: string,
  min: number,
  max: number,
) {
  if (typeof value !== "string")
    throw new ForumError(`Enter ${label.toLowerCase()}.`);
  const text = value.trim().replace(/\r\n/g, "\n");
  if (
    text.length < min ||
    text.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)
  )
    throw new ForumError(`${label} must be ${min}–${max} characters.`);
  return text;
}
export function displayName(value: unknown) {
  const name = forumText(value, "Display name", 2, 60).replace(/\s+/g, " ");
  if (
    /\b(admin|administrator|moderator|anonymous|official)\b/i.test(name) ||
    name.toLowerCase() === "graduate student"
  )
    throw new ForumError(
      "Choose a personal display name, without staff or anonymous labels.",
    );
  return name;
}
export function forumId(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new ForumError("This discussion could not be found.", 404);
  return value;
}
export function topicInput(value: Record<string, unknown>) {
  if (!forumCategories.some((c) => c.id === value.category))
    throw new ForumError("Choose a discussion channel.");
  if (typeof value.anonymous !== "boolean")
    throw new ForumError("Choose how your name should appear.");
  return {
    title: forumText(value.title, "Title", 4, 160),
    body: forumText(value.body, "Message", 2, 8000),
    category: value.category as string,
    anonymous: value.anonymous,
  };
}
export function pageNumber(value: unknown) {
  const n = Number(value || 1);
  return Number.isSafeInteger(n) && n > 0 && n <= 500 ? n : 1;
}
export function safeForumNext(value: unknown) {
  return typeof value === "string" &&
    /^\/forum(?:\/[a-zA-Z0-9/-]*)?(?:\?[a-zA-Z0-9%=&_-]*)?$/.test(value) &&
    !value.startsWith("/forum/login")
    ? value
    : "/forum";
}
