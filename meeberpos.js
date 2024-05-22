const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 200;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 5;

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
	const browser = await puppeteer.launch({args: ['--no-sandbox']});
	try{
		const page = await browser.newPage();
		await page.goto('https://meeberpos.com/dashboard/#/login.html');
		await page.waitForSelector('body > div.ng-scope > div > div.content > div.login-form > form > div:nth-child(1) > input', {visible: true})
		await page.type('body > div.ng-scope > div > div.content > div.login-form > form > div:nth-child(1) > input', user)
		await page.type('body > div.ng-scope > div > div.content > div.login-form > form > div:nth-child(2) > input', pass)
		await page.click('body > div.ng-scope > div > div.content > div.login-form > form > div.form-actions > button')
		await waitTillHTMLRendered(page)

    await page.goto('https://meeberpos.com/dashboard/api/opendinetables/getTransactionByDaterange?daterange=%7B%22startReport%22:'+from+',%22endReport%22:'+to+'%7D&filter=%7B%22where%22:%7B%22opendinetable_status%22:%22Finish%22%7D,%22fields%22:%7B%22dinetable_name%22:true,%22opendinetable_processedby%22:true,%22opendinetable_number%22:true,%22receipts%22:true,%22id%22:true%7D%7D&tenant='+oid);
		const html = await page.content();
		console.log(html);
	  } catch(err) {
	    console.log(err);
	  } finally {
	    await browser.close();
	  }
})();