@echo off
REM Script to run tests and generate coverage report (Windows)

echo.
echo Running RSpec tests with coverage...
echo.

bundle exec rspec --format documentation

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo All tests passed!
    echo ================================================================================
    echo.

    if exist coverage\index.html (
        echo Coverage report generated at: coverage\index.html
        echo.
        echo Opening coverage report in browser...
        echo.
        start coverage\index.html

        echo.
        echo Tips:
        echo    - Coverage report: coverage\index.html
        echo    - Re-run tests: bundle exec rspec
        echo    - Run specific test: bundle exec rspec spec\path\to\file_spec.rb
        echo.
    ) else (
        echo WARNING: Coverage report not found. Make sure SimpleCov is configured.
        echo.
    )
) else (
    echo.
    echo ================================================================================
    echo Tests failed! Exit code: %ERRORLEVEL%
    echo ================================================================================
    echo.
    exit /b %ERRORLEVEL%
)
