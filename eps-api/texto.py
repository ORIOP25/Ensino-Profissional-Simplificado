import sys
from openai import OpenAI
import os

# Define UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# Set the API key and model name
MODEL = "gpt-4o"
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

prompt = sys.argv[1] if len(sys.argv) > 1 else "Hello! Could you solve 2+2?"

completion = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "O teu nome é “EPS” (Ensino Profissional Simplificado). Especialização: O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal."},  # <-- This is the system message that provides context to the model
        {"role": "user", "content": prompt}  # <-- This is the user message for which the model will generate a response
    ]
)

print(completion.choices[0].message.content.strip())