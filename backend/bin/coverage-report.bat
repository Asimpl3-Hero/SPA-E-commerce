@echo off
REM Generate detailed coverage report (Windows)

echo.
echo Generating detailed coverage report...
echo.

bundle exec rspec --format json --out rspec_results.json

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Tests failed! Fix the tests before generating coverage report.
    echo.
    exit /b %ERRORLEVEL%
)

echo.
echo ================================================================================
echo COVERAGE REPORT GENERATED
echo ================================================================================
echo.

if exist coverage\.last_run.json (
    echo Coverage data found. Generating summary...
    echo.
)

if exist coverage\index.html (
    echo HTML Report: coverage\index.html
    echo.
    echo Opening HTML coverage report...
    start coverage\index.html
) else (
    echo WARNING: Coverage HTML report not found.
)

if exist coverage\coverage_summary.txt (
    echo.
    echo Text summary:
    type coverage\coverage_summary.txt
)

echo.
echo Coverage report generation complete!
echo.
