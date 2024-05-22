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
    ,userDataDir: '/yokke/'+md5(user)
  });
  try {
    const page = await browser.newPage();
    var not_logged = true;
    await page.goto('https://biz.yokke.co.id/Orders')
    await waitTillHTMLRendered(page)
    const url = await page.url();  

    // console.log(url)
    if(url.includes("https://biz.yokke.co.id/Login")){
      await page.type('#username_input', user)
      await page.type('#password_input', pass)
      await page.click('#login_btn')

      // await page.waitForNavigation() 
      await waitTillHTMLRendered(page)
    }

    // console.log("FROM", from)
    // console.log("TO", to)
    var data = {
        "selectArguments":{
          "_Type":"DataSourceSelectArguments",
          "FilterExpression":"",
          "SortExpression":"",
          "MaximumRows":50,
          "RetrieveTotalRowCount":false,
          "StartRowIndex":0,
          "TotalRowCount":-1,
          "Tag":"",
          "OperationType":0,
          "ViewName":"",
          "GroupByExpression":"",
          "CalculateAggregates":false,
          "AggregatesExpression":null,
          "SortedColumns":"[]",
          "FilteredColumns":"[]",
          "UserFilters":[
             {
                "PropertyName":"OrderDate",
                "Operator":4,
                "Value":from+" 00:00:00",
                "DisplayValue":"Thu Oct 01 2020 00:00:00 GMT+0700 (Indochina Time)"
             },
             {
                "PropertyName":"OrderDate",
                "Operator":0,
                "Value":to+" 23:59:59",
                "DisplayValue":"Sat Oct 31 2020 00:00:00 GMT+0700 (Indochina Time)"
             }
          ],
          "SelectedViewIndex":3
       }
    };
    data = JSON.stringify(data);

    await page.setRequestInterception(true);
    page.on('request', request => {
        // console.log('REQ', request.url())
        if (request.url() == 'https://biz.yokke.co.id/service/order/GetData'){
          var post = data
          // post = post.replace('"domain":[', '"domain":["&",["create_date",">=","'+from+' 00:00:00"],"&",["create_date","<=","'+to+' 23:59:59"],');
          // post = post.replace('&filters=%5B', '&filters='+encodeURI('[["Sales Invoice","posting_date","Between",["'+from+'","'+to+'"]],'));
          // console.log(post);

          // console.log('REQ', { ...request.headers()
          //   ,"content-type": "application/json"
          // })
          request.continue({
              method : 'POST',
              postData: post,
              headers: { ...request.headers()
                ,"content-type": "application/json"
              }
          });
        } else {
          request.continue();
        }
    });

    page.on('response', async response => {
      // console.log('RES', response.url())
      if (response.url() == 'https://biz.yokke.co.id/service/order/GetData' && not_logged){
          not_logged = false;
          const data = await response.text()
          console.log(data); 
      } 
    })

    await page.goto('https://biz.yokke.co.id/service/order/GetData')
    await waitTillHTMLRendered(page)


    // const res = await page.evaluate((data) => {
    //     return fetch('https://biz.yokke.co.id/service/order/GetData', {
    //       method: 'POST', // *GET, POST, PUT, DELETE, etc.
    //       mode: 'cors', // no-cors, *cors, same-origin
    //       cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //       credentials: 'include', // include, *same-origin, omit
    //       headers: {
    //         'Content-Type': 'application/json'
    //       },
    //       redirect: 'follow', // manual, *follow, error
    //       referrerPolicy: 'origin', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    //       body: data
    //     }).then(response => response.text());
    // }, data);
    // console.log("RES", res)
    
  } catch(err) {
    console.log("ERR", err);
  } finally {
    await browser.close();
  }
})();