"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  readDraft,
  snapshotDraft,
  type ContentDraft,
  type DraftFields,
} from "@/lib/admin/content-draft";
export function DraftRecovery({
  storageKey,
  form,
  onRestore,
  result,
}: {
  storageKey: string;
  form: RefObject<HTMLFormElement | null>;
  onRestore: (fields: DraftFields) => void;
  result?: { success?: boolean };
}) {
  const [available, setAvailable] = useState<ContentDraft | null>(null);
  const [message, setMessage] = useState("");
  const saved = useRef<ContentDraft | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changed = useRef(false);
  useEffect(() => {
    const node = form.current;
    let syncing = false;
    const syncStart = () => {
      syncing = true;
    };
    const syncEnd = () => {
      syncing = false;
    };
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        saved.current = readDraft(raw);
        if (raw && !saved.current) localStorage.removeItem(storageKey);
        setAvailable(saved.current);
      } catch {
        setMessage(
          "Browser recovery is unavailable. Save a draft before leaving.",
        );
      }
    });
    function persist() {
      if (
        !changed.current ||
        !node ||
        saved.current ||
        node.getAttribute("aria-busy") === "true"
      )
        return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(snapshotDraft(new FormData(node))),
        );
        setMessage("Recovery copy saved on this device.");
        changed.current = false;
      } catch {
        setMessage(
          "Browser recovery is unavailable. Save a draft before leaving.",
        );
      }
    }
    const change = () => {
      if (syncing) return;
      changed.current = true;
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(persist, 600);
    };
    node?.addEventListener("input", change);
    node?.addEventListener("change", change);
    node?.addEventListener("cgc:changed", change);
    node?.addEventListener("cgc:sync-start", syncStart);
    node?.addEventListener("cgc:sync-end", syncEnd);
    window.addEventListener("pagehide", persist);
    return () => {
      cancelAnimationFrame(frame);
      if (timeout.current) clearTimeout(timeout.current);
      persist();
      node?.removeEventListener("input", change);
      node?.removeEventListener("change", change);
      node?.removeEventListener("cgc:changed", change);
      node?.removeEventListener("cgc:sync-start", syncStart);
      node?.removeEventListener("cgc:sync-end", syncEnd);
      window.removeEventListener("pagehide", persist);
    };
  }, [storageKey, form]);
  useEffect(() => {
    if (!result?.success) return;
    changed.current = false;
    if (timeout.current) clearTimeout(timeout.current);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Browser storage may be unavailable. */
    }
    const frame = requestAnimationFrame(() => {
      saved.current = null;
      setAvailable(null);
      setMessage("");
    });
    return () => cancelAnimationFrame(frame);
  }, [result, storageKey]);
  function discard() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    saved.current = null;
    setAvailable(null);
    setMessage("");
  }
  return (
    <div className="admin-draft-recovery">
      {available ? (
        <>
          <p>
            Unfinished content from{" "}
            {new Date(available.savedAt).toLocaleString()} is available on this
            device.
          </p>
          <div className="admin-crop-actions">
            <button
              type="button"
              className="admin-secondary"
              onClick={() => {
                if (form.current?.getAttribute("aria-busy") === "true") return;
                onRestore(available.fields);
                discard();
                form.current?.dispatchEvent(new Event("cgc:changed"));
                setMessage(
                  "Recovered. Review the details and publishing choice before saving.",
                );
              }}
            >
              Recover draft
            </button>
            <button type="button" className="admin-secondary" onClick={discard}>
              Discard recovery copy
            </button>
          </div>
        </>
      ) : (
        <small role="status">{message}</small>
      )}
    </div>
  );
}
