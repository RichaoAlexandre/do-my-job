type ReviewCardProps = {
  summary: string;
  diff: string;
};

export default function ReviewCard({ summary, diff }: ReviewCardProps) {
  return (
    <div className="border border-zinc-800 rounded-lg p-6 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
          Review Ready
        </span>
      </div>
      <p className="text-sm text-zinc-300 mb-4">{summary}</p>
      <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-auto text-xs leading-relaxed">
        {diff.split("\n").map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith("+") && !line.startsWith("+++")
                ? "text-green-400"
                : line.startsWith("-") && !line.startsWith("---")
                  ? "text-red-400"
                  : line.startsWith("@@")
                    ? "text-blue-400"
                    : "text-zinc-500"
            }
          >
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}
