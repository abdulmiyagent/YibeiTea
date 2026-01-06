/**
 * Simple translation utility using MyMemory API
 * Free tier: 5000 chars/day without API key
 */

type TranslationPair = "nl-en" | "en-nl";

export async function translate(
  text: string,
  direction: TranslationPair
): Promise<string> {
  if (!text.trim()) return "";

  const langPair = direction === "nl-en" ? "nl|en" : "en|nl";

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
    );

    if (!response.ok) {
      throw new Error("Translation failed");
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    throw new Error("Translation failed");
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function translateBatch(
  texts: { text: string; key: string }[],
  direction: TranslationPair
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const item of texts) {
    if (item.text.trim()) {
      try {
        results[item.key] = await translate(item.text, direction);
      } catch {
        results[item.key] = "";
      }
    } else {
      results[item.key] = "";
    }
  }

  return results;
}
