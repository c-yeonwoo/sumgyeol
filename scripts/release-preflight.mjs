#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
  }

  return env;
}

const envFiles = [
  path.join(root, ".env"),
  path.join(root, ".env.local"),
  path.join(root, ".env.production"),
  path.join(root, ".env.production.local"),
];

for (const file of envFiles) {
  const data = loadEnvFile(file);
  for (const [key, value] of Object.entries(data)) {
    if (process.env[key] === undefined && value !== "") {
      process.env[key] = value;
    }
  }
}

const requiredFiles = [
  "package.json",
  "capacitor.config.ts",
  "public/app-icon.png",
  "public/icon-192.png",
  "public/icon-512.png",
  "vite.config.ts",
  "tsconfig.json",
  "public/manifest.webmanifest",
];

const requiredEnv = {
  VITE_SUPABASE_URL: {
    aliases: ["SUPABASE_URL"],
  },
  VITE_SUPABASE_PUBLISHABLE_KEY: {
    aliases: ["SUPABASE_PUBLISHABLE_KEY"],
  },
};

const isSet = (value) => value !== undefined && value !== null && String(value).trim().length > 0;

Object.entries(requiredEnv).forEach(([requiredKey, config]) => {
  if (isSet(process.env[requiredKey])) return;
  for (const alias of config.aliases) {
    if (isSet(process.env[alias])) {
      process.env[requiredKey] = process.env[alias];
      break;
    }
  }
});

const missingFiles = requiredFiles.filter((item) => {
  const filePath = path.join(root, item);
  return !fs.existsSync(filePath);
});

const missingEnv = [];
for (const key of Object.keys(requiredEnv)) {
  if (!isSet(process.env[key])) {
    missingEnv.push(key);
  }
}

const packageScripts = {
  build: "build",
  releasePreflight: "release:preflight",
  capBuildIos: "cap:build:ios",
  capBuildAndroid: "cap:build:android",
};

let missingScripts = [];
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  missingScripts = Object.entries(packageScripts)
    .filter(([, scriptKey]) => {
      return !pkg.scripts || !pkg.scripts[scriptKey];
    })
    .map(([, scriptKey]) => scriptKey);
} catch (err) {
  missingScripts = Object.values(packageScripts);
}

const warnings = [];
if (!fs.existsSync(path.join(root, "dist"))) {
  warnings.push("dist 디렉터리가 아직 없습니다. 릴리스 전 npm run build를 실행하세요.");
}
if (!fs.existsSync(path.join(root, "dist/client"))) {
  warnings.push("dist/client 디렉터리가 아직 없습니다. 릴리스 전 npm run build를 실행하세요.");
}
if (!fs.existsSync(path.join(root, "dist/client/index.html"))) {
  warnings.push("dist/client/index.html이 없습니다. 릴리스 전 npm run build를 실행하면 생성됩니다.");
}

if (!fs.existsSync(path.join(root, "node_modules"))) {
  warnings.push("node_modules가 없습니다. npm install 실행이 필요합니다.");
}

const lines = [];
let hasError = false;

if (missingFiles.length > 0) {
  hasError = true;
  lines.push("[오류] 누락 파일:");
  for (const file of missingFiles) lines.push(`- ${file}`);
}

if (missingScripts.length > 0) {
  hasError = true;
  lines.push("[오류] package.json 스크립트 누락:");
  for (const script of missingScripts) lines.push(`- ${script}`);
}

if (missingEnv.length > 0) {
  hasError = true;
  lines.push("[오류] 환경변수 미설정(빌드/실행 시 필요):");
  for (const item of missingEnv) lines.push(`- ${item}`);
}

if (warnings.length > 0) {
  lines.push("[주의] 점검 메시지:");
  for (const warn of warnings) lines.push(`- ${warn}`);
}

if (hasError) {
  console.log("\n릴리즈 프리플라이트 실패:\n");
  console.log(lines.join("\n"));
  process.exit(1);
}

console.log("\n릴리즈 프리플라이트 통과:\n- 필수 파일: OK\n- 필수 스크립트: OK\n- 필수 환경변수: OK\n");
if (warnings.length > 0) {
  console.log(lines.join("\n"));
}
console.log("\n권장 다음 단계:\n- npm run release:ios 또는 npm run release:android 실행\n");
