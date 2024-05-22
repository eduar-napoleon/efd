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
    ,userDataDir: '/onezoid/'+md5(user)
  });
  try {
    const page = await browser.newPage();
    var not_logged = true;

    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url().includes('http://dashboard.onezoindonesia.com/transaction/report/pos_transaction/data?draw=2')){
          request.continue({
            url: request.url().replace(/daterange=\S+?&/gm, 'daterange='+from+'+-+'+to+'&'),
          });
          // var post = request.postData();
          // post = post.replace('"limit":80', '"limit":1000');
          // post = post.replace('"domain":[', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"],');
          // // post = post.replace('&filters=%5B', '&filters='+encodeURI('[["Sales Invoice","posting_date","Between",["'+from+'","'+to+'"]],'));
          // // console.log(post);
          // request.continue({
          //     method : 'POST',
          //     postData: post,
          //     headers: { ...request.headers()}
          // });
        } else {
          request.continue();
        }
    });

    page.on('response', async response => {
      // console.log('got response', response.url())
      if (response.url().includes('http://dashboard.onezoindonesia.com/transaction/report/pos_transaction/data?draw=2')){
          const data = await response.text()
          console.log(data); 
      } 
    })

    await page.goto('http://dashboard.onezoindonesia.com/transaction/report/pos_transaction')
    await waitTillHTMLRendered(page)
    const url = await page.url()  
    // console.log(url)
    if(url.includes("login") || url.includes("signin")){
      await page.type('#formLogin > div > div:nth-child(2) > input', user)
      await page.type('#formLogin > div > div:nth-child(3) > input', pass)
      await page.click('#submit')
      await waitTillHTMLRendered(page)
    }
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();