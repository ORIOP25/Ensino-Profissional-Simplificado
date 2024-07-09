document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para botões e input
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('new-conversation-btn').addEventListener('click', startNewConversation);
    document.getElementById('clear-history-btn').addEventListener('click', clearCurrentChatHistory);
    document.getElementById('delete-history-btn').addEventListener('click', deleteHistory);
    document.getElementById('toggle-theme-btn').addEventListener('click', toggleTheme);

    // Carregar tema salvo e histórico ao carregar a página
    applySavedTheme();
    loadChatHistory();
    loadConversationList();
});

// Função para enviar mensagem
async function sendMessageToBackend() {
    const message = document.getElementById('user-input').value.trim();
    if (!message) return;

    try {
        const response = await axios.post('/eps', { prompt: message });
        const assistantResponse = response.data.response;
        appendMessage('user', message);
        appendMessage('assistant', assistantResponse);
        saveMessage('assistant', assistantResponse); // Salvar mensagem do assistente no histórico
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem.');
    }

    document.getElementById('user-input').value = ''; // Limpar campo de entrada
}

// Função para adicionar mensagem ao chat
function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = createMessageElement(sender, message);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Função para criar elemento de mensagem
function createMessageElement(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);

    const img = createAvatar(sender);
    img.addEventListener('click', () => toggleEditDeleteOptions(messageElement));
    messageElement.appendChild(img);

    const text = document.createElement('div');
    text.textContent = message;
    messageElement.appendChild(text);

    return messageElement;
}

// Função para criar avatar de usuário ou assistente
function createAvatar(sender) {
    const img = document.createElement('img');
    img.src = sender === 'user' ? '/static/Imagens/pessoapap.jpg' : '/static/Imagens/robopap.jpg';
    img.alt = sender === 'user' ? 'User' : 'Assistant';
    img.classList.add('avatar');
    return img;
}

// Função para mostrar/ocultar opções de editar/excluir mensagem
function toggleEditDeleteOptions(messageElement) {
    let editDeleteContainer = messageElement.querySelector('.edit-delete-container');
    if (editDeleteContainer) {
        editDeleteContainer.remove();
    } else {
        editDeleteContainer = createEditDeleteContainer();
        messageElement.appendChild(editDeleteContainer);
    }
}

// Função para criar contêiner de opções de editar/excluir mensagem
function createEditDeleteContainer() {
    const editDeleteContainer = document.createElement('div');
    editDeleteContainer.classList.add('edit-delete-container');

    const timestamp = document.createElement('div');
    timestamp.classList.add('message-timestamp');
    timestamp.textContent = new Date().toLocaleTimeString();
    editDeleteContainer.appendChild(timestamp);

    const editButton = createButton('Editar', () => editMessage());
    editDeleteContainer.appendChild(editButton);

    const deleteButton = createButton('Excluir', () => deleteMessage());
    editDeleteContainer.appendChild(deleteButton);

    return editDeleteContainer;
}

// Função para criar botão com texto e função de callback
function createButton(text, callback) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('btn');
    button.addEventListener('click', callback);
    return button;
}

// Função para editar mensagem
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

// Função para excluir mensagem
async function deleteMessage(messageElement) {
    const confirmation = confirm('Tem certeza que deseja excluir esta mensagem?');
    if (confirmation) {
        const chatBox = document.getElementById('chat-box');
        const messageIndex = Array.from(chatBox.children).indexOf(messageElement);

        const messages = getCurrentChatHistory();
        messages.splice(messageIndex, 1);
        saveCurrentChatHistory(messages);

        messageElement.remove();
    }
}

// Função para salvar mensagem no histórico local
function saveMessage(sender, message) {
    const messages = getCurrentChatHistory();
    messages.push({ sender, message });
    saveCurrentChatHistory(messages);
}

// Função para obter histórico atual do chat
function getCurrentChatHistory() {
    const currentChat = localStorage.getItem('currentChat');
    return currentChat ? JSON.parse(currentChat) : [];
}

// Função para salvar histórico atual do chat no armazenamento local
function saveCurrentChatHistory(messages) {
    localStorage.setItem('currentChat', JSON.stringify(messages));
}

// Função para limpar histórico atual do chat
function clearCurrentChatHistory() {
    localStorage.removeItem('currentChat');
    document.getElementById('chat-box').innerHTML = '';
    showNotification('Histórico de chat limpo.');
}

// Função para carregar histórico do chat ao iniciar
function loadChatHistory() {
    const messages = getCurrentChatHistory();
    for (const { sender, message } of messages) {
        appendMessage(sender, message);
    }
}

// Função para iniciar nova conversa
function startNewConversation() {
    const currentChat = getCurrentChatHistory();
    if (currentChat.length > 0) {
        const chatHistory = getChatHistory();
        chatHistory.push({ title: `Conversa em ${new Date().toLocaleString()}`, messages: currentChat });
        saveChatHistory(chatHistory);
    }
    clearCurrentChatHistory();
    showNotification('Nova conversa iniciada.');
    loadConversationList();
}

// Função para excluir histórico completo
function deleteHistory() {
    localStorage.removeItem('chatHistory');
    document.getElementById('conversation-list').innerHTML = '';
    showNotification('Histórico excluído.');
}

// Função para alternar entre temas claro e escuro
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    showNotification('Tema alterado.');
}

// Função para aplicar tema salvo ao carregar página
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Função para exibir notificação por determinado tempo
function showNotification(message) {
    const notificationElement = document.getElementById('notification');
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';
    setTimeout(() => {
        notificationElement.style.display = 'none';
    }, 3000);
}

// Função para carregar lista de conversas antigas
function loadConversationList() {
    const conversationList = getChatHistory();
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
            clearConversationListSelection();
            conversationElement.classList.add('selected');
        });

        conversationListElement.appendChild(conversationElement);
    }
}

// Função para obter histórico completo de conversas antigas
function getChatHistory() {
    const chatHistory = localStorage.getItem('chatHistory');
    return chatHistory ? JSON.parse(chatHistory) : [];
}

// Função para salvar histórico completo de conversas antigas no armazenamento local
function saveChatHistory(chatHistory) {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Função para limpar a seleção anterior na lista de conversas
function clearConversationListSelection() {
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach(item => item.classList.remove('selected'));
}
// Função para enviar mensagem para o backend
async function sendMessage() {
    const message = document.getElementById('user-input').value.trim();
    if (!message) return;

    try {
        const response = await axios.post('/eps', { prompt: message });
        const assistantResponse = response.data.response;
        appendMessage('user', message);
        appendMessage('assistant', assistantResponse);
        saveMessage('assistant', assistantResponse); // Salvar mensagem do assistente no histórico
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showNotification('Erro ao enviar mensagem.');
    }

    document.getElementById('user-input').value = ''; // Limpar campo de entrada
}
