import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLiveWallPhotos, liveWallPhotosVisible, fallbackHashtag } from "@/lib/live-wall";
import { LiveWallSlideshow } from "@/components/live/LiveWallSlideshow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LiveWallPage({ params }: PageProps<"/live/[eventId]">) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { modules: { include: { module: true } } },
  });
  if (!event) notFound();

  const socialConfig = event.modules.find((m) => m.module.key === "social-media")?.config;
  const storedHashtag = socialConfig ? (JSON.parse(socialConfig).hashtag as string | undefined) : undefined;
  const hashtag = storedHashtag || fallbackHashtag(event.title);

  const photos = await getLiveWallPhotos(eventId, event.liveWallMode, event.eventDate);
  const visible = liveWallPhotosVisible(event.liveWallMode, event.eventDate);
  const emptyMessage = !visible
    ? "Die Fotos gibt's morgen früh hier zu sehen."
    : photos.length === 0
      ? "Die ersten Fotos erscheinen hier gleich."
      : null;

  return <LiveWallSlideshow eventId={event.id} initialPhotos={photos} hashtag={hashtag} emptyMessage={emptyMessage} />;
}
