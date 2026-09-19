[CmdletBinding()]
param(
    [string]$WordmarkSource = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\logopixel-4px-b-study.png'),
    [string]$ReferenceSource = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\logopixel-logo-reference.png'),
    [string]$Destination = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\logopixel-clean-master-v01.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$ivory = [System.Drawing.Color]::FromArgb(255, 237, 231, 211)
$ink = [System.Drawing.Color]::FromArgb(255, 15, 46, 31)
$wordmark = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $WordmarkSource))
$reference = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $ReferenceSource))
try {
    if ($wordmark.Width -ne $reference.Width -or $wordmark.Height -ne $reference.Height) {
        throw 'La referencia y el trazado de wordmark deben compartir dimensiones.'
    }

    $output = New-Object System.Drawing.Bitmap $reference.Width, $reference.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        for ($y = 0; $y -lt $output.Height; $y++) {
            for ($x = 0; $x -lt $output.Width; $x++) {
                if ($y -lt 168) {
                    # Approved composition and the leaf/wordmark geometry come
                    # directly from the 4 px cleanup study.
                    $output.SetPixel($x, $y, $wordmark.GetPixel($x, $y))
                }
                elseif ($y -lt 174) {
                    $output.SetPixel($x, $y, $ivory)
                }
                else {
                    # Preserve every letter and separator from the approved
                    # slogan while flattening antialiasing to one dark ink.
                    $sourcePixel = $reference.GetPixel($x, $y)
                    $isInk = ($sourcePixel.R -lt 150) -or (($sourcePixel.G - $sourcePixel.R) -gt 18 -and $sourcePixel.R -lt 210)
                    $output.SetPixel($x, $y, $(if ($isInk) { $ink } else { $ivory }))
                }
            }
        }
        $parent = Split-Path -Parent $Destination
        if (-not (Test-Path -LiteralPath $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        $output.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $output.Dispose()
    }
}
finally {
    $wordmark.Dispose()
    $reference.Dispose()
}

[pscustomobject]@{
    wordmarkSource = (Resolve-Path -LiteralPath $WordmarkSource).Path
    referenceSource = (Resolve-Path -LiteralPath $ReferenceSource).Path
    destination = (Resolve-Path -LiteralPath $Destination).Path
    result = 'reference_faithful_wordmark_and_slogan_cleanup'
}
