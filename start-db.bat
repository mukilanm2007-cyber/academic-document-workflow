@echo off
title MySQL Server 8.0 (Port 3307)
echo [1/3] Starting MySQL Server on port 3307...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="%~dp0database\mysql-data" --port=3307 --bind-address=127.0.0.1 --console
