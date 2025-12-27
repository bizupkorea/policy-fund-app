'use client';

import { useState } from 'react';

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  checked: boolean;
}

interface DocumentChecklistProps {
  programName: string;
  documents: string[];
  onClose: () => void;
}

export function DocumentChecklist({ programName, documents, onClose }: DocumentChecklistProps) {
  // 기본 서류 + 공고문에서 파싱한 서류
  const defaultDocuments = [
    '사업자등록증 사본',
    '재무제표 (최근 2개년)',
    '부가가치세 과세표준증명',
  ];

  const allDocuments = [...new Set([...defaultDocuments, ...documents])];

  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    allDocuments.map((doc, idx) => ({
      id: `doc-${idx}`,
      name: doc,
      checked: false
    }))
  );

  const toggleCheck = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const checkedCount = checklist.filter(item => item.checked).length;
  const progress = Math.round((checkedCount / checklist.length) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-gray-900">서류 체크리스트</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <span className="text-gray-500 text-xl">&times;</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 line-clamp-1">{programName}</p>
        </div>

        {/* 진행률 */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">준비 현황</span>
            <span className="font-medium text-[#1e3a5f]">{checkedCount} / {checklist.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 체크리스트 */}
        <div className="p-5 overflow-y-auto max-h-[400px]">
          <div className="space-y-3">
            {checklist.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  item.checked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleCheck(item.id)}
                  className="w-5 h-5 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                <span className={`flex-1 ${item.checked ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                  {item.name}
                </span>
                {item.checked && (
                  <span className="text-green-500 text-lg">✓</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-5 border-t border-gray-200 bg-gray-50">
          {progress === 100 ? (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-2">모든 서류 준비 완료!</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#1e3a5f] text-white font-medium rounded-lg hover:bg-[#2d4a6f]"
              >
                확인
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              서류 준비가 완료되면 체크해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
