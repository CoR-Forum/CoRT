#!/bin/sh

echo '*** Creating the database ***'
printf "Username: "
read user
mysql -u "${user}" -p cort < database.sql

echo '*** Downloading the SQLITE data ***'
tempdb="$(mktemp)"
wget -O "${tempdb}" https://hail.thebus.top/CoRT/warstatus/stats/events.sqlite

echo '*** Migrating to MySQL ***'
echo "Please enter again you Mysql password for ${user}:"
echo ".dump events" | sqlite3 ${tempdb} | awk 'BEGIN {print "START TRANSACTION;"} /^INSERT/ {sub("VALUES\\(", "VALUES(NULL,"); print} END {print "COMMIT;"}' | mysql -u "${user}" -p cort

rm "${tempdb}"
echo "Migration finished"
