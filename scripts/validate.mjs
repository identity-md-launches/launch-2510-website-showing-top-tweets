import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

const argument = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const { chromium, webkit } = await import(
  argument("playwright") || "playwright"
);
const { default: AxeBuilder } = await import(
  argument("axe") || "@axe-core/playwright"
);
const root = resolve("dist");
const out = resolve("test/scratch/validation");
await mkdir(out, { recursive: true });
const posts = JSON.parse(await readFile("src/posts.json", "utf8"));
const result = {
  checks: [],
  limitations: [],
  browserErrors: [],
  resourceErrors: [],
};
let browser;
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(
    new URL(req.url, "http://localhost").pathname,
  );
  if (!path.startsWith("/preview/")) {
    res.writeHead(404).end();
    return;
  }
  const file = resolve(root, path.slice("/preview/".length) || "index.html");
  if (!file.startsWith(root + sep) && file !== root) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".woff2": "font/woff2",
    };
    res
      .writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
      })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/preview/`;
async function check(name, fn) {
  try {
    await fn();
    result.checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    result.checks.push({ name, passed: false, error: error.message });
    console.log(`FAIL ${name}: ${error.message}`);
  }
}
function collectErrors(page) {
  page.on("pageerror", (error) => result.browserErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      result.resourceErrors.push({
        url: new URL(response.url()).pathname,
        status: response.status(),
      });
  });
  page.on("requestfailed", (request) =>
    result.resourceErrors.push({
      path: new URL(request.url()).pathname,
      failure: request.failure()?.errorText,
    }),
  );
}
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  collectErrors(page);
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === new URL(url).origin
      ? route.continue()
      : route.abort(),
  );
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await check("Production export runs at /preview/ with nine posts", async () =>
    assert.equal(await page.locator("article").count(), 9),
  );
  await check("Local font and all image assets load", async () => {
    assert(await page.evaluate(() => document.fonts.check("800 32px Manrope")));
    assert(
      await page.evaluate(() =>
        [...document.images].every((i) => i.complete && i.naturalWidth > 0),
      ),
    );
  });
  await check("Share metadata points to a real image", async () => {
    for (const selector of [
      "title",
      'link[rel="icon"]',
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
    ])
      assert.equal(await page.locator(selector).count(), 1);
    const share = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    assert.equal(
      (await page.request.get(new URL(share, url).href)).status(),
      200,
    );
  });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await check(`No horizontal overflow at ${width}px`, async () => {
      await page.setViewportSize({ width, height: width > 660 ? 1000 : 844 });
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      assert(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
        "page exceeds viewport",
      );
      await page.screenshot({
        path: `${out}/${width}.png`,
        fullPage: width === 1440,
      });
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await check(
    "Product, Explore action, search and first post are on the 390px opening screen",
    async () => {
      for (const selector of [
        "h1",
        ".primary-button",
        "#tweet-search",
        "article:first-child .save-button",
        "article:first-child .open-post",
      ]) {
        const b = await page.locator(selector).boundingBox();
        assert(
          b && b.y >= 0 && b.y + b.height <= 844,
          `${selector} is below fold`,
        );
      }
    },
  );
  await check("Primary Explore link navigates to the feed", async () => {
    await page
      .getByRole("link", { name: "Explore tweets", exact: true })
      .click();
    await page.waitForFunction(
      () => location.hash === "#feed" && window.scrollY > 0,
    );
  });
  for (const [topic, count] of [
    ["AI agents", 4],
    ["Building", 3],
    ["Community", 2],
    ["All posts", 9],
  ]) {
    await check(`Topic filter: ${topic} shows ${count} posts`, async () => {
      await page.getByRole("button", { name: topic, exact: true }).click();
      assert.equal(await page.locator("article").count(), count);
    });
  }
  await check("Search matches handles without case sensitivity", async () => {
    await page.getByRole("searchbox").fill("  RHYNOTIC  ");
    assert.equal(await page.locator("article").count(), 2);
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    assert.equal(await page.locator("article").count(), 9);
  });
  await check("Search empty state recovers through Clear filters", async () => {
    await page.getByRole("searchbox").fill("no-such-pond-post-8354");
    assert.equal(await page.locator("article").count(), 0);
    assert(
      await page
        .getByRole("heading", { name: "Quiet corner of the pond." })
        .isVisible(),
    );
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    assert.equal(await page.locator("article").count(), 9);
  });
  await check("Latest sorting follows publication dates", async () => {
    await page
      .getByRole("combobox", { name: "Sort tweets" })
      .selectOption("latest");
    const dates = await page
      .locator("article time")
      .evaluateAll((items) => items.map((i) => Date.parse(i.dateTime)));
    assert.deepEqual(
      dates,
      [...dates].sort((a, b) => b - a),
    );
  });
  await check("Top liked sorting follows captured likes", async () => {
    await page
      .getByRole("combobox", { name: "Sort tweets" })
      .selectOption("top");
    assert.deepEqual(
      await page.locator("article h3").allTextContents(),
      [...posts]
        .sort(
          (a, b) =>
            b.likes - a.likes || Date.parse(b.date) - Date.parse(a.date),
        )
        .map((p) => p.title),
    );
  });
  await check("Post context expands and collapses", async () => {
    const button = page.locator("article").first().locator(".context-toggle");
    await button.click();
    assert.equal(await button.getAttribute("aria-expanded"), "true");
    assert(
      await page
        .locator("article")
        .first()
        .locator(".post-context")
        .isVisible(),
    );
    await page
      .locator("article")
      .first()
      .getByRole("button", { name: "Hide context" })
      .click();
    assert.equal(await page.locator("article .post-context").count(), 0);
  });
  await check(
    "Bookmark works with keyboard and persists after reload",
    async () => {
      const save = page.locator("article").first().locator(".save-button");
      await save.focus();
      await page.keyboard.press("Space");
      assert.equal(await save.getAttribute("aria-pressed"), "true");
      await page.reload();
      assert.equal(
        await page
          .locator("article")
          .first()
          .locator(".save-button")
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("button", { name: /^Saved/ }).click();
      assert.equal(await page.locator("article").count(), 1);
    },
  );
  await check(
    "Removing the last bookmark gives a recoverable empty state and returns focus",
    async () => {
      await page.getByRole("button", { name: /^Unsave / }).click();
      assert.equal(await page.locator("article").count(), 0);
      await page.waitForFunction(
        () => document.activeElement.id === "feed-heading",
      );
      await page
        .getByRole("button", { name: "Explore tweets", exact: true })
        .click();
      assert.equal(await page.locator("article").count(), 9);
    },
  );
  await check(
    "Copy link reports success and copies the original post URL",
    async () => {
      await page.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (value) => {
              window.__copiedPost = value;
            },
          },
        }),
      );
      await page
        .locator("article")
        .first()
        .getByRole("button", { name: /^Copy link to/ })
        .click();
      assert.equal(
        await page.evaluate(() => window.__copiedPost),
        posts[0].url,
      );
      assert(
        await page.getByText("Post link copied.", { exact: true }).isVisible(),
      );
      await page.getByRole("button", { name: "Dismiss notification" }).click();
    },
  );
  await check(
    "Clipboard denial offers a selected, editable-by-copy fallback",
    async () => {
      await page.evaluate(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              throw Error("denied");
            },
          },
        }),
      );
      await page
        .locator("article")
        .first()
        .getByRole("button", { name: /^Copy link to/ })
        .click();
      const field = page.getByRole("textbox", { name: "Copy this post link" });
      assert.equal(await field.inputValue(), posts[0].url);
      assert(
        await field.evaluate(
          (el) =>
            document.activeElement === el &&
            el.selectionEnd === el.value.length,
        ),
      );
      await page.getByRole("button", { name: "Dismiss", exact: true }).click();
      await page.getByRole("button", { name: "Dismiss notification" }).click();
    },
  );
  await check(
    "About dialog supports keyboard, traps focus, and Escape returns focus",
    async () => {
      const trigger = page.getByRole("button", {
        name: "About this feed",
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      assert(await page.getByRole("dialog").isVisible());
      const close = page.getByRole("button", { name: "Close about this feed" });
      await close.focus();
      await page.keyboard.press("Shift+Tab");
      assert(
        await page.evaluate(() => !!document.activeElement.closest("dialog")),
      );
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert(await trigger.evaluate((el) => document.activeElement === el));
    },
  );
  await check(
    "About dialog closes through backdrop and close control",
    async () => {
      await page
        .getByRole("button", { name: "About this feed", exact: true })
        .click();
      await page.mouse.click(3, 3);
      assert.equal(await page.getByRole("dialog").count(), 0);
      await page
        .getByRole("button", { name: "About this feed", exact: true })
        .click();
      await page.getByRole("button", { name: "Close about this feed" }).click();
      assert.equal(await page.getByRole("dialog").count(), 0);
    },
  );
  await check("Source links match the original public posts", async () => {
    const links = await page
      .locator("article .open-post")
      .evaluateAll((items) => items.map((a) => a.href));
    assert.deepEqual(
      links,
      [...posts]
        .sort(
          (a, b) =>
            b.likes - a.likes || Date.parse(b.date) - Date.parse(a.date),
        )
        .map((p) => p.url),
    );
    assert(
      await page
        .locator("article .open-post")
        .evaluateAll((items) =>
          items.every(
            (a) => a.target === "_blank" && a.rel.includes("noreferrer"),
          ),
        ),
    );
  });
  await check(
    "Brand navigation returns to the top of the feed page",
    async () => {
      await page.getByRole("link", { name: "Pond home" }).click();
      await page.waitForFunction(() => window.scrollY < 2);
      assert.equal(await page.locator("article").count(), 9);
    },
  );
  await check("Keyboard skip link and visible focus work", async () => {
    await page.reload();
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent),
      "Skip to tweets",
    );
    await page.screenshot({ path: `${out}/390-keyboard-focus.png` });
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Building", exact: true }).focus();
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.activeElement).outlineStyle,
      ),
      "solid",
    );
  });
  await check(
    "Reduced motion disables smooth scrolling and active transitions",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).scrollBehavior,
        ),
        "auto",
      );
      assert.equal(
        await page
          .locator(".primary-button")
          .evaluate((el) => getComputedStyle(el).transitionDuration),
        "0s",
      );
    },
  );
  await check(
    "Axe accessibility scan: initial feed and about dialog",
    async () => {
      await page.goto(url);
      const feed = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      await page
        .getByRole("button", { name: "About this feed", exact: true })
        .click();
      const dialog = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      await writeFile(
        `${out}/axe.json`,
        JSON.stringify(
          { feed: feed.violations, dialog: dialog.violations },
          null,
          2,
        ),
      );
      assert.deepEqual(
        [...feed.violations, ...dialog.violations].map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      await page.keyboard.press("Escape");
    },
  );
  await check(
    "Text enlarged to 200% remains readable without horizontal overflow",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await page.screenshot({
        path: `${out}/390-text-200.png`,
        fullPage: true,
      });
      assert(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      );
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "";
      });
    },
  );
  await check(
    "RTL direction retains reflow without horizontal overflow",
    async () => {
      await page.evaluate(() => (document.documentElement.dir = "rtl"));
      assert(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      );
      await page.screenshot({ path: `${out}/390-rtl.png` });
      await page.evaluate(() => (document.documentElement.dir = "ltr"));
    },
  );
  await check(
    "Unavailable storage keeps saving functional for this visit",
    async () => {
      const other = await browser.newContext();
      await other.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw Error("blocked");
        };
        Storage.prototype.setItem = () => {
          throw Error("blocked");
        };
      });
      const p = await other.newPage();
      await p.goto(url);
      await p.locator("article").first().locator(".save-button").click();
      assert(
        await p
          .getByText(
            "Browser storage is unavailable. Saved posts will last for this visit only.",
          )
          .isVisible(),
      );
      await p.getByRole("button", { name: /^Saved/ }).click();
      assert.equal(await p.locator("article").count(), 1);
      await other.close();
    },
  );
  await check("Corrupt stored data recovers to a usable feed", async () => {
    await page.evaluate(() =>
      localStorage.setItem("identitymd-pond:bookmarks:v1", "{broken"),
    );
    await page.reload();
    assert.equal(await page.locator("article").count(), 9);
    assert.equal(
      await page.locator('article .save-button[aria-pressed="true"]').count(),
      0,
    );
    await page.evaluate(() => localStorage.clear());
  });
  await check("Zero page errors or failed local resources", async () => {
    assert.deepEqual(result.browserErrors, []);
    assert.deepEqual(result.resourceErrors, []);
  });
  await browser.close();
  browser = null;
  try {
    browser = await webkit.launch({ headless: true });
    const safari = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await check(
      "WebKit topic filter, search, bookmark and about dialog",
      async () => {
        await safari.goto(url);
        await safari
          .getByRole("button", { name: "AI agents", exact: true })
          .click();
        assert.equal(await safari.locator("article").count(), 4);
        await safari.getByRole("searchbox").fill("8004");
        assert.equal(await safari.locator("article").count(), 1);
        await safari.locator("article").first().locator(".save-button").click();
        await safari.getByRole("button", { name: /^Saved/ }).click();
        assert.equal(await safari.locator("article").count(), 1);
        await safari
          .getByRole("button", { name: "About this feed", exact: true })
          .click();
        assert(await safari.getByRole("dialog").isVisible());
        await safari.keyboard.press("Escape");
        assert.equal(await safari.getByRole("dialog").count(), 0);
      },
    );
  } catch {
    result.limitations.push(
      "WebKit could not launch in the available browser runtime; Safari behavior is unverified.",
    );
    console.log(
      "LIMITATION WebKit did not launch; Safari interactions unverified.",
    );
  }
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  result.summary = {
    passed: result.checks.filter((c) => c.passed).length,
    failed: result.checks.filter((c) => !c.passed).length,
  };
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result.summary));
  if (result.summary.failed) process.exitCode = 1;
}
