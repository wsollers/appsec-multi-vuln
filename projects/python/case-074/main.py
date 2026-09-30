import sqlite3
import sys

name = sys.argv[1] if len(sys.argv) > 1 else "sample"
db = sqlite3.connect(":memory:")
db.execute("create table items (id integer, name text)")
db.execute("insert into items values (1, 'sample')")
for row in db.execute("select id, name from items where name = '" + name + "'"):
    print(row)
