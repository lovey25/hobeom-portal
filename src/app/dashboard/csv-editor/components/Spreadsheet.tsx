"use client";

import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface SpreadsheetProps {
  filename: string;
  headers: string[];
  data: Record<string, any>[];
  onSave: (headers: string[], data: Record<string, any>[]) => void;
  onCancel: () => void;
}

export function Spreadsheet({
  headers: initialHeaders,
  data: initialData,
  onSave,
  onCancel,
  filename,
}: SpreadsheetProps) {
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [data, setData] = useState<Record<string, any>[]>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 컬럼 폭 상태 (각 컬럼의 최소 폭으로 초기화)
  const [columnWidths, setColumnWidths] = useState<number[]>(
    () => headers.map(() => 100) // 기본 최소 폭 100px
  );
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    const value = data[row][headers[col]] || "";
    setEditingCell({ row, col });
    setEditValue(value);
  };

  const handleCellChange = (value: string) => {
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const newData = [...data];
      newData[editingCell.row][headers[editingCell.col]] = editValue;
      setData(newData);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCellBlur();

      // 다음 행으로 이동
      if (selectedCell && selectedCell.row < data.length - 1) {
        const nextRow = selectedCell.row + 1;
        const nextCol = selectedCell.col;
        setSelectedCell({ row: nextRow, col: nextCol });
        setEditingCell({ row: nextRow, col: nextCol });
        setEditValue(data[nextRow][headers[nextCol]] || "");
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleCellBlur();

      // 다음 열로 이동
      if (selectedCell) {
        const nextCol = selectedCell.col < headers.length - 1 ? selectedCell.col + 1 : 0;
        const nextRow = nextCol === 0 && selectedCell.row < data.length - 1 ? selectedCell.row + 1 : selectedCell.row;

        if (nextRow < data.length) {
          setSelectedCell({ row: nextRow, col: nextCol });
          setEditingCell({ row: nextRow, col: nextCol });
          setEditValue(data[nextRow][headers[nextCol]] || "");
        }
      }
    }
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    headers.forEach((header) => {
      newRow[header] = "";
    });
    setData([...data, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (confirm(`${rowIndex + 1}번 행을 삭제하시겠습니까?`)) {
      const newData = data.filter((_, index) => index !== rowIndex);
      setData(newData);
      setSelectedCell(null);
      setEditingCell(null);
    }
  };

  const handleSave = () => {
    onSave(headers, data);
  };

  // 컬럼 리사이즈 시작
  const handleResizeStart = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colIndex);
    setStartX(e.clientX);
    setStartWidth(columnWidths[colIndex]);
  };

  // 컬럼 리사이즈 중
  const handleResizeMove = (e: MouseEvent) => {
    if (resizingCol === null) return;

    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // 최소 50px

    const newWidths = [...columnWidths];
    newWidths[resizingCol] = newWidth;
    setColumnWidths(newWidths);
  };

  // 컬럼 리사이즈 종료
  const handleResizeEnd = () => {
    setResizingCol(null);
  };

  // 리사이즈 이벤트 리스너 등록
  useEffect(() => {
    if (resizingCol !== null) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizingCol, startX, startWidth]);

  return (
    <div className="space-y-4">
      {/* 툴바: 파일명 + 버튼들 */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-lg font-semibold text-gray-900">
            📝 <code className="text-blue-600">{filename}</code>
          </h2>
          <div className="flex gap-2">
            <Button onClick={handleAddRow} size="sm">
              + 행 추가
            </Button>
            <Button
              onClick={() => selectedCell && handleDeleteRow(selectedCell.row)}
              size="sm"
              className="bg-red-500 hover:bg-red-600"
              disabled={selectedCell === null}
            >
              - 선택 행 삭제
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} size="sm" className="bg-gray-500 hover:bg-gray-600">
            취소
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-green-500 hover:bg-green-600">
            저장
          </Button>
        </div>
      </div>

      <Card className="overflow-auto max-h-[calc(100vh-250px)]">
        <table className="border-collapse text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="border border-gray-300 px-2 py-1 text-center text-gray-900" style={{ width: "50px" }}>
                #
              </th>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 relative"
                  style={{ width: `${columnWidths[colIndex]}px` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{header}</span>
                    {/* 리사이즈 핸들 */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all"
                      onMouseDown={(e) => handleResizeStart(e, colIndex)}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={selectedCell?.row === rowIndex ? "bg-blue-50" : ""}>
                <td
                  className="border border-gray-300 px-2 py-1 text-center text-gray-700 font-medium"
                  style={{ width: "50px" }}
                >
                  {rowIndex + 1}
                </td>
                {headers.map((header, colIndex) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

                  return (
                    <td
                      key={colIndex}
                      className={`border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-900 ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                      }`}
                      style={{ width: `${columnWidths[colIndex]}px` }}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 border border-blue-500 rounded focus:outline-none text-gray-900"
                        />
                      ) : (
                        <span className="block truncate">{row[header] || ""}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="text-sm text-gray-700">
        <p>💡 팁: 셀 클릭으로 편집 | Enter로 아래 행 | Tab으로 다음 열 | ESC로 취소 | 컬럼 경계를 드래그하여 폭 조절</p>
        <p className="font-medium">
          현재 행: {data.length}개 | 헤더: {headers.join(", ")}
        </p>
      </div>
    </div>
  );
}
