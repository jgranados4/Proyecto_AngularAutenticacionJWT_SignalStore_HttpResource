# Ruta al archivo .gitignore
$gitignorePath = ".gitignore"

# Crear .gitignore si no existe
if (!(Test-Path $gitignorePath)) {
    New-Item -Path $gitignorePath -ItemType File | Out-Null
    Write-Host "Archivo .gitignore creado."
}

# Carga el contenido actual del .gitignore
$gitignoreContent = @()
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath
}

# Lista fija de patrones a buscar e ignorar
$ignorePatterns = @(
    "node_modules",
    "dist",
    "build",
    ".env",
    "__pycache__",
    "coverage",
    ".vscode",
    ".idea",
    ".angular",
    "out-tsc",
    ".DS_Store",
    "Thumbs.db"
)

# Para patrones de archivos con extensión, listamos aparte
$filePatterns = @(
    "*.env.*",
    "*.py[cod]",
    "*.log",
    "*.tsbuildinfo"
)

# Para carpetas: buscar recursivamente y obtener rutas relativas con slash final
$foundDirs = @()
foreach ($pattern in $ignorePatterns) {
    $dirs = Get-ChildItem -Path . -Recurse -Directory -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($dir in $dirs) {
        $relativePath = $dir.FullName.Substring((Get-Location).Path.Length + 1)
        $relativePath = $relativePath -replace '\\', '/'
        if (-not $relativePath.EndsWith('/')) {
            $relativePath += '/'
        }
        $foundDirs += $relativePath
    }
}

# Para archivos: buscar recursivamente y obtener rutas relativas
$foundFiles = @()
foreach ($pattern in $filePatterns) {
    $files = Get-ChildItem -Path . -Recurse -File -Include $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
        $relativePath = $relativePath -replace '\\', '/'
        $foundFiles += $relativePath
    }
}

# Ahora agregamos carpetas + archivos que no estén en el .gitignore
$allFound = $foundDirs + $foundFiles
$added = $false
foreach ($item in $allFound | Sort-Object -Unique) {
    if ($gitignoreContent -notcontains $item) {
        Add-Content -Path $gitignorePath -Value $item
        Write-Host "Agregado al .gitignore: $item"
        $added = $true
    }
}

if (-not $added) {
    Write-Host "No se agregaron nuevas entradas al .gitignore."
}

# Recarga el .gitignore actualizado, omitiendo líneas vacías o comentarios
$gitignoreContent = Get-Content $gitignorePath | Where-Object { $_.Trim() -ne "" -and -not $_.Trim().StartsWith("#") }

# Limpia del repositorio archivos ya trackeados que coincidan con las rutas o patrones
foreach ($pattern in $gitignoreContent) {
    $pattern = $pattern.Trim()
    # Ejecutar git ls-files para ese patrón/ruta
    $files = git ls-files $pattern 2>$null
    foreach ($file in $files) {
        Write-Host "Removiendo del repo: $file"
        git rm --cached "$file"
    }
}

# Commit si hay cambios pendientes
$status = git status --porcelain
if ($status) {
    git commit -m "Actualización automática: limpiando archivos/carpetas ignorados y actualizando .gitignore"
    Write-Host "Cambios commiteados."
} else {
    Write-Host "No hay cambios para commitear."
}
