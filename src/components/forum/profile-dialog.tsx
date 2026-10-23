"use client";
import { useState } from "react";
import { forumFetch } from "@/lib/forum/client";
import type { ForumProfile } from "@/lib/forum/types";
import { ForumDialog } from "./primitives";
export function ForumProfileDialog({
  profile,
  onClose,
  onSaved,
}: {
  profile: ForumProfile;
  onClose: () => void;
  onSaved: (profile: ForumProfile) => void;
}) {
  const [name, setName] = useState(
    profile.name_ready ? profile.display_name : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <ForumDialog
      title={profile.name_ready ? "Your display name" : "Make yourself at home"}
      onClose={onClose}
      busy={busy}
    >
      <p className="forum-help">
        Choose the name members see on your named posts. You can still post
        anonymously whenever you prefer.
      </p>
      <form
        className="forum-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            onSaved(
              await forumFetch<ForumProfile>("/api/forum/profile", {
                method: "PATCH",
                body: JSON.stringify({ displayName: name }),
              }),
            );
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not save your name.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          <label>
            Display name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={60}
              autoComplete="nickname"
              autoFocus
            />
          </label>
          <div className="forum-form-actions">
            <button type="button" className="forum-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="forum-primary">
              {busy ? "Saving…" : "Save display name"}
            </button>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="forum-error">
            {error}
          </p>
        )}
      </form>
    </ForumDialog>
  );
}
