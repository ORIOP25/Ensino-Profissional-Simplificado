import sys
import openai
import os

# Set the API key and model name
MODEL = "gpt-4o"
openai.api_key = os.environ.get("OPENAI_API_KEY")

prompt = sys.argv[1] if len(sys.argv) > 1 else "Hello! Could you solve 2+2?"

response = openai.ChatCompletion.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "O teu nome é “EPS” (Ensino Profissional Simplificado). Especialização: O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal."},  
        {"role": "user", "content": prompt}  
    ]
)

print(response.choices[0].message['content'].strip())