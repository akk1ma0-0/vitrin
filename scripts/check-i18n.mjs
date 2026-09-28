#!/usr/bin/env node
/**
 * Fails if any locale file under messages/ is missing a key that
 * messages/en.json has, or has an extra key en.json doesn't (spec section 10).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

const LOCALES = ["en", "es", "pt-BR", "ru", "ro", "de", "fr", "tr", "uk", "pl"];

function flatten(obj, prefix = "") {
  let keys = [];
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(flatten(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadKeys(locale) {
  const raw = readFileSync(path.join(messagesDir, `${locale}.json`), "utf8");
  return flatten(JSON.parse(raw)).sort();
}

const enKeys = loadKeys("en");
let hasError = false;

for (const locale of LOCALES) {
  const keys = loadKeys(locale);
  const keySet = new Set(keys);
  const enSet = new Set(enKeys);

  const missing = enKeys.filter((k) => !keySet.has(k));
  const extra = keys.filter((k) => !enSet.has(k));

  if (missing.length > 0 || extra.length > 0) {
    hasError = true;
    console.error(`\n[${locale}] key mismatch vs en.json:`);
    if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
    if (extra.length) console.error(`  extra:   ${extra.join(", ")}`);
  } else {
    console.log(`[${locale}] OK (${keys.length} keys)`);
  }
}

if (hasError) {
  console.error("\ni18n key check failed.");
  process.exit(1);
}

console.log("\nAll locales have matching keys.");
