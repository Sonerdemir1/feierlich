"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const STORAGE_KEY = "einladi_guest_name";

// Merkt sich den einmal eingegebenen Gästenamen im Browser (localStorage)
// und befuellt damit automatisch jedes weitere Namensfeld auf derselben
// Event-Seite (Galerie-Upload, Gästebuch, RSVP, Sitzplatz-Suche) — sonst
// muesste ein Gast denselben Namen bis zu vier Mal eintippen.
export function GuestNameField({
  name,
  placeholder,
  required,
  style,
  defaultValue,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
  style?: CSSProperties;
  // Bekannter Name ueber den personalisierten Einladungslink (?g=<Token>)
  // — hat Vorrang vor dem localStorage-Wert, der ja auch von einer
  // anderen Person auf demselben Geraet stammen koennte.
  defaultValue?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultValue) {
      if (ref.current) ref.current.value = defaultValue;
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ref.current) ref.current.value = saved;
    } catch {
      // localStorage kann in privaten Fenstern/mit blockierten Cookies
      // fehlschlagen — dann bleibt das Feld einfach leer, kein Problem.
    }
  }, [defaultValue]);

  return (
    <input
      ref={ref}
      type="text"
      name={name}
      placeholder={placeholder}
      required={required}
      style={style}
      onChange={(e) => {
        try {
          localStorage.setItem(STORAGE_KEY, e.target.value);
        } catch {
          // s.o.
        }
      }}
    />
  );
}
