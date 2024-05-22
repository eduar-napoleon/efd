const waitTillHTMLRendered = async (page, timeout = 30000) => {
  try{
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while(checkCounts++ <= maxChecks){
      let html = await page.content();
      let currentHTMLSize = html.length; 

      let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

      // console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

      if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
        countStableSizeIterations++;
      else 
        countStableSizeIterations = 0; //reset the counter

      if(countStableSizeIterations >= minStableSizeIterations) {
        // console.log("Page rendered fully..");
        break;
      }

      lastHTMLSize = currentHTMLSize;
      await page.waitFor(checkDurationMsecs);
    }  
  }catch(err){}
};   

const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
puppeteer.use(
  RecaptchaPlugin({
    provider: { id: '2captcha', token: 'bbfc93ab2d5156f558bed6b37790f2ff' },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
)

const md5 = require('md5');
const fs = require('fs');
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];
const store = process.argv[6];

(async() => {
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"]
    ,ignoreHTTPSErrors: true
    ,userDataDir: '/popcorn/'+md5(store+user)
  });
  try {
    const page = await browser.newPage();
    var not_logged = true;
    var urls = 'https://www.popcorn-pos.com/Admin/pages/report/invoice.php?start_date='+from+'%2000:00&end_date='+to+'%2023:59&show=1';
    await page.goto(urls)
    // await page.waitForNavigation()
    var url = await page.url();  
    // console.log(url)
    if(url.includes("login") || url.includes("signin")){
      await page.type('[name="storeName"]', store)
      await page.type('[name="nik"]', user)
      await page.type('[name="password"]', pass)
      await page.click('[name="signin"]')
      // await waitTillHTMLRendered(page)
	  // url = await page.url();  
	  // console.log(url)
      await page.goto(urls)
	  // url = await page.url();  
	  // console.log(url)
      // await page.waitForNavigation()
    }
	const html = await page.content();
	console.log(html);
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();