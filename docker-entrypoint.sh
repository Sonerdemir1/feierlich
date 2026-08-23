#!/bin/sh
set -e

# `db push` statt versionierter Migrationen: kein lokales Postgres zum
# Erzeugen/Testen von Migrations-SQL verfuegbar gewesen, und vor dem
# ersten echten Deploy gibt es noch keine Produktionsdaten zu schuetzen.
# Spaeter, sobald eine stabile Postgres-Verbindung zum Entwickeln da ist,
# sollte das auf `prisma migrate deploy` mit echter Migrationshistorie
# umgestellt werden.
#
# Beides ist idempotent (der Seed nutzt durchgaengig upsert()), daher
# unbedenklich bei jedem Container-Start erneut auszufuehren — kein
# manueller DB-Schritt noetig, weder beim ersten Deploy noch danach.
npx prisma db push --accept-data-loss --skip-generate
npx prisma db seed

exec npm run start
