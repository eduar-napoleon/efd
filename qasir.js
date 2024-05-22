const waitTillHTMLRendered = async (page, timeout = 30000) => {
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
        await page.waitForTimeout(checkDurationMsecs);
      }  
    }catch(err){}
  };   
  
  const puppeteer = require('puppeteer-extra')
  const crypto = require("crypto");
  
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
  const to = process.argv[4];
  const outlet = process.argv[6];


async function downloadFile(page, file, url, param) {
  const data = await page.evaluate(
    // tslint:disable-next-line no-shadowed-variable
    async ({ url, param }) => {
        function readAsBinaryStringAsync(blob) {
          return new Promise((resolve, reject) => {
              const fr = new FileReader();
              fr.readAsBinaryString(blob);
              fr.onload = () => {
              resolve(fr.result);
              };
          });
        }

        const r = await fetch(url, param);

        return await readAsBinaryStringAsync(await r.blob());
    },
    { url, param }
  );

  fs.writeFileSync(file, data, { encoding: 'binary' });
}
  
  (async() => {
    const browser = await puppeteer.launch({
      args: ["--enable-features=NetworkService", "--no-sandbox"]
      ,ignoreHTTPSErrors: true
      // , headless: false
      ,userDataDir: '/qasir/'+md5(user)
    });
    try {
      const page = await browser.newPage();
      await page.goto('https://'+outlet+'.qasir.id/report/transaction?searchdate='+from+' - '+to+'&employee=');
      await waitTillHTMLRendered(page)
      const url = await page.url(); 
      // console.log(url)
      if(url == 'https://'+outlet+'.qasir.id/'){
        await page.type('[name="username"]', user)
        await page.type('[name="pin"]', pass)
        const form = await page.$('[type="submit"]');
        await form.evaluate( form => form.click() );
        await waitTillHTMLRendered(page)
        await page.goto('https://'+outlet+'.qasir.id/outlet/change?outlet_id=0');
        await waitTillHTMLRendered(page)
        // await page.goto('https://'+outlet+'.qasir.id/report/transaction?searchdate='+from+' - '+to+'&employee=');
        // await waitTillHTMLRendered(page)
      }
      // await page.waitForSelector('#DataTables_Table_0')
      // let element = await page.$('#DataTables_Table_0')
      // var value = await page.evaluate(el => el.innerHTML, element)
      // value = value.replace(/\s{5,}/g, '')
      // value = value.replace(/(\d{2}) : (\d{2})</g, from+" $1:$2<")
      // console.log(value);

      const id = md5(user+from+to);
      await downloadFile(page, id+'.xls', 'https://'+outlet+'.qasir.id/excel/transaction?searchdate='+from+' - '+to, {})
      console.log('/var/www/html/scraping/'+id+'.xls')
    } catch(err) {
      console.log(err);
    } finally {
      await browser.close();
    }
  })();