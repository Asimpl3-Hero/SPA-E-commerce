console.log("🟢 coverage-summary script START");
// Review cov: node scripts/coverage-summary.cjs
const fs = require("fs");
const path = require("path");

const coveragePath = path.resolve(
  __dirname,
  "../coverage/coverage-summary.json"
);

if (!fs.existsSync(coveragePath)) {
  console.error("❌ No se encontró coverage-summary.json");
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
const total = summary.total;

const ok = (pct) => (pct >= 80 ? "✅" : "❌");

console.log("\n📊 Cobertura General del Frontend:\n");
console.log(`Statements: ${total.statements.pct}% ${ok(total.statements.pct)}`);
console.log(`Branches:   ${total.branches.pct}% ${ok(total.branches.pct)}`);
console.log(`Functions:  ${total.functions.pct}% ${ok(total.functions.pct)}`);
console.log(`Lines:      ${total.lines.pct}% ${ok(total.lines.pct)}\n`);
