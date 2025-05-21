// Direct database access script - Simple version
// This script will directly execute an ALTER TABLE statement against your database
// to add the originalHash field to the SignedDocument table

// Get the database URL from the .env file without requiring dotenv module
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Function to read DATABASE_URL from .env
function getDatabaseUrl() {
  try {
    const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error reading .env file:", error.message);
    return null;
  }
}

// Get the database URL
const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env file");
  process.exit(1);
}

console.log("Database URL found in .env file");

// Generate a direct PSQL command to run the SQL
const command = `
echo ALTER TABLE "SignedDocument" ADD COLUMN IF NOT EXISTS "originalHash" TEXT; | psql "${databaseUrl}"
echo CREATE INDEX IF NOT EXISTS "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash"); | psql "${databaseUrl}"
`;

console.log("Executing SQL command to add originalHash field...");
console.log("SQL to execute:");
console.log(
  'ALTER TABLE "SignedDocument" ADD COLUMN IF NOT EXISTS "originalHash" TEXT;'
);
console.log(
  'CREATE INDEX IF NOT EXISTS "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");'
);

// Print instructions for manual execution
console.log("");
console.log("===== MANUAL EXECUTION INSTRUCTIONS =====");
console.log(
  "Since running the command directly might not work due to environment constraints,"
);
console.log(
  "we recommend manually running the SQL statements on your database."
);
console.log("");
console.log(
  "1. Connect to your PostgreSQL database using psql, pgAdmin, or any other PostgreSQL client"
);
console.log("2. Run the following SQL commands:");
console.log(
  '   ALTER TABLE "SignedDocument" ADD COLUMN IF NOT EXISTS "originalHash" TEXT;'
);
console.log(
  '   CREATE INDEX IF NOT EXISTS "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");'
);
console.log("");
console.log("===== END OF INSTRUCTIONS =====");

// Try executing the command, but don't worry if it fails
try {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error executing SQL command:", error.message);
      return;
    }
    if (stderr) {
      console.error("SQL command stderr:", stderr);
      return;
    }
    console.log("SQL command output:", stdout);
    console.log(
      "The originalHash field has been successfully added to the SignedDocument table!"
    );
  });
} catch (error) {
  console.error("Error executing SQL command:", error.message);
}
