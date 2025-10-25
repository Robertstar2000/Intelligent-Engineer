# Copy ALL dependencies from root node_modules to lambda node_modules
Write-Host "Copying all dependencies from root..." -ForegroundColor Yellow

$source = "..\..\node_modules"
$dest = "node_modules"

# Create node_modules if it doesn't exist
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Copy everything except dev dependencies
$exclude = @("@types", "typescript", "serverless", "vitest", "@vitest", "vite", "@vitejs", "esbuild", "@esbuild", "rollup", "@rollup")

Get-ChildItem -Path $source -Directory | Where-Object {
    $name = $_.Name
    -not ($exclude | Where-Object { $name -like "$_*" })
} | ForEach-Object {
    Write-Host "Copying $($_.Name)..." -ForegroundColor Green
    Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
}

Write-Host "All dependencies copied!" -ForegroundColor Green
