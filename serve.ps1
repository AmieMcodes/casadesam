Add-Type -AssemblyName System.Net.HttpListener

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()

Write-Host "Serving on http://localhost:8080/  (Press Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $reqPath = $context.Request.Url.LocalPath.TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($reqPath)) {
      $reqPath = "index.html"
    }

    $filePath = Join-Path (Get-Location) $reqPath

    if (Test-Path $filePath -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($filePath)

      # Minimal content types (enough for this site)
      $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      switch ($ext) {
        ".html" { $context.Response.ContentType = "text/html; charset=utf-8" }
        ".css"  { $context.Response.ContentType = "text/css; charset=utf-8" }
        ".js"   { $context.Response.ContentType = "application/javascript; charset=utf-8" }
        ".png"  { $context.Response.ContentType = "image/png" }
        ".jpg"  { $context.Response.ContentType = "image/jpeg" }
        ".jpeg" { $context.Response.ContentType = "image/jpeg" }
        ".svg"  { $context.Response.ContentType = "image/svg+xml" }
        default { $context.Response.ContentType = "application/octet-stream" }
      }

      $context.Response.StatusCode = 200
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
      $context.Response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $context.Response.ContentType = "text/plain; charset=utf-8"
      $context.Response.OutputStream.Write($msg, 0, $msg.Length)
    }

    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
