@echo off
REM Quick test runner script for Windows

setlocal enabledelayedexpansion

set FORMAT=progress
set EXTRA_ARGS=

:parse_args
if "%~1"=="" goto run_tests
if "%~1"=="-d" set FORMAT=documentation
if "%~1"=="--documentation" set FORMAT=documentation
if "%~1"=="-f" set FORMAT=failures
if "%~1"=="--failures" set FORMAT=failures
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help

REM Capture any file path or other arguments
set EXTRA_ARGS=!EXTRA_ARGS! %~1

shift
goto parse_args

:run_tests
echo Running tests with format: %FORMAT%
echo.
bundle exec rspec --format %FORMAT% %EXTRA_ARGS%
exit /b %ERRORLEVEL%

:show_help
echo Usage: bin\test.bat [options] [file_path]
echo.
echo Options:
echo   -d, --documentation    Show documentation format
echo   -f, --failures         Show only failures
echo   -h, --help             Show this help message
echo.
echo Examples:
echo   bin\test.bat                                    Run all tests
echo   bin\test.bat -d                                 Run with documentation format
echo   bin\test.bat spec\domain\entities              Run tests in specific folder
echo   bin\test.bat spec\domain\entities\product_spec.rb   Run specific test file
echo.
exit /b 0
