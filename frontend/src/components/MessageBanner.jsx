import { useEffect, useState } from "react";

export function MessageBanner({ message, isError }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [message, isError]);

  if (!message || dismissed) return null;

  return (
    <div className={isError ? "message error" : "message"} role={isError ? "alert" : "status"} aria-live="polite">
      <span>{isError ? "Error" : "Status"}</span>
      <strong>{message}</strong>
      <button className="message-close" onClick={() => setDismissed(true)} type="button" aria-label="Close message">
        x
      </button>
    </div>
  );
}
