const waitTillHTMLRendered = async (page, timeout = 15000) => {
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
    ,userDataDir: '/vireopos/'+md5(user)
  });
  // const browser = await puppeteer.connect({
  //   browserWSEndpoint: 'ws://chrome:3000'
  // });
  try {
    const page = await browser.newPage();
    var not_logged = true;
    await page.goto('https://eretail.vireopos.com:28443/#/vireoSalesDetailReport.crux')
    await waitTillHTMLRendered(page)
    var url = await page.url();  
    while(url == "https://eretail.vireopos.com:28443/#/" || url == "https://eretail.vireopos.com:28443/"){
      await page.type('#email', user)
      await page.type('#password', pass)
      await page.click('#btnSignIn')

      await page.waitForNavigation()
      // await waitTillHTMLRendered(page)
      await page.goto('https://eretail.vireopos.com:28443/#/vireoSalesDetailReport.crux')
      await waitTillHTMLRendered(page)
      url = await page.url();
      // console.log(url)
    }

    var range = '&dateFrom='+from+'&dateTo='+to+'&status='
    // console.log(page)
    // console.log(url)
    // const res = await page.evaluate((range) => {
    //     const element = document.querySelector('#formid');
    //     const fid = element.value;

    //     const url2 = 'https://eretail.vireopos.com:28443/vireoSalesDetailReport.crux?EVENT=&OID=&LNG=&formid='+fid+'&defaultArg1=&defaultArg2=&defaultArg3=&defaultArg4=&action_event=search&confirmationDecision=&scrollTop=&selectId='+range+'&channelId=';
    //     // const url2 = 'https://eretail.vireopos.com:28443/vireoSalesDetailReport.crux?EVENT=&OID=&LNG=&formid='+fid+'&defaultArg1=&defaultArg2=&defaultArg3=&defaultArg4=&action_event=search&scrollTop=&selectId='+range;
    //     // return url2
    //     return fetch(url2, {
    //         method: 'GET',
    //         credentials: 'include'
    //     }).then(response => response.text());
    // }, range);
    // console.log(res)

    const fid = await page.evaluate((range) => {
        const element = document.querySelector('#formid');
        return element.value;
    }, range);
    const url2 = 'https://eretail.vireopos.com:28443/vireoSalesDetailReport.crux?EVENT=&OID=&LNG=&formid='+fid+'&defaultArg1=&defaultArg2=&defaultArg3=&defaultArg4=&action_event=search&confirmationDecision=&scrollTop=&selectId='+range+'&channelId=';
    await page.goto(url2);
    console.log(await page.content())
    
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();