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

const fs = require('fs');
const md5 = require('md5');
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];

(async() => {
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"]
    ,ignoreHTTPSErrors: true
    ,userDataDir: '/skyware/'+md5(user)
  });
  try {
    const page = await browser.newPage();
    var not_logged = true;
    await page.goto('https://accorderp.skyware.systems/report/prepare/sales_report')
    await waitTillHTMLRendered(page)
    const url = await page.url()  
    // console.log(url)
    if(url.includes("login") || url.includes("signin")){
      await page.type('#login_username', user)
      await page.type('#login_password', pass)
      await page.click('#login_form > button')
      await waitTillHTMLRendered(page)
    }
    await page.setRequestInterception(true);
    page.on('request', request => {
      // console.log('REQ', request.url())
      if (request.url() == 'https://accorderp.skyware.systems/report/display/sales_report/default'){
        // console.log(JSON.stringify(request.postData()))
        // console.log(JSON.stringify(request.headers()))
        request.continue({
            method : 'POST',
            postData: 'date_from='+from+'&date_to='+to+'&report_type=DETAIL',
            headers: { 
              ...request.headers()
              ,"origin":"https://accorderp.skyware.systems"
              ,"content-type":"application/x-www-form-urlencoded"
              ,"referer":"https://accorderp.skyware.systems/report/prepare/sales_report"
            }
        });
      } else {
        request.continue();
      }
    });

    // page.on('response', async response => {
    //   console.log('RES:'+not_logged, response.url())
    //   if (response.url() == 'https://accorderp.skyware.systems/report/display/sales_report/default' && not_logged){
    //       not_logged = false;
    //       const data = await response.text()
    //       console.log("DATA:"+data); 
    //   } 
    // })
    await page.goto('https://accorderp.skyware.systems/report/display/sales_report/default');
    // await page.click('#form_report > div > div.box-body > div:nth-child(3) > div > button:nth-child(1)')
    await waitTillHTMLRendered(page)
    const html = await page.content();
    console.log(html);
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();