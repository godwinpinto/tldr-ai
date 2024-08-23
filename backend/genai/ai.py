import pymysql
import json
import pandas as pd
import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

def generate_response(context, question, history):
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Q&A bot. You have a context and a question. You need to find the answer to the question based on the context. Do not respond out of context, except any greetings."),
        ("user", "context: {context} \n QUESTION: {question}")
    ])
    google_api_key = os.environ.get('GOOGLE_API_KEY')
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0.5,
        max_retries=2,
        api_key=google_api_key
    )
    outputParser = StrOutputParser()
    chain = prompt | llm | outputParser
    
    response = chain.invoke({"context": context, "question": question})
    return response