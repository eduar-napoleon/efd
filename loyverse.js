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

(async() => {
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"]
    ,ignoreHTTPSErrors: true
    ,userDataDir: '/loyverse/'+md5(user)
  });
  try {
    const page = await browser.newPage();
    var not_logged = true;
    await page.goto('https://r.loyverse.com/dashboard/#/home')
    await waitTillHTMLRendered(page)

    var url = await page.url();  
    while(!url.includes("login") && !url.includes("signin") && !url.includes("dashboard")){
      await waitTillHTMLRendered(page);
    }
    if(url.includes("login") || url.includes("signin")){
      await page.type('#mat-input-0', user)
      await page.type('#mat-input-1', pass)
      await page.click('#sforg-submit')

      await page.solveRecaptchas()
      // await page.waitForNavigation()
      await waitTillHTMLRendered(page)
    }


    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url() == 'https://r.loyverse.com/data/ownercab/getreceiptsarchive'){
          var post = request.postData();
          // post = post.replace(/startDate":"[\d-]+/gm, 'startDate":"'+from);
          // post = post.replace(/endDate":"[\d-]+/gm, 'endDate":"'+to);
          // post = post.replace(/limit":"[\d-]+/gm, 'limit":"1000');
          // post = post.replace(/customPeriod":[^,]+/gm, 'customPeriod":true');
          // post = post.replace('"domain":[', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"],');
          // post = post.replace('&filters=%5B', '&filters='+encodeURI('[["Sales Invoice","posting_date","Between",["'+from+'","'+to+'"]],'));
          // console.log(post);
          request.continue({
              method : 'POST',
              postData: post,
              headers: { ...request.headers()}
          });
        } else {
          request.continue();
        }
    });

    page.on('response', async response => {
      if (response.url() == 'https://r.loyverse.com/data/ownercab/getreceiptsarchive'){
        try{
          // console.log('got response', response.url()+":"+response.status())
          not_logged = false;
          const data = await response.text()
          console.log(data); 
        } catch(err) {
          console.log(err);
        } 
      } 
    })
    const url1 = 'https://r.loyverse.com/dashboard/#/report/average?page=0&limit=1000&from='+from+'%2000:00:00&to='+to+'%2023:59:59&fromHour=0&toHour=0&outletsIds=all&merchantsIds=all';
    // console.log(url1); 
    await page.goto(url1);
    // await page.goto('https://r.loyverse.com/dashboard/#/report/average?page=0&limit=10&periodName=lastThirty&periodLength=30d');
    await waitTillHTMLRendered(page)
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();