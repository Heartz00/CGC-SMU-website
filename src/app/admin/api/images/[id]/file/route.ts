import { signedIn } from "@/lib/admin/auth";
import { libraryFile } from "@/lib/admin/library-file";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await signedIn();
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!auth)
    return Response.json(
      { error: "Please sign in again." },
      { status: 401, headers },
    );
  if (!auth.user.capabilities.upload_files)
    return Response.json(
      { error: "You do not have permission to upload photos." },
      { status: 403, headers },
    );
  try {
    const file = await libraryFile(auth.session, (await params).id);
    return new Response(await file.arrayBuffer(), {
      headers: {
        ...headers,
        "Content-Type": file.type,
        "Content-Disposition": `attachment; filename="${file.name}"`,
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Could not open this image. Choose a JPEG, PNG, or WebP up to 20 MB.",
      },
      { status: 400, headers },
    );
  }
}
