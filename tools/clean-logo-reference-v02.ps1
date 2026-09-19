[CmdletBinding()]
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\references\logopixel-target-v02.jpg'),
    [string]$Destination = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\arboris-logopixel-reference-clean-v02.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$palette = @(
    [System.Drawing.Color]::FromArgb(255, 245, 241, 229), # ivory
    [System.Drawing.Color]::FromArgb(255, 12, 49, 31),    # dark ink
    [System.Drawing.Color]::FromArgb(255, 53, 125, 59),   # leaf base
    [System.Drawing.Color]::FromArgb(255, 167, 201, 87)   # leaf vein/highlight
)

function Get-NearestPaletteIndex([System.Drawing.Color]$Color) {
    $best = 0
    $bestDistance = [double]::PositiveInfinity
    for ($i = 0; $i -lt $palette.Count; $i++) {
        $candidate = $palette[$i]
        $distance = [math]::Pow($Color.R - $candidate.R, 2) + [math]::Pow($Color.G - $candidate.G, 2) + [math]::Pow($Color.B - $candidate.B, 2)
        if ($distance -lt $bestDistance) { $best = $i; $bestDistance = $distance }
    }
    return $best
}

$input = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source))
try {
    $output = New-Object System.Drawing.Bitmap $input.Width, $input.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        for ($y = 0; $y -lt $input.Height; $y++) {
            for ($x = 0; $x -lt $input.Width; $x++) {
                $pixel = $input.GetPixel($x, $y)

                # The corner sparkle is presentation decoration, outside the
                # approved logo lockup. Replace only that small corner region.
                $isCornerDecoration = ($x -ge 1450 -and $y -ge 535)
                if ($isCornerDecoration) {
                    $output.SetPixel($x, $y, $palette[0])
                    continue
                }

                $index = Get-NearestPaletteIndex $pixel
                $output.SetPixel($x, $y, $palette[$index])
            }
        }
        $parent = Split-Path -Parent $Destination
        if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        $output.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally { $output.Dispose() }
}
finally { $input.Dispose() }

[pscustomobject]@{
    source = (Resolve-Path -LiteralPath $Source).Path
    destination = (Resolve-Path -LiteralPath $Destination).Path
    dimensions = @($input.Width, $input.Height)
    palette = @('#F5F1E5', '#0C311F', '#357D3B', '#A7C957')
    result = 'reference_cleaned_without_recomposition'
}
