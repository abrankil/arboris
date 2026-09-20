[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [Parameter(Mandatory = $true)]
    [int]$LogicalWidth,

    [Parameter(Mandatory = $true)]
    [int]$LogicalHeight,

    [Parameter(Mandatory = $true)]
    [int]$CellSize,

    # Explicit permission to create a sampled study instead of an exact native export.
    [switch]$AllowResample,

    [string[]]$PaletteHex,

    [switch]$EnforcePalette,

    [ValidateSet('center','majority')]
    [string]$SamplingMode = 'center'
)

$ErrorActionPreference = 'Stop'
if ($LogicalWidth -le 0 -or $LogicalHeight -le 0 -or $CellSize -le 0) {
    throw 'LogicalWidth, LogicalHeight and CellSize must be positive integers.'
}
if ($EnforcePalette -and -not $PaletteHex) {
    throw 'PaletteHex is required when EnforcePalette is used.'
}

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.Common -ErrorAction SilentlyContinue

 $palette = [System.Collections.Generic.List[System.Drawing.Color]]::new()
if ($PaletteHex) {
    foreach ($hex in $PaletteHex) {
        if ($hex -notmatch '^#[0-9a-fA-F]{6}$') { throw "Invalid RGB palette entry: $hex" }
        $rgb = [Convert]::ToInt32($hex.Substring(1), 16)
        $palette.Add([System.Drawing.Color]::FromArgb(255, ($rgb -shr 16) -band 255, ($rgb -shr 8) -band 255, $rgb -band 255))
    }
}

function Convert-ToPaletteColor([System.Drawing.Color]$sourceColor) {
    if (-not $EnforcePalette) { return $sourceColor }
    if ($sourceColor.A -eq 0) { return [System.Drawing.Color]::FromArgb(0, 0, 0, 0) }
    $best = $null
    $bestDistance = [double]::PositiveInfinity
    foreach ($candidate in $palette) {
        $dr = [double]$sourceColor.R - $candidate.R
        $dg = [double]$sourceColor.G - $candidate.G
        $db = [double]$sourceColor.B - $candidate.B
        $distance = $dr*$dr + $dg*$dg + $db*$db
        if ($distance -lt $bestDistance) { $bestDistance = $distance; $best = $candidate }
    }
    return $best
}

function Get-LogicalCellColor([int]$cellX, [int]$cellY) {
    $sourceX = [Math]::Min($source.Width - 1, [Math]::Floor((($cellX + 0.5) * $source.Width) / $LogicalWidth))
    $sourceY = [Math]::Min($source.Height - 1, [Math]::Floor((($cellY + 0.5) * $source.Height) / $LogicalHeight))
    if ($SamplingMode -eq 'center') {
        return (Convert-ToPaletteColor $source.GetPixel($sourceX, $sourceY))
    }
    $startX = [Math]::Floor(($cellX * $source.Width) / $LogicalWidth)
    $endX = [Math]::Max($startX, [Math]::Ceiling((($cellX + 1) * $source.Width) / $LogicalWidth) - 1)
    $startY = [Math]::Floor(($cellY * $source.Height) / $LogicalHeight)
    $endY = [Math]::Max($startY, [Math]::Ceiling((($cellY + 1) * $source.Height) / $LogicalHeight) - 1)
    $counts = @{}
    for ($sy=$startY; $sy -le $endY -and $sy -lt $source.Height; $sy++) {
        for ($sx=$startX; $sx -le $endX -and $sx -lt $source.Width; $sx++) {
            $mapped = Convert-ToPaletteColor $source.GetPixel($sx, $sy)
            $key = $mapped.ToArgb()
            if ($counts.ContainsKey($key)) { $counts[$key]++ } else { $counts[$key] = 1 }
        }
    }
    $winner = $counts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
    return [System.Drawing.Color]::FromArgb([int]$winner.Key)
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $resolvedOutput) { throw 'Output exists; choose a new versioned filename.' }

$source = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $InputPath).Path)
$logical = $null
$output = $null
try {
    $resampled = $source.Width -ne $LogicalWidth -or $source.Height -ne $LogicalHeight
    if ($resampled -and -not $AllowResample) {
        throw 'Input is not the declared native canvas. Use an actual native PNG or explicitly request -AllowResample for a study.'
    }
    $logical = [System.Drawing.Bitmap]::new(
        $LogicalWidth,
        $LogicalHeight,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )

    # Sample one logical color per cell. No interpolation is used.
    for ($y = 0; $y -lt $LogicalHeight; $y++) {
        for ($x = 0; $x -lt $LogicalWidth; $x++) {
            $logical.SetPixel($x, $y, (Get-LogicalCellColor $x $y))
        }
    }

    $outputWidth = $LogicalWidth * $CellSize
    $outputHeight = $LogicalHeight * $CellSize
    $output = [System.Drawing.Bitmap]::new(
        $outputWidth,
        $outputHeight,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )

    # Replicate each logical cell into one exact CellSize×CellSize module.
    for ($y = 0; $y -lt $LogicalHeight; $y++) {
        for ($x = 0; $x -lt $LogicalWidth; $x++) {
            $color = $logical.GetPixel($x, $y)
            $baseX = $x * $CellSize
            $baseY = $y * $CellSize
            for ($dy = 0; $dy -lt $CellSize; $dy++) {
                for ($dx = 0; $dx -lt $CellSize; $dx++) {
                    $output.SetPixel($baseX + $dx, $baseY + $dy, $color)
                }
            }
        }
    }

    $parent = Split-Path -Parent $resolvedOutput
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    $output.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
    [pscustomobject]@{
        input = (Resolve-Path -LiteralPath $InputPath).Path
        output = (Resolve-Path -LiteralPath $OutputPath).Path
        logicalDimensions = "$LogicalWidth`x$LogicalHeight"
        cellSize = $CellSize
        outputDimensions = "${outputWidth}x${outputHeight}"
        interpolation = 'none'
        status = $(if ($resampled) { 'sampled_study' } else { 'integer_replication' })
        resampled = $resampled
        paletteEnforced = $EnforcePalette.IsPresent
        palette = @($PaletteHex)
        samplingMode = $SamplingMode
        alphaEnforced = $false
        designValidated = $false
        limitations = 'Replicates cells and optionally maps sampled colors to the declared palette. Does not reconstruct native artwork, recover layers, verify typography or approve design.'
    } | ConvertTo-Json
}
finally {
    if ($output) { $output.Dispose() }
    if ($logical) { $logical.Dispose() }
    if ($source) { $source.Dispose() }
}
