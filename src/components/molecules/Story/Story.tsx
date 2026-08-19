"use client";

/**
 * Renders a long piece of academy writing — a coach's career, a match report,
 * an interview — from plain text typed into a dashboard textarea.
 *
 * A deliberately tiny subset of Markdown, so the person writing it does not
 * have to know what Markdown is:
 *
 *   ## Heading      -> section heading
 *   - item          -> bullet
 *   **bold**        -> bold
 *
 * Everything else is an ordinary paragraph. Parsed into React elements and
 * never rendered as raw HTML, so text pasted from Word or a website cannot
 * inject markup into the page.
 */

type StoryBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

export const parseStory = (source: string): StoryBlock[] => {
  const blocks: StoryBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ kind: "list", items: list });
      list = [];
    }
  };

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }
    const heading = line.match(/^#{2,3}\s+(.*)$/);
    if (heading) {
      flushList();
      flushParagraph();
      blocks.push({ kind: "heading", text: heading[1].trim() });
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushList();
  flushParagraph();
  return blocks;
};

/** Renders **bold** spans without going near dangerouslySetInnerHTML. */
export const Emphasised = ({ text }: { text: string }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <strong key={i} className="font-semibold text-[#020022]">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    )}
  </>
);

interface StoryProps {
  text: string;
  /** Shown above the story when the text sets no headings of its own. */
  fallbackHeading?: string;
}

const Story = ({ text, fallbackHeading }: StoryProps) => {
  const blocks = parseStory(text ?? "");
  if (blocks.length === 0) return null;

  const hasHeading = blocks.some((b) => b.kind === "heading");

  return (
    <>
      {!hasHeading && fallbackHeading && (
        <h2 className="text-xl font-bold text-[#020022] mb-4">
          {fallbackHeading}
        </h2>
      )}
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h2
              key={i}
              className={`text-xl font-bold text-[#020022] ${
                i === 0 ? "mb-4" : "mt-10 mb-4"
              }`}
            >
              {block.text}
            </h2>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="space-y-2 mb-4">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-gray-700">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 rounded-full bg-[#E43125] flex-shrink-0"
                  />
                  <span className="leading-relaxed">
                    <Emphasised text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        // Anything before the first heading is the opening line — set it a
        // size larger so the piece has a lead rather than starting flat.
        const isLead = i === 0 && hasHeading;
        return (
          <p
            key={i}
            className={
              isLead
                ? "text-lg text-gray-800 leading-relaxed mb-8"
                : "text-gray-700 leading-relaxed mb-4"
            }
          >
            <Emphasised text={block.text} />
          </p>
        );
      })}
    </>
  );
};

export default Story;
