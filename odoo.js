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
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];
const oid = process.argv[6];

(async() => {
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"],
    ignoreHTTPSErrors: true
  });
  try {
    const page = await browser.newPage();
    await page.goto('https://gelato-secrets.odoo.com/web/login')
    await page.type('#login', user)
    await page.type('#password', pass)
    await page.click('#wrapwrap > main > div > div > div > form > div.clearfix.oe_login_buttons.text-center.mb-1.pt-3 > button')
    await page.waitForNavigation()

    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url() == 'https://gelato-secrets.odoo.com/web/dataset/search_read'){
          var post = request.postData();
          post = post.replace('"limit":80', '"limit":1000');
          post = post.replace('"domain":[', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"],');
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
      // console.log('got response', response.url())
      if (response.url() == 'https://gelato-secrets.odoo.com/web/dataset/search_read'){
          const data = await response.text()
          console.log(data); 
      } 
    })
    await page.goto('https://gelato-secrets.odoo.com/web#action=374&active_id='+oid+'&cids=1&menu_id=203&model=pos.order&view_type=list');
    await waitTillHTMLRendered(page)
  } catch(err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();