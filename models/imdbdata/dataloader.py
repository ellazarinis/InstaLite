# I decided to use python because it is more straightforward than the spark dataloader, and this
# will be run only ones anyways so it does not really matter if it is not as efficient as spark.
# Note: notes.tsv must be in the same directory
import os
import csv
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# Connect to the instalite database
def connect():
    return mysql.connector.connect(
        user=os.getenv('RDS_USER'),
        password=os.getenv('RDS_PWD'),
        host='localhost',
        database='instalite'
    )

def insert_names():
    conn = connect()
    cur = conn.cursor()
    with open('names.tsv', 'r') as f:
        reader = csv.reader(f, delimiter='\t')
        next(reader)
        for row in reader:
            # Insert only the relevant data about nconsts and names into the names table
            cur.execute('INSERT INTO names (nconst, primaryName) VALUES (%s, %s)', (row[0], row[1]))
    conn.commit()
    conn.close()

if __name__ == '__main__':
    insert_names()
