start "MongoDB" mongod --dbpath "C:\data\db"
timeout /t 2
start "Servidor" cmd /k "cd /d C:\Users\juanf\OneDrive\Escritorio\protect\tienda\backend && node server.js"