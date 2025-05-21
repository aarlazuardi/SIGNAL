/**
 * Script untuk menguji pembuatan jurnal
 * Jalankan dengan: node test-create-journal.js
 */

const { PrismaClient } = require("@prisma/client");

async function testCreateJournal() {
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

  try {
    console.log("Connecting to database...");

    // Coba mendapatkan pengguna pertama untuk test
    const user = await prisma.user.findFirst();

    if (!user) {
      console.error(
        "No users found in the database. Please create a user first."
      );
      return false;
    }

    console.log(`Found user: ${user.name} (${user.id})`);

    // Data test untuk jurnal
    const journalData = {
      title: "Test Journal " + new Date().toISOString(),
      content: "This is a test journal content created for debugging purposes.",
      signature: "", // Kosong untuk jurnal yang tidak ditandatangani
      publicKey: "", // Kosong untuk jurnal yang tidak ditandatangani
      verified: false,
      userId: user.id,
    };

    console.log("Attempting to create journal with data:", journalData);

    // Coba buat jurnal
    const journal = await prisma.journal.create({
      data: journalData,
    });

    console.log("Journal created successfully:", journal);
    return true;
  } catch (error) {
    console.error("Error creating journal:");
    console.error(`Name: ${error.name}`);
    console.error(`Message: ${error.message}`);

    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }

    if (error.meta) {
      console.error("Error metadata:", error.meta);
    }

    console.error("Stack trace:", error.stack);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan test
testCreateJournal().then((success) => {
  console.log("\nTest create journal completed.");
  process.exit(success ? 0 : 1);
});
