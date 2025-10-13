const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// SVG를 PNG로 변환하는 함수
async function convertSvgToPng(svgPath, pngPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(pngPath);
    console.log(`✅ Created: ${pngPath} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Failed to create ${pngPath}:`, error.message);
  }
}

// 간단한 알림 아이콘 SVG 생성
function createNotificationSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="192" height="192">
  <rect width="192" height="192" fill="#3B82F6" rx="38.4"/>
  <path d="M96 40C82 40 72 50 72 64V80C72 86 66 92 60 96L56 98V102H136V98L132 96C126 92 120 86 120 80V64C120 50 110 40 96 40Z" fill="white"/>
  <circle cx="96" cy="110" r="8" fill="white"/>
  <circle cx="118" cy="50" r="14" fill="#EF4444"/>
</svg>
  `.trim();
}

function createBadgeSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
  <circle cx="36" cy="36" r="36" fill="#3B82F6"/>
  <path d="M36 15C30 15 27 18 27 24V30C27 32 25 34 23 36L22 37V38H50V37L49 36C47 34 45 32 45 30V24C45 18 42 15 36 15Z" fill="white"/>
  <circle cx="36" cy="41" r="3" fill="white"/>
</svg>
  `.trim();
}

async function main() {
  const publicDir = path.join(__dirname, "../public");

  // 임시 SVG 파일 생성
  const tempIconSvg = path.join(publicDir, "temp-icon.svg");
  const tempBadgeSvg = path.join(publicDir, "temp-badge.svg");

  fs.writeFileSync(tempIconSvg, createNotificationSvg());
  fs.writeFileSync(tempBadgeSvg, createBadgeSvg());

  console.log("🔄 Converting SVG to PNG...\n");

  // PNG 생성
  await convertSvgToPng(tempIconSvg, path.join(publicDir, "icon-192x192.png"), 192);
  await convertSvgToPng(tempIconSvg, path.join(publicDir, "icon-512x512.png"), 512);
  await convertSvgToPng(tempBadgeSvg, path.join(publicDir, "badge-72x72.png"), 72);

  // 임시 파일 삭제
  fs.unlinkSync(tempIconSvg);
  fs.unlinkSync(tempBadgeSvg);

  console.log("\n✅ All PNG icons created successfully!");
}

main().catch(console.error);
