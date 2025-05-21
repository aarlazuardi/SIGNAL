# Script PowerShell untuk menambahkan kolom originalHash ke tabel SignedDocument
# Simpan sebagai add-original-hash.ps1

# Coba ambil DATABASE_URL dari .env file
$envPath = "d:\Pendidikan Aar\3. KULIAH\Sems4\SIGNAL\.env"
$envContent = Get-Content $envPath -Raw

# Ekstrak DATABASE_URL menggunakan regex
$regex = 'DATABASE_URL\s*=\s*"([^"]+)"'
$match = [regex]::Match($envContent, $regex)

if ($match.Success) {
    $databaseUrl = $match.Groups[1].Value
    Write-Host "Database URL ditemukan di file .env"
    
    # Persiapkan SQL command
    $sqlCommand = @"
-- Tambahkan kolom originalHash ke tabel SignedDocument jika belum ada
ALTER TABLE "SignedDocument" ADD COLUMN IF NOT EXISTS "originalHash" TEXT;

-- Tambahkan index pada originalHash untuk pencarian yang lebih cepat
CREATE INDEX IF NOT EXISTS "SignedDocument_originalHash_idx" ON "SignedDocument"("originalHash");
"@

    Write-Host "SQL yang akan dijalankan:"
    Write-Host $sqlCommand
    
    Write-Host "`n===== INSTRUKSI MANUAL ====="
    Write-Host "Ini adalah URL database Anda:"
    Write-Host $databaseUrl
    Write-Host "`nSilakan ikuti langkah-langkah ini:"
    Write-Host "1. Buka pgAdmin atau DBeaver dan buat koneksi baru menggunakan URL di atas"
    Write-Host "2. Atau gunakan psql jika diinstal dengan perintah: psql $databaseUrl"
    Write-Host "3. Jalankan perintah SQL berikut:"
    Write-Host $sqlCommand
    Write-Host "===== AKHIR INSTRUKSI ====="
    
    # Coba jalankan perintah menggunakan psql jika tersedia
    Write-Host "`nMencoba menjalankan perintah secara otomatis menggunakan psql..."
    try {
        # Simpan SQL ke file sementara
        $tempFile = [System.IO.Path]::GetTempFileName()
        $sqlCommand | Out-File -FilePath $tempFile -Encoding utf8
        
        # Jalankan menggunakan psql
        psql $databaseUrl -f $tempFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Perintah SQL berhasil dijalankan! Kolom originalHash telah ditambahkan."
        } else {
            Write-Host "Gagal menjalankan perintah SQL. Silakan gunakan metode manual yang dijelaskan di atas."
        }
        
        # Hapus file sementara
        Remove-Item $tempFile
    }
    catch {
        Write-Host "Tidak dapat menjalankan psql. Anda harus menjalankan perintah SQL secara manual."
        Write-Host "Pesan error: $_"
    }
} else {
    Write-Host "Tidak dapat menemukan DATABASE_URL di file .env. Pastikan format file .env benar."
}
