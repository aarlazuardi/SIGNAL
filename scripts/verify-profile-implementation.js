const fs = require("fs");
const path = require("path");

// Function to check if a file exists and contains a specific string
function checkFileAndContent(filePath, searchString = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, containsString: false };
    }

    if (searchString === null) {
      return { exists: true, containsString: null };
    }

    const content = fs.readFileSync(filePath, "utf8");
    return {
      exists: true,
      containsString: content.includes(searchString),
    };
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error);
    return { exists: false, containsString: false };
  }
}

// Main validation function
function validateProfileImplementation() {
  const results = {
    profileComponent: checkFileAndContent(
      path.join(process.cwd(), "components", "profile-page.jsx")
    ),
    profileRoute: checkFileAndContent(
      path.join(process.cwd(), "app", "profile", "page.jsx")
    ),
    profileApi: checkFileAndContent(
      path.join(process.cwd(), "app", "api", "profile", "update", "route.js")
    ),
    dashboardLink: checkFileAndContent(
      path.join(process.cwd(), "components", "dashboard.jsx"),
      'href="/profile"'
    ),
    prismaSchema: checkFileAndContent(
      path.join(process.cwd(), "prisma", "schema.prisma"),
      "avatar"
    ),
  };

  // Output results
  console.log("\n===== Profile Implementation Validation =====");
  console.log(
    `Profile Component: ${results.profileComponent.exists ? "✅" : "❌"}`
  );
  console.log(`Profile Route: ${results.profileRoute.exists ? "✅" : "❌"}`);
  console.log(`Profile API: ${results.profileApi.exists ? "✅" : "❌"}`);
  console.log(
    `Dashboard Link: ${results.dashboardLink.containsString ? "✅" : "❌"}`
  );
  console.log(
    `Prisma Schema Avatar: ${results.prismaSchema.containsString ? "✅" : "❌"}`
  );

  const allPassed = Object.values(results).every(
    (result) =>
      result.exists === true &&
      (result.containsString === true || result.containsString === null)
  );

  console.log("\n===== Overall Result =====");
  console.log(allPassed ? "✅ All checks passed!" : "❌ Some checks failed!");
  console.log("===============================\n");
}

// Run validation
validateProfileImplementation();
