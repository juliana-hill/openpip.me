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
