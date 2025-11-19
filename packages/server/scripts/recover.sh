#!/bin/bash

DB="$1"

DB_PATH="./data/${DB}.db"
BACKUP_PATH="./data/${DB}_corrupt_backup.db"
NEW_DB="./data/${DB}_new.db"
DUMP_FILE="./data/${DB}_backup.sql"

echo "Starting SQLite recovery process..."

# 1. Backup the corrupted database
echo "Backing up corrupted database..."
cp "$DB_PATH" "$BACKUP_PATH"

# 2. Run integrity check
echo "Running integrity check on ${DB_PATH}..."
INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")
echo "Integrity check on ${DB_PATH} result: $INTEGRITY"

if [ "$INTEGRITY" != "ok" ]; then
	echo "Database '${DB_PATH}' is corrupted. Attempting recovery..."
else
	echo "Database '${DB_PATH}' integrity is OK. No recovery needed."
	exit 0
fi

# 3. Attempt to dump database
echo "Attempting .dump..."
if sqlite3 "$DB_PATH" ".dump" >"$DUMP_FILE"; then
	echo ".dump of '${DB_PATH}' successful."
else
	echo ".dump failed. Trying .recover..."
	if sqlite3 "$DB_PATH" ".recover" >"$DUMP_FILE"; then
		echo ".recover of '${DB_PATH}' successful."
	else
		echo "Recovery of '${DB_PATH}' failed. Manual intervention required."
		exit 1
	fi
fi

# 4. Create new database from dump
echo "Creating new database from dump..."
sqlite3 "$NEW_DB" <"$DUMP_FILE"

# 5. Enable WAL mode for resilience
echo "Enabling WAL mode on new database..."
sqlite3 "$NEW_DB" "PRAGMA journal_mode=WAL;"

# 6. Replace old database with new one
echo "Replacing old database with new one..."
mv "$NEW_DB" "$DB_PATH"
