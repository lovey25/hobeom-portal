import React, { useState, useEffect } from "react";
import { TravelItem } from "@/types";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ItemFormData) => Promise<void>;
  item?: TravelItem | null;
  categories: string[];
}

export interface ItemFormData {
  id?: string;
  name: string;
  category: string;
  importance: number;
  width: number;
  height: number;
  depth: number;
  weight: number;
}

export function ItemFormModal({ isOpen, onClose, onSave, item, categories }: ItemFormModalProps) {
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    category: "",
    importance: 3,
    width: 0,
    height: 0,
    depth: 0,
    weight: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id,
        name: item.name,
        category: item.category,
        importance: item.importance,
        width: item.width,
        height: item.height,
        depth: item.depth,
        weight: item.weight,
      });
    } else {
      setFormData({
        name: "",
        category: categories.length > 0 ? categories[0] : "",
        importance: 3,
        width: 0,
        height: 0,
        depth: 0,
        weight: 0,
      });
    }
  }, [item, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 새 카테고리가 있으면 해당 카테고리 사용
      const finalCategory = newCategory.trim() || formData.category;
      await onSave({ ...formData, category: finalCategory });
      onClose();
    } catch (error) {
      console.error("아이템 저장 실패:", error);
      alert("아이템 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{item ? "준비물 수정" : "준비물 추가"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl" disabled={isSaving}>
            ×
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 여권, 칫솔, 충전기"
              required
            />
          </div>

          {/* 분류 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              분류 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!newCategory}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="새 분류 입력"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">기존 분류 선택 또는 새 분류 입력</p>
          </div>

          {/* 중요도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              중요도 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.importance}
              onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="5">5 - 매우중요 (필수)</option>
              <option value="4">4 - 중요</option>
              <option value="3">3 - 보통</option>
              <option value="2">2 - 낮음</option>
              <option value="1">1 - 선택</option>
            </select>
          </div>

          {/* 크기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              크기 (cm) <span className="text-red-500">*</span>
            </label>
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
          </div>

          {/* 무게 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              무게 (g) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.weight || 0}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="무게 (g)"
              required
            />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "저장 중..." : item ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
