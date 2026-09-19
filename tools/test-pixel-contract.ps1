# Synthetic fixtures test rejection behavior; these are not Arboris artwork.
[CmdletBinding()]
param([string]$ReportPath)
$ErrorActionPreference='Stop'
if ($ReportPath -and (Test-Path -LiteralPath $ReportPath)) { throw 'Report exists; choose a new filename.' }
Add-Type -AssemblyName System.Drawing
$testRoot=Join-Path ([IO.Path]::GetTempPath()) ('arboris-pixel-audit-'+[guid]::NewGuid().ToString('N'))
[void](New-Item -ItemType Directory -Path $testRoot)
$audit=Join-Path $PSScriptRoot 'measure-pixel-contract.ps1'
$rows=[System.Collections.Generic.List[object]]::new()
function Fixture([string]$name,[int]$w,[int]$h,[scriptblock]$paint) {
    $b=[Drawing.Bitmap]::new($w,$h)
    try {
        & $paint $b
        $p=Join-Path $testRoot ($name+'.png')
        $b.Save($p,[Drawing.Imaging.ImageFormat]::Png)
        return $p
    } finally { $b.Dispose() }
}
function Check([string]$name,[bool]$ok) {
    $rows.Add([pscustomobject]@{test=$name;passed=$ok})
    if (-not $ok) { throw "Regression: $name" }
}
$native=Fixture native 3 2 {param($b)
    for($y=0;$y -lt 2;$y++){for($x=0;$x -lt 3;$x++){$b.SetPixel($x,$y,[Drawing.Color]::Black)}}
    $b.SetPixel(2,1,[Drawing.Color]::White)
}
$valid=Fixture valid 6 4 {param($b)
    for($y=0;$y -lt 4;$y++){for($x=0;$x -lt 6;$x++){$b.SetPixel($x,$y,[Drawing.Color]::Black)}}
    for($y=2;$y -lt 4;$y++){for($x=4;$x -lt 6;$x++){$b.SetPixel($x,$y,[Drawing.Color]::White)}}
}
$argsAudit=@{CellSize=2;ExpectedWidth=6;ExpectedHeight=4;PaletteHex=@('#000000','#FFFFFF');AlphaMode='opaque'}
$r=& $audit -InputPath $valid @argsAudit -NativePath $native
Check 'unequal_cluster_areas_on_same_grid_are_valid' ($r.technicalStatus -eq 'measured_checks_passed')
Check 'exact_integer_export_matches_native' ($r.nativeComparison -eq 'matched')
Check 'technical_pass_never_approves_design' ($r.approvalStatus -eq 'not_approved' -and $r.designStatus -eq 'not_evaluated')
$corrupt=Fixture corrupt 6 4 {param($b)
    for($y=0;$y -lt 4;$y++){for($x=0;$x -lt 6;$x++){$b.SetPixel($x,$y,[Drawing.Color]::Black)}}
    $b.SetPixel(1,1,[Drawing.Color]::White)
}
$r=& $audit -InputPath $corrupt @argsAudit -NativePath $native
Check 'single_off_grid_pixel_is_rejected' ($r.failures -contains 'cell_uniformity')
Check 'native_mismatch_is_rejected' ($r.failures -contains 'native_rgba_mismatch')
$badPalette=Fixture palette 6 4 {param($b)
    for($y=0;$y -lt 4;$y++){for($x=0;$x -lt 6;$x++){$b.SetPixel($x,$y,[Drawing.Color]::Red)}}
}
$r=& $audit -InputPath $badPalette @argsAudit
Check 'uniform_cells_do_not_hide_wrong_palette' ($r.intraCellMismatches -eq 0 -and $r.failures -contains 'palette')
$argsAudit.AlphaMode='binary-transparent'
$r=& $audit -InputPath $valid @argsAudit
Check 'opaque_image_cannot_claim_transparency' ($r.failures -contains 'missing_transparency')
$partial=Fixture alpha 6 4 {param($b)
    for($y=0;$y -lt 4;$y++){for($x=0;$x -lt 6;$x++){$b.SetPixel($x,$y,[Drawing.Color]::FromArgb(128,0,0,0))}}
}
$r=& $audit -InputPath $partial @argsAudit
Check 'partial_alpha_is_rejected' ($r.failures -contains 'partial_alpha')
$empty=Fixture empty 6 4 {param($b)}
$r=& $audit -InputPath $empty @argsAudit
Check 'empty_transparent_image_is_rejected' ($r.failures -contains 'empty_image')
$argsAudit.CellSize=4
$r=& $audit -InputPath $valid @argsAudit
Check 'fractional_cell_at_edge_is_rejected' ($r.failures -contains 'grid_divisibility')
$argsAudit.ExpectedWidth=8
$r=& $audit -InputPath $valid @argsAudit
Check 'incorrect_dimensions_are_rejected' ($r.failures -contains 'dimensions')
$renderer=Join-Path $PSScriptRoot 'lock-pixel-grid.ps1'
$study=Join-Path $testRoot 'unrequested-study.png'
$caught=$false
try { & $renderer -InputPath $valid -OutputPath $study -LogicalWidth 3 -LogicalHeight 2 -CellSize 2 | Out-Null }
catch { $caught=$_.Exception.Message -like '*not the declared native canvas*' }
Check 'renderer_refuses_implicit_resampling' ($caught -and -not (Test-Path -LiteralPath $study))
$before=(Get-FileHash -LiteralPath $valid).Hash
$caught=$false
try { & $renderer -InputPath $native -OutputPath $valid -LogicalWidth 3 -LogicalHeight 2 -CellSize 2 | Out-Null }
catch { $caught=$_.Exception.Message -like '*Output exists*' }
Check 'renderer_preserves_existing_output' ($caught -and $before -eq (Get-FileHash -LiteralPath $valid).Hash)
$replica=Join-Path $testRoot 'native-export.png'
$replication=& $renderer -InputPath $native -OutputPath $replica -LogicalWidth 3 -LogicalHeight 2 -CellSize 2 | ConvertFrom-Json
$r=& $audit -InputPath $replica -CellSize 2 -ExpectedWidth 6 -ExpectedHeight 4 -PaletteHex @('#000000','#FFFFFF') -AlphaMode opaque -NativePath $native
Check 'renderer_exact_export_matches_native_rgba' ($r.nativeComparison -eq 'matched' -and $replication.status -eq 'integer_replication' -and -not $replication.designValidated)
$json=[pscustomobject]@{passed=$rows.Count;failed=0;tests=@($rows.ToArray());fixtures=$testRoot} | ConvertTo-Json -Depth 5
if ($ReportPath) { $json | Set-Content -LiteralPath $ReportPath -Encoding utf8 }
$json
