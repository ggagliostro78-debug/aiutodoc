const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const entries = [
  "index.html",
  "logo.jpg",
  "manifest.webmanifest",
  "service-worker.js",
  "src",
  "assets"
];

function copyRecursive(source, target) {
  const baseName = path.basename(source).toLowerCase();
  if (baseName === "thumbs.db") return;

  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

if (fs.existsSync(dist)) {
  for (const entry of fs.readdirSync(dist)) {
    fs.rmSync(path.join(dist, entry), { recursive: true, force: true });
  }
} else {
  fs.mkdirSync(dist, { recursive: true });
}

for (const entry of entries) {
  copyRecursive(path.join(root, entry), path.join(dist, entry));
}

console.log(`Netlify static build complete: ${path.relative(root, dist)}`);
