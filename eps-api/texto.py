import sys
from openai import OpenAI
import os

# Configurar a codificação UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Definir a chave da API e o modelo
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o"

# Obter o prompt do usuário
prompt = sys.argv[1]

# Criar a conclusão do chat
response = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "O teu nome é “EPS” (Ensino Profissional Simplificado). Especialização: O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal."},
        {"role": "user", "content": prompt}
    ]
)

# Imprimir a resposta
print(response.choices[0].message.content.strip())