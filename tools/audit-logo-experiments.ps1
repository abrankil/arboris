[CmdletBinding()]
param([Parameter(Mandatory)][string]$ReportDirectory)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path -Parent $PSScriptRoot
$runRoot=Join-Path (Split-Path -Parent $repoRoot) 'output/arboris/generator-runs/2026-09-14-logo-g07'
$reportRoot=[IO.Path]::GetFullPath($ReportDirectory)
if(Test-Path -LiteralPath $reportRoot){throw 'Choose a new report directory to preserve previous reports.'}
[void](New-Item -ItemType Directory -Path $reportRoot)
$audit=Join-Path $PSScriptRoot 'measure-pixel-contract.ps1'
$palette=@('#0F2E1F','#2E7D32','#4C9A3D','#A7C957','#EDE7D3','#8B6F47')
$summary=[System.Collections.Generic.List[object]]::new()
foreach($case in @(
    @{name='v02';file='proposal-v02.png';width=1957;height=804;cell=4},
    @{name='v03';file='proposal-v03-grid-locked.png';width=1956;height=804;cell=4}
)) {
    $report=& $audit -InputPath (Join-Path $runRoot $case.file) -ExpectedWidth $case.width -ExpectedHeight $case.height -CellSize $case.cell -PaletteHex $palette -AlphaMode opaque
    $report | Add-Member -NotePropertyName contractScope -NotePropertyValue 'Diagnostic historical geometry; not an approved logo canvas. Palette from brand brief; native source not supplied.'
    $report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $reportRoot ($case.name+'.json')) -Encoding utf8
    $summary.Add([pscustomobject]@{candidate=$case.name;status=$report.technicalStatus;colors=$report.visibleRgbColors;outsidePalette=$report.pixelsOutsidePalette;cellMismatches=$report.intraCellMismatches;failures=$report.failures})
}
$tests=& (Join-Path $PSScriptRoot 'test-pixel-contract.ps1') | ConvertFrom-Json
$tests | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $reportRoot 'regression-tests.json') -Encoding utf8
[pscustomobject]@{reports=$reportRoot;audits=@($summary.ToArray());testsPassed=$tests.passed;testsFailed=$tests.failed} | ConvertTo-Json -Depth 6
