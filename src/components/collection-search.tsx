"use client";
import { useId, useState, type ReactNode } from "react";
export function CollectionSearch({
  items,
  className,
  label,
  defaultGroup = "",
}: {
  items: { id: string; text: string; group: string; content: ReactNode }[];
  className: string;
  label: string;
  defaultGroup?: string;
}) {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState(defaultGroup),
    id = useId();
  const groups = [...new Set(items.map((i) => i.group))].filter(Boolean);
  const shown = items.filter(
    (i) =>
      (!group || i.group === group) &&
      i.text
        .toLocaleLowerCase("en-US")
        .includes(query.trim().toLocaleLowerCase("en-US")),
  );
  return (
    <>
      <div className="collection-controls">
        <label htmlFor={id}>
          Search {label}
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label}`}
          />
        </label>
        {groups.length > 0 && (
          <label>
            Filter {label}
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">All</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p role="status" className="section-note">
        {shown.length} {shown.length === 1 ? "result" : "results"}
      </p>
      <div className={className}>
        {shown.map((i) => (
          <div key={i.id} className="collection-item">
            {i.content}
          </div>
        ))}
      </div>
      {!shown.length && <p>No matches. Try another search or filter.</p>}
    </>
  );
}
