[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OutputDirectory,
    [ValidateRange(1,32)][int]$CellSize = 4,
    [ValidateRange(1,3)][int]$GlyphScale = 1,
    [ValidateSet('v08','v09')][string]$DesignVariant = 'v08'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$width = 128 * $GlyphScale
$height = 32 * $GlyphScale
$colors = @{
    ink = [Drawing.Color]::FromArgb(255,15,46,31)
    leaf = [Drawing.Color]::FromArgb(255,46,125,50)
    leafLight = [Drawing.Color]::FromArgb(255,76,154,61)
    leafHighlight = [Drawing.Color]::FromArgb(255,167,201,87)
    ivory = [Drawing.Color]::FromArgb(255,237,231,211)
}

$glyphs = @{
    'a' = @('0111110','1100011','1100011','1111111','1100011','1100011','1100011','1100011','1100011')
    'r' = @('1111110','1100011','1100000','1100000','1100000','1100000','1100000','1100000','1100000')
    'b' = @('1100000','1100000','1111110','1100011','1100011','1100011','1100011','1100011','1111110')
    'i' = @('001100','000000','001100','001100','001100','001100','001100','001100','001100')
    's' = @('0111110','1100000','1100000','0111110','0000011','0000011','1100011','0111110','0000000')
}
$small = @{
    'A'=@('010','101','111','101','101'); 'C'=@('111','100','100','100','111'); 'D'=@('110','101','101','101','110')
    'E'=@('111','100','110','100','111'); 'L'=@('100','100','100','100','111'); 'N'=@('101','111','111','101','101')
    'O'=@('111','101','101','101','111'); 'P'=@('110','101','110','100','100'); 'R'=@('110','101','110','101','101')
    'S'=@('111','100','111','001','111'); 'V'=@('101','101','101','101','010'); 'X'=@('101','101','010','101','101')
}
if ($DesignVariant -eq 'v09') {
    $glyphs['a'] = @('0111110','1100011','1100011','1111111','1100011','1100011','1100011','1100011','1100011')
    $glyphs['r'] = @('1111100','1100011','1100000','1100000','1100000','1100000','1100000','1100000','1100000')
    $glyphs['b'] = @('1100000','1100000','1111110','1100011','1100011','1100011','1100011','1100011','1111110')
    $glyphs['i'] = @('001100','000000','001100','001100','001100','001100','001100','001100','001100')
    $glyphs['s'] = @('0111110','1100000','1100000','0111110','0000011','0000011','1100011','0111110','0000000')
}

function Set-Cell([Drawing.Bitmap]$Bitmap,[int]$X,[int]$Y,[Drawing.Color]$Color) {
    if ($X -ge 0 -and $Y -ge 0 -and $X -lt $Bitmap.Width -and $Y -lt $Bitmap.Height) {
        $Bitmap.SetPixel($X,$Y,$Color)
    }
}
function Set-Block([Drawing.Bitmap]$Bitmap,[int]$X,[int]$Y,[int]$Scale,[Drawing.Color]$Color) {
    for($dy=0;$dy -lt $Scale;$dy++){for($dx=0;$dx -lt $Scale;$dx++){Set-Cell $Bitmap ($X+$dx) ($Y+$dy) $Color}}
}
function Paint-Glyph([Drawing.Bitmap]$Bitmap,[string[]]$Pattern,[int]$X,[int]$Y,[Drawing.Color]$Color,[int]$Scale = 1) {
    for($row=0;$row -lt $Pattern.Count;$row++) {
        for($col=0;$col -lt $Pattern[$row].Length;$col++) {
            if($Pattern[$row][$col] -eq '1') { Set-Block $Bitmap ($X+$col*$Scale) ($Y+$row*$Scale) $Scale $Color }
        }
    }
}
function Paint-Leaf([Drawing.Bitmap]$Bitmap,[int]$X,[int]$Y,[int]$Scale = 1) {
    if ($DesignVariant -eq 'v09') {
        $pattern=@('0000001000000','0000011100000','0000111110000','0001111111000','0011111111100','0111111111110','1111111111100','0111111111000','0011111110000','0001111100000','0000111000000')
        $vein=@(@(5,10),@(5,9),@(5,8),@(6,7),@(6,6),@(7,5),@(7,4),@(8,3),@(9,2),@(3,8),@(2,7),@(9,6),@(10,6))
    } else {
        $pattern=@('00000100000','00011110000','00111111000','01111111100','11111111110','11111111111','01111111110','00111111000','00011110000')
        $vein=@(@(5,8),@(5,7),@(5,6),@(5,5),@(6,4),@(6,3),@(7,2),@(8,1),@(3,6),@(2,5),@(8,5),@(9,5))
    }
    Paint-Glyph $Bitmap $pattern $X $Y $colors.leaf $Scale
    foreach($p in $vein) { Set-Block $Bitmap ($X+$p[0]*$Scale) ($Y+$p[1]*$Scale) $Scale $colors.leafHighlight }
    Set-Block $Bitmap ($X+6*$Scale) ($Y+5*$Scale) $Scale $colors.leafLight
}
function Paint-Slogan([Drawing.Bitmap]$Bitmap,[int]$X,[int]$Y,[int]$Scale = 1) {
    $text='EXPLORA • APRENDE • CONSERVA'
    $cursor=$X
    foreach($char in $text.ToCharArray()) {
        if($char -eq ' ') { $cursor+=2*$Scale; continue }
        if($char -eq '•') { Set-Block $Bitmap $cursor ($Y+2*$Scale) $Scale $colors.ink; $cursor+=2*$Scale; continue }
        Paint-Glyph $Bitmap $small[$char.ToString()] $cursor $Y $colors.ink $Scale
        $cursor+=4*$Scale
    }
}

$logical=[Drawing.Bitmap]::new($width,$height,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$presentation=$null
try {
    for($y=0;$y -lt $height;$y++){for($x=0;$x -lt $width;$x++){ $logical.SetPixel($x,$y,$colors.ivory) }}
    $wordX=8*$GlyphScale; $wordY=5*$GlyphScale
    Paint-Glyph $logical $glyphs['a'] $wordX $wordY $colors.ink $GlyphScale
    # Accent is a separate, aligned cluster over the first glyph.
    Set-Block $logical ($wordX+2*$GlyphScale) ($wordY-2*$GlyphScale) $GlyphScale $colors.ink
    Set-Block $logical ($wordX+3*$GlyphScale) ($wordY-2*$GlyphScale) $GlyphScale $colors.ink
    Set-Block $logical ($wordX+4*$GlyphScale) ($wordY-3*$GlyphScale) $GlyphScale $colors.ink
    $cursor=$wordX+9*$GlyphScale
    Paint-Glyph $logical $glyphs['r'] $cursor $wordY $colors.ink $GlyphScale; $cursor+=9*$GlyphScale
    Paint-Glyph $logical $glyphs['b'] $cursor $wordY $colors.ink $GlyphScale; $cursor+=9*$GlyphScale
    Paint-Leaf $logical $cursor $wordY $GlyphScale; $cursor+=13*$GlyphScale
    Paint-Glyph $logical $glyphs['r'] $cursor $wordY $colors.ink $GlyphScale; $cursor+=9*$GlyphScale
    Paint-Glyph $logical $glyphs['i'] $cursor $wordY $colors.ink $GlyphScale; $cursor+=8*$GlyphScale
    Paint-Glyph $logical $glyphs['s'] $cursor $wordY $colors.ink $GlyphScale
    Paint-Slogan $logical (12*$GlyphScale) (18*$GlyphScale) $GlyphScale

    $parent=[IO.Path]::GetFullPath($OutputDirectory)
    if(Test-Path -LiteralPath $parent){$existing=Get-ChildItem -LiteralPath $parent -File -ErrorAction SilentlyContinue;if($existing){throw 'Output directory is not empty; choose a new versioned directory.'}}
    else{[void](New-Item -ItemType Directory -Path $parent)}
    $logicalPath=Join-Path $parent ("proposal-${DesignVariant}-native-logical.png")
    $presentationPath=Join-Path $parent ("proposal-${DesignVariant}-native-${CellSize}x.png")
    $logical.Save($logicalPath,[Drawing.Imaging.ImageFormat]::Png)
    $presentation=[Drawing.Bitmap]::new($width*$CellSize,$height*$CellSize,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for($y=0;$y -lt $height;$y++){for($x=0;$x -lt $width;$x++){
        $color=$logical.GetPixel($x,$y)
        for($dy=0;$dy -lt $CellSize;$dy++){for($dx=0;$dx -lt $CellSize;$dx++){$presentation.SetPixel($x*$CellSize+$dx,$y*$CellSize+$dy,$color)}}
    }}
    $presentation.Save($presentationPath,[Drawing.Imaging.ImageFormat]::Png)
    [pscustomobject]@{status='native_grid_rendered';designVariant=$DesignVariant;logical=$logicalPath;presentation=$presentationPath;logicalDimensions="${width}x${height}";cellSize=$CellSize;glyphScale=$GlyphScale;palette=@('#0F2E1F','#2E7D32','#4C9A3D','#A7C957','#EDE7D3');designValidated=$false} | ConvertTo-Json
}
finally{if($presentation){$presentation.Dispose()};$logical.Dispose()}
