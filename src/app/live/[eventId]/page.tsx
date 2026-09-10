import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLiveWallPhotos, fallbackHashtag } from "@/lib/live-wall";
import { LiveWallSlideshow } from "@/components/live/LiveWallSlideshow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LiveWallPage({ params }: PageProps<"/live/[eventId]">) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) notFound();

  // Einzige Quelle: Event.socialMediaText (derselbe Hashtag-Text wie auf der
  // Einladungsseite) — vorher ein eigenes, unabhaengiges EventModule.config-
  // Feld, siehe Fund in der Bestandsaufnahme zur Live-Wand-Vereinfachung.
  // Gleiche Fallback-Logik wie zuvor, nur die Quelle hat sich geaendert.
  const hashtag = event.socialMediaText || fallbackHashtag(event.title);

  const photos = await getLiveWallPhotos(eventId);
  const emptyMessage = photos.length === 0 ? "Die ersten Fotos erscheinen hier gleich." : null;

  return <LiveWallSlideshow eventId={event.id} initialPhotos={photos} hashtag={hashtag} emptyMessage={emptyMessage} />;
}
