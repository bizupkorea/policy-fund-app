const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// 정렬 로직 시작 라인 찾기
let sortStart = -1;
let sortEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// matched 정렬 (트랙 우선순위 → 점수순)')) {
    sortStart = i;
  }
  if (sortStart > 0 && lines[i].trim() === '});' && i > sortStart) {
    sortEnd = i;
    break;
  }
}

if (sortStart >= 0 && sortEnd > sortStart) {
  console.log(`정렬 로직: 라인 ${sortStart + 1} ~ ${sortEnd + 1}`);

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

  const newLines = newSort.split('\n');
  lines.splice(sortStart, sortEnd - sortStart + 1, ...newLines);
  console.log('✅ 4단계 정렬 로직 적용');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
