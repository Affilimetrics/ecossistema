@echo off
setlocal
cd /d "%~dp0"
rem Tests always use SQLite; the operational DATABASE_URL is not used.
set "DATABASE_URL=sqlite:///tests-local.sqlite3"

if "%~1"=="" goto run_all
if /I "%~1"=="all" goto run_all

goto run_selected

:run_selected
python manage.py test %* --verbosity 2 --noinput
goto finish

:run_all
python manage.py test core.test_authentication core.test_profile core.tests core.test_advanced_tools core.test_desktop_api core.test_testing_portal core.test_test_runner magalu_bot.tests.test_afiliados ads_manager.tests ltv.tests.test_importer ltv.tests.test_metrics cpa.tests.test_analytics cpa.tests.test_importer financeiro.tests.test_frontend financeiro.tests.test_roi desktop_app.tests.test_ml_output --verbosity 2 --noinput

:finish
set "TEST_EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %TEST_EXIT_CODE%
