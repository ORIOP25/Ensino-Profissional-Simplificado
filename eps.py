import json
import os
import sys
from openai import OpenAI

def main(prompt):
    try:
        # Configurar a chave da API e o modelo
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        MODEL = "gpt-4o"

        # Criar a conclusão do chat
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "O teu nome é “EPS” (Ensino Profissional Simplificado). Especialização: O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal."},
                {"role": "user", "content": prompt}
            ]
        )

        # Retornar a resposta como JSON
        print(json.dumps({'response': response.choices[0].message.content.strip()}))

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        print(json.dumps({'error': 'No prompt provided'}), file=sys.stderr)
