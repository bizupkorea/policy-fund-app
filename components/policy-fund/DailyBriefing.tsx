'use client';

import { useState, useEffect } from 'react';
import { Calendar, Bell, Clock, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import type { PolicyFundProgram } from '@/lib/types/policy-fund';

interface DailyBriefingProps {
  newPrograms: PolicyFundProgram[];
  deadlineSoonPrograms: Array<PolicyFundProgram & { daysLeft: number }>;
  onProgramClick?: (program: PolicyFundProgram) => void;
}

export function DailyBriefing({
  newPrograms,
  deadlineSoonPrograms,
  onProgramClick,
}: DailyBriefingProps) {
  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const formattedDate = `${today.getMonth() + 1}월 ${today.getDate()}일(${dayNames[today.getDay()]})`;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">오늘의 정책자금</h2>
              <p className="text-orange-100 text-sm">{formattedDate} 업데이트</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
              총 {newPrograms.length + deadlineSoonPrograms.length}건
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 신규 공고 섹션 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">오늘 새로 올라온 공고</h3>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
              {newPrograms.length}건
            </span>
          </div>

          {newPrograms.length > 0 ? (
            <div className="space-y-2">
              {newPrograms.slice(0, 3).map((program) => (
                <div
                  key={program.id}
                  onClick={() => onProgramClick?.(program)}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                      신규
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-orange-600 line-clamp-1">
                        {program.name}
                      </p>
                      <p className="text-xs text-gray-500">{program.executingAgency}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
              오늘 등록된 신규 공고가 없습니다
            </div>
          )}
        </div>

        {/* 마감 임박 섹션 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-900">마감 임박</h3>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
              {deadlineSoonPrograms.length}건
            </span>
          </div>

          {deadlineSoonPrograms.length > 0 ? (
            <div className="space-y-2">
              {deadlineSoonPrograms.slice(0, 3).map((program) => (
                <div
                  key={program.id}
                  onClick={() => onProgramClick?.(program)}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-white text-xs font-bold rounded ${
                        program.daysLeft <= 3 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    >
                      D-{program.daysLeft}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-red-600 line-clamp-1">
                        {program.name}
                      </p>
                      <p className="text-xs text-gray-500">{program.applicationPeriod}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 text-sm">
              7일 이내 마감 예정인 공고가 없습니다
            </div>
          )}
        </div>

        {/* 전체 보기 버튼 */}
        <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
          전체 공고 보기
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
