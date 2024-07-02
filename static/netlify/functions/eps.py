import json
import base64
from openai import OpenAI
import os

def handler(event, context):
    # Definir o modelo a ser usado
    MODEL = "gpt-4o"

    # Configurar o cliente OpenAI com a chave da API
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    # Primeira solicitação de chat
    completion = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Help me with my math homework!"},
            {"role": "user", "content": "Hello! Could you solve 2+2?"}
        ]
    )

    # Caminho da imagem
    IMAGE_PATH = "/path/to/your/image.jpg"

    # Função para codificar a imagem em base64
    def encode_image(image_path):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    # Codificar a imagem
    base64_image = encode_image(IMAGE_PATH)

    # Segunda solicitação de chat com a imagem codificada
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "és um assistente que vê as cores dos bonecos"},
            {"role": "user", "content": [
                {"type": "text", "text": "este emoji é de que cor ?"},
                {"type": "image_url", "image_url": {
                    "url": f"data:image/png;base64,{base64_image}"}
                }
            ]}
        ],
        temperature=0.3,
    )

    # Retornar a resposta do assistente
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': response.choices[0].message.content
        })
    }