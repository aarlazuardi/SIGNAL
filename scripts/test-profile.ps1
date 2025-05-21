# PowerShell script to test profile components
Write-Host "`n🧪 Testing Profile Page Functionality" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

$profileComponentPath = Join-Path -Path $PWD -ChildPath "components\profile-page.jsx"
if (Test-Path $profileComponentPath) {
    Write-Host "✅ Profile component exists" -ForegroundColor Green
} else {
    Write-Host "❌ Profile component not found!" -ForegroundColor Red
    exit 1
}

$profileRoutePath = Join-Path -Path $PWD -ChildPath "app\profile\page.jsx"
if (Test-Path $profileRoutePath) {
    Write-Host "✅ Profile route exists" -ForegroundColor Green
} else {
    Write-Host "❌ Profile route not found!" -ForegroundColor Red
    exit 1
}

$profileApiPath = Join-Path -Path $PWD -ChildPath "app\api\profile\update\route.js"
if (Test-Path $profileApiPath) {
    Write-Host "✅ Profile API exists" -ForegroundColor Green
} else {
    Write-Host "❌ Profile API not found!" -ForegroundColor Red
    exit 1
}

$dashboardPath = Join-Path -Path $PWD -ChildPath "components\dashboard.jsx"
if (Test-Path $dashboardPath) {
    $dashboardContent = Get-Content -Path $dashboardPath -Raw
    if ($dashboardContent -match 'href="/profile"') {
        Write-Host "✅ Dashboard has profile link" -ForegroundColor Green
    } else {
        Write-Host "❌ Dashboard is missing profile link!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Dashboard component not found!" -ForegroundColor Red
    exit 1
}

$schemaPath = Join-Path -Path $PWD -ChildPath "prisma\schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content -Path $schemaPath -Raw
    if ($schemaContent -match 'avatar' -and $schemaContent -match 'signature') {
        Write-Host "✅ Prisma schema has required user fields" -ForegroundColor Green
    } else {
        Write-Host "❌ Prisma schema missing required user fields!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Prisma schema not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All profile page tests passed!" -ForegroundColor Green
Write-Host "`nTo test functionality manually:" -ForegroundColor Yellow
Write-Host "1. Start the dev server: npm run dev" -ForegroundColor Yellow
Write-Host "2. Log in to the application" -ForegroundColor Yellow
Write-Host "3. Navigate to the profile page from dashboard" -ForegroundColor Yellow
Write-Host "4. Try updating profile information" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan
