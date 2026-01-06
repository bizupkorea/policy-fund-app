const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 정렬 로직 수정
const oldSort = `  // matched 정렬 (트랙 우선순위 → 점수순)
  matched.sort((a, b) => {
    const trackOrder: Record<TrackLabel, number> = { '전용': 1, '정책연계': 2, '일반': 3, '보증': 4 };
    const aTrack = trackOrder[a.track] ?? 99;
    const bTrack = trackOrder[b.track] ?? 99;
    if (aTrack !== bTrack) return aTrack - bTrack;
    return (b._score || 0) - (a._score || 0);
  });`;

const newSort = `  // ★ 4단계 정렬 우선순위
  // 1순위: 특화자금 (exclusive)
  // 2순위: 기업규모 적합도
  // 3순위: 직접대출 우선 (보증 후순위)
  // 4순위: 점수순
  matched.sort((a, b) => {
    // 1) 특화자금(전용) 우선
    if (a.track === '전용' && b.track !== '전용') return -1;
    if (b.track === '전용' && a.track !== '전용') return 1;

    // 2) 기업규모 적합도 (높을수록 우선)
    const aSizeScore = a._sizeScore || 50;
    const bSizeScore = b._sizeScore || 50;
    if (aSizeScore !== bSizeScore) return bSizeScore - aSizeScore;

    // 3) 직접대출 우선 (보증 후순위)
    if (a.track !== '보증' && b.track === '보증') return -1;
    if (b.track !== '보증' && a.track === '보증') return 1;

    // 4) 점수순
    return (b._score || 0) - (a._score || 0);
  });`;

if (content.includes(oldSort)) {
  content = content.replace(oldSort, newSort);
  console.log('✅ 4단계 정렬 로직 적용');
} else {
  console.log('⚠️ 정렬 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
