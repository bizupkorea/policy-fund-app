const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/matching-engine.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. MatchedFund 인터페이스에서 confidence를 optional로 변경 (exclusive는 confidence 없음)
const oldInterface = `export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence: 'HIGH' | 'MEDIUM';
  why: string;
  hard_rules_passed: string[];
  _score?: number; // 내부 정렬용 (JSON 출력 시 삭제)
}`;

const newInterface = `export interface MatchedFund {
  program_name: string;
  agency: string;
  track: TrackLabel;
  label: '전용·우선' | '유력' | '대안' | '플랜B';
  confidence?: 'HIGH' | 'MEDIUM'; // exclusive는 점수 계산 대상 아님 → confidence 없음
  why: string;
  hard_rules_passed: string[];
  _score?: number; // 내부 정렬용 (JSON 출력 시 삭제)
}`;

if (content.includes(oldInterface)) {
  content = content.replace(oldInterface, newInterface);
  console.log('✅ MatchedFund 인터페이스 수정 (confidence optional)');
} else {
  console.log('⚠️ MatchedFund 인터페이스 패턴 찾을 수 없음');
}

// 2. 순위 기반 처리에서 exclusive는 confidence 제거
const oldRankUpdate = `  // v8: 순위 기반 why, label 재설정
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

const newRankUpdate = `  // v8: 순위 기반 why, label 재설정
  // exclusive는 점수 계산 대상 아님 → confidence 제거, 상단 고정
  // 3순위 이후는 "왜 1·2순위가 아닌지"를 전제로 추천됨
  limitedMatched.forEach((fund, index) => {
    const rank = index + 1;
    const trackCode = fund.track === '전용' ? 'exclusive' :
      fund.track === '정책연계' ? 'policy_linked' :
      fund.track === '보증' ? 'guarantee' : 'general';

    // exclusive 트랙: confidence 제거 (점수 계산 대상 아님)
    if (trackCode === 'exclusive') {
      delete fund.confidence;
      fund.label = '전용·우선';
      fund.why = \`\${fund.program_name}은(는) 귀사의 전용자격에 해당하는 우선 검토 자금입니다.\`;
    } else {
      // 비-exclusive: 순위에 맞는 이유 및 label 생성
      fund.why = generateRankReason(rank, trackCode, fund.program_name);
      fund.label = generateLabel(rank, trackCode, fund.track);
    }
  });`;

if (content.includes(oldRankUpdate)) {
  content = content.replace(oldRankUpdate, newRankUpdate);
  console.log('✅ 순위 처리 로직 수정 (exclusive confidence 제거)');
} else {
  console.log('⚠️ 순위 처리 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ exclusive 규칙 패치 완료!');
