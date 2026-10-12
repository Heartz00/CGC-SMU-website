"use client";
import {
  createContext,
  useContext,
  useId,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SaveResult } from "@/lib/admin/save-result";
import { DraftRecovery } from "./draft-recovery";
const ErrorContext = createContext<Record<string, string>>({});
const DirtyContext = createContext<() => void>(() => {});
const EditingContext = createContext(false);
export function useEditingForm() {
  return useContext(EditingContext);
}
export function useMarkUnsaved() {
  return useContext(DirtyContext);
}
const navigationChecks = new WeakSet<Event>();
export function FieldError({ name }: { name: string }) {
  const errors = useContext(ErrorContext);
  const id = useId();
  return (
    <span id={id} data-field-error={name} className="admin-field-error">
      {errors[name] || ""}
    </span>
  );
}
export function SavedForm({
  action,
  children,
  className,
  clearOnSuccess = false,
  onSaved,
  draftKey,
  onPendingChange,
}: {
  action: (form: FormData) => Promise<SaveResult>;
  children: ReactNode;
  className?: string;
  clearOnSuccess?: boolean;
  onSaved?: (result: SaveResult) => void;
  draftKey?: string;
  onPendingChange?: (pending: boolean) => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const entries = useRef<FormData | null>(null);
  const dirty = useRef(false);
  const restoring = useRef(false);
  const savedCallback = useRef(onSaved);
  useEffect(() => {
    savedCallback.current = onSaved;
  }, [onSaved]);
  const [savedAt, setSavedAt] = useState("");
  const [edited, setEdited] = useState(false);
  useEffect(() => {
    const node = form.current;
    const changed = () => {
      dirty.current = true;
      setEdited(true);
    };
    node?.addEventListener("cgc:changed", changed);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (navigationChecks.has(event) || event.defaultPrevented) return;
      if (
        !dirty.current ||
        !target ||
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        target.getAttribute("href")?.startsWith("#")
      )
        return;
      navigationChecks.add(event);
      if (!window.confirm("You have unsaved changes. Leave this page?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", click, true);
    return () => {
      node?.removeEventListener("cgc:changed", changed);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", click, true);
    };
  }, []);
  const [clientError, setClientError] = useState("");
  const [nativeErrors, setNativeErrors] = useState<Record<string, string>>({});
  const [state, submit, pending] = useActionState(
    async (previous: SaveResult, data: FormData): Promise<SaveResult> => {
      if (previous.version) data.set("version", previous.version);
      if (previous.postId) data.set("id", String(previous.postId));
      entries.current = data;
      const result = await action(data);
      if (result.success) {
        dirty.current = false;
        setEdited(false);
        setSavedAt(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        savedCallback.current?.(result);
      }
      return {
        ...result,
        version: result.version || previous.version,
        postId: result.postId || previous.postId,
      };
    },
    { message: "" } as SaveResult,
  );
  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);
  useEffect(() => {
    if (
      state.success &&
      state.postId &&
      pathname === "/admin/announcements/new"
    )
      router.replace(`/admin/announcements/${state.postId}?notice=saved`);
  }, [state, pathname, router]);
  useEffect(() => {
    const node = form.current;
    if (!node || !entries.current) return;
    if (state.success && clearOnSuccess) {
      node.dispatchEvent(new Event("cgc:saved"));
      return;
    }
    const snapshot = entries.current;
    const frame = requestAnimationFrame(() => {
      restoring.current = true;
      node.dispatchEvent(new Event("cgc:sync-start"));
      const offsets: Record<string, number> = {};
      for (const element of Array.from(node.elements)) {
        if (
          !(
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ) ||
          !element.name
        )
          continue;
        const values = snapshot.getAll(element.name);
        if (
          element instanceof HTMLInputElement &&
          element.type === "checkbox"
        ) {
          element.checked = snapshot.has(element.name);
          continue;
        }
        const index = offsets[element.name] || 0;
        offsets[element.name] = index + 1;
        const value = values[index];
        if (element instanceof HTMLInputElement && element.type === "file") {
          if (value instanceof File && value.size) {
            const transfer = new DataTransfer();
            transfer.items.add(value);
            element.files = transfer.files;
          }
        } else if (typeof value === "string") {
          const prototype =
            element instanceof HTMLTextAreaElement
              ? HTMLTextAreaElement.prototype
              : element instanceof HTMLSelectElement
                ? HTMLSelectElement.prototype
                : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(
            element,
            value,
          );
          element.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const error =
          state.fields?.[element.name] ||
          state.fields?.[`${element.name}:${index}`];
        element.setAttribute("aria-invalid", error ? "true" : "false");
        const slot = element
          .closest("label")
          ?.querySelector<HTMLElement>("[data-field-error]");
        const input =
          element instanceof HTMLInputElement && element.type === "hidden"
            ? element
                .closest("label")
                ?.querySelector<HTMLInputElement>(
                  'input:not([type="hidden"])',
                ) || element
            : element;
        input.setAttribute("aria-invalid", error ? "true" : "false");
        if (slot && error) {
          input.setAttribute("aria-describedby", slot.id);
          input.setAttribute("aria-invalid", "true");
        } else if (slot && input.getAttribute("aria-describedby") === slot.id) {
          input.removeAttribute("aria-describedby");
        }
      }
      const version = node.querySelector<HTMLInputElement>(
        'input[name="version"]',
      );
      if (version && state.version) version.value = state.version;
      const id = node.querySelector<HTMLInputElement>('input[name="id"]');
      if (id && state.postId) id.value = String(state.postId);
      restoring.current = false;
      node.dispatchEvent(new Event("cgc:sync-end"));
    });
    return () => cancelAnimationFrame(frame);
  }, [state, clearOnSuccess]);
  return (
    <form
      ref={form}
      action={submit}
      className={className}
      aria-busy={pending}
      onClickCapture={(event) => {
        if ((event.target as Element).closest("[data-unsaved-change]")) {
          dirty.current = true;
          setEdited(true);
        }
      }}
      onSubmit={() => {
        setClientError("");
        setNativeErrors({});
      }}
      onChange={() => {
        if (!restoring.current) {
          dirty.current = true;
          setEdited(true);
        }
        setClientError("");
        setNativeErrors({});
      }}
      onInvalidCapture={(event) => {
        const field = event.target as HTMLInputElement;
        for (
          let parent = field.parentElement;
          parent && parent !== event.currentTarget;
          parent = parent.parentElement
        ) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        }
        const name = field.name || field.dataset.fieldName || "";
        const row = field.closest<HTMLElement>("[data-record-index]")?.dataset
          .recordIndex;
        if (name)
          setNativeErrors((current) => ({
            ...current,
            [row === undefined ? name : `${name}:${row}`]:
              field.validationMessage,
          }));
        field.setAttribute("aria-invalid", "true");
        requestAnimationFrame(() => {
          const slot = field
            .closest("label")
            ?.querySelector<HTMLElement>("[data-field-error]");
          if (slot) field.setAttribute("aria-describedby", slot.id);
        });
        setClientError(
          `${field.closest("label")?.querySelector("span")?.textContent || "Required field"}: ${field.validationMessage}`,
        );
      }}
    >
      {draftKey && (
        <DraftRecovery
          storageKey={draftKey}
          form={form}
          result={state}
          onRestore={(fields) => {
            const node = form.current;
            if (!node) return;
            for (const [name, value] of Object.entries(fields)) {
              const element = node.elements.namedItem(name);
              if (!(
                element instanceof HTMLInputElement ||
                element instanceof HTMLTextAreaElement
              ))
                continue;
              Object.getOwnPropertyDescriptor(
                element instanceof HTMLTextAreaElement
                  ? HTMLTextAreaElement.prototype
                  : HTMLInputElement.prototype,
                "value",
              )?.set?.call(element, value);
              element.dispatchEvent(new Event("input", { bubbles: true }));
            }
            const status = node.querySelector<HTMLSelectElement>(
              'select[name="status"]',
            );
            if (status) {
              status.value = "draft";
              status.dispatchEvent(new Event("change", { bubbles: true }));
            }
            node.dispatchEvent(
              new CustomEvent("cgc:restore", { detail: fields }),
            );
            dirty.current = true;
            setEdited(true);
          }}
        />
      )}
      <DirtyContext.Provider
        value={() => {
          if (!restoring.current) {
            dirty.current = true;
            setEdited(true);
          }
        }}
      >
        <ErrorContext.Provider value={{ ...state.fields, ...nativeErrors }}>
          <EditingContext.Provider value={true}>
            <fieldset className="admin-form-fields" disabled={pending}>
              {children}
            </fieldset>
          </EditingContext.Provider>
        </ErrorContext.Provider>
      </DirtyContext.Provider>
      {(clientError || state.message) && (
        <div
          className={`admin-notice ${state.success ? "success" : ""}`}
          role={state.success ? "status" : "alert"}
          tabIndex={-1}
        >
          <p>{clientError || state.message}</p>
          {state.links?.map((link) => (
            <p key={link.href}>
              <Link href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label} ↗
              </Link>
            </p>
          ))}
        </div>
      )}
      <p className="admin-save-status" role="status">
        {pending
          ? "Saving…"
          : edited
            ? "Unsaved changes"
            : savedAt
              ? `Saved at ${savedAt}`
              : ""}
      </p>
    </form>
  );
}
