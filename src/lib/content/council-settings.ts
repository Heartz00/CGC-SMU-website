import "server-only";
import { getWordPressPage } from "./wordpress";
import { parseHomeSettings } from "./home-settings";
import { parseCouncilHistory } from "./council-history";
export async function getHomeSettings() {
  try {
    return parseHomeSettings(
      (await getWordPressPage("cgc-home-settings")) || "",
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
