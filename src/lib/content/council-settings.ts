import "server-only";
import { getWordPressPage } from "./wordpress";
import { parseHomeSettings, activeHomeSettings } from "./home-settings";
import { parseCouncilHistory } from "./council-history";
export async function getHomeSettings() {
  try {
    return activeHomeSettings(
      parseHomeSettings((await getWordPressPage("cgc-home-settings")) || ""),
    );
  } catch {
    return {};
  }
}
export async function getCouncilHistory() {
  try {
    return parseCouncilHistory(
      (await getWordPressPage("cgc-council-history")) || "",
    );
  } catch {
    return [];
  }
}
