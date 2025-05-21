# Script untuk memeriksa dan memperbaiki data jurnal
# Script ini menggunakan Prisma Studio untuk membantu memvisualisasi dan memperbaiki data di database

Write-Host "=== SIGNAL JOURNAL DATA CHECKER ===" -ForegroundColor Cyan
Write-Host "Tool ini membantu Anda memeriksa dan memperbaiki data jurnal yang bermasalah" -ForegroundColor Cyan
Write-Host ""

# Fungsi untuk menjalankan Prisma Studio (visualisasi database)
function Start-PrismaStudio {
    Write-Host "Memulai Prisma Studio untuk melihat data database..." -ForegroundColor Yellow
    Write-Host "Gunakan UI Prisma Studio untuk memeriksa data jurnal yang tidak valid" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        Write-Host "Menjalankan: npx prisma studio" -ForegroundColor Gray
        npx prisma studio
    }
    catch {
        Write-Host "Error menjalankan Prisma Studio: $_" -ForegroundColor Red
        Write-Host "Pastikan Prisma diinstal dengan menjalankan: npm install @prisma/client" -ForegroundColor Red
    }
}

# Fungsi untuk memeriksa database dengan script sederhana
function Test-Database {
    Write-Host "Memeriksa koneksi database dan struktur data..." -ForegroundColor Yellow
    
    try {
        Write-Host "Menjalankan script tes database..." -ForegroundColor Gray
        Write-Host "node scripts/test-db-connection.js" -ForegroundColor Gray
        node scripts/test-db-connection.js
    }
    catch {
        Write-Host "Error menjalankan tes database: $_" -ForegroundColor Red
    }
}

# Fungsi untuk menjalankan script diagnostik dashboard
function Test-Dashboard {
    Write-Host "Menjalankan diagnostik dashboard..." -ForegroundColor Yellow
    
    try {
        Write-Host "Menjalankan: node scripts/fix-dashboard.js" -ForegroundColor Gray
        node scripts/fix-dashboard.js
    }
    catch {
        Write-Host "Error menjalankan diagnostik dashboard: $_" -ForegroundColor Red
    }
}

# Menu utama
function Show-Menu {
    Write-Host ""
    Write-Host "MENU DIAGNOSTIK:" -ForegroundColor Cyan
    Write-Host "1. Periksa koneksi database dan struktur data" -ForegroundColor White
    Write-Host "2. Lihat dan edit data jurnal dengan Prisma Studio" -ForegroundColor White
    Write-Host "3. Jalankan diagnostik dashboard" -ForegroundColor White
    Write-Host "4. Analisis masalah loop di dashboard" -ForegroundColor White
    Write-Host "5. Keluar" -ForegroundColor White
    Write-Host ""
    Write-Host "Pilih opsi (1-5): " -ForegroundColor Cyan -NoNewline
    
    $choice = Read-Host
    
    switch ($choice) {
        "1" { Test-Database; Show-Menu }
        "2" { Start-PrismaStudio; Show-Menu }
        "3" { Test-Dashboard; Show-Menu }
        "4" { 
            Write-Host "Menjalankan: node scripts/analyze-dashboard-loop.js" -ForegroundColor Gray
            node scripts/analyze-dashboard-loop.js
            Show-Menu 
        }
        "5" { 
            Write-Host "Keluar dari tool diagnostik" -ForegroundColor Yellow
            exit 
        }
        default { 
            Write-Host "Pilihan tidak valid. Silakan pilih 1-5." -ForegroundColor Red
            Show-Menu 
        }
    }
}

# Mulai program
Write-Host "Menjalankan diagnosa untuk masalah dashboard..." -ForegroundColor Green
Write-Host "Tool ini akan membantu Anda memeriksa dan memperbaiki data jurnal yang mungkin menyebabkan masalah loop." -ForegroundColor White
Write-Host ""
Write-Host "TIPS PERBAIKAN:" -ForegroundColor Green
Write-Host "1. Periksa apakah format tanggal pada jurnal valid" -ForegroundColor White
Write-Host "2. Pastikan semua jurnal memiliki ID dan title yang valid" -ForegroundColor White
Write-Host "3. Jika ada data jurnal yang rusak, perbaiki atau hapus dari database" -ForegroundColor White
Write-Host "4. Restart server setelah memperbaiki data" -ForegroundColor White
Write-Host ""

Show-Menu
