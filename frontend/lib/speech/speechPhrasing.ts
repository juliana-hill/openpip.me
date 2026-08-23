/**
 * Shapes text so the neural voice breaks it in the right places.
 *
 * Pocket TTS does its own chunking, and it is good until it is not. Read from
 * `node_modules/pocket-tts-js/src/worker.js`:
 *
 * - `SENTENCE_SPLIT_RE` is `/[^.!?]+[.!?]+|[^.!?]+$/g`, so **every** full stop
 *   is a boundary and nothing else is. A period inside `$300.00` splits it, and
 *   the two halves are synthesised separately -- "three hundred", pause, "zero
 *   zero".
 * - Sentences are packed up to `max_token_per_chunk`, which the bundle sets to
 *   **50 tokens** -- roughly forty words. A single sentence longer than that
 *   falls through to `splitTokenIdsIntoChunks`, which slices the token array by
 *   count and decodes each slice. SentencePiece tokens are sub-word, so that cut
 *   lands mid-word and the voice says half of one.
 *
 * Listing copy walks into both. Once `speakableText` has stripped the bullets,
 * a features list is a run of lines with no terminal punctuation at all -- one
 * "sentence" of two hundred words, straight into the mid-word path.
 *
 * So: give the splitter real boundaries, take away the false ones, and make
 * sure nothing reaching it is long enough to trigger the fallback.
 *
 * Ported from ../../../../couchbumming/lib/speech-phrasing.ts. Applied only on
 * the neural tier. `speechSynthesis` has its own, better, handling of numbers
 * and abbreviations, and "1 point 5" would be a regression there.
 */

// The bundle's own limit is 50 tokens. Words are counted instead of tokenised
// (the tokeniser lives in the worker), and sub-word splitting means tokens
// outnumber words -- so this sits well under the real ceiling on purpose.
const MAX_WORDS_PER_SENTENCE = 28;

// Expansions worth doing for their own sake: each of these also carries a full
// stop that would otherwise read as the end of a sentence.
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bsq\.?\s*ft\.?/gi, "square feet"],
  [/\bapt\./gi, "apartment"],
  [/\bste\./gi, "suite"],
  [/\bblvd\./gi, "boulevard"],
  [/\bave\./gi, "avenue"],
  [/\bst\.(?=\s|$)/gi, "street"],
  [/\brd\./gi, "road"],
  [/\bapprox\./gi, "approximately"],
  [/\bincl\./gi, "including"],
  [/\bmin\./gi, "minimum"],
  [/\bmax\./gi, "maximum"],
  [/\bmo\./gi, "month"],
  [/\byr\./gi, "year"],
];

// Matches a JSON-shaped `"field_name": ` label — e.g. from a proposal payload
// or tool-call result rendered inline in chat. Deliberately requires the
// quotes and colon together, not just any quoted word, so ordinary quoted
// dialogue in prose ("I'll take it," she said) is left alone.
const FIELD_LABEL = /"([A-Za-z][A-Za-z0-9_ ]*)"\s*:\s*/g;

function humanizeFieldLabel(rawKey: string): string {
  const words = rawKey.replace(/_/g, " ").trim().split(/\s+/);
  return words.map((word, index) => (index === 0 ? word[0].toUpperCase() + word.slice(1) : word)).join(" ");
}

/**
 * Gives every `"field": value` pair its own sentence for the field name,
 * before the rest of the pipeline ever sees it — otherwise "title" and its
 * value get read as one run-on utterance with no pause between them.
 *
 * "title": "Quarterly review" becomes two lines — "Title." then the value on
 * its own line — so the existing "every line is a terminated sentence" step
 * in phraseForSynthesis() gives the label a real pause instead of a comma-ish
 * blend into whatever follows the colon. Must run before speakableText(),
 * which would otherwise delete the underscores this needs to turn into
 * spaces (`message_id` -> "message id", not "messageid").
 */
export function insertFieldPauses(text: string): string {
  return text.replace(FIELD_LABEL, (_match, rawKey: string) => `\n${humanizeFieldLabel(rawKey)}.\n`);
}

function expandNumbers(text: string): string {
  return (
    text
      // Whole-dollar amounts written with cents. ".00" is not information any
      // listener wants, and dropping it removes the false boundary with it.
      .replace(/\$(\d[\d,]*)\.00\b/g, "$1 dollars")
      .replace(/\$(\d[\d,]*)\.(\d{2})\b/g, "$1 dollars $2 cents")
      .replace(/\$(\d[\d,]*)/g, "$1 dollars")
      // Any remaining decimal. Spoken, not silently joined: "1.5 baths" must not
      // become "15 baths", which is the same class of error as deleting a hyphen
      // from a range.
      .replace(/(\d)\.(\d)/g, "$1 point $2")
      // "$975/month" reads as a price, not a fraction.
      .replace(/\s*\/\s*(month|mo|week|wk|night|day|yr|year)\b/gi, " per $1")
  );
}

/** Splits on the same boundaries the worker does, so the count matches. */
function sentencesOf(line: string): string[] {
  return (line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((s) => s.trim()).filter(Boolean);
}

/**
 * Breaks an over-long sentence at its clause boundaries. Commas and semicolons
 * are already places a reader pauses, so promoting one to a full stop costs
 * some prosody -- far less than a word cut in half.
 */
function breakLongSentence(sentence: string): string[] {
  const words = sentence.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_SENTENCE) return [sentence];

  const clauses = sentence.split(/(?<=[,;:])\s+/);
  const out: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (!current.length) return;
    out.push(current.join(" ").replace(/[,;:]\s*$/, ""));
    current = [];
  };

  for (const clause of clauses) {
    const clauseWords = clause.split(/\s+/).filter(Boolean);
    const pending = current.reduce((n, c) => n + c.split(/\s+/).length, 0);
    if (pending && pending + clauseWords.length > MAX_WORDS_PER_SENTENCE) flush();

    if (clauseWords.length > MAX_WORDS_PER_SENTENCE) {
      // No clause boundary to use. A hard word-count split is the last resort,
      // but it still lands between words rather than inside one.
      flush();
      for (let i = 0; i < clauseWords.length; i += MAX_WORDS_PER_SENTENCE) {
        out.push(clauseWords.slice(i, i + MAX_WORDS_PER_SENTENCE).join(" ").replace(/[,;:]\s*$/, ""));
      }
      continue;
    }
    current.push(clause);
  }
  flush();
  return out.filter(Boolean);
}

/**
 * Returns `text` with explicit, correct sentence boundaries and no sentence long
 * enough to be cut mid-word. Expects insertFieldPauses() and speakableText() to
 * have run already.
 */
export function phraseForSynthesis(text: string): string {
  const expanded = ABBREVIATIONS
    .reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);

  const sentences: string[] = [];
  for (const line of expandNumbers(expanded).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const sentence of sentencesOf(trimmed)) {
      for (const part of breakLongSentence(sentence)) {
        // Every line becomes a terminated sentence. A stripped bullet has no
        // punctuation of its own, and without this the whole list arrives as one
        // unsplittable run.
        sentences.push(/[.!?]$/.test(part) ? part : `${part}.`);
      }
    }
  }

  return sentences.join(" ");
}
