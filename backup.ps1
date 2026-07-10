while ($true) {
    Write-Host "Starting auto-backup cycle..."
    
    # Check for changes strictly within backend/ and src/
    $status = git status --porcelain backend/ src/
    
    if (-not [string]::IsNullOrWhiteSpace($status)) {
        Write-Host "Changes detected. Staging backend/ and src/..."
        git add backend/ src/
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "auto-backup: [$timestamp]"
        
        Write-Host "Committing changes..."
        git commit -m $commitMessage
        
        Write-Host "Pushing to origin main..."
        git push origin main
        
        Write-Host "Backup successful at $timestamp!"
    } else {
        Write-Host "No changes detected in backend/ or src/. Skipping commit."
    }
    
    Write-Host "Sleeping for 15 minutes..."
    Start-Sleep -Seconds 900
}
