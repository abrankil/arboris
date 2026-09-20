[CmdletBinding()]
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\prototype\arboris-logo-prototype-p01.png'),
    [string]$Destination = (Join-Path $PSScriptRoot '..\..\output\arboris\brand\prototype\arboris-logo-prototype-p02.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$outline = [System.Drawing.Color]::FromArgb(255, 12, 49, 31)
$leaf = [System.Drawing.Color]::FromArgb(255, 53, 125, 59)
$leafShadow = [System.Drawing.Color]::FromArgb(255, 36, 90, 45)
$vein = [System.Drawing.Color]::FromArgb(255, 167, 201, 87)

$input = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $Source))
try {
    $w = $input.Width; $h = $input.Height
    $isLeaf = New-Object 'bool[,]' $w,$h
    $isOpaque = New-Object 'bool[,]' $w,$h
    for ($y=0; $y -lt $h; $y++) {
        for ($x=0; $x -lt $w; $x++) {
            $c=$input.GetPixel($x,$y)
            $isOpaque[$x,$y]=($c.A -gt 0)
            $isLeaf[$x,$y]=($c.A -gt 0 -and $c.G -gt ($c.R + 15) -and $c.R -gt 15)
        }
    }

    $output = New-Object System.Drawing.Bitmap $w,$h,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        for ($y=0; $y -lt $h; $y++) {
            for ($x=0; $x -lt $w; $x++) {
                $c=$input.GetPixel($x,$y)
                if ($isLeaf[$x,$y]) {
                    $shadowEdge=$false
                    for ($dy=-1; $dy -le 1; $dy++) { for ($dx=-1; $dx -le 1; $dx++) {
                        if ($dx -eq 0 -and $dy -eq 0) { continue }
                        $nx=$x+$dx;$ny=$y+$dy
                        if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h -and -not $isLeaf[$nx,$ny] -and $dy -ge 0) { $shadowEdge=$true }
                    }}
                    if ($shadowEdge -and $c.R -gt 20 -and $c.G -lt 180) { $output.SetPixel($x,$y,$leafShadow) }
                    elseif ($c.R -gt 120 -and $c.G -gt 160) { $output.SetPixel($x,$y,$vein) }
                    else { $output.SetPixel($x,$y,$leaf) }
                }
                elseif ($isOpaque[$x,$y]) { $output.SetPixel($x,$y,$c) }
                else {
                    $nearLeaf=$false
                    for ($dy=-1; $dy -le 1; $dy++) { for ($dx=-1; $dx -le 1; $dx++) {
                        if ($dx -eq 0 -and $dy -eq 0) { continue }
                        $nx=$x+$dx;$ny=$y+$dy
                        if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h -and $isLeaf[$nx,$ny]) { $nearLeaf=$true }
                    }}
                    if ($nearLeaf) { $output.SetPixel($x,$y,$outline) } else { $output.SetPixel($x,$y,$transparent) }
                }
            }
        }
        $parent=Split-Path -Parent $Destination
        if(-not(Test-Path -LiteralPath $parent)){New-Item -ItemType Directory -Path $parent -Force|Out-Null}
        $output.Save($Destination,[System.Drawing.Imaging.ImageFormat]::Png)
    } finally {$output.Dispose()}
} finally {$input.Dispose()}

[pscustomobject]@{source=(Resolve-Path -LiteralPath $Source).Path;destination=(Resolve-Path -LiteralPath $Destination).Path;width=$w;height=$h;result='vegetation_style_applied_to_leaf_only'}
