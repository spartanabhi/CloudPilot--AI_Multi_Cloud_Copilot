import os
from langchain_groq import ChatGroq

def get_llm():
    """
    Returns a configured ChatGroq instance using the GROQ_API_KEY environment variable.
    """
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0
    )
