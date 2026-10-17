# Crops the app icon out of logo/solanisense_logo.jpeg into the PWA icons. Run from the repo root in Windows PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
# The logo is a rounded blue square at x 709..2099, y 75..1469 on a dark 2752x1536 canvas; its corners curve 81 px in along the diagonal.
# The crop is the largest centered square 85 px inside every edge: all blue, so iOS can round it, and the wordmark (down to y 1367) stays in.
# shortcut: Windows only (System.Drawing), to avoid adding an image library; on another OS crop the same square with any image tool
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path 'logo/solanisense_logo.jpeg'))
$out = (New-Item -ItemType Directory -Force 'public/icons').FullName
foreach ($size in 192, 512) {
  $dst = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  $wrap = New-Object System.Drawing.Imaging.ImageAttributes
  $wrap.SetWrapMode('TileFlipXY') # the resampler then reads mirrored crop pixels at the border, not the dark area outside it
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $size, $size), 794, 162, 1220, 1220, 'Pixel', $wrap)
  $dst.Save((Join-Path $out "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $dst.Dispose()
}
$src.Dispose()
