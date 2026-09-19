[CmdletBinding()]
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\logopixel-logo-reference.png'),
    [string]$Destination = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\logopixel-standardized-v02.png'),
    [ValidateSet(1, 2, 4, 8)]
    [int]$CellSize = 2,
    [ValidateRange(1, 64)]
    [int]$ForegroundSamples = 3,
    [ValidateRange(1, 64)]
    [int]$LeafForegroundSamples = 2,
    [int]$GridOffsetX = 0,
    [int]$GridOffsetY = 0
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-Color([string]$Hex) {
    $value = $Hex.TrimStart('#')
    [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($value.Substring(0, 2), 16), [Convert]::ToInt32($value.Substring(2, 2), 16), [Convert]::ToInt32($value.Substring(4, 2), 16))
}

# Palette declared in the original logopixel manual. The background uses the
# documented ivory so the result is flat and reproducible.
$palette = @(
    (New-Color '#EDE7D3'),
    (New-Color '#0F2E1F'),
    (New-Color '#2E7D32'),
    (New-Color '#4C9A3D'),
    (New-Color '#A7C957')
)

function Get-NearestPaletteIndex([System.Drawing.Color]$Color) {
    $bestIndex = 0
    $bestDistance = [double]::PositiveInfinity
    for ($i = 0; $i -lt $palette.Count; $i++) {
        $candidate = $palette[$i]
        $distance = [math]::Pow($Color.R - $candidate.R, 2) + [math]::Pow($Color.G - $candidate.G, 2) + [math]::Pow($Color.B - $candidate.B, 2)
        if ($distance -lt $bestDistance) {
            $bestDistance = $distance
            $bestIndex = $i
        }
    }
    return $bestIndex
}

$input = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source))
$sourceWidth = $input.Width
$sourceHeight = $input.Height
try {
    if ($GridOffsetX -lt 0 -or $GridOffsetX -ge $CellSize -or $GridOffsetY -lt 0 -or $GridOffsetY -ge $CellSize) {
        throw "Los desplazamientos de retícula deben estar entre 0 y $($CellSize - 1)."
    }
    if (($input.Width % $CellSize) -ne 0) {
        throw "El ancho $($input.Width) no es divisible por la celda $CellSize."
    }

    $output = New-Object System.Drawing.Bitmap $input.Width, $input.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($output)
        try {
            $graphics.Clear($palette[0])
        }
        finally {
            $graphics.Dispose()
        }

        for ($y = -$CellSize + $GridOffsetY; $y -lt $input.Height; $y += $CellSize) {
            for ($x = -$CellSize + $GridOffsetX; $x -lt $input.Width; $x += $CellSize) {
                $counts = @(0, 0, 0, 0, 0)
                $limitY = [math]::Min($y + $CellSize, $input.Height)
                $limitX = [math]::Min($x + $CellSize, $input.Width)
                $startY = [math]::Max($y, 0)
                $startX = [math]::Max($x, 0)
                for ($sampleY = $startY; $sampleY -lt $limitY; $sampleY++) {
                    for ($sampleX = $startX; $sampleX -lt $limitX; $sampleX++) {
                        $counts[(Get-NearestPaletteIndex $input.GetPixel($sampleX, $sampleY))]++
                    }
                }

                # Keep intentional 4 px details while discarding isolated
                # anti-alias/background noise from the flattened reference.
                $winner = 0
                $foregroundCount = $counts[1] + $counts[2] + $counts[3] + $counts[4]
                # The leaf's small vein details need one lower threshold than
                # the lettering. Its bounding box is taken from the approved
                # reference and is not a change to its composition.
                $insideLeaf = ($startX -ge 266 -and $startX -lt 352 -and $startY -ge 56 -and $startY -lt 164)
                $minimumForegroundSamples = if ($insideLeaf) { $LeafForegroundSamples } else { $ForegroundSamples }
                if ($foregroundCount -ge $minimumForegroundSamples) {
                    $winner = 1
                    for ($i = 2; $i -lt $counts.Count; $i++) {
                        if ($counts[$i] -gt $counts[$winner]) { $winner = $i }
                    }
                }

                # Green is reserved for the approved leaf only. Flattened
                # anti-alias tones elsewhere must not create green specks in
                # letters or in the slogan.
                if ($winner -gt 0 -and -not $insideLeaf) { $winner = 1 }
                $fill = $palette[$winner]
                for ($fillY = $startY; $fillY -lt $limitY; $fillY++) {
                    for ($fillX = $startX; $fillX -lt $limitX; $fillX++) {
                        $output.SetPixel($fillX, $fillY, $fill)
                    }
                }
            }
        }

        $destinationDirectory = Split-Path -Parent $Destination
        if (-not (Test-Path -LiteralPath $destinationDirectory)) {
            New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        }
        $output.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $output.Dispose()
    }
}
finally {
    $input.Dispose()
}

[pscustomobject]@{
    source = (Resolve-Path -LiteralPath $Source).Path
    destination = (Resolve-Path -LiteralPath $Destination).Path
    width = $sourceWidth
    height = $sourceHeight
    cellSize = $CellSize
    foregroundSamples = $ForegroundSamples
    leafForegroundSamples = $LeafForegroundSamples
    gridOffset = @($GridOffsetX, $GridOffsetY)
    palette = @('#EDE7D3', '#0F2E1F', '#2E7D32', '#4C9A3D', '#A7C957')
    result = 'standardized_without_recomposition'
}
