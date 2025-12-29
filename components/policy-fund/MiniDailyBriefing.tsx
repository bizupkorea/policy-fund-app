'use client';

import { useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import type { PolicyFundProgram } from '@/lib/types/policy-fund';

interface MiniDailyBriefingProps {
  onViewAll?: () => void;
}

export function MiniDailyBriefing({ onViewAll }: MiniDailyBriefingProps) {
  const [newPrograms, setNewPrograms] = useState<PolicyFundProgram[]>([]);
  const [deadlineSoonPrograms, setDeadlineSoonPrograms] = useState<Array<PolicyFundProgram & { daysLeft: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const formattedDate = `${today.getMonth() + 1}월 ${today.getDate()}일(${dayNames[today.getDay()]})`;

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const response = await fetch('/api/policy-fund/daily');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setNewPrograms(result.data.newPrograms);
            setDeadlineSoonPrograms(result.data.deadlineSoonPrograms);
          }
        }
      } catch (error) {
        console.error('미니 브리핑 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBriefing();
  }, []);

  const handleProgramClick = (program: PolicyFundProgram) => {
    if (program.detailUrl) {
      window.open(program.detailUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-white" />
          <div>
            <h3 className="text-sm font-bold text-white">오늘의 정책자금</h3>
            <p className="text-orange-100 text-xs">{formattedDate}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 신규 공고 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-gray-700">신규 공고</span>
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">
              {newPrograms.length}건
            </span>
          </div>

          {newPrograms.length > 0 ? (
            <div className="space-y-1.5">
              {newPrograms.slice(0, 3).map((program) => (
                <div
                  key={program.id}
                  onClick={() => handleProgramClick(program)}
                  className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors group"
                >
                  <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded flex-shrink-0">
                    NEW
                  </span>
                  <p className="text-xs text-gray-700 truncate flex-1 group-hover:text-orange-600">
                    {program.name}
                  </p>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-orange-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">신규 공고 없음</p>
          )}
        </div>

        {/* 마감 임박 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-bold text-gray-700">마감 임박</span>
            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
              {deadlineSoonPrograms.length}건
            </span>
          </div>

          {deadlineSoonPrograms.length > 0 ? (
            <div className="space-y-1.5">
              {deadlineSoonPrograms.slice(0, 3).map((program) => (
                <div
                  key={program.id}
                  onClick={() => handleProgramClick(program)}
                  className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors group"
                >
                  <span
                    className={`px-1.5 py-0.5 text-white text-[10px] font-bold rounded flex-shrink-0 ${
                      program.daysLeft <= 3 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  >
                    D-{program.daysLeft}
                  </span>
                  <p className="text-xs text-gray-700 truncate flex-1 group-hover:text-red-600">
                    {program.name}
                  </p>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-red-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">마감 임박 공고 없음</p>
          )}
        </div>

        {/* 전체 보기 버튼 */}
        <button
          onClick={onViewAll}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          전체 공고 보기
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
