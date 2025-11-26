/**
 * Static Export Compliance Checker
 * 
 * This script validates that the Next.js app follows static export requirements:
 * - No SSR: getServerSideProps, getInitialProps
 * - No ISR: revalidate, getStaticProps with revalidate
 * - No server actions: 'use server'
 * - No API routes: app/api or pages/api
 * - No server-only imports in non-client components
 * - Dynamic routes must have generateStaticParams
 */

import * as fs from "fs";
import * as path from "path";

const VIOLATIONS = [];
const ROOT_DIR = path.resolve(".");
const APP_DIR = path.join(ROOT_DIR, "app");
const PAGES_DIR = path.join(ROOT_DIR, "pages");

// Forbidden patterns
const FORBIDDEN_PATTERNS = [
  { pattern: /getServerSideProps/, message: "getServerSideProps is not allowed (SSR)" },
  { pattern: /getInitialProps/, message: "getInitialProps is not allowed (SSR)" },
  { pattern: /['"]use server['"]/, message: "'use server' directive is not allowed" },
  { pattern: /from ['"]next\/headers['"]/, message: "next/headers is not allowed in static export" },
  { pattern: /\bcookies\(\)/, message: "cookies() is not allowed in static export" },
  { pattern: /\bheaders\(\)/, message: "headers() is not allowed in static export" },
  { pattern: /from ['"]server-only['"]/, message: "server-only imports are not allowed" },
  { pattern: /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/, message: "dynamic='force-dynamic' is not allowed" },
];

// Check if file should be scanned
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return [".ts", ".tsx", ".js", ".jsx"].includes(ext);
}

// Recursively scan directory
function scanDirectory(dir, relativePath = "") {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, out
      if (["node_modules", ".next", "out", ".git"].includes(entry.name)) {
        continue;
      }

      // Check for API routes
      if (entry.name === "api" && (dir.endsWith("app") || dir.endsWith("pages"))) {
        VIOLATIONS.push({
          file: relPath,
          issue: "API routes are not allowed in static export",
        });
      }

      scanDirectory(fullPath, relPath);
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      scanFile(fullPath, relPath);
    }
  }
}

// Scan individual file
function scanFile(filePath, relPath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // Check forbidden patterns
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      VIOLATIONS.push({
        file: relPath,
        issue: message,
      });
    }
  }

  // Check for ISR revalidate
  if (/export\s+const\s+revalidate\s*=/.test(content) && !/revalidate\s*=\s*(false|0)/.test(content)) {
    VIOLATIONS.push({
      file: relPath,
      issue: "revalidate is not allowed in static export (ISR)",
    });
  }
}

// Check dynamic routes have generateStaticParams
function checkDynamicRoutes(dir, relativePath = "") {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      if (["node_modules", ".next", "out", ".git"].includes(entry.name)) {
        continue;
      }

      // Check if directory name contains dynamic segment [...]
      if (/\[.*\]/.test(entry.name)) {
        // Look for page.tsx/page.ts in this directory
        const pageFiles = ["page.tsx", "page.ts", "page.jsx", "page.js"];
        let hasPage = false;
        let hasGenerateStaticParams = false;

        for (const pageFile of pageFiles) {
          const pagePath = path.join(fullPath, pageFile);
          if (fs.existsSync(pagePath)) {
            hasPage = true;
            const content = fs.readFileSync(pagePath, "utf-8");
            if (/export\s+(async\s+)?function\s+generateStaticParams/.test(content)) {
              hasGenerateStaticParams = true;
            }
            break;
          }
        }

        if (hasPage && !hasGenerateStaticParams) {
          VIOLATIONS.push({
            file: relPath,
            issue: "Dynamic route must export generateStaticParams for static export",
          });
        }
      }

      checkDynamicRoutes(fullPath, relPath);
    }
  }
}

// Main execution
console.log("🔍 Checking static export compliance...\n");

// Scan app directory
if (fs.existsSync(APP_DIR)) {
  console.log("Scanning app/ directory...");
  scanDirectory(APP_DIR, "app");
  checkDynamicRoutes(APP_DIR, "app");
}

// Scan pages directory (if using pages router)
if (fs.existsSync(PAGES_DIR)) {
  console.log("Scanning pages/ directory...");
  scanDirectory(PAGES_DIR, "pages");
}

// Scan components directory
const COMPONENTS_DIR = path.join(ROOT_DIR, "components");
if (fs.existsSync(COMPONENTS_DIR)) {
  console.log("Scanning components/ directory...");
  scanDirectory(COMPONENTS_DIR, "components");
}

// Report results
console.log("\n" + "=".repeat(70));
if (VIOLATIONS.length === 0) {
  console.log("✅ No violations found! Static export compliance verified.");
  console.log("=".repeat(70) + "\n");
  process.exit(0);
} else {
  console.log(`❌ Found ${VIOLATIONS.length} violation(s):\n`);
  VIOLATIONS.forEach(({ file, issue }, index) => {
    console.log(`${index + 1}. ${file}`);
    console.log(`   Issue: ${issue}\n`);
  });
  console.log("=".repeat(70) + "\n");
  console.log("Please fix the violations above before building for static export.");
  process.exit(1);
}

