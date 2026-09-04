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
        className={className}
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
      className={`w-full border-0 bg-transparent p-0 outline-none ${className ?? ""}`}
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
