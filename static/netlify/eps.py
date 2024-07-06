import json
from openai import OpenAI
import os

def handler(event, context):
    try:
        # Configurar a codificação UTF-8
        sys.stdout.reconfigure(encoding='utf-8')

        # Configurar a chave da API e o modelo
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        MODEL = "gpt-4o"

        # Obter o prompt do corpo da solicitação
        body = json.loads(event['body'])
        prompt = body.get('prompt', '')

        # Criar a conclusão do chat
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "O teu nome é “EPS” (Ensino Profissional Simplificado). Especialização: O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal."},
                {"role": "user", "content": prompt}
            ]
        )

        # Retornar a resposta como JSON
        return {
            'statusCode': 200,
            'body': json.dumps({'response': response.choices[0].message.content.strip()})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }