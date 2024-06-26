document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('send-image-btn').addEventListener('click', () => {
        document.getElementById('image-input').click();
    });
    document.getElementById('image-input').addEventListener('change', sendImage);
});

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();

    if (!message) return;

    appendMessage('user', message);
    inputField.value = '';

    try {
        const response = await fetch('/eps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        appendMessage('assistant', data.response);
    } catch (error) {
        appendMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.');
    }
}

async function sendImage() {
    const imageInput = document.getElementById('image-input');
    const file = imageInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    appendImageMessage('user', URL.createObjectURL(file));
    imageInput.value = '';

    try {
        const response = await fetch('/eps/image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        appendMessage('assistant', data.response);
    } catch (error) {
        appendMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.');
    }
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const img = document.createElement('img');
    img.src = sender === 'user' ? '/static/Imagens/pessoapap.jpg' : '/static/Imagens/robopap.jpg';
    img.alt = sender === 'user' ? 'User' : 'Assistant';
    messageElement.appendChild(img);

    const text = document.createElement('div');
    text.textContent = message;
    messageElement.appendChild(text);

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendImageMessage(sender, imageUrl) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const img = document.createElement('img');
    img.src = sender === 'user' ? '/static/Imagens/pessoapap.jpg' : '/static/Imagens/robopap.jpg';
    img.alt = sender === 'user' ? 'User' : 'Assistant';
    messageElement.appendChild(img);

    const image = document.createElement('img');
    image.src = imageUrl;
    messageElement.appendChild(image);

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}


function toggleEditDeleteOptions(messageElement) {
    let editDeleteContainer = messageElement.querySelector('.edit-delete-container');
    if (editDeleteContainer) {
        editDeleteContainer.remove();
    } else {
        editDeleteContainer = document.createElement('div');
        editDeleteContainer.classList.add('edit-delete-container');

        const timestamp = document.createElement('div');
        timestamp.classList.add('message-timestamp');
        timestamp.textContent = new Date().toLocaleTimeString();
        editDeleteContainer.appendChild(timestamp);

        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.classList.add('btn');
        editButton.addEventListener('click', () => editMessage(messageElement));
        editDeleteContainer.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Excluir';
        deleteButton.classList.add('btn');
        deleteButton.addEventListener('click', () => deleteMessage(messageElement));
        editDeleteContainer.appendChild(deleteButton);

        messageElement.appendChild(editDeleteContainer);
    }
}

async function editMessage(messageElement) {
    const messageText = messageElement.querySelector('div:not(.edit-delete-container)').textContent;
    const newMessage = prompt('Editar mensagem:', messageText);

    if (newMessage !== null) {
        const chatBox = document.getElementById('chat-box');
        const messageIndex = Array.from(chatBox.children).indexOf(messageElement);

        const messages = getCurrentChatHistory();
        messages[messageIndex].message = newMessage;
        saveCurrentChatHistory(messages);

        messageElement.querySelector('div:not(.edit-delete-container)').textContent = newMessage;
    }
}

async function deleteMessage(messageElement) {
    const chatBox = document.getElementById('chat-box');
    const messageIndex = Array.from(chatBox.children).indexOf(messageElement);

    const messages = getCurrentChatHistory();
    messages.splice(messageIndex, 1);
    saveCurrentChatHistory(messages);

    messageElement.remove();
}

function saveMessage(sender, message) {
    const messages = getCurrentChatHistory();
    messages.push({ sender, message });
    saveCurrentChatHistory(messages);
}

function getCurrentChatHistory() {
    const currentChat = localStorage.getItem('currentChat');
    return currentChat ? JSON.parse(currentChat) : [];
}

function saveCurrentChatHistory(messages) {
    localStorage.setItem('currentChat', JSON.stringify(messages));
}

function clearCurrentChatHistory() {
    localStorage.removeItem('currentChat');
    document.getElementById('chat-box').innerHTML = '';
    showNotification('Histórico de chat limpo.');
}

function loadChatHistory() {
    console.log('Loading chat history');
    const messages = getCurrentChatHistory();
    for (const { sender, message } of messages) {
        if (message === '[imagem]') {
            // carrega a URL da imagem, se necessário
            const imageUrl = ''; // substitua com a URL correta, se necessário
            appendImageMessage(sender, imageUrl);
        } else {
            appendMessage(sender, message);
        }
    }
}

function startNewConversation() {
    clearCurrentChatHistory();
    showNotification('Nova conversa iniciada.');
}

function deleteHistory() {
    localStorage.removeItem('chatHistory');
    document.getElementById('conversation-list').innerHTML = '';
    showNotification('Histórico excluído.');
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    showNotification('Tema alterado.');
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';
    setTimeout(() => {
        notificationElement.style.display = 'none';
    }, 3000);
}

function loadConversationList() {
    console.log('Loading conversation list');
    const conversationList = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const conversationListElement = document.getElementById('conversation-list');
    conversationListElement.innerHTML = '';

    for (const conversation of conversationList) {
        const conversationElement = document.createElement('div');
        conversationElement.classList.add('conversation-item');
        conversationElement.textContent = conversation.title || 'Conversa sem título';
        conversationElement.addEventListener('click', () => {
            localStorage.setItem('currentChat', JSON.stringify(conversation.messages));
            loadChatHistory();
            showNotification('Conversa carregada.');
        });

        conversationListElement.appendChild(conversationElement);
    }
}
