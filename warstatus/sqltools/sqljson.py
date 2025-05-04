#!/usr/bin/env python3


def get(db, item):
    """ get an item in json format (either warstatus or statistics or history) """
    db_cursor = db.cursor()
    db_cursor.execute("""SELECT content FROM json WHERE type = %s""", (item,))
    try:
        return db_cursor.fetchone()[0]
    except:
        # No data yet
        return None

def put(db, item, json):
    """ put an item in json format (either warstatus or statistics or history) """
    db_cursor = db.cursor()
    db_cursor.execute("""replace into json (type, content) values(%s, %s)""", (item, json))
    db.commit()
