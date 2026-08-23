/**
 * Prepares text for speech synthesis.
 *
 * Read-aloud is pointed at model output, and since listing copy became a
 * markdown details section that means `speechSynthesis` was being handed `###`,
 * `**` and `|` to pronounce.
 *
 * The one rule worth stating loudly, because getting it wrong is worse than not
 * stripping at all: **hyphens become a space, never nothing.** Deleting them
 * turns "3-5 years" into "35 years" and "$50,000-$70,000" into a single number.
 * That is not a formatting problem, it is the reader being told something false.
 *
 * Ported from ../../../../couchbumming/lib/speakable-text.ts (unchanged) —
 * markdown stripping has nothing project-specific about it. JSON/field
 * handling (the "title": "..." running together with its value) is a
 * separate, later step — see speechPhrasing.ts.
 */
export function speakableText(input: string): string {
  return (
    input
      // A spoken URL is noise, so keep the link's label and drop its target.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Email bodies often expose the raw destination in footer copy (for
      // example, "web: https://..."). Keep the surrounding words but never
      // make the voice read a long URL character by character.
      .replace(/\b(?:https?|ftp):\/\/[^\s<>'")]+/gi, "")
      .replace(/\bwww\.[^\s<>'")]+/gi, "")
      // Marketing emails frequently insert zero-width tracking characters and
      // non-breaking spaces between words. They are invisible in the iframe
      // but can cause neural TTS to vocalize individual characters.
      .replace(/\u00a0/g, " ")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u034f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "")
      // Code blocks are not prose and reading them aloud helps nobody.
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`/g, "")
      // Horizontal rules, before hyphens are touched -- otherwise a rule turns
      // into a run of spoken spaces.
      .replace(/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, " ")
      // Leading heading and blockquote markers.
      .replace(/^[ \t]*[#>]+[ \t]*/gm, "")
      // List bullets, before the hyphen rule so "- item" does not become " item"
      // with a stray leading space.
      .replace(/^[ \t]*[-*+][ \t]+/gm, "")
      // Ordered list markers keep their number: "1." reads naturally.
      // Emphasis, strikethrough, and the underscores in snake_case labels.
      .replace(/[*_~]/g, "")
      // A table's separator row is punctuation only -- "| --- | :-- |" -- and
      // has nothing to say. Removed whole, before the hyphen rule turns it into
      // a line of spaces.
      .replace(/^[ \t]*\|?[ \t:|-]*\|[ \t:|-]*$/gm, "")
      // Table cell and header separators.
      .replace(/\|/g, " ")
      // Every remaining hyphen. A space, so a range is read as two numbers.
      .replace(/-/g, " ")
      // Tidy up without collapsing paragraph breaks, which pace the speech.
      .replace(/[ \t]{2,}/g, " ")
      // Trim each line, not just the whole string: stripping a bullet or a pipe
      // leaves indentation that a synthesiser renders as a pause.
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
