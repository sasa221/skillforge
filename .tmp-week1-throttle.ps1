$ProgressPreference='SilentlyContinue'
$statuses = @()
for ($i = 1; $i -le 6; $i++) {
  try {
    $body = @{ email='nobody@example.com'; password='wrongpass' } | ConvertTo-Json
    Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/login' -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop | Out-Null
    $statuses += 200
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $statuses += [int]$resp.StatusCode.value__
    } else {
      $statuses += -1
    }
  }
}
$statuses | ConvertTo-Json -Depth 3 | Write-Output
