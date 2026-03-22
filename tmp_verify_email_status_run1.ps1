$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'
$loginBody = @{ email = 'admin@wearhouse.com'; password = 'wearhouse' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/quick-login" -ContentType 'application/json' -Body $loginBody
$token = $login.token
$orderId = 180001
$result = Invoke-RestMethod -Method Get -Uri "$base/api/orders/$orderId/email-status" -Headers @{ Authorization = "Bearer $token" }
$result | ConvertTo-Json -Depth 10 | Set-Content -Path 'c:\websiteu1\tmp_email_status_180001.json' -Encoding UTF8
Write-Output 'Wrote c:\websiteu1\tmp_email_status_180001.json'
