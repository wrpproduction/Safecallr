const fs = require("fs");
const path = require("path");

const matches = [];

function searchPath(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(targetPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
          searchPath(fullPath);
        }
      } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
        checkFile(fullPath);
      }
    }
  } else if (stat.isFile()) {
    checkFile(targetPath);
  }
}

function checkFile(fullPath) {
  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (
      (line.match(/\bcode\s*:/) || 
       line.match(/\bcode\b/) || 
       line.match(/["']code["']/) || 
       line.match(/data\.code/)) &&
      !line.includes("err.code") &&
      !line.includes("error.code") &&
      !line.includes("statusCode") &&
      !line.includes("res.status") &&
      !line.includes("languageCode") &&
      !line.includes("postalCode") &&
      !line.includes("countryCode") &&
      !line.includes("import ") &&
      !line.includes("//") &&
      !line.includes("codePostal")
    ) {
      matches.push({ file: fullPath, lineNum: index + 1, text: line.trim() });
    }
  });
}

searchPath("src");
searchPath("server");
searchPath("server.ts");
searchPath("functions");

console.log("Total matches:", matches.length);
matches.forEach(m => console.log(`${m.file}:${m.lineNum} -> ${m.text}`));
