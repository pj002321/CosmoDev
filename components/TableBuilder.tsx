"use client";

import { useState } from "react";

const MIN_ROWS = 2; // header + at least one body row
const MIN_COLS = 1;

function makeGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (r === 0 ? `헤더${c + 1}` : ""))
  );
}

function toMarkdown(cells: string[][]): string {
  const escape = (s: string) => s.replace(/\|/g, "\\|").trim() || " ";
  const [header, ...body] = cells;
  const lines = [
    `| ${header.map(escape).join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...body.map((row) => `| ${row.map(escape).join(" | ")} |`),
  ];
  return lines.join("\n") + "\n";
}

const btnClass =
  "font-mono text-xs text-muted border border-border rounded px-2 py-1 hover:border-accent disabled:opacity-40 disabled:hover:border-border";

export default function TableBuilder({
  onInsert,
  onClose,
}: {
  onInsert: (markdown: string) => void;
  onClose: () => void;
}) {
  const [cells, setCells] = useState<string[][]>(() => makeGrid(3, 3));
  const [activeRow, setActiveRow] = useState(0);
  const [activeCol, setActiveCol] = useState(0);

  const rowCount = cells.length;
  const colCount = cells[0]?.length ?? 0;

  function updateCell(r: number, c: number, value: string) {
    setCells((prev) =>
      prev.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row))
    );
  }

  function addRow() {
    setCells((prev) => {
      const next = [...prev];
      next.splice(activeRow + 1, 0, Array(colCount).fill(""));
      return next;
    });
    setActiveRow((r) => r + 1);
  }

  function deleteRow() {
    if (rowCount <= MIN_ROWS) return;
    setCells((prev) => prev.filter((_, i) => i !== activeRow));
    setActiveRow((r) => Math.min(r, rowCount - 2));
  }

  function insertColumn(offset: 0 | 1) {
    setCells((prev) =>
      prev.map((row) => {
        const next = [...row];
        next.splice(activeCol + offset, 0, "");
        return next;
      })
    );
    if (offset === 1) setActiveCol((c) => c + 1);
  }

  function deleteColumn() {
    if (colCount <= MIN_COLS) return;
    setCells((prev) => prev.map((row) => row.filter((_, j) => j !== activeCol)));
    setActiveCol((c) => Math.min(c, colCount - 2));
  }

  function resize(rows: number, cols: number) {
    rows = Math.max(MIN_ROWS, rows);
    cols = Math.max(MIN_COLS, cols);
    setCells((prev) => {
      const withCols = prev.map((row) => {
        const r = row.slice(0, cols);
        while (r.length < cols) r.push("");
        return r;
      });
      const next = withCols.slice(0, rows);
      while (next.length < rows) next.push(Array(cols).fill(""));
      return next;
    });
    setActiveRow((r) => Math.min(r, rows - 1));
    setActiveCol((c) => Math.min(c, cols - 1));
  }

  return (
    <div className="border border-border rounded p-3 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={addRow} className={btnClass}>
          + 행 추가
        </button>
        <button type="button" onClick={deleteRow} disabled={rowCount <= MIN_ROWS} className={btnClass}>
          − 행 삭제
        </button>
        <span className="w-px h-4 bg-border" />
        <button type="button" onClick={() => insertColumn(0)} className={btnClass}>
          ◀ 열 삽입
        </button>
        <button type="button" onClick={() => insertColumn(1)} className={btnClass}>
          열 삽입 ▶
        </button>
        <button type="button" onClick={deleteColumn} disabled={colCount <= MIN_COLS} className={btnClass}>
          열 삭제
        </button>
        <span className="w-px h-4 bg-border" />
        <label className="flex items-center gap-1 font-mono text-xs text-muted">
          행
          <input
            type="number"
            min={MIN_ROWS}
            value={rowCount}
            onChange={(e) => resize(Number(e.target.value) || MIN_ROWS, colCount)}
            className="w-12 bg-surface border border-border rounded px-1 py-0.5 outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center gap-1 font-mono text-xs text-muted">
          열
          <input
            type="number"
            min={MIN_COLS}
            value={colCount}
            onChange={(e) => resize(rowCount, Number(e.target.value) || MIN_COLS)}
            className="w-12 bg-surface border border-border rounded px-1 py-0.5 outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {cells.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border border-border p-0">
                    <input
                      value={cell}
                      onFocus={() => {
                        setActiveRow(r);
                        setActiveCol(c);
                      }}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      className={`w-28 px-2 py-1 text-sm bg-surface outline-none focus:bg-background ${
                        r === 0 ? "font-medium" : ""
                      } ${r === activeRow && c === activeCol ? "ring-1 ring-accent" : ""}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onInsert(toMarkdown(cells))}
          className="btn-accent font-mono text-xs rounded px-3 py-1.5"
        >
          표 삽입
        </button>
        <button type="button" onClick={onClose} className={btnClass}>
          취소
        </button>
        <span className="font-mono text-xs text-muted">
          첫 행은 헤더로 쓰이고, 선택된 셀 기준으로 행/열이 추가·삭제됩니다
        </span>
      </div>
    </div>
  );
}
