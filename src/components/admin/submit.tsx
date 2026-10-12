"use client";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useEditingForm } from "./saved-form";
export function SubmitButton({
  label = "Save",
  pending = "Saving…",
  secondary = false,
  cancel = true,
}: {
  label?: string;
  pending?: string;
  secondary?: boolean;
  cancel?: boolean;
}) {
  const status = useFormStatus();
  const editing = useEditingForm();
  return (
    <div className={editing ? "admin-submit-actions" : undefined}>
      <button
        type="submit"
        className={secondary ? "admin-secondary" : "button"}
        disabled={status.pending}
      >
        {status.pending ? pending : label}
      </button>
      {editing && cancel && !status.pending && (
        <Link className="admin-secondary" href="/admin">
          Cancel
        </Link>
      )}
    </div>
  );
}
