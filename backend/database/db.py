import pymysql
import json
import pandas as pd
import os
from dotenv import load_dotenv


# Load environment variables from .env file
load_dotenv()

def database_connection():
    connection = pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_verify_cert=True,
        ssl_verify_identity=True,
        ssl_ca=os.getenv("DB_SSL_CA")
    )
    return connection


def get_or_create_user(connection, user_name, created_by):
    with connection.cursor() as cursor:
        # Check if user exists
        cursor.execute("SELECT user_id FROM TLDR_MSTR_USER_TBL WHERE user_name = %s", (user_name,))
        result = cursor.fetchone()

        if result:
            return result[0]
        else:
            # Create a new user
            cursor.execute(
                "INSERT INTO TLDR_MSTR_USER_TBL (user_name, created_by, created_at) VALUES (%s, %s, NOW())",
                (user_name, created_by)
            )
            connection.commit()
            return cursor.lastrowid

def get_or_create_content(connection, user_id, content_hash, content_prefix):
    with connection.cursor() as cursor:
        # Check if content exists
        cursor.execute(
            "SELECT content_id FROM TLDR_MSTR_CONTENT_TBL WHERE user_id = %s AND content_hash = %s",
            (user_id, content_hash)
        )
        result = cursor.fetchone()

        if result:
            return result[0]
        else:
            # Insert new content
            cursor.execute(
                "INSERT INTO TLDR_MSTR_CONTENT_TBL (user_id, content_hash, content_prefix, created_at) VALUES (%s, %s, %s, NOW())",
                (user_id, content_hash, content_prefix)
            )
            connection.commit()
            return cursor.lastrowid

def insert_content_chunk(connection, content_id, user_id, chunk_data, chunk_vector):
    with connection.cursor() as cursor:
        # Insert chunk data into the table
        cursor.execute(
            "INSERT INTO TLDR_MSTR_CONTENT_CHUNK_TBL (content_id, user_id, chunk_data, chunk_vector, created_at) VALUES (%s, %s, %s, %s, NOW())",
            (content_id, user_id, chunk_data, chunk_vector)
        )
        connection.commit()
        return cursor.lastrowid

def fetch_content_by_user_id(connection, user_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM TLDR_MSTR_CONTENT_TBL WHERE user_id = %s", (user_id,))
        columns = [desc[0] for desc in cursor.description]  # Get column names
        rows = cursor.fetchall()
        result = [dict(zip(columns, row)) for row in rows]  # Create list of dictionaries
    return result


def fetch_chunks_by_content_id(connection, content_id, question_chunk_vector):
    with connection.cursor() as cursor:
        # Note: Make sure that `question_chunk_vector` is formatted correctly for the query.
        query = """
        SELECT chunk_data
        FROM TLDR_MSTR_CONTENT_CHUNK_TBL
        WHERE content_id = %s
        ORDER BY Vec_Cosine_distance(chunk_vector, %s) LIMIT 5;
        """
        cursor.execute(query, (content_id, question_chunk_vector))
        columns = [desc[0] for desc in cursor.description]  # Get column names
        rows = cursor.fetchall()
        result = [dict(zip(columns, row)) for row in rows]  # Create list of dictionaries
    return result

def fetch_chunks_by_user_id(connection, user_id, question_chunk_vector, content_ids=None):
    with connection.cursor() as cursor:
        # Check if content_id array is provided
        if content_ids:
            # Create a placeholders string for the IN clause, e.g., %s, %s, %s for each content ID
            placeholders = ', '.join(['%s'] * len(content_ids))
            query = f"""
                SELECT chunk_data 
                FROM TLDR_MSTR_CONTENT_CHUNK_TBL 
                WHERE user_id = %s 
                AND content_id IN ({placeholders})
                ORDER BY Vec_Cosine_distance(chunk_vector, %s) 
                LIMIT 10
            """
            # Combine user_id, content_id, and question_chunk_vector into a single list of parameters
            params = [user_id] + content_ids + [question_chunk_vector]
        else:
            # If content_id is not provided, run the original query without the IN clause
            query = """
                SELECT chunk_data 
                FROM TLDR_MSTR_CONTENT_CHUNK_TBL 
                WHERE user_id = %s 
                ORDER BY Vec_Cosine_distance(chunk_vector, %s) 
                LIMIT 10
            """
            params = [user_id, question_chunk_vector]

        # Execute the query with the appropriate parameters
        cursor.execute(query, params)
        columns = [desc[0] for desc in cursor.description]  # Get column names
        rows = cursor.fetchall()
        result = [dict(zip(columns, row)) for row in rows]  # Create list of dictionaries

    return result

