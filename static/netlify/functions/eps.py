import json
import base64
from openai import OpenAI
import os

def handler(event, context):
    try:
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        body = json.loads(event['body'])

        if 'image' in body:
            image_data = body['image']
            base64_image = base64.b64encode(image_data.encode('utf-8')).decode('utf-8')
            messages = [
                {"role": "system", "content": "és um assistente que vê as cores dos bonecos"},
                {"role": "user", "content": [
                    {"type": "text", "text": "este emoji é de que cor ?"},
                    {"type": "image_url", "image_url": f"data:image/png;base64,{base64_image}"}
                ]}
            ]
        else:
            prompt = body['prompt']
            messages = [
                {"role": "system", "content": "You are a helpful assistant. Help me with my math homework!"},
                {"role": "user", "content": prompt}
            ]

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.3,
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'response': response.choices[0].message.content})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
