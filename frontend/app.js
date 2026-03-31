// Initialize Lucide icons
try {
    lucide.createIcons();
} catch (e) {
    console.warn("Lucide icons failed to load:", e);
}

const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const swapBtn = document.getElementById('swapBtn');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');
const sidebarHistoryList = document.getElementById('sidebarHistoryList');
const historyLoading = document.getElementById('historyLoading');
const newChatBtn = document.getElementById('newChatBtn');

const API_URL = 'http://localhost:8000';

let currentSessionId = generateSessionId();

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
}

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim().length > 0) {
        sendBtn.disabled = false;
        sendBtn.style.background = 'var(--accent)';
    } else {
        sendBtn.disabled = true;
        sendBtn.style.background = '';
    }
});

// Submit on Enter (Shift+Enter for new line)
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) sendTranslationRequest();
    }
});

sendBtn.addEventListener('click', () => {
    sendTranslationRequest();
});

// Swap Languages
swapBtn.addEventListener('click', () => {
    const tempLang = sourceLangSelect.value;
    sourceLangSelect.value = targetLangSelect.value;
    targetLangSelect.value = tempLang;
});

// New Chat Button
newChatBtn.addEventListener('click', () => {
    currentSessionId = generateSessionId();
    // Clear chat box except empty state
    chatBox.innerHTML = '';
    chatBox.appendChild(emptyState);
    emptyState.classList.remove('hidden');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;
    chatInput.focus();
});

async function sendTranslationRequest() {
    const text = chatInput.value.trim();
    if (!text) return;

    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    // Remove empty state
    emptyState.classList.add('hidden');

    // Display User Message
    appendMessage('user', text, sourceLang);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Display AI typing indicator
    const typingElementId = appendTypingIndicator(targetLang);

    try {
        const response = await fetch(`${API_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                source_lang: sourceLang,
                target_lang: targetLang,
                session_id: currentSessionId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Translation failed');
        }

        const data = await response.json();
        
        // Remove typing and replace with AI message
        removeMessage(typingElementId);
        appendMessage('ai', data.translated_text, targetLang, data.cached);
        
        // Refresh history to show new item
        loadHistory();

    } catch (error) {
        console.error('Translation Error:', error);
        removeMessage(typingElementId);
        appendMessage('error', `Error: ${error.message}. Is the backend running?`, '');
    }
}

function appendMessage(role, text, langCode, cached = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-message' : role === 'ai' ? 'ai-message' : 'ai-message'}`;
    
    let avatarIcon = role === 'user' ? 'user' : 'languages';
    let avatarClass = role === 'user' ? 'user-avatar' : 'ai-avatar';
    
    // Format language name
    let langName = "Language";
    if(langCode) {
        const select = role === 'user' ? sourceLangSelect : targetLangSelect;
        const option = Array.from(select.options).find(opt => opt.value === langCode);
        langName = option ? option.text : langCode.toUpperCase();
    }
    
    let cachedBadgeHTML = cached ? `<span style="background: rgba(46, 160, 67, 0.2); color: #2ea043; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; margin-left: 8px;">Cached⚡</span>` : '';

    msgDiv.innerHTML = `
        <div class="message-content">
            <div class="message-avatar ${avatarClass}">
                <i data-lucide="${avatarIcon}"></i>
            </div>
            <div class="message-body ${role === 'error' ? 'error-msg' : ''}">
                ${role !== 'error' ? `<div class="message-meta-lang">${langName}${cachedBadgeHTML}</div>` : ''}
                <div>${text.replace(/\n/g, '<br/>')}</div>
            </div>
        </div>
    `;
    
    chatBox.appendChild(msgDiv);
    lucide.createIcons({root: msgDiv});
    
    smoothScrollToBottom();
}

function appendTypingIndicator(targetLangCode) {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ai-message`;
    msgDiv.id = id;
    
    const option = Array.from(targetLangSelect.options).find(opt => opt.value === targetLangCode);
    const langName = option ? option.text : targetLangCode.toUpperCase();

    msgDiv.innerHTML = `
        <div class="message-content">
            <div class="message-avatar ai-avatar">
                <i data-lucide="languages"></i>
            </div>
            <div class="message-body">
                <div class="message-meta-lang">Translating to ${langName}...</div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        </div>
    `;
    
    chatBox.appendChild(msgDiv);
    lucide.createIcons({root: msgDiv});
    smoothScrollToBottom();
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if(el) chatBox.removeChild(el);
}

function smoothScrollToBottom() {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
}

// --- History SideBar Logic ---

async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/sessions`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const data = await response.json();
        
        sidebarHistoryList.innerHTML = '';
        
        if (data.length === 0) {
            sidebarHistoryList.innerHTML = '<p style="color:var(--text-muted); font-size: 0.85rem; padding: 10px;">No translations yet.</p>';
            return;
        }

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            
            div.innerHTML = `
                <div class="history-item-langs">${item.source_lang.toUpperCase()} &rarr; ${item.target_lang.toUpperCase()}</div>
                <div class="history-item-text" title="${item.input_text.replace(/"/g, '&quot;')}">
                    ${item.input_text}
                </div>
            `;
            
            // Load full session on click
            div.addEventListener('click', () => {
                loadSessionDetails(item.session_id);
            });

            sidebarHistoryList.appendChild(div);
        });
        
    } catch (e) {
        console.error('History Fetch Error:', e);
        sidebarHistoryList.innerHTML = '<p style="color:#ff6b6b; font-size: 0.85rem; padding: 10px;">Backend unavailable.</p>';
    }
}

async function loadSessionDetails(sessionId) {
    try {
        const response = await fetch(`${API_URL}/session/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch session details');
        
        const messages = await response.json();
        currentSessionId = sessionId; // switch to this session
        
        chatBox.innerHTML = '';
        emptyState.classList.add('hidden');
        
        // Show first message's language as selected
        if(messages.length > 0) {
            sourceLangSelect.value = messages[0].source_lang;
            targetLangSelect.value = messages[0].target_lang;
        }

        messages.forEach(msg => {
            appendMessage('user', msg.input_text, msg.source_lang);
            appendMessage('ai', msg.translated_text, msg.target_lang, false);
        });
        
    } catch (e) {
        console.error('Session Details Fetch Error:', e);
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    chatInput.focus();
});
