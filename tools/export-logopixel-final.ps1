[CmdletBinding()]
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\logopixel-standardized-v02.png'),
    [string]$NativeDestination = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\arboris-logopixel-final-native.png'),
    [string]$PresentationDestination = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\arboris-logopixel-final-4x.png'),
    [ValidateSet(1, 2, 4, 8)]
    [int]$SourceCellSize = 2,
    [ValidateSet(2, 4, 8)]
    [int]$PresentationScale = 4
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$input = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source))
try {
    if (($input.Width % $SourceCellSize) -ne 0 -or ($input.Height % $SourceCellSize) -ne 0) {
        throw "La fuente debe dividirse exactamente por $SourceCellSize."
    }

    $nativeWidth = [int]($input.Width / $SourceCellSize)
    $nativeHeight = [int]($input.Height / $SourceCellSize)
    $native = New-Object System.Drawing.Bitmap $nativeWidth, $nativeHeight, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        for ($nativeY = 0; $nativeY -lt $nativeHeight; $nativeY++) {
            for ($nativeX = 0; $nativeX -lt $nativeWidth; $nativeX++) {
                $sample = $input.GetPixel($nativeX * $SourceCellSize, $nativeY * $SourceCellSize)
                for ($checkY = 0; $checkY -lt $SourceCellSize; $checkY++) {
                    for ($checkX = 0; $checkX -lt $SourceCellSize; $checkX++) {
                        if ($input.GetPixel(($nativeX * $SourceCellSize) + $checkX, ($nativeY * $SourceCellSize) + $checkY).ToArgb() -ne $sample.ToArgb()) {
                            throw "La fuente contiene una celda irregular en $nativeX,$nativeY."
                        }
                    }
                }
                $native.SetPixel($nativeX, $nativeY, $sample)
            }
        }

        foreach ($destination in @($NativeDestination, $PresentationDestination)) {
            $parent = Split-Path -Parent $destination
            if (-not (Test-Path -LiteralPath $parent)) {
                New-Item -ItemType Directory -Path $parent -Force | Out-Null
            }
        }
        $native.Save($NativeDestination, [System.Drawing.Imaging.ImageFormat]::Png)

        $presentation = New-Object System.Drawing.Bitmap ($nativeWidth * $PresentationScale), ($nativeHeight * $PresentationScale), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            for ($y = 0; $y -lt $nativeHeight; $y++) {
                for ($x = 0; $x -lt $nativeWidth; $x++) {
                    $color = $native.GetPixel($x, $y)
                    for ($scaleY = 0; $scaleY -lt $PresentationScale; $scaleY++) {
                        for ($scaleX = 0; $scaleX -lt $PresentationScale; $scaleX++) {
                            $presentation.SetPixel(($x * $PresentationScale) + $scaleX, ($y * $PresentationScale) + $scaleY, $color)
                        }
                    }
                }
            }
            $presentation.Save($PresentationDestination, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        finally {
            $presentation.Dispose()
        }
    }
    finally {
        $native.Dispose()
    }
}
finally {
    $input.Dispose()
}

$presentationWidth = $nativeWidth * $PresentationScale
$presentationHeight = $nativeHeight * $PresentationScale
[pscustomobject]@{
    source = (Resolve-Path -LiteralPath $Source).Path
    native = (Resolve-Path -LiteralPath $NativeDestination).Path
    presentation = (Resolve-Path -LiteralPath $PresentationDestination).Path
    nativeDimensions = @($nativeWidth, $nativeHeight)
    presentationDimensions = @($presentationWidth, $presentationHeight)
    scale = $PresentationScale
    result = 'final_pixel_master_and_nearest_neighbor_export'
}
