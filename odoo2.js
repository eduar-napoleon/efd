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
        await page.waitForTimeout(checkDurationMsecs);
      }  
    }catch(err){}
  };   
  
  const puppeteer = require('puppeteer-extra')
  const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')

  
  // add stealth plugin and use defaults (all evasion techniques)
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
  puppeteer.use(StealthPlugin())
  puppeteer.use(
    RecaptchaPlugin({
      provider: { id: '2captcha', token: 'bbfc93ab2d5156f558bed6b37790f2ff' },
      visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    })
  )
  // puppeteer.use(require('puppeteer-extra-plugin-block-resources')({
  //   blockedTypes: new Set(['image', 'stylesheet'])
  // }))
  const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')()
  puppeteer.use(blockResourcesPlugin)
  
  const md5 = require('md5');
  const fs = require('fs');
  const user = process.argv[2];
  const pass = process.argv[3];
  const from = process.argv[4];
  const to = process.argv[5];
  const items = ['stylesheet', 'image', 'media', 'font', 'script', 'texttrack', 'xhr', 'eventsource', 'websocket', 'manifest', 'other'];

  (async() => {
    const browser = await puppeteer.launch({
      args: ["--enable-features=NetworkService", "--no-sandbox"]
      ,ignoreHTTPSErrors: true
      ,userDataDir: '/odoo/'+md5(user)
      // ,userDataDir: '/uniq/'+md5(user+"4")
      // ,headless: false
    });
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(180000); 
      items.forEach(item => blockResourcesPlugin.blockedTypes.add(item))
      await page.goto('http://sakapatatjogja.ddns.net:8911/web/')
      var url = await page.url()  
      if(url.includes("/web/login")){
        await page.type('#login', user)
        await page.type('#password', pass)
        await page.click('[type="submit"]')
        await waitTillHTMLRendered(page)
      }

      var body = "{\"jsonrpc\":\"2.0\",\"method\":\"call\",\"params\":{\"model\":\"pos.order\",\"fields\":[\"name\",\"pos_reference\",\"partner_id\",\"date_order\",\"user_id\",\"amount_total\",\"company_id\",\"state\",\"session_id\"],\"domain\":[],\"context\":{\"lang\":\"en_US\",\"tz\":false,\"uid\":38,\"params\":{\"action\":302,\"min\":1,\"limit\":80,\"view_type\":\"list\",\"model\":\"pos.order\",\"menu_id\":189,\"_push_me\":false},\"bin_size\":true},\"offset\":0,\"limit\":1000,\"sort\":\"\"},\"id\":90771387}";
      // console.log(body);
      // body = body.replace('"domain":[]', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"]]');
      // body = JSON.parse(body);

      // console.log(body); 
      const output = await page.evaluate((data) => {
        return fetch("http://sakapatatjogja.ddns.net:8911/web/dataset/search_read", {
          "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "x-requested-with": "XMLHttpRequest"
          },
          "referrer": "http://sakapatatjogja.ddns.net:8911/web",
          "referrerPolicy": "strict-origin-when-cross-origin",
          "body": data,
          "method": "POST",
          "mode": "cors",
          "credentials": "include"
        }).then(response => response.text());
      }, body);
      console.log(output); 
    } catch(err) {
      console.log("ERR", err);
    } finally {
      await browser.close();
    }
  })();