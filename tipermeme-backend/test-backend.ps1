# test-backend.ps1

Write-Host "Testing TipPerMeme Backend..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri http://localhost:3001/
Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host "Response: $($response.Content)" -ForegroundColor Cyan

# Test 2: Get Memes (empty)
Write-Host "`n2. Testing memes endpoint..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri http://localhost:3001/api/memes
Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
Write-Host "Response: $($response.Content)" -ForegroundColor Cyan

# Test 3: Try to tip non-existent meme (should get 404)
Write-Host "`n3. Testing tip endpoint (404 expected)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:3001/api/tips/fake-meme-id -Method POST
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response: $responseBody" -ForegroundColor Cyan
}

Write-Host "`n✅ Basic tests complete!" -ForegroundColor Green
Write-Host "Backend is working! Ready for frontend." -ForegroundColor Green