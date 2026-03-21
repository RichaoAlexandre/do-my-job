import { useState } from "react";
import { Send01 } from "@untitled-ui/icons-react";

type FloatingInputProps = {
  onSubmit: (value: string) => void;
  placeholder?: string;
};

export default function FloatingInput({
  onSubmit,
  placeholder = "Send a message...",
}: FloatingInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <div className="sticky bottom-0 p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 pr-12 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <Send01 className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
