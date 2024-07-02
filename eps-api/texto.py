from flask import Flask, request, jsonify, send_from_directory
import base64
import os
import openai

app = Flask(__name__)

# Configurar o cliente OpenAI com a chave da API
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Caminho da imagem
IMAGE_PATH = os.path.join(app.root_path, 'static', 'Imagens', 'pessoapap.jpg')

# Função para codificar a imagem em base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

# Endpoint para solicitação de chat
@app.route('/eps', methods=['POST'])
def chat():
    data = request.json
    prompt = data.get('prompt')

completion = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "You are a helpful assistant. Help me with my math homework!"},
        {"role": "user", "content": prompt}
    ]
)
    assistant_message = response.choices[0].text.strip()
    return jsonify({"response": assistant_message})

# Endpoint para solicitação de chat com imagem
@app.route('/eps/image', methods=['POST'])
def chat_with_image():
    base64_image = encode_image(IMAGE_PATH)

    response = openai.Completion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "és um assistente que vê as cores dos bonecos"},
            {"role": "user", "content": [
                {"type": "text", "text": "este emoji é de que cor ?"},
                {"type": "image_url", "image_url": f"data:image/png;base64,{base64_image}"}
            ]}
        ],
        temperature=0.0
    )
    
    assistant_message = response.choices[0].message.content.strip()
    return jsonify({"response": assistant_message})

# Endpoint para servir arquivos estáticos
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# Endpoint para a página principal
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    app.run(debug=True)