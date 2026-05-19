import { copyFileSync, existsSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const manifestPath = join(rootDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const version = String(manifest.version || "").trim();

if (!version) {
  throw new Error("manifest.json 缺少 version，无法打包。");
}

const distDir = join(rootDir, "dist");
const releaseName = `bilitato-v${version}`;
const releaseDir = join(distDir, releaseName);
const zipPath = join(distDir, `${releaseName}.zip`);

const files = [
  "manifest.json",
  "background.js",
  "content.js",
  "content.css",
  "inject.js",
  "logger.js",
  "html2canvas.min.js",
  "markdownRenderer.js",
  "permission-request.html",
  "permission-request.js",
  "rules.json",
  "subtitleProcessor.js"
];

const directories = [
  "_locales",
  "assets",
  "content",
  "utils"
];

function copyRequiredFile(relativePath) {
  const source = join(rootDir, relativePath);
  if (!existsSync(source)) {
    throw new Error(`缺少上架必需文件：${relativePath}`);
  }
  copyFileSync(source, join(releaseDir, basename(relativePath)));
}

function copyRequiredDirectory(relativePath) {
  const source = join(rootDir, relativePath);
  const destination = join(releaseDir, relativePath);
  if (!existsSync(source)) {
    throw new Error(`缺少上架必需目录：${relativePath}`);
  }
  execFileSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "$ErrorActionPreference='Stop'; Copy-Item -LiteralPath $env:COPY_SOURCE -Destination $env:COPY_DESTINATION -Recurse -Force"
  ], {
    stdio: "inherit",
    env: {
      ...process.env,
      COPY_SOURCE: source,
      COPY_DESTINATION: destination
    }
  });
}

function buildRelease() {
  rmSync(releaseDir, { recursive: true, force: true });
  rmSync(zipPath, { force: true });
  mkdirSync(releaseDir, { recursive: true });

  files.forEach(copyRequiredFile);
  directories.forEach(copyRequiredDirectory);

  execFileSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "$ErrorActionPreference='Stop'; $source = Join-Path $env:RELEASE_DIR '*'; Compress-Archive -Path $source -DestinationPath $env:RELEASE_ZIP -Force"
  ], {
    stdio: "inherit",
    env: {
      ...process.env,
      RELEASE_DIR: releaseDir,
      RELEASE_ZIP: zipPath
    }
  });
  console.log(`Release package ready: ${zipPath}`);
}

try {
  buildRelease();
} catch (error) {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
}
