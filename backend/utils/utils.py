from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
import os


#google API
google_api_key = os.environ.get('GOOGLE_API_KEY')

def generate_embeddings(text):

    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
    embedding = embedding_model.embed_query(text=text)

    return embedding
