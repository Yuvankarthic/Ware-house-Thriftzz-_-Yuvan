$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'

$health = Invoke-RestMethod -Method Get -Uri "$base/health"
$loginBody = @{ email = 'admin@wearhouse.com'; password = 'wearhouse' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/quick-login" -ContentType 'application/json' -Body $loginBody
$token = $login.token
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "qa.verify+$stamp@example.com"
$orderBody = @{
  customer_name = 'Mail Verify'
  email = $email
  phone = '9999999998'
  address = 'Verify Street'
  city = 'Hyderabad'
  pincode = '500001'
  product_name = 'Verification Product'
  order_value = 999
  quantity = 1
  payment_id = "pay_verify_$stamp"
} | ConvertTo-Json

$orderCreate = Invoke-RestMethod -Method Post -Uri "$base/api/orders" -ContentType 'application/json' -Body $orderBody
$orderId = $orderCreate.order.order_id

$before = Invoke-RestMethod -Method Get -Uri "$base/api/orders/$orderId/email-status" -Headers @{ Authorization = "Bearer $token" }

$updates = @()
foreach ($s in @('Packed','Out for Delivery','Delivered')) {
  $updateBody = @{ status = $s } | ConvertTo-Json
  $updateResp = Invoke-RestMethod -Method Patch -Uri "$base/api/orders/$orderId/status" -Headers $headers -Body $updateBody
  $statusSnapshot = Invoke-RestMethod -Method Get -Uri "$base/api/orders/$orderId/email-status" -Headers @{ Authorization = "Bearer $token" }
  $updates += [pscustomobject]@{
    status_update = $s
    update_response = $updateResp
    email_status_snapshot = $statusSnapshot
  }
}

$result = [pscustomobject]@{
  health = $health
  login_ok = [bool]$token
  order_id = $orderId
  customer_email = $email
  order_create_response = $orderCreate
  email_status_before_updates = $before
  update_checks = $updates
}

$result | ConvertTo-Json -Depth 20 | Set-Content -Path 'c:\websiteu1\tmp_verify_email_status.json' -Encoding UTF8
Write-Output 'Wrote c:\websiteu1\tmp_verify_email_status.json'
