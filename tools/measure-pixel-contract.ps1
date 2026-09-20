# Read-only measurements. A successful numeric audit never approves artwork.
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$InputPath,
    [Parameter(Mandatory)][ValidateRange(1,4096)][int]$CellSize,
    [Parameter(Mandatory)][ValidateRange(1,32768)][int]$ExpectedWidth,
    [Parameter(Mandatory)][ValidateRange(1,32768)][int]$ExpectedHeight,
    [Parameter(Mandatory)][string[]]$PaletteHex,
    [Parameter(Mandatory)][ValidateSet('opaque','binary-transparent')][string]$AlphaMode,
    [string]$NativePath
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$allowed = [System.Collections.Generic.HashSet[int]]::new()
foreach ($hex in $PaletteHex) {
    if ($hex -notmatch '^#[0-9a-fA-F]{6}$') { throw "Invalid RGB palette entry: $hex" }
    [void]$allowed.Add([Convert]::ToInt32($hex.Substring(1),16))
}
$sourcePath = (Resolve-Path -LiteralPath $InputPath).Path
$bitmap = [System.Drawing.Bitmap]::new($sourcePath)
$native = $null
try {
    $issues = [System.Collections.Generic.List[string]]::new()
    $colors = [System.Collections.Generic.HashSet[int]]::new()
    $outside = 0L; $partial = 0L; $transparent = 0L; $gridMismatch = 0L; $nativeMismatch = 0L
    $nativeComparable = $false
    if ($bitmap.Width -ne $ExpectedWidth -or $bitmap.Height -ne $ExpectedHeight) { $issues.Add('dimensions') }
    if ($bitmap.Width % $CellSize -or $bitmap.Height % $CellSize) { $issues.Add('grid_divisibility') }
    if ($NativePath) {
        $native = [System.Drawing.Bitmap]::new((Resolve-Path -LiteralPath $NativePath).Path)
        $nativeComparable = $native.Width * $CellSize -eq $bitmap.Width -and $native.Height * $CellSize -eq $bitmap.Height
        if (-not $nativeComparable) { $issues.Add('native_dimensions') }
    }
    for ($y=0; $y -lt $bitmap.Height; $y++) {
        $cy = [int][Math]::Floor($y / $CellSize)
        for ($x=0; $x -lt $bitmap.Width; $x++) {
            $cx = [int][Math]::Floor($x / $CellSize)
            $pixel = $bitmap.GetPixel($x,$y)
            if ($pixel.A -eq 0) { $transparent++ }
            else {
                $rgb = $pixel.ToArgb() -band 0xFFFFFF
                [void]$colors.Add($rgb)
                if (-not $allowed.Contains($rgb)) { $outside++ }
            }
            if ($pixel.A -gt 0 -and $pixel.A -lt 255) { $partial++ }
            if ($pixel.ToArgb() -ne $bitmap.GetPixel($cx*$CellSize,$cy*$CellSize).ToArgb()) { $gridMismatch++ }
            if ($nativeComparable -and $pixel.ToArgb() -ne $native.GetPixel($cx,$cy).ToArgb()) { $nativeMismatch++ }
        }
    }
    if ($outside) { $issues.Add('palette') }
    if ($gridMismatch) { $issues.Add('cell_uniformity') }
    if ($nativeMismatch) { $issues.Add('native_rgba_mismatch') }
    if ($AlphaMode -eq 'opaque' -and ($partial -or $transparent)) { $issues.Add('opaque_alpha') }
    if ($AlphaMode -eq 'binary-transparent') {
        if ($partial) { $issues.Add('partial_alpha') }
        if (-not $transparent) { $issues.Add('missing_transparency') }
        if ($transparent -eq [long]$bitmap.Width*$bitmap.Height) { $issues.Add('empty_image') }
    }
    [pscustomobject]@{
        protocolVersion='0.2'
        input=$sourcePath
        sha256=(Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
        dimensions=@($bitmap.Width,$bitmap.Height)
        cellSize=$CellSize
        visibleRgbColors=$colors.Count
        pixelsOutsidePalette=$outside
        transparentPixels=$transparent
        partialAlphaPixels=$partial
        intraCellMismatches=$gridMismatch
        nativeComparison=$(if (-not $native) {'not_supplied'} elseif (-not $nativeComparable) {'not_comparable'} elseif ($nativeMismatch) {'mismatch'} else {'matched'})
        nativePixelMismatches=$nativeMismatch
        failures=@($issues.ToArray())
        technicalStatus=$(if ($issues.Count) {'failed'} else {'measured_checks_passed'})
        designStatus='not_evaluated'
        approvalStatus='not_approved'
        limitations='Cannot infer native design grid, correct lettering, morphology or Pixelorama layers. CellSize=1 is trivially uniform. Sampling can preserve unwanted halos and texture.'
    }
} finally {
    if ($native) { $native.Dispose() }
    $bitmap.Dispose()
}
