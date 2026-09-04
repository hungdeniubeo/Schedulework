import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  className?: string;
  onCommit: (next: string) => void;
};

export function InlineEdit({ value, className, onCommit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onCommit(next);
    else setDraft(value);
  }

  if (!editing) {
    return (
      <span
        className={`cursor-text rounded-sm px-0.5 hover:bg-black/[0.04] ${className ?? ""}`}
        onClick={() => setEditing(true)}
        title="Click để sửa"
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={ref}
      value={draft}
      className={`w-full rounded-sm border-0 bg-white/70 p-0 px-0.5 outline-none ring-1 ring-neutral-300 ${className ?? ""}`}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
    />
  );
}
