// 3개 기관 크롤링 테스트
const https = require('https');

const sites = [
  // 소진공 - 다양한 URL 시도
  {
    name: '소진공 메인',
    url: 'https://www.semas.or.kr/web/main/index.kmdc',
  },
  {
    name: '소진공 정책자금',
    url: 'https://www.semas.or.kr/web/SUP01/SUP0101/SUP010101.kmdc',
  },
  // 신보 - 다양한 URL 시도
  {
    name: '신보 메인',
    url: 'https://www.kodit.co.kr/index.do',
  },
  {
    name: '신보 공지사항',
    url: 'https://www.kodit.co.kr/kodit/cm/selectBbsList.do?menuNo=1141',
  },
  // 기보 - 다양한 URL 시도
  {
    name: '기보 메인',
    url: 'https://www.kibo.or.kr/main/index.do',
  },
  {
    name: '기보 공지사항',
    url: 'https://www.kibo.or.kr/nw/bbs/bbsList.do',
  },
];

async function testCrawl(site) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    };

    const startTime = Date.now();

    https.get(site.url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const elapsed = Date.now() - startTime;
        console.log(`\n=== ${site.name} ===`);
        console.log(`URL: ${site.url}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response Time: ${elapsed}ms`);
        console.log(`Content Length: ${data.length} bytes`);

        // 봇 차단 여부 확인 (robots 메타태그는 제외)
        const isBlocked =
          data.includes('captcha') ||
          data.includes('CAPTCHA') ||
          data.includes('차단') ||
          data.includes('접근이 거부') ||
          data.includes('Access Denied') ||
          data.includes('Bot detected') ||
          data.includes('봇 감지') ||
          res.statusCode === 403;

        // JavaScript 렌더링 필요 여부
        const needsJS =
          data.includes('document.location') ||
          data.includes('location.href') ||
          (data.length < 1000 && data.includes('<script'));

        // 404 여부
        const is404 =
          res.statusCode === 404 ||
          data.includes('페이지를 찾을 수 없') ||
          data.includes('404');

        // 데이터 유무
        const hasData =
          data.includes('<table') ||
          data.includes('<ul') ||
          data.includes('공지') ||
          data.includes('게시판');

        console.log(`\n[분석 결과]`);
        console.log(`- 봇 차단: ${isBlocked ? '⚠️ YES' : '✅ NO'}`);
        console.log(`- JS 렌더링 필요: ${needsJS ? '⚠️ YES' : '✅ NO'}`);
        console.log(`- 404 에러: ${is404 ? '❌ YES' : '✅ NO'}`);
        console.log(`- 데이터 존재: ${hasData ? '✅ YES' : '⚠️ NO'}`);

        // 크롤링 가능성 판단
        let crawlable = '✅ 가능';
        if (isBlocked) crawlable = '❌ 불가 (봇 차단)';
        else if (is404) crawlable = '❌ 불가 (404)';
        else if (needsJS) crawlable = '⚠️ 어려움 (JS 렌더링 필요)';
        else if (!hasData) crawlable = '⚠️ 확인 필요 (데이터 미확인)';

        console.log(`\n🎯 크롤링 가능성: ${crawlable}`);

        // 실제 데이터 패턴 확인
        const hasList = data.includes('<li') || data.includes('<tr');
        const hasAjax = data.includes('$.ajax') || data.includes('fetch(') || data.includes('XMLHttpRequest');
        const hasTable = data.includes('<table') || data.includes('<tbody');

        console.log(`- 리스트 태그: ${hasList ? '✅ YES' : '⚠️ NO'}`);
        console.log(`- AJAX 호출: ${hasAjax ? '⚠️ YES (동적 로딩)' : '✅ NO'}`);
        console.log(`- 테이블 태그: ${hasTable ? '✅ YES' : '⚠️ NO'}`);

        // 첫 1000자 미리보기
        console.log(`\n[미리보기 (1000자)]`);
        console.log(data.substring(0, 1000).replace(/\s+/g, ' '));

        resolve({ site: site.name, crawlable, status: res.statusCode });
      });
    }).on('error', (err) => {
      console.log(`\n=== ${site.name} ===`);
      console.log(`❌ Error: ${err.message}`);
      resolve({ site: site.name, crawlable: '❌ 불가 (연결 실패)', error: err.message });
    });
  });
}

async function main() {
  console.log('🔍 3개 기관 크롤링 테스트 시작...\n');
  console.log('='.repeat(60));

  const results = [];
  for (const site of sites) {
    const result = await testCrawl(site);
    results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 최종 결과 요약:');
  console.log('-'.repeat(40));
  results.forEach(r => {
    console.log(`${r.site}: ${r.crawlable}`);
  });
}

main();
