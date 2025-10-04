"use client";

import React, { useState, useEffect } from "react";
import { Bag } from "@/types";

interface BagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BagFormData) => Promise<void>;
  bag?: Bag | null;
}

interface BagFormData {
  id?: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
}

export function BagFormModal({ isOpen, onClose, onSave, bag }: BagFormModalProps) {
  const [formData, setFormData] = useState<BagFormData>({
    name: "",
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (bag) {
        // 편집 모드
        setFormData({
          id: bag.id,
          name: bag.name,
          width: bag.width,
          height: bag.height,
          depth: bag.depth,
          weight: bag.weight,
        });
      } else {
        // 새로 추가 모드
        setFormData({
          name: "",
          width: 0,
          height: 0,
          depth: 0,
          weight: 0,
        });
      }
    }
  }, [isOpen, bag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const volume = formData.width * formData.height * formData.depth;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{bag ? "가방 수정" : "가방 추가"}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 캐리어, 백팩"
                required
              />
            </div>

            {/* 크기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">크기 (cm) *</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.width || 0}
                  onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="가로"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.height || 0}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="세로"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.depth || 0}
                  onChange={(e) => setFormData({ ...formData, depth: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="높이"
                  required
                />
              </div>
              {volume > 0 && <p className="mt-1 text-sm text-gray-500">용량: {(volume / 1000).toFixed(1)}L</p>}
            </div>

            {/* 무게 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">무게 (g) *</label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.weight || 0}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="무게 (g)"
                required
              />
              {formData.weight > 0 && (
                <p className="mt-1 text-sm text-gray-500">{(formData.weight / 1000).toFixed(2)}kg</p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSaving}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : bag ? "수정" : "추가"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
