/**
 * semas-micro-enterprise 자금에 targetScale 설정
 * 소공인 전용 자금 → micro만 신청 가능
 */

const fs = require('fs');

const filePath = 'E:/biznova/policy-fund-app/lib/policy-fund/knowledge-base.ts';
let content = fs.readFileSync(filePath, 'utf8');

// semas-micro-enterprise 자금에 targetScale 추가
const oldPattern = `    id: 'semas-micro-enterprise',
    institutionId: 'semas',
    track: 'general',
    name: '소공인특화자금',`;

const newPattern = `    id: 'semas-micro-enterprise',
    institutionId: 'semas',
    track: 'general',
    name: '소공인특화자금',

    // ★ 소공인 전용 (하드컷)
    targetScale: ['micro'],`;

if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  console.log('✅ semas-micro-enterprise에 targetScale: ["micro"] 추가 완료');
} else {
  console.log('⚠️ 패턴 찾을 수 없음');
}

fs.writeFileSync(filePath, content, 'utf8');
