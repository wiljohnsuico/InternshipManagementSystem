import mysql.connector
from mysql.connector import Error

try:
    # Connect to the MySQL database
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="qcu_ims"
    )

    if conn.is_connected():
        print("✅ Successfully connected to MySQL database!")

        cursor = conn.cursor()

        # 🔎 Show all tables in the database
        cursor.execute("SHOW TABLES")
        print("📋 Available tables in 'qcu_ims':")
        for table in cursor:
            print(f" - {table[0]}")

        print("\n📤 Fetching data from 'admin_tbl':")

        # 📦 Fetch data from the 'admin_tbl' table
        cursor.execute("SELECT * FROM admin_tbl")
        rows = cursor.fetchall()

        if rows:
            print("📦 Data from 'admin_tbl':")
            for row in rows:
                print(row)
        else:
            print("⚠️ No data found in 'admin_tbl' table.")

except Error as e:
    print(f"❌ Error while connecting to MySQL: {e}")

finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()
        print("🔌 MySQL connection closed.")
