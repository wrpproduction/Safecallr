const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes("node_modules") && !file.includes(".git") && !file.includes("dist")) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(".");
const results = [];

files.forEach(f => {
  const content = fs.readFileSync(f, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    // Regex for firestore read/writes of code property
    if (
      (line.includes("code:") || 
       line.includes("code,") || 
       line.includes(".code") || 
       line.includes("['code']") || 
       line.includes('["code"]')) &&
      !line.includes("err.code") &&
      !line.includes("error.code") &&
      !line.includes("auth/") &&
      !line.includes("statusCode") &&
      !line.includes("languageCode") &&
      !line.includes("countryCode") &&
      !line.includes("postalCode") &&
      !line.includes("codePostal") &&
      !line.includes("<code") &&
      !line.includes("</code>")
    ) {
      results.push({ file: f, line: idx + 1, text: line.trim() });
    }
  });
});

console.log(JSON.stringify(results, null, 2));
