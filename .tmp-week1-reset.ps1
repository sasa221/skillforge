$ProgressPreference='SilentlyContinue'
$email = "week1.reset." + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + "@example.com"
$oldPassword = 'TempPass123!'
$newPassword = 'NewPass123!'
$signupBody = @{ fullName='Week One Reset'; email=$email; password=$oldPassword; interests=@('Excel') } | ConvertTo-Json
$signup = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/signup' -Method Post -ContentType 'application/json' -Body $signupBody
$reqBody = @{ email=$email } | ConvertTo-Json
$request = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/password-reset/request' -Method Post -ContentType 'application/json' -Body $reqBody
$confirmBody = @{ token=$request.debugToken; newPassword=$newPassword } | ConvertTo-Json
$confirm = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/password-reset/confirm' -Method Post -ContentType 'application/json' -Body $confirmBody
$loginBody = @{ email=$email; password=$newPassword } | ConvertTo-Json
$login = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/auth/login' -Method Post -ContentType 'application/json' -Body $loginBody
[pscustomobject]@{
  email = $email
  requestOk = [bool]$request.ok
  hasDebugToken = [bool]$request.debugToken
  confirmHasAccessToken = [bool]$confirm.accessToken
  loginWithNewPasswordOk = [bool]$login.accessToken
} | ConvertTo-Json -Depth 5 | Write-Output
