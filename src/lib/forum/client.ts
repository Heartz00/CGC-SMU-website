"use client";
export async function forumFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    signal: options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      data.error || "The forum could not complete this request.",
    ) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}
