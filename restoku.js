const puppeteer = require('puppeteer');
const fs = require('fs');
const md5 = require('md5');
const user = process.argv[2];
const pass = process.argv[3];
const from = process.argv[4];
const to = process.argv[5];



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
	const browser = await puppeteer.launch({args: ['--no-sandbox']
});
	try{
		const page = await browser.newPage();
		await page.goto('https://app.restoku.id/login');
		await page.type('[name="username"]', user)
		await page.type('[name="password"]', pass)
		await page.click('[type="submit"]')
		await page.waitForNavigation()

		const id = md5("restoku"+user+from+to);
		await downloadFile(page, id+'.xls', 'https://app.restoku.id/laporan/penjualan/spreadsheet?tgl_awal='+from+'&tgl_akhir='+to, {})
		console.log('/var/www/html/scraping/'+id+'.xls')
		// await page.goto('https://app.restoku.id/laporan/penjualan/spreadsheet?tgl_awal='+from+'&tgl_akhir='+to);
		// const html = await page.content();
		// console.log(html);
	  } catch(err) {
	    console.log(err);
	  } finally {
	    await browser.close();
	  }
})();