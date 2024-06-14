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
        const response = await fetch('./netlify/functions/eps', {
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
            const response = await fetch('./netlify/functions/eps', {
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
    const oldMessage = messageElement.querySelector('div').textContent;
    const newMessage = prompt('Edite sua mensagem:', oldMessage);
    if (newMessage !== null && newMessage.trim() !== '') {
        const textElement = messageElement.querySelector('div');
        textElement.textContent = newMessage;
        updateMessageInLocalStorage(messageElement, newMessage);

        try {
            const response = await fetch('./netlify/functions/eps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: newMessage })
            });

            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            appendMessage('assistant', data.response);
        } catch (error) {
            appendMessage('assistant', 'Desculpe, ocorreu um erro. Tente novamente.');
            showNotification('Erro de rede. Tente novamente.');
        }
    }
}

function deleteMessage(messageElement) {
    if (confirm('Tem certeza de que deseja excluir esta mensagem?')) {
        messageElement.remove();
        removeMessageFromLocalStorage(messageElement);
    }
}

function updateMessageInLocalStorage(messageElement, newMessage) {
    const currentChatId = localStorage.getItem('currentChatId');
    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    const messageIndex = Array.from(messageElement.parentElement.children).indexOf(messageElement);
    if (chatHistory[messageIndex]) {
        chatHistory[messageIndex].message = newMessage;
        localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
    }
}

function removeMessageFromLocalStorage(messageElement) {
    const currentChatId = localStorage.getItem('currentChatId');
    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    const messageIndex = Array.from(messageElement.parentElement.children).indexOf(messageElement);
    chatHistory.splice(messageIndex, 1);
    localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
}

function saveMessage(sender, message) {
    const currentChatId = localStorage.getItem('currentChatId') || Date.now().toString();
    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    chatHistory.push({ sender, message });
    localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
    localStorage.setItem('currentChatId', currentChatId);
}

function loadChatHistory() {
    const currentChatId = localStorage.getItem('currentChatId');
    if (!currentChatId) return;

    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    chatHistory.forEach(entry => appendMessage(entry.sender, entry.message));
}

function clearCurrentChatHistory() {
    const currentChatId = localStorage.getItem('currentChatId');
    if (!currentChatId) return;

    localStorage.removeItem(currentChatId);
    document.getElementById('chat-box').innerHTML = '';
    showNotification('Histórico de conversa atual limpo!');
}

function startNewConversation() {
    const currentChatId = localStorage.getItem('currentChatId');
    if (currentChatId) {
        const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
        if (chatHistory.length > 0) {
            let chatName = prompt("Digite o nome da conversa:") || Conversa ${new Date(Number(currentChatId)).toLocaleString()};
            localStorage.setItem(chatName_${currentChatId}, chatName);
        }
    }

    const newChatId = Date.now().toString();
    localStorage.setItem('currentChatId', newChatId);
    document.getElementById('chat-box').innerHTML = '';
    loadConversationList();
    showNotification('Nova conversa iniciada!');
}

function loadConversationList() {
    const conversationList = document.getElementById('conversation-list');
    conversationList.innerHTML = '';

    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chatName_')) {
            const chatId = key.replace('chatName_', '');
            const chatName = localStorage.getItem(key);
            const listItem = document.createElement('li');
            listItem.textContent = chatName;
            listItem.dataset.chatId = chatId;
            listItem.addEventListener('click', () => loadConversation(chatId));
            conversationList.appendChild(listItem);
        }
    });
}

function loadConversation(chatId) {
    localStorage.setItem('currentChatId', chatId);
    document.getElementById('chat-box').innerHTML = '';
    loadChatHistory();
    showNotification('Conversa carregada!');
}

function deleteHistory() {
    if (confirm('Você tem certeza que deseja apagar todo o histórico de conversas? Esta ação não pode ser desfeita.')) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('chatName_') || !isNaN(Number(key))) {
                localStorage.removeItem(key);
            }
        });
        document.getElementById('chat-box').innerHTML = '';
        loadConversationList();
        showNotification('Histórico de conversas apagado!');
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    showNotification(isDarkMode ? 'Modo escuro ativado!' : 'Modo claro ativado!');
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'enabled') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}