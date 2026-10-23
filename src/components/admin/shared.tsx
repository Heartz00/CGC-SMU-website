import { AdminNavLink } from "./nav-link";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin/auth";
import type { ReactNode } from "react";
import { SubmitButton } from "./submit";
import { FieldError } from "./saved-form";
import { AdminNavigationMenu } from "./navigation-menu";
const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/albums", label: "Photo albums", capability: "publish_pages" },
  { href: "/admin/history", label: "Activity & history" },
  {
    href: "/admin/attendance",
    label: "Registration & attendance",
    capability: "publish_pages",
  },
  { href: "/admin/homepage", label: "Homepage", capability: "publish_pages" },
  {
    href: "/admin/handover",
    label: "Council handover",
    capability: "publish_pages",
  },
  { href: "/admin/publish", label: "Create update", capability: "edit_posts" },
  { href: "/admin/officers", label: "Officers", capability: "publish_pages" },
  { href: "/admin/events", label: "Events", capability: "publish_pages" },
  {
    href: "/admin/announcements",
    label: "Updates",
    capability: "edit_posts",
  },
  { href: "/admin/resources", label: "Resources", capability: "publish_pages" },
  { href: "/admin/media", label: "Photos", capability: "upload_files" },
  {
    href: "/admin/forum",
    label: "Forum moderation",
    capability: "moderate_comments",
  },
  { href: "/admin/access", label: "People & access" },
];
export async function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { user } = await requireAdmin();
  return (
    <div className="container admin-shell">
      <aside className="admin-sidebar">
        <p className="eyebrow">Council workspace</p>
        <AdminNavigationMenu items={sections}>
          <nav aria-label="Dashboard">
            {sections.map((item) =>
              item.capability && !user.capabilities[item.capability] ? (
                <span
                  key={item.href}
                  className="admin-restricted"
                  aria-disabled="true"
                >
                  {item.label} <small>Permission needed</small>
                </span>
              ) : (
                <AdminNavLink
                  href={item.href}
                  key={item.href}
                  label={item.label}
                />
              ),
            )}
          </nav>
        </AdminNavigationMenu>
        <div className="admin-identity">
          <strong>{user.name}</strong>
          <span>{user.roles.join(", ")}</span>
          <form action={logout}>
            <SubmitButton label="Sign out" pending="Signing out…" secondary />
          </form>
        </div>
      </aside>
      <section className="admin-main">
        <div className="admin-heading">
          <p className="eyebrow">Content management</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Notice({ kind }: { kind?: string }) {
  const messages: Record<string, string> = {
    "formatting-confirmation":
      "To change this formatted announcement, select the formatting confirmation checkbox before saving.",
    "announcement-links":
      "Select a flyer from the image library and use a registration link beginning with https://. Both are optional.",
    "announcement-fields":
      "Add a title and announcement text, and choose Draft or Publish. Title limit: 200 characters; text limit: 50,000.",
    "image-missing": "Choose a non-empty image file before uploading.",
    "image-size":
      "This image is larger than 2 MB. Export or compress it below 2 MB, then upload again.",
    "image-format":
      "This file is not a valid JPEG, PNG, or WebP image. Export it in one of these formats; renaming its extension does not convert it.",
    "image-description":
      "Enter an image description of 1–300 characters before uploading.",
    saved: "Saved.",
    validation:
      "Check the required fields, links, and formatting confirmation. Not saved.",
    permission: "You do not have permission for this action.",
    authentication:
      "Sign-in failed. Check your username and application password.",
    connection: "Could not save. Please try again.",
    conflict: "This content has changed. Reload before saving.",
  };
  if (!kind || !messages[kind]) return null;
  return (
    <p
      className={`admin-notice ${kind === "saved" ? "success" : ""}`}
      role="status"
    >
      {messages[kind]}
    </p>
  );
}
export function Field({
  label,
  name,
  value = "",
  required = false,
  type = "text",
  maxLength = 5000,
  help,
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  help?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={maxLength}
      />
      {help && <small>{help}</small>}
      <FieldError name={name} />
    </label>
  );
}
export function TextArea({
  label,
  name,
  value = "",
  required = false,
  rows = 5,
  help,
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  rows?: number;
  help?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea
        name={name}
        defaultValue={value}
        required={required}
        rows={rows}
        maxLength={50000}
      />
      {help && <small>{help}</small>}
      <FieldError name={name} />
    </label>
  );
}
export function ReplacementWarning() {
  return (
    <label className="admin-check">
      <input name="replace" type="checkbox" />
      <span>
        Replace existing formatting and embedded links with plain paragraphs.
        <FieldError name="replace" />
      </span>
    </label>
  );
}
