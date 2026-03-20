export function toolResultToString(
  content: string | { type: string; [key: string]: unknown }[],
): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => ("text" in part ? String(part.text) : JSON.stringify(part)))
    .join("\n");
}
