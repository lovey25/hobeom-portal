"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Card } from "@/components/ui/Card";
import { cookieUtils } from "@/lib/cookies";
import { ChildProfile, GrowthRecord } from "@/types";
import { layout, text, state, cn } from "@/styles/design-system";
import { GrowthHeader } from "./components/GrowthHeader";
import { GrowthChart } from "./components/GrowthChart";
import { RecordsTable } from "./components/RecordsTable";
import { RecordFormModal } from "./components/RecordFormModal";

export default function GrowthRecordsPage() {
  const { setPageTitle } = usePageTitle();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GrowthRecord | null>(null);
  const [token, setToken] = useState("");
  const [tableOpen, setTableOpen] = useState(false);

  useEffect(() => {
    setPageTitle("성장 기록 관리", "소중한 아이의 성장을 체계적으로 관리하세요");
  }, [setPageTitle]);

  const loadAll = useCallback(async () => {
    const t = cookieUtils.getToken() ?? "";
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${t}` };
      const [profileRes, recordsRes] = await Promise.all([
        fetch("/api/growth-records/profile", { headers }),
        fetch("/api/growth-records", { headers }),
      ]);
      const profileData = await profileRes.json();
      const recordsData = await recordsRes.json();

      if (!profileRes.ok || !profileData.success) {
        throw new Error(profileData.message ?? "자녀 프로필을 불러오지 못했습니다.");
      }
      if (!recordsRes.ok || !recordsData.success) {
        throw new Error(recordsData.message ?? "성장 기록을 불러오지 못했습니다.");
      }

      setProfile(profileData.data ?? null);
      setRecords(Array.isArray(recordsData.data) ? recordsData.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddRecord = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEditRecord = (record: GrowthRecord) => {
    setEditing(record);
    setModalOpen(true);
  };

  return (
    <ProtectedRoute>
      <div className={layout.page}>
        <main className={cn(layout.container, layout.section)}>
          <GrowthHeader profile={profile} onAddRecord={handleAddRecord} />

          {loading && <p className={state.loading}>불러오는 중...</p>}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className={state.error}>⚠️ {error}</p>
              <p className="mt-1 text-xs text-red-600">
                Google Sheets 연동 환경변수와 시트 공유 권한을 확인해주세요.
              </p>
            </Card>
          )}

          {!loading && !error && (
            <>
              <Card>
                <h2 className={text.cardTitle}>📈 성장 그래프</h2>
                <GrowthChart profile={profile} records={records} />
              </Card>

              <Card>
                <button
                  type="button"
                  onClick={() => setTableOpen((v) => !v)}
                  aria-expanded={tableOpen}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h2 className="text-lg font-bold text-gray-900">
                    📋 최근 기록
                    <span className="ml-2 text-sm font-normal text-gray-600">({records.length}건)</span>
                  </h2>
                  <span className="text-sm text-gray-500" aria-hidden>
                    {tableOpen ? "접기 ▲" : "펼치기 ▼"}
                  </span>
                </button>
                {tableOpen && (
                  <div className="mt-4">
                    <RecordsTable records={records} onEdit={handleEditRecord} />
                  </div>
                )}
              </Card>
            </>
          )}

          <RecordFormModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSaved={loadAll}
            token={token}
            editing={editing}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}
