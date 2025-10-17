"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { Spreadsheet } from "./components/Spreadsheet";

interface CSVFile {
  name: string;
  size: number;
  modified: string;
}

interface CSVData {
  filename: string;
  headers: string[];
  rows: Record<string, any>[];
  raw: string;
}

export default function CSVEditorPage() {
  const { user } = useAuth();
  const { setPageTitle } = usePageTitle();
  const [files, setFiles] = useState<CSVFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPageTitle("CSV 편집기", "데이터 파일을 직접 편집할 수 있습니다");
  }, [setPageTitle]);

  // CSV 파일 목록 로드
  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      const response = await fetch("/api/csv-editor", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setFiles(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("파일 목록을 불러오는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 특정 CSV 파일 로드
  const loadCSVFile = async (filename: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      const response = await fetch(`/api/csv-editor/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setCsvData(result.data);
        setSelectedFile(filename);
        setIsEditing(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("파일을 불러오는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // CSV 파일 저장
  const saveCSVFile = async (headers: string[], rows: Record<string, any>[]) => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("hobeom-portal-token="))
        ?.split("=")[1];

      const response = await fetch(`/api/csv-editor/${selectedFile}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ headers, rows }),
      });

      const result = await response.json();

      if (result.success) {
        alert("파일이 저장되었습니다.");
        setIsEditing(false);
        setCsvData(null);
        setSelectedFile(null);
        loadFiles(); // 목록 새로고침
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("파일을 저장하는 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("편집을 취소하시겠습니까? 저장되지 않은 변경사항은 손실됩니다.")) {
      setIsEditing(false);
      setCsvData(null);
      setSelectedFile(null);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto px-6 py-8 max-w-[1800px]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 font-medium">
              ⚠️ {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!isEditing && !isLoading && (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">CSV 파일 목록</h2>
                  <Button onClick={loadFiles} size="sm">
                    🔄 새로고침
                  </Button>
                </div>

                {files.length === 0 ? (
                  <p className="text-gray-700 text-center py-8 font-medium">CSV 파일이 없습니다.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">파일명</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">크기</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900">최종 수정</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {files.map((file) => (
                          <tr
                            key={file.name}
                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => loadCSVFile(file.name)}
                          >
                            <td className="px-4 py-3">
                              <code className="text-blue-600 font-semibold hover:underline">{file.name}</code>
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-medium">{(file.size / 1024).toFixed(2)} KB</td>
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              {new Date(file.modified).toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {isEditing && csvData && (
            <Spreadsheet
              filename={csvData.filename}
              headers={csvData.headers}
              data={csvData.rows}
              onSave={saveCSVFile}
              onCancel={handleCancel}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
