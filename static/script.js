document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to buttons and inputs
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

    // Load chat history and saved theme
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
        const response = await fetch('/.netlify/functions/eps', {
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
            const response = await fetch('/.netlify/functions/eps', {
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
            const response = await fetch('/.netlify/functions/eps', {
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
        removeMessageFromLocalStorage(messageElement);
        messageElement.remove();
        showNotification('Mensagem excluída.');
    }
}

function loadChatHistory() {
    const currentChatId = localStorage.getItem('currentChatId');
    if (!currentChatId) return;

    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    chatHistory.forEach(entry => {
        if (entry.message === '[imagem]') {
            appendImageMessage(entry.sender, entry.message);
        } else {
            appendMessage(entry.sender, entry.message);
        }
    });
}

function saveMessage(sender, message) {
    const currentChatId = localStorage.getItem('currentChatId') || Date.now().toString();
    localStorage.setItem('currentChatId', currentChatId);

    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    chatHistory.push({ sender, message });
    localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
}

function updateMessageInLocalStorage(messageElement, newMessage) {
    const currentChatId = localStorage.getItem('currentChatId');
    if (!currentChatId) return;

    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    const index = Array.from(messageElement.parentNode.children).indexOf(messageElement);
    chatHistory[index].message = newMessage;
    localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
}

function removeMessageFromLocalStorage(messageElement) {
    const currentChatId = localStorage.getItem('currentChatId');
    if (!currentChatId) return;

    const chatHistory = JSON.parse(localStorage.getItem(currentChatId)) || [];
    const index = Array.from(messageElement.parentNode.children).indexOf(messageElement);
    chatHistory.splice(index, 1);
    localStorage.setItem(currentChatId, JSON.stringify(chatHistory));
}

function clearCurrentChatHistory() {
    const currentChatId = localStorage.getItem('currentChatId');
    if (currentChatId) {
        localStorage.removeItem(currentChatId);
        document.getElementById('chat-box').innerHTML = '';
        showNotification('Histórico da conversa atual apagado.');
    }
}

function startNewConversation() {
    localStorage.setItem('currentChatId', Date.now().toString());
    document.getElementById('chat-box').innerHTML = '';
    showNotification('Nova conversa iniciada.');
}

function deleteHistory() {
    if (confirm('Tem certeza de que deseja excluir todo o histórico?')) {
        localStorage.clear();
        document.getElementById('chat-box').innerHTML = '';
        showNotification('Todo o histórico foi apagado.');
    }
}

function loadConversationList() {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';

    Object.keys(localStorage).forEach(key => {
        if (!isNaN(key)) {
            const listItem = document.createElement('li');
            listItem.textContent = new Date(parseInt(key)).toLocaleString();
            listItem.addEventListener('click', () => loadConversation(key));
            chatList.appendChild(listItem);
        }
    });
}

function loadConversation(chatId) {
    localStorage.setItem('currentChatId', chatId);
    document.getElementById('chat-box').innerHTML = '';
    loadChatHistory();
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function toggleTheme() {
    const currentTheme = document.body.className;
    const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.className = savedTheme;
}