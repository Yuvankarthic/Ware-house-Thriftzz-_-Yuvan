$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000'

$health = Invoke-RestMethod -Method Get -Uri "$base/health"

$loginBody = @{ email = 'admin@wearhouse.com'; password = 'wearhouse' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/quick-login" -ContentType 'application/json' -Body $loginBody
$token = $login.token

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "qa+$stamp@example.com"

$orderBody = @{
  customer_name = 'Mail QA'
  email = $email
  phone = '9999999999'
  address = 'Test Street'
  city = 'Hyderabad'
  pincode = '500001'
  product_name = 'QA Product'
  order_value = 999
  quantity = 1
  payment_id = "pay_test_$stamp"
} | ConvertTo-Json

$order = Invoke-RestMethod -Method Post -Uri "$base/api/orders" -ContentType 'application/json' -Body $orderBody
$orderId = $order.order.order_id
$headers = @{ Authorization = "Bearer $token" }

$statuses = @('Packed', 'Out for Delivery', 'Delivered')
$updates = @()
foreach ($s in $statuses) {
  $body = @{ status = $s } | ConvertTo-Json
  $resp = Invoke-RestMethod -Method Patch -Uri "$base/api/orders/$orderId/status" -ContentType 'application/json' -Headers $headers -Body $body
  $updates += [pscustomobject]@{
    status = $s
    response = $resp
  }
}

$result = [pscustomobject]@{
  health = $health
  login_ok = [bool]$token
  order_email = $email
  order_id = $orderId
  order_create = $order
  status_updates = $updates
}

$result | ConvertTo-Json -Depth 12 | Set-Content -Path 'c:\websiteu1\tmp_mail_test.json'
Write-Output "Wrote c:\websiteu1\tmp_mail_test.json"
