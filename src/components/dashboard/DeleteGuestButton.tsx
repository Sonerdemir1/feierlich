"use client";

import { deleteGuest } from "@/app/dashboard/events/[id]/guests/actions";

export function DeleteGuestButton({ eventId, guestId, guestName }: { eventId: string; guestId: string; guestName: string }) {
  return (
    <form
      action={deleteGuest.bind(null, eventId, guestId)}
      onSubmit={(e) => {
        if (!confirm(`${guestName} wirklich aus der Gästeliste entfernen?`)) {
          e.preventDefault();
        }
      }}
      style={{ display: "inline" }}
    >
      <button type="submit" style={{ fontSize: 12, color: "#B2543A", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        Entfernen
      </button>
    </form>
  );
}
