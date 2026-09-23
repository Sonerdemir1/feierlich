import "dotenv/config";
import { execSync } from "node:child_process";
import { prisma } from "@/lib/prisma";

// Orchestriert tests/gallery-upload.spec.ts: legt ein Wegwerf-Event samt
// Tisch an, startet den Playwright-Test mit den passenden Umgebungs-
// variablen, raeumt danach wieder auf — egal ob der Test besteht.
async function main() {
  const owner = await prisma.user.findFirst();
  const eventType = await prisma.eventType.findFirst({ where: { active: true } });
  const template = await prisma.template.findFirst({ where: { status: "ACTIVE" } });
  if (!owner || !eventType || !template) throw new Error("Keine Basisdaten (User/EventType/Template) gefunden.");

  // Galerie ist ein paketgebundenes Feature (siehe lib/event-features.ts,
  // eventHasFeature() prueft event.order.status==="PAID" + Package.features)
  // — ohne einen bezahlten Order mit passendem Paket rendert die Galerie-
  // Sektion gar nicht, egal ob das Modul selbst "an" ist. Gefunden beim
  // ersten Testlauf: die Galerie-Sektion fehlte komplett, weil dieses
  // Skript vorher gar keinen Order anlegte.
  const galleryPackage = await prisma.package.findFirst({ where: { features: { contains: '"gallery"' } } });
  if (!galleryPackage) throw new Error('Kein Paket mit Feature "gallery" gefunden.');

  const slug = `tmp-playwright-${Date.now()}`;
  const event = await prisma.event.create({
    data: {
      slug,
      title: "Playwright Messung",
      eventDate: new Date(),
      ownerId: owner.id,
      eventTypeId: eventType.id,
      templateId: template.id,
      status: "PUBLISHED",
    },
  });
  const table = await prisma.table.create({ data: { eventId: event.id, name: "Tisch 1", capacity: 8 } });
  const order = await prisma.order.create({
    data: {
      userId: owner.id,
      packageId: galleryPackage.id,
      eventId: event.id,
      amountCents: galleryPackage.priceCents,
      status: "PAID",
    },
  });

  console.log(`Test-Event angelegt: ${slug} / Tisch ${table.id} / Paket ${galleryPackage.name}`);

  try {
    execSync("npx playwright test tests/gallery-upload.spec.ts", {
      stdio: "inherit",
      env: { ...process.env, EVENT_SLUG: slug, TABLE_ID: table.id },
    });
  } finally {
    // Order.eventId ist optional (Prisma-Standardverhalten fuer optionale
    // Relationen ist SetNull, nicht Cascade) — beim Loeschen des Events
    // wuerde die Order sonst als Karteileiche mit eventId:null liegen
    // bleiben, deshalb hier explizit zuerst geloescht.
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.event.delete({ where: { id: event.id } });
    console.log("Test-Event wieder gelöscht.");
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
