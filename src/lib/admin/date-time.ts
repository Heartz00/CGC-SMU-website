export function dallasLocalTime(iso: string): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T");
}
export function dallasToIso(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return "";
  const wall = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(wall)) return "";
  // Start with standard time; during the repeated autumn hour, prefer the
  // later (standard-time) occurrence. Never silently shift a nonexistent time.
  let guess = wall + 6 * 60 * 60 * 1000;
  for (let i = 0; i < 3; i++) {
    const rendered = dallasLocalTime(new Date(guess).toISOString());
    const delta = wall - Date.parse(`${rendered}:00Z`);
    guess += delta;
  }
  return dallasLocalTime(new Date(guess).toISOString()) === local
    ? new Date(guess).toISOString()
    : "";
}
