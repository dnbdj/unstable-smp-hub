# Refresh pinned creator face tiles from live Mojang textures.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File unstable-smp-hub/tools/fetch-skins.ps1
# Output: unstable-smp-hub/skins/<creator-id>.png (flat 2D face, base+hat, 16x nearest-neighbor).
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"
$app = Join-Path (Split-Path $PSScriptRoot -Parent) ""
$out = Join-Path $app "skins"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$names = @{ wemmbu = "Wemmbu"; flamefrags = "FlameFrags"; parrotx2 = "ParrotX2"; spokeishere = "SpokeIsHere" }
foreach ($id in $names.Keys) {
  $n = $names[$id]
  $u = Invoke-RestMethod "https://api.mojang.com/users/profiles/minecraft/$n"
  $p = Invoke-RestMethod ("https://sessionserver.mojang.com/session/minecraft/profile/" + $u.id)
  $tex = ($p.properties | Where-Object { $_.name -eq "textures" }).value
  $skinUrl = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($tex)) | ConvertFrom-Json).textures.SKIN.url
  $raw = Join-Path $env:TEMP ("skin-" + $id + ".png")
  Invoke-WebRequest $skinUrl -OutFile $raw
  $src = [System.Drawing.Bitmap]::FromFile($raw)
  $b = New-Object System.Drawing.Bitmap(128, 128)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0,0,128,128)), (New-Object System.Drawing.Rectangle(8,8,8,8)), [System.Drawing.GraphicsUnit]::Pixel)
  if ($src.Width -ge 48) {
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0,0,128,128)), (New-Object System.Drawing.Rectangle(40,8,8,8)), [System.Drawing.GraphicsUnit]::Pixel)
  }
  $g.Dispose()
  $b.Save((Join-Path $out ($id + ".png")), [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose(); $src.Dispose()
  Write-Output ("pinned {0} <- {1}" -f $id, $skinUrl)
}
Write-Output "done"
