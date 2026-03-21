import { useState } from "react";
import { ChevronDown } from "@untitled-ui/icons-react";
import { cn } from "../lib/cn";
import { parseDiff, type FileDiff, type DiffLine } from "../lib/parseDiff";

const CONTEXT_LINES = 3;
const EXPAND_STEP = 40;

type Segment =
  | { type: "lines"; lines: DiffLine[] }
  | { type: "collapsible"; lines: DiffLine[]; id: number };

type ReviewCardProps = {
  summary: string;
  diff: string;
};

function DiffLineRow({ line }: { line: DiffLine }) {
  return (
    <tr
      className={cn(
        line.type === "add" && "bg-green-950/30",
        line.type === "delete" && "bg-red-950/30",
      )}
    >
      <td
        className={cn(
          "w-10 px-2 py-0.5 text-right select-none border-r border-zinc-800",
          line.type === "delete" ? "text-red-400/50" : "text-zinc-600",
        )}
      >
        {line.oldLine ?? ""}
      </td>
      <td
        className={cn(
          "w-10 px-2 py-0.5 text-right select-none border-r border-zinc-800",
          line.type === "add" ? "text-green-400/50" : "text-zinc-600",
        )}
      >
        {line.newLine ?? ""}
      </td>
      <td className="px-3 py-0.5">
        <span
          className={cn(
            line.type === "add" && "text-green-400",
            line.type === "delete" && "text-red-400",
            line.type === "context" && "text-zinc-400",
          )}
        >
{line.content}
        </span>
      </td>
    </tr>
  );
}

function buildSegments(allLines: DiffLine[]): Segment[] {
  const changed = new Set<number>();
  allLines.forEach((line, i) => {
    if (line.type === "add" || line.type === "delete") {
      changed.add(i);
    }
  });

  const visible = new Set<number>();
  allLines.forEach((_, i) => {
    if (changed.has(i)) {
      visible.add(i);
    } else {
      for (let d = 1; d <= CONTEXT_LINES; d++) {
        if (changed.has(i - d) || changed.has(i + d)) {
          visible.add(i);
          break;
        }
      }
    }
  });

  const segments: Segment[] = [];
  let collapsibleId = 0;
  let i = 0;

  while (i < allLines.length) {
    if (visible.has(i)) {
      const lines: DiffLine[] = [];
      while (i < allLines.length && visible.has(i)) {
        lines.push(allLines[i]);
        i++;
      }
      segments.push({ type: "lines", lines });
    } else {
      const lines: DiffLine[] = [];
      while (i < allLines.length && !visible.has(i)) {
        lines.push(allLines[i]);
        i++;
      }
      segments.push({ type: "collapsible", lines, id: collapsibleId++ });
    }
  }

  return segments;
}

function CollapsibleBlock({
  segment,
  revealed,
  onExpand,
}: {
  segment: Extract<Segment, { type: "collapsible" }>;
  revealed: number;
  onExpand: () => void;
}) {
  const visibleLines = segment.lines.slice(0, revealed);
  const hiddenCount = segment.lines.length - revealed;

  return (
    <>
      {visibleLines.map((line, i) => (
        <DiffLineRow key={`col-${segment.id}-${i}`} line={line} />
      ))}
      {hiddenCount > 0 && (
        <tr
          className="bg-zinc-900/50 cursor-pointer hover:bg-zinc-800/60 transition-colors"
          onClick={onExpand}
        >
          <td colSpan={3} className="px-3 py-1 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{hiddenCount} hidden lines</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function FileDiffCard({ file }: { file: FileDiff }) {
  const allLines = file.hunks.flat();
  const segments = buildSegments(allLines);

  const [revealedMap, setRevealedMap] = useState<Record<number, number>>({});

  function handleExpand(id: number) {
    setRevealedMap((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + EXPAND_STEP,
    }));
  }

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
        <span className="text-xs font-mono text-zinc-300">{file.newPath}</span>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-xs font-mono leading-relaxed border-collapse">
          <tbody>
            {segments.map((seg, si) =>
              seg.type === "lines" ? (
                seg.lines.map((line, li) => (
                  <DiffLineRow key={`${si}-${li}`} line={line} />
                ))
              ) : (
                <CollapsibleBlock
                  key={`col-${seg.id}`}
                  segment={seg}
                  revealed={revealedMap[seg.id] ?? 0}
                  onExpand={() => handleExpand(seg.id)}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReviewCard({ summary, diff }: ReviewCardProps) {
  const files = parseDiff(diff);

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
          Code Review
        </span>
        <span className="text-xs text-zinc-500">
          {files.length} file{files.length !== 1 && "s"} changed
        </span>
      </div>
      <p className="text-sm text-zinc-300">{summary}</p>
      {files.map((file, i) => (
        <FileDiffCard key={i} file={file} />
      ))}
    </div>
  );
}
