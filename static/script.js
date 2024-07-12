document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('clear-history-btn').addEventListener('click', clearCurrentChatHistory);
    document.getElementById('new-conversation-btn').addEventListener('click', startNewConversation);
    document.getElementById('delete-history-btn').addEventListener('click', deleteHistory);
    document.getElementById('toggle-theme-btn').addEventListener('click', toggleTheme);

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

        const data = await response.text(); // Recebe a resposta como texto puro
        appendMessage('assistant', data);
        saveMessage('assistant', data); // Salvar mensagem do assistente no histórico
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        appendMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.');
        showNotification('Erro de rede. Tente novamente.');
    }
}

function appendMessage(sender, message, save = true) {
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

    if (sender === 'user') {
        const settingsButton = document.createElement('button');
        settingsButton.innerHTML = '⚙';
        settingsButton.classList.add('settings-btn');
        settingsButton.addEventListener('click', () => toggleEditDeleteOptions(messageElement));
        messageElement.appendChild(settingsButton);
    }

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (save) saveMessage(sender, message);
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
    updateConversationList(); // Atualizar a lista de conversas ao salvar mensagem
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

function startNewConversation() {
    const messages = getCurrentChatHistory();
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

    if (messages.length > 0) {
        chatHistory.push({ title: `Conversa ${chatHistory.length + 1}`, messages });
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }

    clearCurrentChatHistory();
    showNotification('Nova conversa iniciada.');
    loadConversationList();
}

function deleteHistory() {
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('currentChat');
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

    for (const [index, conversation] of conversationList.entries()) {
        const conversationElement = document.createElement('div');
        conversationElement.classList.add('conversation-item');
        conversationElement.textContent = conversation.title || `Conversa ${index + 1}`;
        conversationElement.addEventListener('click', () => {
            localStorage.setItem('currentChat', JSON.stringify(conversation.messages));
            loadChatHistory();
            showNotification('Conversa carregada.');
        });

        conversationListElement.appendChild(conversationElement);
    }
}

function loadChatHistory() {
    const chatBox = document.getElementById('chat-box');
    const messages = getCurrentChatHistory();

    chatBox.innerHTML = '';
    messages.forEach(({ sender, message }) => {
        appendMessage(sender, message, false); // Evita salvar mensagens ao carregar o histórico
    });
}

function updateConversationList() {
    const conversationListElement = document.getElementById('conversation-list');
    const conversationList = JSON.parse(localStorage.getItem('chatHistory')) || [];

    conversationListElement.innerHTML = '';
    for (const [index, conversation] of conversationList.entries()) {
        const conversationElement = document.createElement('div');
        conversationElement.classList.add('conversation-item');
        conversationElement.textContent = conversation.title || `Conversa ${index + 1}`;
        conversationElement.addEventListener('click', () => {
            localStorage.setItem('currentChat', JSON.stringify(conversation.messages));
            loadChatHistory();
            showNotification('Conversa carregada.');
        });

        conversationListElement.appendChild(conversationElement);
    }
}