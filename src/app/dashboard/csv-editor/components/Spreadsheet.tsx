"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
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
  const [headers] = useState<string[]>(initialHeaders);
  const [data, setData] = useState<Record<string, any>[]>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // 컬럼 폭 상태 (각 컬럼의 최소 폭으로 초기화)
  const [columnWidths, setColumnWidths] = useState<number[]>(
    () => headers.map(() => 100) // 기본 최소 폭 100px
  );
  const [resizingCol, setResizingCol] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // 정렬 상태: { columnIndex: 'asc' | 'desc' | null }
  const [sortState, setSortState] = useState<{ col: number; direction: "asc" | "desc" } | null>(null);

  // 편집 모드 진입 시 input에 포커스
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // 단일 클릭: 셀 선택
  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell(null); // 편집 모드 해제
  };

  // 더블 클릭: 편집 모드 진입
  const handleCellDoubleClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(data[row][headers[col]] || "");
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

  // 편집 모드에서 키보드 이벤트
  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCellBlur();

      if (selectedCell) {
        if (e.shiftKey) {
          // Shift+Enter: 위로 이동
          if (selectedCell.row > 0) {
            const nextRow = selectedCell.row - 1;
            const nextCol = selectedCell.col;
            setSelectedCell({ row: nextRow, col: nextCol });
            setEditingCell({ row: nextRow, col: nextCol });
            setEditValue(data[nextRow][headers[nextCol]] || "");
          }
        } else {
          // Enter: 아래로 이동
          if (selectedCell.row < data.length - 1) {
            const nextRow = selectedCell.row + 1;
            const nextCol = selectedCell.col;
            setSelectedCell({ row: nextRow, col: nextCol });
            setEditingCell({ row: nextRow, col: nextCol });
            setEditValue(data[nextRow][headers[nextCol]] || "");
          }
        }
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleCellBlur();

      if (selectedCell) {
        if (e.shiftKey) {
          // Shift+Tab: 왼쪽으로 이동
          if (selectedCell.col > 0) {
            const nextCol = selectedCell.col - 1;
            const nextRow = selectedCell.row;
            setSelectedCell({ row: nextRow, col: nextCol });
            setEditingCell({ row: nextRow, col: nextCol });
            setEditValue(data[nextRow][headers[nextCol]] || "");
          } else if (selectedCell.row > 0) {
            // 첫 열이면 이전 행의 마지막 열로
            const nextCol = headers.length - 1;
            const nextRow = selectedCell.row - 1;
            setSelectedCell({ row: nextRow, col: nextCol });
            setEditingCell({ row: nextRow, col: nextCol });
            setEditValue(data[nextRow][headers[nextCol]] || "");
          }
        } else {
          // Tab: 오른쪽으로 이동
          if (selectedCell.col < headers.length - 1) {
            const nextCol = selectedCell.col + 1;
            const nextRow = selectedCell.row;
            setSelectedCell({ row: nextRow, col: nextCol });
            setEditingCell({ row: nextRow, col: nextCol });
            setEditValue(data[nextRow][headers[nextCol]] || "");
          } else if (selectedCell.row < data.length - 1) {
            // 마지막 열이면 다음 행의 첫 열로
            const nextCol = 0;
            const nextRow = selectedCell.row + 1;
            setSelectedCell({ row: nextRow, col: nextCol });
            setEditingCell({ row: nextRow, col: nextCol });
            setEditValue(data[nextRow][headers[nextCol]] || "");
          }
        }
      }
    }
  };

  // 선택 모드에서 키보드 이벤트
  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectedCell || editingCell) return;

    const { row, col } = selectedCell;

    if (e.key === "Enter") {
      e.preventDefault();
      // 편집 모드로 진입
      setEditingCell({ row, col });
      setEditValue(data[row][headers[col]] || "");
    } else if (e.key === "ArrowUp" && row > 0) {
      e.preventDefault();
      setSelectedCell({ row: row - 1, col });
    } else if (e.key === "ArrowDown" && row < data.length - 1) {
      e.preventDefault();
      setSelectedCell({ row: row + 1, col });
    } else if (e.key === "ArrowLeft" && col > 0) {
      e.preventDefault();
      setSelectedCell({ row, col: col - 1 });
    } else if (e.key === "ArrowRight" && col < headers.length - 1) {
      e.preventDefault();
      setSelectedCell({ row, col: col + 1 });
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

  // 컬럼 정렬 기능
  const handleSort = (colIndex: number) => {
    const header = headers[colIndex];
    let newDirection: "asc" | "desc" = "asc";

    // 같은 컬럼 클릭 시 방향 전환
    if (sortState?.col === colIndex) {
      newDirection = sortState.direction === "asc" ? "desc" : "asc";
    }

    const sortedData = [...data].sort((a, b) => {
      const aVal = String(a[header] || "");
      const bVal = String(b[header] || "");

      // 숫자인지 확인
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      const isNumeric = !isNaN(aNum) && !isNaN(bNum);

      if (isNumeric) {
        return newDirection === "asc" ? aNum - bNum : bNum - aNum;
      } else {
        return newDirection === "asc" ? aVal.localeCompare(bVal, "ko") : bVal.localeCompare(aVal, "ko");
      }
    });

    setData(sortedData);
    setSortState({ col: colIndex, direction: newDirection });
    setSelectedCell(null);
    setEditingCell(null);
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

      <div
        className="overflow-auto max-h-[calc(100vh-250px)] border border-gray-200 rounded-lg bg-white"
        ref={tableRef}
        tabIndex={0}
        onKeyDown={handleTableKeyDown}
      >
        <table className="border-collapse text-sm" style={{ tableLayout: "fixed" }}>
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="border border-gray-300 px-2 py-1 text-center text-gray-900" style={{ width: "50px" }}>
                #
              </th>
              {headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 relative cursor-pointer hover:bg-gray-200 transition-colors"
                  style={{ width: `${columnWidths[colIndex]}px` }}
                  onClick={() => handleSort(colIndex)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{header}</span>
                    {/* 정렬 표시 */}
                    {sortState?.col === colIndex && (
                      <span className="text-blue-600 font-bold">{sortState.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                    {/* 리사이즈 핸들 */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 hover:w-1.5 transition-all z-10"
                      onMouseDown={(e) => handleResizeStart(e, colIndex)}
                      onClick={(e) => e.stopPropagation()}
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
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleEditKeyDown}
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
      </div>

      <div className="text-sm text-gray-700">
        <p>
          💡 팁: 클릭=선택 | 더블클릭=편집 | 방향키=이동 | Enter=편집시작 | Tab/Enter로 셀이동 | Shift+Tab/Enter로
          역방향 | 헤더 클릭=정렬
        </p>
        <p className="font-medium">
          현재 행: {data.length}개 | 헤더: {headers.join(", ")}
        </p>
      </div>
    </div>
  );
}
