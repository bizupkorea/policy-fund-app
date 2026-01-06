const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// why_ranked_here → why, label 재설정 추가
const oldRankUpdate = `  // 순위 이유 추가 (why_ranked_here) - 정렬 후 순위에 맞게 업데이트
  // 3순위 이후는 "왜 1·2순위가 아닌지"를 전제로 추천됨
  limitedMatched.forEach((fund, index) => {
    const rank = index + 1;
    const trackCode = fund.track === '전용' ? 'exclusive' :
      fund.track === '정책연계' ? 'policy_linked' :
      fund.track === '보증' ? 'guarantee' : 'general';
    // 순위에 맞는 이유 생성 (기존 값 무시하고 순위 기반으로 재생성)
    fund.why_ranked_here = generateRankReason(rank, trackCode, fund.program_name);
  });`;

const newRankUpdate = `  // v8: 순위 기반 why, label 재설정
  // 3순위 이후는 "왜 1·2순위가 아닌지"를 전제로 추천됨
  limitedMatched.forEach((fund, index) => {
    const rank = index + 1;
    const trackCode = fund.track === '전용' ? 'exclusive' :
      fund.track === '정책연계' ? 'policy_linked' :
      fund.track === '보증' ? 'guarantee' : 'general';
    // 순위에 맞는 이유 생성
    fund.why = generateRankReason(rank, trackCode, fund.program_name);
    // 순위에 맞는 label 재설정
    fund.label = generateLabel(rank, trackCode, fund.track);
  });`;

if (content.includes(oldRankUpdate)) {
  content = content.replace(oldRankUpdate, newRankUpdate);
  console.log('✅ 순위 업데이트 로직 수정 완료');
} else {
  console.log('⚠️ 순위 업데이트 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ 패치 완료!');
