"use client";
import { useState } from "react";
export function ShareLink() {
  const [message, setMessage] = useState("");
  return (
    <span>
      <button
        type="button"
        className="button button-share"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.href);
            setMessage("Link copied.");
          } catch {
            setMessage(
              "Copy the address from your browser to share this event.",
            );
          }
        }}
      >
        Copy event link
      </button>
      <span role="status" className="share-status">
        {message}
      </span>
    </span>
  );
}
