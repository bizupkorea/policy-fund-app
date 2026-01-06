const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `  // 순위 이유 추가 (why_ranked_here)
  limitedMatched.forEach((fund, index) => {
    const rank = index + 1;
    if (!fund.why_ranked_here) {
      fund.why_ranked_here = generateRankReason(rank,
        fund.track === '전용' ? 'exclusive' :
        fund.track === '정책연계' ? 'policy_linked' :
        fund.track === '보증' ? 'guarantee' : 'general',
        fund.program_name);
    }
  });`;

const newCode = `  // 순위 이유 추가 (why_ranked_here) - 정렬 후 순위에 맞게 업데이트
  // 3순위 이후는 "왜 1·2순위가 아닌지"를 전제로 추천됨
  limitedMatched.forEach((fund, index) => {
    const rank = index + 1;
    const trackCode = fund.track === '전용' ? 'exclusive' :
      fund.track === '정책연계' ? 'policy_linked' :
      fund.track === '보증' ? 'guarantee' : 'general';
    // 순위에 맞는 이유 생성 (기존 값 무시하고 순위 기반으로 재생성)
    fund.why_ranked_here = generateRankReason(rank, trackCode, fund.program_name);
  });`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('why_ranked_here 업데이트 완료!');
} else {
  console.log('패턴을 찾을 수 없습니다. 대체 방법 시도...');

  // 라인 기반 교체
  const lines = content.split('\n');
  let startIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// 순위 이유 추가 (why_ranked_here)')) {
      startIdx = i;
      break;
    }
  }

  if (startIdx >= 0) {
    // 기존 블록 찾기 (});로 끝나는 라인까지)
    let endIdx = startIdx;
    for (let i = startIdx; i < lines.length; i++) {
      if (lines[i].trim() === '});') {
        endIdx = i;
        break;
      }
    }

    console.log('발견: 라인', startIdx + 1, '~', endIdx + 1);

    const newLines = newCode.split('\n');
    lines.splice(startIdx, endIdx - startIdx + 1, ...newLines);

    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('라인 기반 교체 완료!');
  }
}
