# Fuer Plattformen mit langlebigem Server-Prozess (Railway, Render,
# Fly.io, ein eigener Server) — NICHT fuer serverlose Plattformen wie
# Vercel. Datenbank ist Postgres (separater Managed-Service, z. B.
# Railway-Postgres-Plugin), nur hochgeladene Dateien landen ohne
# R2-Konfiguration auf der lokalen Festplatte dieses Containers — dafuer
# braucht die Plattform dann trotzdem ein persistentes Volume.
#
# Bewusst ein einzelnes, "volles" Image statt Next.js' minimaler
# standalone-Ausgabe: das Deploy braucht ohnehin die Prisma-CLI und tsx
# zur Laufzeit (fuer Migrationen/Seed beim Start), ein volles
# node_modules ist da einfacher und robuster als selektiv zu kopieren.
FROM node:22-slim
WORKDIR /app

# Ohne dies findet Prisma zur Laufzeit keine libssl/openssl-Version und
# warnt beim Start ("failed to detect the libssl/openssl version to
# use") — node:22-slim bringt das anders als node:22 nicht mit.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

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
