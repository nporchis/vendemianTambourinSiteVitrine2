/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const ids = process.argv.slice(2);
let content = fs.readFileSync("tasks.md", "utf-8");
for (const t of ids) {
  const re = new RegExp("- \\[ \\] (" + t + "\\b)");
  content = content.replace(re, "- [X] $1");
}
fs.writeFileSync("tasks.md", content);
console.log("marked", ids.length);
