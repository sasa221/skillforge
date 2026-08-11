$ProgressPreference='SilentlyContinue'
$email = "week1.verify." + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + "@example.com"
$password = "TempPass123!"
$signupSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$signupBody = @{ fullName='Week One Verify'; email=$email; password=$password; interests=@('Excel') } | ConvertTo-Json
$signup = Invoke-RestMethod -UseBasicParsing -WebSession $signupSession -Uri 'http://localhost:3200/auth/signup' -Method Post -ContentType 'application/json' -Body $signupBody
$accessToken = $signup.accessToken

$dashboardStatus = $null
$dashboardLocation = $null
try {
  $r = Invoke-WebRequest -UseBasicParsing -WebSession $signupSession -Uri 'http://localhost:3100/dashboard' -MaximumRedirection 0 -ErrorAction Stop
  $dashboardStatus = [int]$r.StatusCode
  $dashboardLocation = $r.Headers['Location']
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $dashboardStatus = [int]$resp.StatusCode
    $dashboardLocation = $resp.Headers['Location']
  }
}

$apiStatus = 200
$apiMessage = $null
try {
  Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/progress/me/dashboard' -Headers @{ Authorization = "Bearer $accessToken" } -ErrorAction Stop | Out-Null
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    $apiStatus = $resp.StatusCode.value__
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $apiMessage = $reader.ReadToEnd()
    $reader.Close()
  } else {
    $apiStatus = -1
    $apiMessage = $_.Exception.Message
  }
}

$verifyReqBody = @{ email=$email } | ConvertTo-Json
$verifyReq = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/email-verification/request' -Method Post -ContentType 'application/json' -Body $verifyReqBody
$verifyBody = @{ token=$verifyReq.debugToken } | ConvertTo-Json
$verifyConfirm = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/email-verification/confirm' -Method Post -ContentType 'application/json' -Body $verifyBody
$afterDashboard = Invoke-WebRequest -UseBasicParsing -WebSession $signupSession -Uri 'http://localhost:3100/dashboard' -ErrorAction Stop
$afterApi = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/progress/me/dashboard' -Headers @{ Authorization = "Bearer $accessToken" } -ErrorAction Stop
$result = [pscustomobject]@{
  email = $email
  initialDashboardStatus = $dashboardStatus
  initialDashboardLocation = $dashboardLocation
  initialApiStatus = $apiStatus
  initialApiMessage = $apiMessage
  verificationOk = $verifyConfirm.ok
  postVerifyDashboardStatus = [int]$afterDashboard.StatusCode
  postVerifyDashboardUrl = $afterDashboard.BaseResponse.ResponseUri.AbsoluteUri
  postVerifyApiHasDashboard = [bool]$afterApi
}
$result | ConvertTo-Json -Depth 5 | Write-Output
