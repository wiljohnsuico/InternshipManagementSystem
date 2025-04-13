import mysql.connector

# Connect to the MySQL database
conn = mysql.connector.connect(
    host="localhost",        # or your DB host
    user="your_username",    # replace with your MySQL username
    password="your_password",# replace with your MySQL password
    database="qcu_ims"       # make sure this matches your .sql file
)

# Create a cursor
cursor = conn.cursor()

# Example query
cursor.execute("SELECT * FROM students")  # Replace with your actual table

# Fetch and print data
rows = cursor.fetchall()
for row in rows:
    print(row)

# Close connection
cursor.close()
conn.close()
