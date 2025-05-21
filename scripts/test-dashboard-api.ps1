# Skrip PowerShell untuk menguji endpoint API dashboard
$token = Read-Host -Prompt "Masukkan token autentikasi Anda (signal_auth_token dari localStorage)"

Write-Host "`n=== Menguji Endpoint API Dashboard ===`n" -ForegroundColor Cyan

# Membuat header dengan token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Mencoba mengambil jurnal dari API
try {
    Write-Host "Mengambil data jurnal dari API..." -ForegroundColor Yellow
    
    # Menggunakan Invoke-RestMethod untuk memanggil API
    # Perhatikan bahwa ini mengasumsikan API berjalan di localhost:3000
    # Ganti URL jika perlu
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/journal/mine" -Headers $headers -Method Get -ErrorAction Stop
    
    Write-Host "`n✓ Berhasil terhubung ke API!" -ForegroundColor Green
    Write-Host "`nData jurnal yang dikembalikan:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3
}
catch {
    Write-Host "`n❌ Gagal mengambil data jurnal" -ForegroundColor Red
    Write-Host "Detail error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Red
        }
        catch {
            Write-Host "Tidak dapat membaca response body" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Rekomendasi Perbaikan ===`n" -ForegroundColor Cyan
Write-Host "1. Periksa apakah token autentikasi masih valid" -ForegroundColor White
Write-Host "2. Pastikan server API berjalan dengan benar" -ForegroundColor White
Write-Host "3. Periksa error di console browser untuk informasi lebih lanjut" -ForegroundColor White
Write-Host "4. Pastikan format data jurnal yang dikembalikan sesuai dengan yang diharapkan dashboard" -ForegroundColor White
Write-Host "5. Coba restart server Next.js dengan 'npm run dev'" -ForegroundColor White

Write-Host "`nUntuk menjalankan server pengembangan, gunakan: npm run dev" -ForegroundColor Yellow
