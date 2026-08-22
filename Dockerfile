# Fuer Plattformen mit persistenter Festplatte (Railway, Render, Fly.io,
# ein eigener Server) — NICHT fuer serverlose Plattformen wie Vercel,
# denen die persistente Festplatte fehlt, die die SQLite-Datenbank hier
# braucht.
#
# Bewusst ein einzelnes, "volles" Image statt Next.js' minimaler
# standalone-Ausgabe: das Deploy braucht ohnehin die Prisma-CLI und tsx
# zur Laufzeit (fuer Migrationen/Seed beim Start), ein volles
# node_modules ist da einfacher und robuster als selektiv zu kopieren.
#
# Debian-basiert (nicht Alpine), damit better-sqlite3s natives Modul ohne
# Kompilier-Aerger installiert.
FROM node:22-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
