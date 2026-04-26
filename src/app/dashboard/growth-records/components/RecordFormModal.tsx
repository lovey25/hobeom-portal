"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GrowthRecord } from "@/types";

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  editing: GrowthRecord | null;
}

interface FormState {
  date: string;
  heightCm: string;
  weightKg: string;
  memo: string;
}

function todayKst(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().substring(0, 10);
}

const EMPTY: FormState = { date: todayKst(), heightCm: "", weightKg: "", memo: "" };

export function RecordFormModal({ isOpen, onClose, onSaved, token, editing }: RecordFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({
        date: editing.date,
        heightCm: editing.heightCm ? String(editing.heightCm) : "",
        weightKg: editing.weightKg ? String(editing.weightKg) : "",
        memo: editing.memo ?? "",
      });
    } else {
      setForm({ ...EMPTY, date: todayKst() });
    }
    setError(null);
  }, [isOpen, editing]);

  async function handleSubmit() {
    const heightCm = parseFloat(form.heightCm);
    const weightKg = parseFloat(form.weightKg);
    if (!form.date) return setError("측정일을 입력해주세요.");
    if (!Number.isFinite(heightCm) || heightCm <= 0) return setError("키(cm)는 0보다 커야 합니다.");
    if (!Number.isFinite(weightKg) || weightKg <= 0) return setError("몸무게(kg)는 0보다 커야 합니다.");

    setSaving(true);
    setError(null);
    try {
      const url = editing
        ? `/api/growth-records/${editing.rowIndex}`
        : "/api/growth-records";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: form.date,
          heightCm,
          weightKg,
          memo: form.memo,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? "저장에 실패했습니다.");
        return;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/growth-records/${editing.rowIndex}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message ?? "삭제에 실패했습니다.");
        return;
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "성장 기록 수정" : "성장 기록 추가"}
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {editing && (
              <Button variant="danger" onClick={handleDelete} disabled={saving}>
                삭제
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="측정일"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="키 (cm)"
            type="number"
            step="0.1"
            min="0"
            value={form.heightCm}
            onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
          />
          <Input
            label="몸무게 (kg)"
            type="number"
            step="0.1"
            min="0"
            value={form.weightKg}
            onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
          />
        </div>
        <Input
          label="메모"
          type="text"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="(선택) 특이사항"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
