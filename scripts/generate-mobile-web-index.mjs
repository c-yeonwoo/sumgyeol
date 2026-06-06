#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const clientDir = path.join(distDir, "client");
function findMainIndex() {
  if (!fs.existsSync(clientDir)) return null;

  const assetsDir = path.join(clientDir, "assets");
  if (!fs.existsSync(assetsDir)) return null;

  const files = fs
    .readdirSync(assetsDir)
    .filter((name) => name.startsWith("index-") && name.endsWith(".js"))
    .map((name) => {
      const fullPath = path.join(assetsDir, name);
      const stats = fs.statSync(fullPath);
      return {
        name,
        path: fullPath,
        size: stats.size,
        mtimeMs: stats.mtimeMs,
      };
    })
    .filter((item) => item.size > 40);

  if (files.length === 0) return null;

  const appCandidate = files
    .map((file) => {
      const mapPath = `${file.path}.map`;
      if (!fs.existsSync(mapPath)) {
        return { name: file.name, size: file.size, score: 0, sourceCount: 0 };
      }

      try {
        const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
        const sources = Array.isArray(map.sources) ? map.sources : [];
        const sourceCount = sources.length;
        const hasSrc =
          sources.some((source) =>
            source.includes("/src/") || source.includes("../../../src/"),
          ) ?? false;

        let score = 0;
        if (hasSrc) score += 5;
        if (sources.some((source) => source.includes("src/router.tsx"))) score += 4;
        if (sources.some((source) => source.includes("src/start.ts"))) score += 3;
        if (sources.some((source) => source.includes("src/routes"))) score += 2;
        if (sourceCount > 150) score += 1;

        return { name: file.name, size: file.size, score, sourceCount };
      } catch (_error) {
        return { name: file.name, size: file.size, score: 0, sourceCount: 0 };
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount;
      if (b.size !== a.size) return b.size - a.size;
      return 0;
    });

  if (appCandidate.length > 0) {
    return appCandidate[0].name;
  }

  files.sort((a, b) => b.mtimeMs - a.mtimeMs || b.size - a.size);
  return files[0].name;
}

function collectCssEntries() {
  const assetsDir = path.join(clientDir, "assets");
  if (!fs.existsSync(assetsDir)) return [];

  return fs
    .readdirSync(assetsDir)
    .filter((name) => name.startsWith("styles-") && name.endsWith(".css"));
}

function createIndexHtml(mainScriptName) {
  const cssLinks = collectCssEntries()
    .map((css) => `    <link rel="stylesheet" href="./assets/${css}" />`)
    .join("\n");
  const bootstrapScript = `<script>
    (() => {
      const pathname = window.location.pathname || "";
      const shouldNormalize =
        pathname === "/index.html" ||
        pathname === "/assets/" ||
        pathname === "/assets" ||
        pathname.endsWith("/index.html");
      if (!shouldNormalize) return;

      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = "/";
      window.history.replaceState({}, "", nextUrl.pathname + nextUrl.search + nextUrl.hash);
    })();
  </script>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>sumgyeol</title>
    <meta name="theme-color" content="#F9F8F6" />
${cssLinks ? `${cssLinks}\n` : ""}
${bootstrapScript}
  </head>
  <body>
    <script type="module" src="./assets/${mainScriptName}"></script>
  </body>
</html>
`;
}

const mainScript = findMainIndex();
if (!mainScript) {
  console.error("[모바일 웹 에셋] index-*.js 파일을 찾지 못했습니다. 먼저 npm run build를 실행하세요.");
  process.exit(1);
}

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
if (!fs.existsSync(clientDir)) fs.mkdirSync(clientDir, { recursive: true });

fs.writeFileSync(path.join(clientDir, "index.html"), createIndexHtml(mainScript));
fs.writeFileSync(path.join(distDir, "index.html"), createIndexHtml(mainScript));

console.log(`[모바일 웹 에셋] 생성 완료: dist/client/index.html (module: ${mainScript})`);
