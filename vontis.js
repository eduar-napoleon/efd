const waitTillHTMLRendered = async (page, timeout = 30000) => {
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
};   

const puppeteer = require('puppeteer');
const fs = require('fs');
const md5 = require('md5');

const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];

(async() => {
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"],
    ignoreHTTPSErrors: true
  });
  try {
    const page = await browser.newPage();

    const headlessUserAgent = await page.evaluate(() => navigator.userAgent);
    const chromeUserAgent = headlessUserAgent.replace('HeadlessChrome', 'Chrome');
    await page.setUserAgent(chromeUserAgent);
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.8'
    });

    var not_logged = true;
    await page.goto('https://www.vontis.id/saysomething/#!/login')
    await waitTillHTMLRendered(page)
    await page.waitForSelector('#txtUsername')
    await page.type('#txtUsername', user)
    await page.type('#txtPassword', pass)
    await page.click('#cmdLogin')
    await waitTillHTMLRendered(page)

    await page.setRequestInterception(true);
    page.on('request', request => {
        // console.log(request.url())
        if (request.url().includes('/getSalesTransactionListV2')){
          var post = request.postData();
          post = post.replace(/startDate":"[\d-]+/gm, 'startDate":"'+from);
          post = post.replace(/endDate":"[\d-]+/gm, 'endDate":"'+to);
          const extras = {'Content-MD5': md5(post)};
          // console.log(post)
          // post = post.replace('length=5', 'length=1000');
          // post = post.replace('"domain":[', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"],');
          // post = post.replace('&filters=%5B', '&filters='+encodeURI('[["Sales Invoice","posting_date","Between",["'+from+'","'+to+'"]],'));
          // console.log(post);
          request.continue({
              method : 'POST',
              postData: post,
              headers: { ...request.headers(), ...extras}
          });
        } else {
          request.continue();
        }
    });

    page.on('response', async response => {
      // console.log('got response', response.url())
      if (response.url().includes('/getSalesTransactionListV2') && not_logged){
          const request = response.request();
          var post = request.postData();
          // console.log(post); 
          if(post.includes('COMPLETED'))  {
            not_logged = false
            const data = await response.text()
            console.log(data); 
          }
      } 
    })
    await page.goto('https://www.vontis.id/saysomething/#!/app/order/salesTransactions');
    await waitTillHTMLRendered(page)

  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();