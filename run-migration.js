// Simple script to run the Prisma migration
const { execSync } = require("child_process");

try {
  console.log("Running Prisma migration...");
  execSync("npx prisma migrate dev --name add_original_hash", {
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log("Migration successful!");
} catch (error) {
  console.error("Migration failed:", error.message);
}
