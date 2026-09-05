param(
  [string]$Source = "D:\meu-site\img\bem-esportivo-logo-novo-ajustado.png",
  [string]$SymbolSource = "D:\meu-site\img\simbolobe.png",
  [string]$OutputDirectory = "D:\meu-site\img\brand"
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

function Get-ContentBounds {
  param([System.Drawing.Bitmap]$Bitmap, [int]$Threshold = 14, [bool]$UseAlpha = $false)

  $left = $Bitmap.Width
  $top = $Bitmap.Height
  $right = -1
  $bottom = -1

  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      $pixel = $Bitmap.GetPixel($x, $y)
      $visible = if ($UseAlpha) { $pixel.A -gt $Threshold } else { [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B)) -gt $Threshold }
      if ($visible) {
        if ($x -lt $left) { $left = $x }
        if ($x -gt $right) { $right = $x }
        if ($y -lt $top) { $top = $y }
        if ($y -gt $bottom) { $bottom = $y }
      }
    }
  }

  if ($right -lt $left -or $bottom -lt $top) { throw "Nenhum conteúdo visível encontrado." }
  return [System.Drawing.Rectangle]::FromLTRB($left, $top, $right + 1, $bottom + 1)
}

function Remove-SmallIslands {
  param([System.Drawing.Bitmap]$Bitmap, [int]$MinimumPixels = 42)

  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $visited = New-Object 'bool[]' ($width * $height)
  for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
      $index = ($y * $width) + $x
      if ($visited[$index]) { continue }
      $visited[$index] = $true
      if ($Bitmap.GetPixel($x, $y).A -le 10) { continue }

      $queue = [System.Collections.Generic.Queue[System.Drawing.Point]]::new()
      $component = [System.Collections.Generic.List[System.Drawing.Point]]::new()
      $queue.Enqueue([System.Drawing.Point]::new($x, $y))

      while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        $component.Add($point)
        for ($offsetY = -1; $offsetY -le 1; $offsetY++) {
          for ($offsetX = -1; $offsetX -le 1; $offsetX++) {
            if ($offsetX -eq 0 -and $offsetY -eq 0) { continue }
            $nextX = $point.X + $offsetX
            $nextY = $point.Y + $offsetY
            if ($nextX -lt 0 -or $nextX -ge $width -or $nextY -lt 0 -or $nextY -ge $height) { continue }
            $nextIndex = ($nextY * $width) + $nextX
            if ($visited[$nextIndex]) { continue }
            $visited[$nextIndex] = $true
            if ($Bitmap.GetPixel($nextX, $nextY).A -gt 10) {
              $queue.Enqueue([System.Drawing.Point]::new($nextX, $nextY))
            }
          }
        }
      }

      if ($component.Count -lt $MinimumPixels) {
        foreach ($point in $component) { $Bitmap.SetPixel($point.X, $point.Y, [System.Drawing.Color]::Transparent) }
      }
    }
  }
}

function Export-TransparentLogo {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [ValidateSet("white", "dark")][string]$TextTone
  )

  $sourceBitmap = [System.Drawing.Bitmap]::FromFile($InputPath)
  try {
    $bounds = Get-ContentBounds -Bitmap $sourceBitmap -Threshold 18
    $padding = 24
    $result = New-Object System.Drawing.Bitmap ($bounds.Width + ($padding * 2)), ($bounds.Height + ($padding * 2)), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      for ($y = 0; $y -lt $bounds.Height; $y++) {
        for ($x = 0; $x -lt $bounds.Width; $x++) {
          $pixel = $sourceBitmap.GetPixel($bounds.X + $x, $bounds.Y + $y)
          $maximum = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
          $minimum = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
          $spread = $maximum - $minimum

          if ($maximum -le 8) { continue }

          $isNeutral = $spread -lt 22
          if ($isNeutral) {
            $alpha = [Math]::Min(255, [Math]::Max(0, [int](($maximum - 6) * 1.08)))
            if ($alpha -le 0) { continue }
            $tone = if ($TextTone -eq "white") { 255 } else { 24 }
            $color = [System.Drawing.Color]::FromArgb($alpha, $tone, $tone, $tone)
          } else {
            $alpha = if ($maximum -ge 72) { 255 } else { [Math]::Min(255, [int]($maximum * 3.55)) }
            if ($alpha -le 0) { continue }
            $color = [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B)
          }

          $result.SetPixel($x + $padding, $y + $padding, $color)
        }
      }

      Remove-SmallIslands -Bitmap $result
      $result.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $result.Dispose()
    }
  } finally {
    $sourceBitmap.Dispose()
  }
}

function Export-CroppedSymbol {
  param([string]$InputPath, [string]$OutputPath)

  $sourceBitmap = [System.Drawing.Bitmap]::FromFile($InputPath)
  try {
    $bounds = Get-ContentBounds -Bitmap $sourceBitmap -Threshold 6 -UseAlpha $true
    # O favicon usa uma tela quadrada de alta resolução. O símbolo é copiado
    # em proporção 1:1, sem interpolação ou ampliação artificial.
    $canvasSize = 1024
    $offsetX = [int](($canvasSize - $bounds.Width) / 2)
    $offsetY = [int](($canvasSize - $bounds.Height) / 2)
    $result = New-Object System.Drawing.Bitmap $canvasSize, $canvasSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($result)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.DrawImage($sourceBitmap, $offsetX, $offsetY, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
      }
      $result.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $result.Dispose()
    }
  } finally {
    $sourceBitmap.Dispose()
  }
}

Export-TransparentLogo -InputPath $Source -OutputPath (Join-Path $OutputDirectory "bem-esportivo-com-nome-branco.png") -TextTone white
Export-TransparentLogo -InputPath $Source -OutputPath (Join-Path $OutputDirectory "bem-esportivo-com-nome-escuro.png") -TextTone dark
Export-CroppedSymbol -InputPath $SymbolSource -OutputPath (Join-Path $OutputDirectory "bem-esportivo-simbolo.png")

Get-ChildItem -LiteralPath $OutputDirectory -File | Select-Object Name, Length
