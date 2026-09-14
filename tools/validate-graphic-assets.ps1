# Read-only audit for Arboris graphics. Requires Windows PowerShell/.NET drawing support.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$repoRoot = Split-Path -Parent $PSScriptRoot
$characterRoot = Join-Path $repoRoot 'data/characters'
$index = Get-Content -LiteralPath (Join-Path $characterRoot 'index.json') -Raw | ConvertFrom-Json
$issues = [System.Collections.Generic.List[string]]::new()
$review = [System.Collections.Generic.List[string]]::new()
$rows = [System.Collections.Generic.List[object]]::new()
$ids = [System.Collections.Generic.HashSet[string]]::new()
$files = [System.Collections.Generic.HashSet[string]]::new()
$assets = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

function Require-File([string]$basePath, [string]$relativePath) {
    $resolved = [System.IO.Path]::GetFullPath((Join-Path $basePath $relativePath))
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "Missing referenced file: $resolved"
    }
    return $resolved
}

function Compare-PixeloramaLayer([string]$sourcePath, [System.Drawing.Bitmap]$bitmap) {
    $archive = $null
    try {
        $archive = [System.IO.Compression.ZipFile]::OpenRead($sourcePath)
        $entry = $archive.GetEntry('image_data/frames/1/layer_1')
        if (-not $entry) {
            return [pscustomobject]@{ status = 'not_comparable'; detail = 'missing image layer' }
        }
        $expectedLength = $bitmap.Width * $bitmap.Height * 4
        if ($entry.Length -ne $expectedLength) {
            return [pscustomobject]@{ status = 'not_comparable'; detail = "unexpected layer length: $($entry.Length)" }
        }
        $bytes = [byte[]]::new($expectedLength)
        $stream = $entry.Open()
        try {
            $read = 0
            while ($read -lt $bytes.Length) {
                $count = $stream.Read($bytes, $read, $bytes.Length - $read)
                if ($count -le 0) { break }
                $read += $count
            }
        } finally {
            $stream.Dispose()
        }
        if ($read -ne $bytes.Length) {
            return [pscustomobject]@{ status = 'not_comparable'; detail = "short image layer: $read/$($bytes.Length) bytes" }
        }
        for ($y = 0; $y -lt $bitmap.Height; $y++) {
            for ($x = 0; $x -lt $bitmap.Width; $x++) {
                $pixel = $bitmap.GetPixel($x, $y)
                $offset = (($y * $bitmap.Width) + $x) * 4
                if ($bytes[$offset] -ne $pixel.R -or
                    $bytes[$offset + 1] -ne $pixel.G -or
                    $bytes[$offset + 2] -ne $pixel.B -or
                    $bytes[$offset + 3] -ne $pixel.A) {
                    return [pscustomobject]@{ status = 'mismatch'; detail = "pixel mismatch at $x,$y" }
                }
            }
        }
        return [pscustomobject]@{ status = 'matched'; detail = 'RGBA layer matches PNG' }
    } catch {
        return [pscustomobject]@{ status = 'not_comparable'; detail = $_.Exception.Message }
    } finally {
        if ($archive) { $archive.Dispose() }
    }
}

foreach ($entry in $index.characters) {
    if (-not $files.Add($entry)) { $issues.Add("Duplicate entry: $entry") }
    $metadataPath = Require-File $characterRoot $entry
    $metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
    if (-not $ids.Add($metadata.id)) { $issues.Add("Duplicate ID: $($metadata.id)") }
    if ($metadata.selectedDesign.isCanonical -ne $true) { $issues.Add("Active design is not canonical: $entry") }
    $path = Require-File $characterRoot $metadata.selectedDesign.asset
    if (-not $assets.Add($path)) { $issues.Add("Shared selected asset: $path") }
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($metadata.provenance -and $metadata.provenance.sha256 -and $hash -ne $metadata.provenance.sha256) {
        $issues.Add("Declared SHA-256 does not match: $entry")
    }
    $sourcePath = $null
    if ($metadata.selectedDesign.source) {
        $sourcePath = Require-File $characterRoot $metadata.selectedDesign.source
    }

    $bitmap = [System.Drawing.Bitmap]::new($path)
    try {
        $dimensions = "$($bitmap.Width)x$($bitmap.Height)"
        if ($dimensions -ne '125x125' -or $dimensions -ne $metadata.selectedDesign.dimensions) {
            $issues.Add("Unexpected dimensions: $entry ($dimensions)")
        }
        $transparent = 0
        $partial = 0
        $visible = 0
        for ($y = 0; $y -lt $bitmap.Height; $y++) {
            for ($x = 0; $x -lt $bitmap.Width; $x++) {
                $alpha = $bitmap.GetPixel($x, $y).A
                if ($alpha -eq 0) { $transparent++ } else { $visible++ }
                if ($alpha -gt 0 -and $alpha -lt 255) { $partial++ }
            }
        }
        if ($transparent -eq 0) { $issues.Add("No transparent background: $entry") }
        if ($visible -eq 0) { $issues.Add("Empty sprite: $entry") }
        if ($partial -gt 0) {
            $review.Add("$($metadata.speciesId): $partial semitransparent pixels. Review the approved sprite; do not modify it automatically.")
        }
        $editableSourceMatch = 'not_declared'
        if ($sourcePath) {
            $sourceCheck = Compare-PixeloramaLayer $sourcePath $bitmap
            $editableSourceMatch = $sourceCheck.status
            if ($sourceCheck.status -eq 'mismatch') {
                $issues.Add("Editable source does not match PNG: $entry ($($sourceCheck.detail))")
            } elseif ($sourceCheck.status -eq 'not_comparable') {
                $review.Add("$($metadata.speciesId): editable source could not be compared ($($sourceCheck.detail)).")
            }
        }
        $rows.Add([pscustomobject]@{
            speciesId = $metadata.speciesId
            version = $metadata.selectedDesign.version
            dimensions = $dimensions
            semitransparentPixels = $partial
            editableSourceMatch = $editableSourceMatch
            sha256 = $hash
        })
    } finally {
        $bitmap.Dispose()
    }
}

$layers = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($entry in $index.sharedAssets.animationLayers.characters) {
    $path = Require-File $characterRoot $entry
    if (-not $layers.Add($path)) { $issues.Add("Duplicate animation layer: $entry") }
}
if (-not $layers.SetEquals($assets)) { $issues.Add('Animation layers do not match the current character assets.') }
foreach ($entry in @($index.sharedAssets.approvedVisualReferences) + @($index.sharedAssets.promotional)) {
    [void](Require-File $characterRoot $entry)
}

$backgroundRoot = Join-Path $repoRoot 'docs/assets/backgrounds'
$backgroundRows = [System.Collections.Generic.List[object]]::new()
$canvas = $null
foreach ($entry in @('00-sky.png', '01-background.png', '02-midground.png', '03-foreground.png')) {
    $path = Require-File $backgroundRoot "parallax/$entry"
    $bitmap = [System.Drawing.Bitmap]::new($path)
    try {
        $dimensions = "$($bitmap.Width)x$($bitmap.Height)"
        if ($canvas -and $canvas -ne $dimensions) { $issues.Add("Mismatched parallax canvas: $entry") }
        $canvas = $dimensions
        $backgroundRows.Add([pscustomobject]@{file = $entry; dimensions = $dimensions})
    } finally {
        $bitmap.Dispose()
    }
}

[pscustomobject]@{
    status = $(if ($issues.Count) { 'invalid' } elseif ($review.Count) { 'review_required' } else { 'checks_passed' })
    characters = @($rows.ToArray())
    parallax = @($backgroundRows.ToArray())
    errors = @($issues.ToArray())
    humanReview = @($review.ToArray())
    limitations = 'Read-only file checks; no Pixelorama session, botanical validation, native pixel-grid or scene-render certification.'
} | ConvertTo-Json -Depth 6

if ($issues.Count) { exit 1 }
