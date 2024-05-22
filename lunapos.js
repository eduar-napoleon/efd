// const waitTillHTMLRendered = async (page, timeout = 30000) => {
//   try{
//     const checkDurationMsecs = 1000;
//     const maxChecks = timeout / checkDurationMsecs;
//     let lastHTMLSize = 0;
//     let checkCounts = 1;
//     let countStableSizeIterations = 0;
//     const minStableSizeIterations = 3;

//     while(checkCounts++ <= maxChecks){
//       let html = await page.content();
//       let currentHTMLSize = html.length; 

//       let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

//       console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);

//       if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
//         countStableSizeIterations++;
//       else 
//         countStableSizeIterations = 0; //reset the counter

//       if(countStableSizeIterations >= minStableSizeIterations) {
//         console.log("Page rendered fully..");
//         break;
//       }

//       lastHTMLSize = currentHTMLSize;
//       await page.waitFor(checkDurationMsecs);
//     }  
//   }catch(err){}
// };   

// const puppeteer = require('puppeteer-extra')

// // add stealth plugin and use defaults (all evasion techniques)
// const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(StealthPlugin())

// const fs = require('fs');
// const md5 = require('md5');
// const user = process.argv[2];
// const pass = process.argv[3];
// const from = process.argv[4];
// const to = process.argv[5];

// (async() => {
//   const browser = await puppeteer.launch({
//     args: ["--enable-features=NetworkService", "--no-sandbox"]
//     ,ignoreHTTPSErrors: true
//     ,userDataDir: '/lunapos/'+md5(user)
//   });
//   try {
//     const page = await browser.newPage();
//     var not_logged = true;

//     await page.setRequestInterception(true);
//     page.on('request', request => {
//         console.log('got request', request.url())
//         if (request.url().includes('https://luna-prod-api-report.azurewebsites.net/reports/sales/sales-list?posType=all')){
//           request.continue();
//           // request.continue({
//           //   url: request.url().replace(/daterange=\S+?&/gm, 'daterange='+from+'+-+'+to+'&'),
//           // });
//           // var post = request.postData();
//           // post = post.replace('"limit":80', '"limit":1000');
//           // post = post.replace('"domain":[', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"],');
//           // // post = post.replace('&filters=%5B', '&filters='+encodeURI('[["Sales Invoice","posting_date","Between",["'+from+'","'+to+'"]],'));
//           // // console.log(post);
//           // request.continue({
//           //     method : 'POST',
//           //     postData: post,
//           //     headers: { ...request.headers()}
//           // });
//         } else {
//           request.continue();
//         }
//     });

//     page.on('response', async response => {
//       console.log('got response', response.url())
//       if (response.url().includes('https://luna-prod-api-report.azurewebsites.net/reports/sales/sales-list?posType=all')){
//           const data = await response.text()
//           console.log(data); 
//       } 
//     })

//     await page.goto('https://lunapos.app/#/reports/sales')
//     await waitTillHTMLRendered(page)
//     const url = await page.url()  
//     // console.log(url)
//     if(url.includes("login") || url.includes("signin")){
//       await page.type('#email', user)
//       await page.type('#password', pass)
//       await page.click('#login')
//       await console.log("login"); 
//       await waitTillHTMLRendered(page)
//     }
//     await console.log("masuk"); 
//     await page.click('app-base-report > .well > .ng-pristine > .mt > .btn')
    
//     console.log("click terapkan"); 

//     const res = await page.evaluate(() => {
//         // const element = document.querySelector('#formid');
//         // const fid = element.value;
//         const url2 = 'https://luna-prod-api-report.azurewebsites.net/reports/sales/sales-list?posType=all';
//         // console.log(url2)
//         return fetch(url2, {
//             method: 'POST',
//             headers: {
//               'Accept': 'application/json, text/plain, */*',
//               'Content-Type': 'application/json',
//               'Authorization': 'Bearer nOBNRoQiH9lKcXnACdMjksNwIofDiEMU2NbGk7DZ1djMgAxf3HbIc3c9XNh1zOun8LngXHrup5LLwx-UnWGQ--HxWZdvkw4naJqWK9xAQny_YM2A8w2qGVCHxDSo1U8kDYpOFBEy8Ax-KQGoh0eaCOpvWKiGZPpUZLM_aPc-WynpKrl5eMf0oyCTk0bILf1-rfwDw53_Ob3t_w1jjJ9StnsupaztTWfqjjTpRfzv7NfOPV3GyGHBRuSpz4yI6-M3eKV24j98uD35xwsxuxrot4MtoH8p5B0CY7SG2DjVDJ2Mue9iwrzFVQFLAsXsKLKVwV2zVsvveXA8PeSKGEyWOLAyyAzXkzx-M9VIc_pxuK6rMGes99n_Da5nKxKhs0Q7boO2wl0ZjT0KKzwkzTAwQluUAGHUwIE5Tn2EamCjgVqYChcMog6ZAuBrGSpNjYhTBkT6LDe0rlhqZ55rYOKIVeR00RgcqVNmz116GZmuef-ERpXDLcq1HoRXLmnNJLMl5gnzP5ka3NILmiuwR0CgvA7RUc3IEkbQMDcSgBQakVAP3svTJLavonxo4gvu2hIff-UqrWwGd4plX4MC2GwTKmh5_UV-wjfw3Thn83XXxdQjTY3h6WTVThMTLjx1iJ-hkyZcXKQSRwo8KB0VaP7bfeBU6UNETWhCqTtin0ib9cFO39JtpmGdQBZqQdt-D_dFujXdSr-D60NVrkr9xxT5huiTIrCTDc-Zoaq0VA-bGTaTJyx5XBUyAwRRyvX_Lphd6Yt_mN6DAjBWOEqoUr3oDCpDHl8piuCcIWJR3gJlaGuuohXQ9QrOfiUJnyDePSf4KlgGMYOOSczr5ba2-gNpsXtCzNee1bjpBH-yLwojwjwKX3qy0OAqTbx8v6sWddsdghlj8_YyhR3xSiqepVGSWKoXfSvG462S6qbO5bOkfQBF7G2mQ3Cd0SHWXdh7iOUCCoHEgAllSR-mz0GHNYZl5pcBQRAkxqmInknWAqHgB17rhzaxDuxen0SANThML4GJ9WI84jKNNufPH4kr-m57qDSbE_4qcDG7ccErrI_0hHjw1tw_I5_-lfZbTzL_0rjzJaXMGomuz5YyljE14_t9yd-L2LBwi4UCNGxHX4FkLEJPtGEu8oab2j7vqg7GizuU6DLZW5Y1UP0GnPaPxEIgEZ8QDvFjSthvCgV0h6yeiodCSHMfaf6yYo0ieWj7YAJ6XrMI2XqFtlV5htaXWfHL8SiNx1EU-wN74LHgEDCP52wsMu0Slhi9ebHINfu2U5UJU1HBsi10au7r77w9fid87kWgm0ESw0XCe-fkGmVBiQyjyLiMklm2cqVkOI_7waPbY9m5BmA9CWMzfgKP54nlqYAQmYRNfkLHh1ExYw5X3IsnhQFvp8JdWXhQbi1NjbzNbaHeBVqqsVtqOEWQq2tjx0JtiyYShVA5S6nLi0aD1joZHvFBBRMmloGESxWjJCOd1Kzz5qs6zg95AaHeSEGjlJpCgBCTjTzpyuigaOIyP2GfmHM-A_QJ0z7EIuQKqVUefKm16NdY73CJlDUvY4sH948hjahdTg-G6UQ-K1v0zTT-1GOe'
//             },
//             body: '{"lowDate":"2020-11-20","highDate":"2020-11-20","transactionTypes":["sales_invoice","sales_credit_note"],"statuses":["open","closed"],"paymentStatuses":[""],"outletIds":["2050"],"salesTypes":[],"take":30,"skip":0}',
//             credentials: 'include'
//         }).then(response => response.text());
//     });
//     console.log(res)
//     // await page.waitForResponse(response => response.status() === 200 && response.url() == 'https://luna-prod-api-report.azurewebsites.net/reports/sales/sales-list?posType=all')
//     // await waitTillHTMLRendered(page)
//     // const html = await page.content();
//     // console.log(html);
//   } catch(err) {
//     console.log(err);
//   } finally {
//     await browser.close();
//   }
// })();
const fetch = require('node-fetch');
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];

(async() => {
  var token = await fetch('https://luna-prod-api-auth.azurewebsites.net/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://lunapos.app/'
      },
      body: 'grant_type=password&username='+user+'&password='+pass+'&client_id=luna-main-web',
      credentials: 'include'
  }).then(response => response.text());

  // console.log(token)

  token = JSON.parse(token)

  const access_token = token['access_token']
  const outlet_id = token['master_outlet_id']
  // console.log(token)

  const res = await fetch('https://luna-prod-api-report.azurewebsites.net/reports/sales/sales-list?posType=all', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+access_token
      },
      body: '{"lowDate":"'+from+'","highDate":"'+to+'","transactionTypes":["sales_invoice","sales_credit_note"],"statuses":["open","closed"],"paymentStatuses":[""],"outletIds":["'+outlet_id+'"],"salesTypes":[],"take":30,"skip":0}',
      credentials: 'include'
  }).then(response => response.text());
  console.log(res)
})();

