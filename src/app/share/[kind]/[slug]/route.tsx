import { ImageResponse } from "next/og";
import { getEvents } from "@/lib/content";
import { getWordPressPost } from "@/lib/content/wordpress";
import { eventSlug } from "@/lib/content/event-links";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ kind: string; slug: string }> },
) {
  const { kind, slug } = await params;
  let title = "",
    description = "";
  if (kind === "events") {
    const event = (await getEvents()).items.find((e) => eventSlug(e) === slug);
    if (!event) return new Response("Not found", { status: 404 });
    title = event.title;
    description = event.location;
  } else if (kind === "news") {
    const post = await getWordPressPost(slug);
    if (!post) return new Response("Not found", { status: 404 });
    title = post.title;
    description = post.excerpt;
  } else return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#354ca1",
        color: "white",
        padding: 70,
        flexDirection: "column",
        justifyContent: "space-between",
        borderTop: "18px solid #dc1735",
      }}
    >
      <div style={{ fontSize: 27, letterSpacing: 3 }}>
        SMU · CHEMISTRY GRADUATE COUNCIL
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: title.length > 85 ? 48 : 62,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {title.slice(0, 150)}
        </div>
        <div style={{ fontSize: 26, marginTop: 28, color: "#e2e8ff" }}>
          {description.slice(0, 180)}
        </div>
      </div>
      <div style={{ fontSize: 23 }}>Community. Connection. Chemistry.</div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    },
  );
}
