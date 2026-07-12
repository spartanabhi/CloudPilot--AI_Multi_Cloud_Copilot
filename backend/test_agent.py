from dotenv import load_dotenv
import os
import sys

# Load env variables
load_dotenv()

groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("WARNING: GROQ_API_KEY is not set in the backend/.env file.")
    print("Please go to https://console.groq.com to get an API key and populate it in backend/.env.\n")

from agent.graph import ask_agent

def categorize_error(e: Exception) -> str:
    err_msg = str(e)
    # Check for Quota/Rate Limit (429)
    if "429" in err_msg or "RateLimitError" in err_msg or "rate limit" in err_msg.lower():
        return "Quota exceeded (429): You have exceeded your Groq API rate limits. Please check your usage plans."
    # Check for Invalid API Key (401/Authentication)
    elif "401" in err_msg or "AuthenticationError" in err_msg or "api key" in err_msg.lower() or "unauthorized" in err_msg.lower():
        return "Invalid API key: Please verify that your GROQ_API_KEY is correct and active."
    # Check for Model Not Found (404)
    elif "404" in err_msg or "NotFoundError" in err_msg or "model_not_found" in err_msg or "not found" in err_msg.lower():
        return f"Model not found: The selected model is not available or has been deprecated. (Details: {err_msg})"
    # Check for Network Failure
    elif any(term in err_msg.lower() for term in ["connection", "timeout", "dns", "network", "host", "socket"]):
        return f"Network failure: Could not connect to the Groq API. (Details: {err_msg})"
    else:
        return f"Unknown exception: {err_msg}"

questions = [
    "What EC2 instances are running on AWS right now?",
    "Are any of my AWS S3 buckets publicly accessible?",
    "What's my AWS cost breakdown for the last 30 days?",
]

for q in questions:
    print(f"\nQ: {q}")
    try:
        ans = ask_agent(q)
        print(f"A: {ans}")
    except Exception as e:
        print(f"A: ERROR - {categorize_error(e)}")
    print("-" * 60)
