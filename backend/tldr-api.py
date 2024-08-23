from flask import Flask, request, jsonify
import hashlib
import pymysql
import os
from database.db import database_connection, get_or_create_user, get_or_create_content, insert_content_chunk, fetch_chunks_by_user_id, fetch_chunks_by_content_id, fetch_content_by_user_id
from utils.utils import generate_embeddings
import json
from genai.ai import generate_response
import concurrent.futures

app = Flask(__name__)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user_name = data.get('user_name')
    created_by = user_name  # assuming user creates their own account
    connection = database_connection()
    user_id = get_or_create_user(connection, user_name, created_by)
    connection.close()
    return jsonify({'user_id': user_id})

@app.route('/api/content', methods=['GET'])
def get_content():
    user_id = request.args.get('user_id')
    connection = database_connection()
    content = fetch_content_by_user_id(connection, user_id)
    connection.close()
    return jsonify(content)

# @app.route('/api/content', methods=['POST'])
# def post_content():
#     data = request.json
#     content_data = data.get('content_data')
#     user_id = data.get('user_id')
#     content_hash = hashlib.sha512(content_data.encode()).hexdigest()
#     connection = database_connection()
#     content_id = get_or_create_content(connection, user_id, content_hash, content_data[:20])

#     for i in range(0, len(content_data), 500):
#         chunk_data = content_data[i:i+500]
#         chunk_vector = generate_embeddings(chunk_data)  # assuming you have a function to generate vectors
#         insert_content_chunk(connection, content_id, user_id, chunk_data, chunk_vector=json.dumps(chunk_vector))

#     connection.close()
#     return jsonify({'content_id': content_id})
def process_chunk(content_id, user_id, chunk_data):
    connection = database_connection()  # Establish a new connection for each thread
    try:
        chunk_vector = generate_embeddings(chunk_data)  # Assuming you have a function to generate vectors
        insert_content_chunk(connection, content_id, user_id, chunk_data, chunk_vector=json.dumps(chunk_vector))
    finally:
        connection.close()  # Ensure the connection is closed

@app.route('/api/content', methods=['POST'])
def post_content():
    data = request.json
    content_data = data.get('content_data')
    user_id = data.get('user_id')
    content_hash = hashlib.sha512(content_data.encode()).hexdigest()
    connection = database_connection()
    content_id = get_or_create_content(connection, user_id, content_hash, content_data[:20])
    connection.close()  # Close the connection after getting the content ID

    # Use ThreadPoolExecutor for parallel processing of chunks
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = []
        for i in range(0, len(content_data), 500):
            chunk_data = content_data[i:i+500]
            # Submit the task to the executor
            futures.append(executor.submit(process_chunk, content_id, user_id, chunk_data))
        
        # Wait for all futures to complete
        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()  # We can also check for exceptions here if needed
            except Exception as e:
                print(f"An error occurred: {e}")

    return jsonify({'content_id': content_id})


@app.route('/api/content-html', methods=['POST'])
def post_content_html():
    data = request.json
    content_data = data.get('content_data')
    user_id = data.get('user_id')
    content_hash = hashlib.sha512(content_data.encode()).hexdigest()
    connection = database_connection()
    content_id = get_or_create_content(connection, user_id, content_hash, content_data[:20])
    connection.close()  # Close the connection after getting the content ID

    # Use ThreadPoolExecutor for parallel processing of chunks
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = []
        for i in range(0, len(content_data), 500):
            chunk_data = content_data[i:i+500]
            # Submit the task to the executor
            futures.append(executor.submit(process_chunk, content_id, user_id, chunk_data))
        
        # Wait for all futures to complete
        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()  # We can also check for exceptions here if needed
            except Exception as e:
                print(f"An error occurred: {e}")

    return jsonify({'content_id': content_id})


@app.route('/api/message-by-content-id', methods=['POST'])
def message_by_content_id():
    data = request.json
    content_id = data.get('content_id')
    question_data = data.get('question_data')
    question_embedding=generate_embeddings(question_data)
    connection = database_connection()
    result = fetch_chunks_by_content_id(connection, content_id,question_chunk_vector=json.dumps(question_embedding))
    connection.close()
    print(result)
    merged_data = "\n\n".join(item['chunk_data'] for item in result)
    print(merged_data)
    response_string = generate_response(merged_data, question_data, "")
    
    # Create a dictionary for the response including bot_response
    response = {
        "bot_response": response_string
    }
    
    # Return the JSON response
    return jsonify(response)



@app.route('/api/message-by-user-id', methods=['POST'])
def message_by_user_id():
    data = request.json
    
    # Extract user_id, question_data, and content_id from the request
    user_id = data.get('user_id')
    question_data = data.get('question_data')
    content_ids = data.get('content_ids', [0])  # Default to empty list if not provided

    # Generate embeddings for the question data
    question_embedding = generate_embeddings(question_data)

    # Establish database connection
    connection = database_connection()

    # Fetch chunks using user_id and content_id
    result = fetch_chunks_by_user_id(
        connection, 
        user_id, 
        question_chunk_vector=json.dumps(question_embedding), 
        content_ids=content_ids
    )

    # Close the database connection
    connection.close()

    # Merge fetched data chunks into a single string
    merged_data = "\n\n".join(item['chunk_data'] for item in result)

    # Generate a response using the merged data and question data
    response_string = generate_response(merged_data, question_data, "")

    # Create a dictionary for the response including bot_response
    response = {
        "bot_response": response_string
    }

    # Return the JSON response
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)