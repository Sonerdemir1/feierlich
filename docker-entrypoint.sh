#!/bin/sh
set -e

# Verzeichnis der SQLite-Datei sicherstellen (z. B. das gemountete
# Volume /data) — falls die Plattform den Mount-Pfad noch nicht als
# Verzeichnis angelegt hat, bevor der Container startet.
DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
mkdir -p "$(dirname "$DB_PATH")"

# Beides ist idempotent (Migrationen ueberspringen bereits angewandte
# Schritte, der Seed nutzt durchgaengig upsert()), daher unbedenklich bei
# jedem Container-Start erneut auszufuehren — kein manueller DB-Schritt
# noetig, weder beim ersten Deploy noch danach.
npx prisma migrate deploy
npx prisma db seed

exec npm run start
