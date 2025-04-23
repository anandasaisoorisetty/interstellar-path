# Convert all JPG files to WebP
Get-ChildItem -Path "src/assets" -Filter "*.jpg" | ForEach-Object {
    $webpPath = [System.IO.Path]::ChangeExtension($_.FullName, "webp")
    cwebp -q 80 $_.FullName -o $webpPath
    Write-Host "Converted $($_.Name) to WebP"
}

# Convert all PNG files to WebP
Get-ChildItem -Path "src/assets" -Filter "*.png" | ForEach-Object {
    $webpPath = [System.IO.Path]::ChangeExtension($_.FullName, "webp")
    cwebp -lossless $_.FullName -o $webpPath
    Write-Host "Converted $($_.Name) to WebP"
}
