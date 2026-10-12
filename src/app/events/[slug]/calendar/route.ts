import { getEvents } from "@/lib/content";
import { eventSlug } from "@/lib/content/event-links";
import { calendarFile } from "@/lib/content/calendar-file";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = (await getEvents()).items.find(
    (item) => eventSlug(item) === slug,
  );
  if (!event) return new Response("Event not found", { status: 404 });
  return new Response(calendarFile(event), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cgc-event.ics"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
