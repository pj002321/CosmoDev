"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditableTagline({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  async function save() {
    const trimmed = value.trim() || initialValue;
    setValue(trimmed);
    setEditing(false);
    if (trimmed === initialValue) return;
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagline: trimmed }),
    });
    router.refresh();
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={value}
        maxLength={60}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.blur();
          if (e.key === "Escape") {
            setValue(initialValue);
            setEditing(false);
          }
        }}
        className="text-2xl font-semibold bg-transparent border-b border-accent outline-none w-full max-w-md"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className="text-2xl font-semibold animate-fade-in cursor-text hover:text-accent transition-colors"
      title="클릭해서 제목 수정"
    >
      {value}
    </h1>
  );
}
