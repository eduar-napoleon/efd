//pkg api.js --targets node16-win-x64 --output api.exe
//pkg api.js --targets node16-mac-x64 --output api

const express = require('express');
const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const md5 = require('md5');
const bodyParser = require('body-parser');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const Client = require('@infosimples/node_two_captcha');
const moment = require('moment');
const {sync} = require('./fb.js');


const app = express();
const PORT = process.env.PORT || 3000;

puppeteer.use(StealthPlugin());
puppeteer.use(RecaptchaPlugin({
  provider: { id: '2captcha', token: 'bbfc93ab2d5156f558bed6b37790f2ff' },
  visualFeedback: true,
  throwOnError: true
}));

const client = new Client('bbfc93ab2d5156f558bed6b37790f2ff', {
  timeout: 60000,
  polling: 5000,
  throwErrors: false
});

app.use(bodyParser.json());

const sleep = ms => new Promise(res => setTimeout(res, ms));

const waitTillHTMLRendered = async (page, timeout = 30000) => {
  try {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while (checkCounts++ <= maxChecks) {
      let html = await page.content();
      let currentHTMLSize = html.length;

      if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
        countStableSizeIterations++;
      else
        countStableSizeIterations = 0;

      if (countStableSizeIterations >= minStableSizeIterations) {
        break;
      }

      lastHTMLSize = currentHTMLSize;
      await sleep(checkDurationMsecs);
    }
  } catch (err) {
    console.log(err);
  }
};

app.post('/kp', async (req, res) => {
  const { user, pass, from, to } = req.body;

  if (!user || !pass || !from || !to) {
    return res.status(400).send({ error: 'Missing required fields: user, pass, from, to' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--enable-features=NetworkService", "--no-sandbox",'--proxy-server=localhost:8082'], 
      ignoreHTTPSErrors: true,
      headless: process.env.ENV == 'PROD',
      userDataDir: 'data/kp' + md5(user)
    });
    const page = await browser.newPage();
    const cf = md5(user) + '.json';
    if (fs.existsSync(cf)) {
      const cookiesString = fs.readFileSync(cf);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
    }

    let data = null;
    page.setRequestInterception(true);
    page.on('request', request => {
      if (request.interceptResolutionState().action === "already-handled") return;
      if (request.url().startsWith('https://kasirpintar.co.id/account/laporan_filter_ajax/Semua/Semua/Semua/')) {
        let url1 = request.url();
        url1 = url1.replace(/[\d\-]{8,}\/[\d\-]{8,}/gm, from + "/" + to);
        request.continue({ url: url1 });
      } else {
        request.continue();
      }
    });

    page.on('response', async response => {
      try {
        if (response.url().startsWith('https://kasirpintar.co.id/account/laporan_filter_ajax/Semua/Semua/Semua/')) {
          const data = await response.text();
          // console.log(data);
          if (!res.headersSent) {
            res.send(data);
          }
        }
      } catch (err) {
        console.log(err);
      }
    });

    await page.goto('https://kasirpintar.co.id/login');
    let url = await page.url();
    if (url.includes("login")) {
      await page.type('[name="email"]', user);
      await page.type('[name="password"]', pass);
      if (data) {
        const response = await client.decode({ 'base64': data, calc: 1 });
        await page.type('#captcha', response.text);
      }
      await page.click('#login-form > button');
      await waitTillHTMLRendered(page);
      const cookies = await page.cookies();
      fs.writeFileSync(cf, JSON.stringify(cookies));
    }
    await page.goto('https://kasirpintar.co.id/account/laporan_staff_user');
    await waitTillHTMLRendered(page);

  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'An error occurred during scraping' });
  } finally {
    if (!res.headersSent) {
      res.send({});
    }
    if(browser)    await browser.close();  }
});

app.post('/firebird', async (req, res) => {
  let { profile_id, path, query } = req.body;

  if (!profile_id || !path) {
    return res.status(400).send({ error: 'Missing required fields: profile_id, path' });
  }

  try {
    const result = await sync(profile_id, path, query);
    res.send(result);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'An error occurred during scraping' });
  } finally {
    if (!res.headersSent) {
      res.send({});
    }
  }
})

app.post('/uniq', async (req, res) => {
  let { user, pass, from, to } = req.body;
  const trace = true;

  if (!user || !pass || !from || !to) {
    return res.status(400).send({ error: 'Missing required fields: user, pass, from, to' });
  }

  from = moment(from).unix() * 1000;
  to = moment(to).unix() * 1000 + 999;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--enable-features=NetworkService", "--no-sandbox",'--proxy-server=localhost:8082'], 
      ignoreHTTPSErrors: true,
      headless: process.env.ENV == 'PROD',
      userDataDir: 'data/uniq' + md5(user)
    });
    const page = await browser.newPage();
    const cf = 'uniq' + md5(user) + '.json';
    var rld = false;
    if (fs.existsSync(cf)) {
      const cookiesString = fs.readFileSync(cf);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
    }

    await page.setDefaultNavigationTimeout(180000);
    await page.goto('https://staging.uniq.id/reports/sales/history', { waitUntil: 'domcontentloaded', timeout: 0 })
    await waitTillHTMLRendered(page)
    var html = await page.content();
    // console.log(html);
    if (html.includes("Cloudflare")) {
      if (trace) console.log("Cloudflare");

      await page.goto('https://staging.uniq.id/reports/sales/history', { waitUntil: 'domcontentloaded', timeout: 0 })
      await waitTillHTMLRendered(page)
      var url = await page.url()
      if (!url.includes("?continue=")) {
        if (trace) console.log("reCAPTCHAs")
        await page.solveRecaptchas()
      }
      rld = true;
    }

    var url = await page.url()
    if (!url.includes("staging.uniq.id") && !url.includes("?continue=")) {
      if (trace) console.log("WAIT:NAV")
      await page.waitForNavigation()
    }
    if (trace) console.log("T1")
    // await page.solveRecaptchas()
    var url = await page.url()
    if (url.includes("?continue=")) {
      await page.goto('https://staging.uniq.id/reports/sales/history', { waitUntil: 'domcontentloaded', timeout: 0 })

      await page.type('[name="email"]', user)
      await page.type('[name="password"]', pass)
      await page.click('[type="submit"]')
      if (trace) console.log("T3:")
      await sleep(1000)
      if (url.includes("?continue=")) {
        if (trace) console.log("reCAPTCHAs")
        await page.solveRecaptchas()
        if (trace) console.log("reCAPTCHAsDone")
        await sleep(5000)
      }
    }

    var url = await page.url()
    if (!url.includes("staging.uniq.id")) {
      if (trace) console.log("WAIT:NAV1")
      await page.solveRecaptchas()
      if (trace) console.log("WAIT:NAV2")
      await page.waitForNavigation()
    }

    const cookies = await page.cookies();
    // console.log(JSON.stringify(cookies))
    fs.writeFileSync(cf, JSON.stringify(cookies));
    if (rld && c > 0) {
      await page.close();
      return await loadPage(browser, c - 1);
    }

    page.setRequestInterception(true);
    page.on('request', request => {
      try {
        if (request.interceptResolutionState().action === "already-handled") return;
        if (request.url().startsWith('https://api-report-staging.uniq.id/v1/sales/transaction') && request.method() === 'POST') {
          const requestBody = request.postData(); // Get the original request body
          const params = new URLSearchParams(requestBody); // Parse the original body as URLSearchParams
          params.set('startDate', from); // Set the startDate parameter to 'from'
          params.set('endDate', to); // Set the endDate parameter to 'to'
          const newData = params.toString(); // Convert the modified parameters back to a URL-encoded string
          request.continue({
            method: 'POST',
            postData: newData,
            headers: {
              ...request.headers(),
              'Content-Type': 'application/x-www-form-urlencoded', // Set the content type if not already set
            }
          });
        } else {
          request.continue();
        }
      } catch (err) {
        console.log(err);
        if (!res.headersSent) {
          res.status(500).send({ error: 'An error occurred during scraping' });
        }
      }
    });

    var result = []
    page.on('response', async response => {
      try {
        if (response.url().startsWith('https://api-report-staging.uniq.id/v1/sales/transaction') && response.request().method() === 'POST') {
          const data = await response.text();
          var dt = JSON.parse(data);
          result.push(...dt['data']);  
          if (dt.offsetId == 0 && !res.headersSent) {
            res.send(result);
          }
        }
      } catch (err) {
        console.log(err);
      }
    });
    if (trace) console.log("T4:")
    await page.click('#btnTransaksi');

    let limit = 20000;
    while(!res.headersSent && limit > 0) {
      await sleep(500);
      limit = limit-500;
    }
    if (trace) console.log("T5:")
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'An error occurred during scraping' });
  } finally {
    if (!res.headersSent) {
      res.send({});
    }
    if(browser)    await browser.close();  }
});

app.post('/esb', async (req, res) => {
  const { user, pass, from, to } = req.body;

  if (!user || !pass || !from || !to) {
    return res.status(400).send({ error: 'Missing required fields: user, pass, from, to' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--enable-features=NetworkService", "--no-sandbox",'--proxy-server=localhost:8082'], 
      ignoreHTTPSErrors: true,
      headless: process.env.ENV == 'PROD',
      userDataDir: 'data/esb' + md5(user)
    });
    const page = await browser.newPage();
    const cf = md5(user) + '.json';
    if (fs.existsSync(cf)) {
      const cookiesString = fs.readFileSync(cf);
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
    }

    await page.goto('https://poslite.esb.co.id/report/sales-detail/index');
    let url = await page.url();
    if (url.includes("login")) {
      await page.type('#email', user);
      await page.type('#password', pass);
      await page.click('body > app-login > div > div.card-content > div > div > form > div > button');
      await waitTillHTMLRendered(page);
      const cookies = await page.cookies();
      fs.writeFileSync(cf, JSON.stringify(cookies));
    }

    page.setRequestInterception(true);
    page.on('request', request => {
      try {
        if (request.interceptResolutionState().action === "already-handled") return;
        if (request.url().startsWith('https://poslite.esb.co.id/api/web/v1/report/sales-detail')) {
          var url1 = request.url();
          url1 = url1.replace(/startDate=[\d-]+/gm, 'startDate='+from);
          url1 = url1.replace(/endDate=[\d-]+/gm, 'endDate='+to);
          request.continue({
              url : url1
          });
        } else {
          request.continue();
        }
      } catch (err) {
        console.log(err);
      }
    });

    var result = []
    page.on('response', async response => {
      try {
        if (response.url().startsWith('https://poslite.esb.co.id/api/web/v1/report/sales-detail')) {
          const data = await response.text();
          if (!res.headersSent) {
            res.send(data);
          }
        }
      } catch (err) {
        console.log(err);
      }
    });

    if(!page.url().startsWith('https://poslite.esb.co.id/report/sales-detail/index')){
      await page.goto('https://poslite.esb.co.id/report/sales-detail/index');
    }
    await waitTillHTMLRendered(page);

    await page.click("body > app-layout > nz-layout > nz-layout > nz-content > div.app-content > app-sales-detail > app-sales-detail-index > div.card-container > div > div > div > div > div.mt-3.ant-row.ant-row-middle.ant-row-end.ng-star-inserted > div:nth-child(2) > button");

    let limit = 20000;
    while(!res.headersSent && limit > 0) {
      await sleep(500);
      limit = limit-500;
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: 'An error occurred during scraping' });
  } finally {
    if (!res.headersSent) {
      res.send({});
    }
    if(browser)    await browser.close();  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});