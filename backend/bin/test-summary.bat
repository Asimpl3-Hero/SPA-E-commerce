@echo off
REM Generate a quick test summary

echo.
echo ================================================================================
echo                           BACKEND TEST SUITE
echo ================================================================================
echo.

bundle exec rspec --format progress --no-profile 2>nul

set EXIT_CODE=%ERRORLEVEL%

echo.
echo ================================================================================
echo                           SUMMARY
echo ================================================================================

if exist coverage\.last_run.json (
    echo.
    echo Coverage Report: coverage\index.html

    REM Try to extract coverage percentage from the JSON file
    for /f "delims=" %%i in ('powershell -Command "(Get-Content coverage\.last_run.json | ConvertFrom-Json).result.covered_percent"') do set COVERAGE=%%i

    if defined COVERAGE (
        echo Coverage: !COVERAGE!%%

        REM Check if coverage meets minimum
        for /f "delims=." %%a in ("!COVERAGE!") do set COVERAGE_INT=%%a
        if !COVERAGE_INT! GEQ 80 (
            echo Status: PASS - Coverage above 80%%
        ) else (
            echo Status: WARNING - Coverage below 80%%
        )
    )
)

echo.
echo ================================================================================

if %EXIT_CODE% EQU 0 (
    echo                        ALL TESTS PASSED
    echo ================================================================================
    echo.
    echo Next steps:
    echo   - View coverage: bin\coverage.bat
    echo   - Run specific test: bundle exec rspec spec\path\to\file_spec.rb
    echo   - Read testing guide: TESTING.md
    echo.
) else (
    echo                        TESTS FAILED
    echo ================================================================================
    echo.
    echo Please fix the failing tests before proceeding.
    echo.
    exit /b %EXIT_CODE%
)
