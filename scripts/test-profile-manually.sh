#!/bin/bash
# Test script for profile functionality

# Banner
echo "========================================"
echo "SIGNAL Profile Feature Test Script"
echo "========================================"
echo

# Start the development server
echo "🚀 Starting the development server..."
echo "Open http://localhost:3000 in your browser"
echo "Login with your credentials and test the profile page"
echo

# Steps to test
echo "📋 Test Checklist:"
echo "1. ⬜ Log in to the application"
echo "2. ⬜ Navigate to the dashboard"
echo "3. ⬜ Click the 'Profil' button"
echo "4. ⬜ Verify profile page loads correctly"
echo "5. ⬜ Test avatar upload with a valid image (<2MB)"
echo "6. ⬜ Verify avatar preview appears"
echo "7. ⬜ Test avatar upload with invalid file type (should show error)"
echo "8. ⬜ Test avatar upload with file >2MB (should show error)"
echo "9. ⬜ Update name field"
echo "10. ⬜ Test empty name validation (should show error)"
echo "11. ⬜ Verify email field is read-only"
echo "12. ⬜ Set a new passhash"
echo "13. ⬜ Test passhash validation (min 6 chars)"
echo "14. ⬜ Test passhash confirmation validation"
echo "15. ⬜ Save changes and verify toast notification"
echo "16. ⬜ Reload the page and verify changes persisted"
echo "17. ⬜ Test navigation back to dashboard"
echo

# Start the dev server
npm run dev
