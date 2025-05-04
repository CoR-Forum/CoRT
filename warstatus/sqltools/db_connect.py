#!/usr/bin/env python3

import configparser
import MySQLdb as mysql

def connect():
    cfg = configparser.ConfigParser()
    cfg.read("secrets.ini")
    secrets = cfg["mysql"]
    db = mysql.connect(secrets["host"], secrets["user"], secrets["password"], secrets["database"])
    cursor = db.cursor()
    db_schema = """
    create table if not exists events (
        rowid integer primary key not null auto_increment,
        date integer not null,
        name text not null,
        location text not null,
        owner text not null,
        type text not null
    );
    """
    cursor.execute(db_schema)
    db_schema = """
    create table if not exists json (
        type varchar(64) primary key not null,
        content mediumtext
    );
    """
    cursor.execute(db_schema)
    return db
