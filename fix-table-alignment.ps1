# Script to fix table alignment across all pages
# Ensures consistent padding and alignment for table headers and cells

$files = @(
    "src/app/admin/time-off-requests/page.tsx",
    "src/app/admin/overtime-requests/page.tsx",
    "src/app/admin/registration-requests/page.tsx",
    "src/app/admin/work-shifts/page.tsx",
    "src/app/admin/time-off-types/page.tsx",
    "src/app/admin/warehouse/storage/page.tsx",
    "src/app/admin/warehouse/suppliers/page.tsx",
    "src/app/admin/warehouse/inventory/page.tsx",
    "src/app/admin/renewals/page.tsx",
    "src/app/employee/overtime-requests/page.tsx",
    "src/app/employee/warehouse/storage/page.tsx",
    "src/app/employee/warehouse/suppliers/page.tsx",
    "src/app/employee/warehouse/inventory/page.tsx",
    "src/app/employee/appointments/components/AppointmentList.tsx"
)

$replacements = @(
    # Fix table header padding - from p-3 to px-6 py-3
    @{
        Old = 'className="text-left p-3 font'
        New = 'className="text-left px-6 py-3 font'
    },
    @{
        Old = 'className="text-right p-3 font'
        New = 'className="text-right px-6 py-3 font'
    },
    @{
        Old = 'className="text-center p-3 font'
        New = 'className="text-center px-6 py-3 font'
    },
    # Fix table cell padding - from p-3 to px-6 py-4
    @{
        Old = '<td className="p-3 '
        New = '<td className="px-6 py-4 '
    },
    @{
        Old = '<td className="p-3">'
        New = '<td className="px-6 py-4">'
    },
    # Fix "Thao tác" column to always be text-right
    @{
        Old = 'text-left.*Thao tác'
        New = 'text-right px-6 py-3 font-medium text-gray-700">Thao tác'
        IsRegex = $true
    }
)

$count = 0
foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $modified = $false
        
        foreach ($replacement in $replacements) {
            if ($replacement.IsRegex) {
                if ($content -match $replacement.Old) {
                    $content = $content -replace $replacement.Old, $replacement.New
                    $modified = $true
                }
            } else {
                if ($content -contains $replacement.Old) {
                    $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
                    $modified = $true
                }
            }
        }
        
        if ($modified) {
            Set-Content $fullPath -Value $content -NoNewline
            $count++
            Write-Host "✓ Fixed: $file" -ForegroundColor Green
        }
    }
}

Write-Host "`nTotal files fixed: $count" -ForegroundColor Cyan
