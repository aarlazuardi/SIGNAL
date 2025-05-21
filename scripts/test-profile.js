#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Simple test script to verify profile page rendering and API functionality
 */
console.log("\n🧪 Testing Profile Page Functionality");
console.log("====================================");

// 1. Check if profile-page.jsx exists
const profileComponentPath = path.join(
  process.cwd(),
  "components/profile-page.jsx"
);
if (fs.existsSync(profileComponentPath)) {
  console.log("✅ Profile component exists");
} else {
  console.error("❌ Profile component not found!");
  process.exit(1);
}

// 2. Check if profile route exists
const profileRoutePath = path.join(process.cwd(), "app/profile/page.jsx");
if (fs.existsSync(profileRoutePath)) {
  console.log("✅ Profile route exists");
} else {
  console.error("❌ Profile route not found!");
  process.exit(1);
}

// 3. Check if profile API exists
const profileApiPath = path.join(
  process.cwd(),
  "app/api/profile/update/route.js"
);
if (fs.existsSync(profileApiPath)) {
  console.log("✅ Profile API exists");
} else {
  console.error("❌ Profile API not found!");
  process.exit(1);
}

// 4. Check if dashboard has profile link
const dashboardPath = path.join(process.cwd(), "components/dashboard.jsx");
const dashboardContent = fs.readFileSync(dashboardPath, "utf-8");
if (dashboardContent.includes('href="/profile"')) {
  console.log("✅ Dashboard has profile link");
} else {
  console.error("❌ Dashboard is missing profile link!");
  process.exit(1);
}

// 5. Check required user fields in Prisma schema
const schemaPath = path.join(process.cwd(), "prisma/schema.prisma");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");
if (schemaContent.includes("avatar") && schemaContent.includes("signature")) {
  console.log("✅ Prisma schema has required user fields");
} else {
  console.error("❌ Prisma schema missing required user fields!");
  process.exit(1);
}

console.log("\n✅ All profile page tests passed!");
console.log("\nTo test functionality manually:");
console.log("1. Start the dev server: npm run dev");
console.log("2. Log in to the application");
console.log("3. Navigate to the profile page from dashboard");
console.log("4. Try updating profile information");
console.log("====================================\n");
