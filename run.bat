@echo off
echo Starting Resume Builder...

:: Start the PostgreSQL database using Docker Compose if it exists
if exist docker-compose.yml (
    echo Starting PostgreSQL database...
    docker-compose up -d
)

:: Wait a few seconds for DB to be ready
timeout /t 3 /nobreak >nul

:: Start the API Server in a new window
echo Starting API Server...
start "API Server" cmd /k "pnpm --filter @workspace/api-server run dev:local"

:: Start the Expo App in a new window
echo Starting Expo App...
start "Expo App" cmd /k "pnpm --filter @workspace/resume-ai run dev:local"

echo Services have been started in separate windows!
