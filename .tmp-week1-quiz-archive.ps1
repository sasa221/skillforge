$ProgressPreference='SilentlyContinue'
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLoginBody = @{ email='admin@skillforge.dev'; password='Admin123!' } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -UseBasicParsing -WebSession $adminSession -Uri 'http://localhost:3200/auth/login' -Method Post -ContentType 'application/json' -Body $adminLoginBody
$adminToken = $adminLogin.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

$instructors = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/admin/instructors' -Headers $adminHeaders
$instructorId = $instructors.items[0].id

$courseBody = @{
  title = "Week1 Quiz Types $ts"
  slug = "week1-quiz-types-$ts"
  description = 'Temporary course for week1 verification'
  instructorId = $instructorId
  difficulty = 'beginner'
  status = 'published'
  estimatedMinutes = 20
  requiresSequentialModules = $false
} | ConvertTo-Json
$course = Invoke-RestMethod -UseBasicParsing -Uri 'http://localhost:3200/admin/courses' -Method Post -Headers $adminHeaders -ContentType 'application/json' -Body $courseBody

$moduleBody = @{
  title = 'Week1 Module'
  description = 'Temporary module'
  status = 'published'
  order = 0
} | ConvertTo-Json
$module = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/courses/{0}/modules" -f $course.id) -Method Post -Headers $adminHeaders -ContentType 'application/json' -Body $moduleBody

$lessonBody = @{
  title = 'Week1 Lesson'
  slug = "week1-lesson-$ts"
  learningObjective = 'Validate short answer and ordered quizzes'
  content = 'Temporary lesson'
  status = 'published'
  estimatedMinutes = 5
  order = 0
} | ConvertTo-Json
$lesson = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/modules/{0}/lessons" -f $module.id) -Method Post -Headers $adminHeaders -ContentType 'application/json' -Body $lessonBody

$quizBody = @{ title='Week1 Quiz'; passingScore=50; status='published' } | ConvertTo-Json
$quiz = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/lessons/{0}/quiz" -f $lesson.id) -Method Post -Headers $adminHeaders -ContentType 'application/json' -Body $quizBody

$shortBody = @{
  type = 'short_answer'
  prompt = 'Type Excel'
  correctText = 'Excel'
  explanation = 'Expected short answer'
  difficulty = 1
  order = 0
} | ConvertTo-Json
$shortQuestion = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/quizzes/{0}/questions" -f $quiz.id) -Method Post -Headers $adminHeaders -ContentType 'application/json' -Body $shortBody

$orderedBody = @{
  type = 'ordered'
  prompt = 'Order the steps'
  options = @(
    @{ text='Open Excel'; order=0 },
    @{ text='Create table'; order=1 },
    @{ text='Sort data'; order=2 }
  )
  correctOrderIndices = @(0,1,2)
  explanation = 'Ordered answer'
  difficulty = 2
  order = 1
} | ConvertTo-Json -Depth 6
$orderedQuestion = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/quizzes/{0}/questions" -f $quiz.id) -Method Post -Headers $adminHeaders -ContentType 'application/json' -Body $orderedBody

$studentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$studentLoginBody = @{ email='student@skillforge.dev'; password='Student123!' } | ConvertTo-Json
$studentLogin = Invoke-RestMethod -UseBasicParsing -WebSession $studentSession -Uri 'http://localhost:3200/auth/login' -Method Post -ContentType 'application/json' -Body $studentLoginBody
$studentToken = $studentLogin.accessToken
$studentHeaders = @{ Authorization = "Bearer $studentToken" }
Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/courses/{0}/enroll" -f $course.id) -Method Post -Headers $studentHeaders | Out-Null
$lessonQuiz = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/lessons/{0}/quiz" -f $lesson.id) -Headers $studentHeaders
$orderedLive = $lessonQuiz.quiz.questions | Where-Object { $_.type -eq 'ordered' }
$shortLive = $lessonQuiz.quiz.questions | Where-Object { $_.type -eq 'short_answer' }
$submitBody = @{
  answers = @(
    @{ questionId = $shortLive.id; textAnswer = 'Excel' },
    @{ questionId = $orderedLive.id; orderedAnswer = @($orderedLive.options[0].id, $orderedLive.options[1].id, $orderedLive.options[2].id) }
  )
} | ConvertTo-Json -Depth 8
$submit = Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/lessons/{0}/quiz/submit" -f $lesson.id) -Method Post -Headers $studentHeaders -ContentType 'application/json' -Body $submitBody

$archiveBody = @{ status='archived' } | ConvertTo-Json
Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/courses/{0}" -f $course.id) -Method Patch -Headers $adminHeaders -ContentType 'application/json' -Body $archiveBody | Out-Null
try {
  $publicAfterArchive = Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:3200/courses/{0}" -f $course.slug) -ErrorAction Stop
  $archiveStatus = [int]$publicAfterArchive.StatusCode
} catch {
  $archiveStatus = $_.Exception.Response.StatusCode.value__
}
$publishBody = @{ status='published' } | ConvertTo-Json
Invoke-RestMethod -UseBasicParsing -Uri ("http://localhost:3200/admin/courses/{0}" -f $course.id) -Method Patch -Headers $adminHeaders -ContentType 'application/json' -Body $publishBody | Out-Null
$publicAfterPublish = Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:3200/courses/{0}" -f $course.slug) -ErrorAction Stop

[pscustomobject]@{
  tempCourseSlug = $course.slug
  shortAnswerQuestionCreated = [bool]$shortQuestion.id
  orderedQuestionCreated = [bool]$orderedQuestion.id
  shortQuestionReturned = [bool]$shortLive.id
  orderedQuestionReturned = [bool]$orderedLive.id
  quizSubmitPassed = $submit.passed
  quizSubmitScore = $submit.score
  archivePublicStatus = $archiveStatus
  publishPublicStatus = [int]$publicAfterPublish.StatusCode
} | ConvertTo-Json -Depth 5 | Write-Output
