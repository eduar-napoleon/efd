const waitTillHTMLRendered = async (page, timeout = 15000) => {
  try{
    const checkDurationMsecs = 500;
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

const md5 = require('md5');
const fs = require('fs');
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];

(async() => {
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"]
    ,ignoreHTTPSErrors: true
    ,userDataDir: '/poslavu/'+md5(user)
  });
  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: 'ws://chrome:3000?--user-data-dir=/tmp/poslavu/'+md5(user)
  // });
  try {
    const page = await browser.newPage();
    var not_logged = true;
    await page.goto('http://admin.poslavu.com/cp/?mode=reports_reports_v2&report=31')
    const url = await page.url();  
    // console.log(url)
    if(url.includes('login')){
      await page.type('[name="username"]', user)
      await page.type('[name="password"]', pass)
      await page.click('[type="submit"]')

      await waitTillHTMLRendered(page)
    }

    const url2 = 'http://admin.poslavu.com/cp/index.php?mode=reports_id_13&reportid=13&rmode=view&setdate='+from+'&stime=0&day_duration=2&reportid=13&export_type=csv&widget=reports/export';
    const res = await page.evaluate((url2) => {
        return fetch(url2, {
            method: 'GET',
            credentials: 'include'
        }).then(response => response.text());
    },url2);
    console.log(res)
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();