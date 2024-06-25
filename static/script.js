document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('clear-history-btn').addEventListener('click', clearCurrentChatHistory);
    document.getElementById('new-conversation-btn').addEventListener('click', startNewConversation);
    document.getElementById('delete-history-btn').addEventListener('click', deleteHistory);
    document.getElementById('toggle-theme-btn').addEventListener('click', toggleTheme);
    document.getElementById('send-image-btn').addEventListener('click', () => {
        document.getElementById('image-input').click();
    });
    document.getElementById('image-input').addEventListener('change', sendImage);

    loadChatHistory();
    loadConversationList();
    applySavedTheme();
});

async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();

    if (!message) return;

    appendMessage('user', message);
    inputField.value = '';
    showNotification('Mensagem enviada!');

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
        showNotification('Erro de rede. Tente novamente.');
    }
}

async function sendImage() {
    const imageInput = document.getElementById('image-input');
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
        const imageUrl = reader.result;
        appendImageMessage('user', imageUrl);
        imageInput.value = '';
        showNotification('Imagem enviada!');

        try {
            const response = await fetch('/netlify/functions/eps.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: '[imagem]', image: imageUrl })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            appendMessage('assistant', data.response);
        } catch (error) {
            appendMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.');
            showNotification('Erro de rede. Tente novamente.');
        }
    };
    reader.readAsDataURL(file);

}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const img = document.createElement('img');
    img.src = sender === 'user' ? '/path/to/user-image.jpg' : '/path/to/assistant-image.jpg';
    img.alt = sender === 'user' ? 'User' : 'Assistant';
    messageElement.appendChild(img);

    const text = document.createElement('div');
    text.textContent = message;
    messageElement.appendChild(text);

    if (sender === 'user') {
        const settingsButton = document.createElement('button');
        settingsButton.innerHTML = '⚙';
        settingsButton.classList.add('settings-btn');
        settingsButton.addEventListener('click', () => toggleEditDeleteOptions(messageElement));
        messageElement.appendChild(settingsButton);
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    saveMessage(sender, message);
}

function appendImageMessage(sender, imageUrl) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const img = document.createElement('img');
    img.src = sender === 'user' ? '/path/to/user-image.jpg' : '/path/to/assistant-image.jpg';
    img.alt = sender === 'user' ? 'User' : 'Assistant';
    messageElement.appendChild(img);

    const image = document.createElement('img');
    image.src = imageUrl;
    messageElement.appendChild(image);

    if (sender === 'user') {
        const settingsButton = document.createElement('button');
        settingsButton.innerHTML = '⚙';
        settingsButton.classList.add('settings-btn');
        settingsButton.addEventListener('click', () => toggleEditDeleteOptions(messageElement));
        messageElement.appendChild(settingsButton);
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    saveMessage(sender, '[imagem]');
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