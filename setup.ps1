# One-click setup script for ConnectSphere
# Run from: ConnectSphere Codes\ directory

Write-Host "🚀 Setting up ConnectSphere..." -ForegroundColor Cyan

# Install backend dependencies
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies  
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nTo start the app:" -ForegroundColor White
Write-Host "  1. Open a terminal → cd backend && npm run dev" -ForegroundColor Gray
Write-Host "  2. Open another terminal → cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "  3. Visit http://localhost:5173" -ForegroundColor Cyan
