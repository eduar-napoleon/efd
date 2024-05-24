//cloudflared access tcp --hostname proxy.marketa.id --url localhost:8082
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--proxy-server=localhost:8082']
  });
  const page = await browser.newPage();
  await page.goto('https://www.google.com/');
  await page.screenshot({path: 'example.png'});
  await browser.close();
})();
