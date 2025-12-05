const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 1920x1080 뷰포트 설정
  await page.setViewport({ width: 1920, height: 1080 });

  // HTML 파일 로드
  const filePath = path.resolve(__dirname, 'presentation_v3.html');
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

  // 슬라이드 개수 확인
  const slideCount = await page.evaluate(() => {
    return document.querySelectorAll('.slide').length;
  });

  console.log(`Found ${slideCount} slides`);

  // PDF 생성 - 각 섹션이 100vh이므로 landscape 1920x1080 비율로
  await page.pdf({
    path: 'presentation_v3.pdf',
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  console.log('PDF generated: presentation_v3.pdf');

  await browser.close();
})();
