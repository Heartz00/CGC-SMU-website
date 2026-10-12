"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({
  label = "Save",
  pending = "Saving…",
  secondary = false,
}: {
  label?: string;
  pending?: string;
  secondary?: boolean;
}) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      className={secondary ? "admin-secondary" : "button"}
      disabled={status.pending}
    >
      {status.pending ? pending : label}
    </button>
  );
}
