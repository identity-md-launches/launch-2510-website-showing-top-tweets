import { readFile } from "node:fs/promises";
const modulePath = process.argv
  .find((a) => a.startsWith("--playwright="))
  ?.slice(13);
const { chromium } = await import(modulePath || "playwright");
const font = (await readFile("public/fonts/manrope-latin.woff2")).toString(
  "base64",
);
const frog = (await readFile("public/pepe-ops.svg")).toString("base64");
const icon = (await readFile("public/favicon.svg")).toString("base64");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="UTF-8"><style>
  @font-face{font-family:Manrope;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 800}*{box-sizing:border-box}body{margin:0;background:#091a11;color:#e8eedf;font-family:Manrope,Arial,sans-serif;width:1200px;height:630px;padding:48px 58px;position:relative}header{display:flex;align-items:center;gap:12px;font-size:32px;font-weight:800}header img{width:40px;height:40px}header span{font-size:16px;color:#a4b4a2;border-left:1px solid #294032;padding-left:24px;margin-left:12px;font-weight:600}h1{font-size:68px;line-height:1.08;letter-spacing:-3px;margin:70px 0 22px;font-weight:800;width:600px;position:relative;z-index:1}h1 span{color:#b9ed80}p{font-size:22px;color:#a4b4a2;position:relative;z-index:1}main>img{position:absolute;width:575px;height:340px;right:0;top:165px}.footer{position:absolute;bottom:42px;left:58px;right:58px;padding-top:22px;border-top:1px solid #294032;display:flex;justify-content:space-between;font-size:16px;color:#a4b4a2}.footer strong{color:#b9ed80;font-weight:600}</style></head><body><header><img src="data:image/svg+xml;base64,${icon}" alt="">pond.<span>IdentityMD</span></header><main><h1>The signal in<br>the <span>swamp.</span></h1><p>Top tweets about IdentityMD.</p><img src="data:image/svg+xml;base64,${frog}" alt="AI Pepe operators"></main><div class="footer"><strong>The IdentityMD conversation</strong><span>AI agents · Builders · Community</span></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/og-image.png" });
  console.log("Created public/og-image.png (1200 × 630).");
} finally {
  await browser.close();
}
