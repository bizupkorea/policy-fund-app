/**
 * 리팩토링 Phase 1: 트랙 차단 완화
 * - exclusive 자격 있어도 general 완전 차단 → 후순위로 변경
 * - blockedTracks 로직 제거 (전용자격 미보유 시 exclusive만 차단 유지)
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. 트랙 결정 로직 수정 - exclusive 자격 있어도 일반 차단 안 함
const oldTrackDecision = `  if (hasExclusiveQualification) {
    // 전용자격 보유 → 일반트랙 차단
    allowedTracks = ['전용', '정책연계', '보증'];
    blockedTracksKorean = ['일반'];

    const qualifications: string[] = [];
    if (profile.isDisabledStandard) qualifications.push('장애인표준사업장');
    if (profile.isDisabled) qualifications.push('장애인기업');
    if (profile.isSocialEnterprise) qualifications.push('사회적기업');
    if (profile.isRestart) qualifications.push('재창업기업');
    if (profile.isFemale) qualifications.push('여성기업');

    trackDecisionWhy = qualifications.join(', ') + ' 자격 보유 → 전용자금 우선, 일반자금 제외';
  } else {
    // 전용자격 미보유 → 전용트랙 차단
    allowedTracks = ['정책연계', '일반', '보증'];
    blockedTracksKorean = ['전용'];
    trackDecisionWhy = '전용자격 미보유 → 전용자금 신청 불가';
  }`;

const newTrackDecision = `  if (hasExclusiveQualification) {
    // 전용자격 보유 → 전용자금 우선 (일반자금도 후순위로 포함)
    allowedTracks = ['전용', '정책연계', '일반', '보증'];
    blockedTracksKorean = []; // 차단 없음, 정렬 우선순위로 처리

    const qualifications: string[] = [];
    if (profile.isDisabledStandard) qualifications.push('장애인표준사업장');
    if (profile.isDisabled) qualifications.push('장애인기업');
    if (profile.isSocialEnterprise) qualifications.push('사회적기업');
    if (profile.isRestart) qualifications.push('재창업기업');
    if (profile.isFemale) qualifications.push('여성기업');

    trackDecisionWhy = qualifications.join(', ') + ' 자격 보유 → 전용자금 우선 추천';
  } else {
    // 전용자격 미보유 → 전용트랙 차단 (신청 불가)
    allowedTracks = ['정책연계', '일반', '보증'];
    blockedTracksKorean = ['전용'];
    trackDecisionWhy = '전용자격 미보유 → 전용자금 신청 불가';
  }`;

if (content.includes(oldTrackDecision)) {
  content = content.replace(oldTrackDecision, newTrackDecision);
  console.log('✅ Phase 1-1: 트랙 결정 로직 수정 완료');
} else {
  console.log('⚠️ 트랙 결정 패턴 찾을 수 없음');
}

// 2. blockedTracks 변수 수정 - exclusive 자격 시 차단 없음
const oldBlockedTracks = `  // 내부용 차단 트랙 리스트 (영문)
  const blockedTracks = hasExclusiveQualification ? ['general'] : ['exclusive'];`;

const newBlockedTracks = `  // 내부용 차단 트랙 리스트 (영문)
  // 전용자격 보유 시: 차단 없음 (정렬 우선순위로 처리)
  // 전용자격 미보유 시: exclusive만 차단 (신청 불가)
  const blockedTracks = hasExclusiveQualification ? [] : ['exclusive'];`;

if (content.includes(oldBlockedTracks)) {
  content = content.replace(oldBlockedTracks, newBlockedTracks);
  console.log('✅ Phase 1-2: blockedTracks 수정 완료');
} else {
  console.log('⚠️ blockedTracks 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Phase 1 완료: 트랙 차단 완화');
