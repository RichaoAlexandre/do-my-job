export type DiffLineType = "add" | "delete" | "context";

export type DiffLine = {
  type: DiffLineType;
  content: string;
  oldLine: number | null;
  newLine: number | null;
};

export type FileDiff = {
  oldPath: string;
  newPath: string;
  hunks: DiffLine[][];
};

export function parseDiff(raw: string): FileDiff[] {
  const files: FileDiff[] = [];
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    // Find next file diff
    if (!lines[i].startsWith("diff --git")) {
      i++;
      continue;
    }

    let oldPath = "";
    let newPath = "";
    i++;

    // Parse headers (index, ---, +++)
    while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff --git")) {
      if (lines[i].startsWith("--- ")) {
        oldPath = lines[i].slice(4).replace(/^a\//, "");
      }
      if (lines[i].startsWith("+++ ")) {
        newPath = lines[i].slice(4).replace(/^b\//, "");
      }
      i++;
    }

    const hunks: DiffLine[][] = [];

    // Parse hunks
    while (i < lines.length && !lines[i].startsWith("diff --git")) {
      if (lines[i].startsWith("@@")) {
        const hunkHeader = lines[i];
        const match = hunkHeader.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        let oldLine = match ? parseInt(match[1]) : 1;
        let newLine = match ? parseInt(match[2]) : 1;

        const hunk: DiffLine[] = [];
        i++;

        while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("diff --git")) {
          const line = lines[i];
          if (line.startsWith("+")) {
            hunk.push({ type: "add", content: line.slice(1), oldLine: null, newLine: newLine++ });
          } else if (line.startsWith("-")) {
            hunk.push({ type: "delete", content: line.slice(1), oldLine: oldLine++, newLine: null });
          } else {
            // Context line (starts with space or is empty)
            hunk.push({ type: "context", content: line.startsWith(" ") ? line.slice(1) : line, oldLine: oldLine++, newLine: newLine++ });
          }
          i++;
        }

        hunks.push(hunk);
      } else {
        i++;
      }
    }

    files.push({ oldPath, newPath, hunks });
  }

  return files;
}
