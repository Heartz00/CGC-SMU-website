import { signedIn } from "@/lib/admin/auth";
import { imageLibrary } from "@/lib/admin/image-library";
export async function GET() {
  const auth = await signedIn();
  const headers = { "Cache-Control": "no-store" };
  if (!auth)
    return Response.json(
      { error: "Please sign in again to load photos." },
      { status: 401, headers },
    );
  try {
    return Response.json(
      { images: await imageLibrary(auth.session) },
      { headers },
    );
  } catch {
    return Response.json(
      {
        error: "Could not load photos. Try again.",
      },
      { status: 503, headers },
    );
  }
}
