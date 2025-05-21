# Test script for profile functionality in Windows PowerShell

# Banner
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SIGNAL Profile Feature Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host

# Start the development server
Write-Host "🚀 Starting the development server..." -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser" -ForegroundColor Yellow
Write-Host "Login with your credentials and test the profile page" -ForegroundColor Yellow
Write-Host

# Steps to test
Write-Host "📋 Test Checklist:" -ForegroundColor Magenta
Write-Host "1. ⬜ Log in to the application" -ForegroundColor White
Write-Host "2. ⬜ Navigate to the dashboard" -ForegroundColor White
Write-Host "3. ⬜ Click the 'Profil' button" -ForegroundColor White
Write-Host "4. ⬜ Verify profile page loads correctly" -ForegroundColor White
Write-Host "5. ⬜ Test avatar upload with a valid image (<2MB)" -ForegroundColor White
Write-Host "6. ⬜ Verify avatar preview appears" -ForegroundColor White
Write-Host "7. ⬜ Test avatar upload with invalid file type (should show error)" -ForegroundColor White
Write-Host "8. ⬜ Test avatar upload with file >2MB (should show error)" -ForegroundColor White
Write-Host "9. ⬜ Update name field" -ForegroundColor White
Write-Host "10. ⬜ Test empty name validation (should show error)" -ForegroundColor White
Write-Host "11. ⬜ Verify email field is read-only" -ForegroundColor White
Write-Host "12. ⬜ Set a new passhash" -ForegroundColor White
Write-Host "13. ⬜ Test passhash validation (min 6 chars)" -ForegroundColor White
Write-Host "14. ⬜ Test passhash confirmation validation" -ForegroundColor White
Write-Host "15. ⬜ Save changes and verify toast notification" -ForegroundColor White
Write-Host "16. ⬜ Reload the page and verify changes persisted" -ForegroundColor White
Write-Host "17. ⬜ Test navigation back to dashboard" -ForegroundColor White
Write-Host

# Prompt to start the server
$start = Read-Host "Press Enter to start the dev server or Ctrl+C to exit"
npm run dev
