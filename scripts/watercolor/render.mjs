import { chromium } from "playwright";
import fs from "node:fs";
const dir = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [n,w,h] of [["welcome",1560,1320],["lesson1",1400,1040],["lesson2",1400,1040]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<body style="margin:0">${fs.readFileSync(dir+"/"+n+".svg","utf8")}</body>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${dir}/${n}.jpg`, type: "jpeg", quality: 82 });
  await p.close();
}
await b.close();
