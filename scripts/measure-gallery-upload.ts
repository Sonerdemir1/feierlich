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

  console.log(`Test-Event angelegt: ${slug} / Tisch ${table.id}`);

  try {
    execSync("npx playwright test tests/gallery-upload.spec.ts", {
      stdio: "inherit",
      env: { ...process.env, EVENT_SLUG: slug, TABLE_ID: table.id },
    });
  } finally {
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
