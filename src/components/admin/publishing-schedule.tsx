"use client";
import { useEffect, useRef, useState } from "react";
import { dallasLocalTime, dallasToIso } from "@/lib/admin/date-time";
export function PublishingSchedule({ initial = "" }: { initial?: string }) {
  const node = useRef<HTMLDivElement>(null),
    [visible, setVisible] = useState(!!initial),
    [local, setLocal] = useState(() =>
      initial ? dallasLocalTime(initial) : "",
    );
  useEffect(() => {
    const form = node.current?.closest("form"),
      select = form?.querySelector<HTMLSelectElement>('select[name="status"]');
    const update = () => setVisible(select?.value === "future");
    update();
    select?.addEventListener("change", update);
    return () => select?.removeEventListener("change", update);
  }, []);
  return (
    <div ref={node} hidden={!visible}>
      <label className="admin-field">
        <span>Publish at (Dallas time)</span>
        <input
          type="datetime-local"
          value={local}
          required={visible}
          onChange={(e) => {
            setLocal(e.target.value);
            e.target.setCustomValidity(
              e.target.value && !dallasToIso(e.target.value)
                ? "Choose a valid Dallas time."
                : "",
            );
          }}
        />
      </label>
      <input
        type="hidden"
        name="publishAt"
        value={visible && local ? dallasToIso(local) : ""}
      />
    </div>
  );
}
