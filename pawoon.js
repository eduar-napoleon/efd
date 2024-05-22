const puppeteer = require('puppeteer');
const fs = require('fs');
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];

(async() => {
	const browser = await puppeteer.launch({args: ['--no-sandbox']
	,headless:false
});
	try{
		const page = await browser.newPage();
		await page.goto('https://dashboard.pawoon.com/login');
		await page.type('[name="email"]', user)
		await page.type('[name="password"]', pass)
		await page.click('[type="submit"]')
		await page.waitForNavigation()
		await page.goto('https://dashboard.pawoon.com/report/sales-transaction/data?sort_by=desc&outlet=3262e7e0-47a6-11e9-93fb-d1601e631b8f&start_date='+from+'&end_date='+to+'&utc_offset=-7');
		const html = await page.content();
		console.log(html);
	  } catch(err) {
	    console.log(err);
	  } finally {
	    await browser.close();
	  }
})();