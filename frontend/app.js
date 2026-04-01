// Initialize Lucide icons
try {
    lucide.createIcons();
} catch (e) {
    console.warn("Lucide icons failed to load:", e);
}

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const globalTargetLang = document.getElementById('globalTargetLang');

const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const chatBox = document.getElementById('chatBox');
const emptyState = document.getElementById('emptyState');
const sidebarHistoryList = document.getElementById('sidebarHistoryList');
const historyLoading = document.getElementById('historyLoading');
const newChatBtn = document.getElementById('newChatBtn');

const API_URL = 'http://localhost:8000';

// Load settings
let savedTargetLang = localStorage.getItem('translingua_target_lang') || 'en';

const langNames = {
    'en': 'English', 'hi': 'Hindi', 'te': 'Telugu', 
    'fr': 'French', 'es': 'Spanish', 'ja': 'Japanese',
    'ko': 'Korean', 'de': 'German', 'auto': 'Auto-Detected'
};

let currentSessionId = generateSessionId();

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
}

// Settings Modal Logic
settingsBtn.addEventListener('click', () => {
    globalTargetLang.value = savedTargetLang;
    settingsModal.classList.remove('hidden');
});
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
saveSettingsBtn.addEventListener('click', () => {
    savedTargetLang = globalTargetLang.value;
    localStorage.setItem('translingua_target_lang', savedTargetLang);
    settingsModal.classList.add('hidden');
});

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

// File Upload
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const sourceLang = "auto";
    const targetLang = savedTargetLang;

    emptyState.classList.add('hidden');
    appendMessage('user', `📎 <strong>Attached Document:</strong> ${file.name}`, sourceLang);
    const typingElementId = appendTypingIndicator(targetLang);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    formData.append('session_id', currentSessionId);

    try {
        const response = await fetch(`${API_URL}/translate-file`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'File translation failed');
        }

        const data = await response.json();
        removeMessage(typingElementId);
        
        let previewText = data.translated_text;
        if(previewText.length > 250) {
            previewText = previewText.substring(0, 250) + '...';
        }
        
        appendMessage('ai', `✅ Document translated successfully!\n\n**Preview:**\n${previewText}\n\n*A .txt file with the fully translated contents has been downloaded automatically.*`, targetLang);
        
        // Auto Download the translated file
        const blob = new Blob([data.translated_text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Translated_${data.original_filename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        loadHistory();
        
    } catch (error) {
        console.error('File Upload Error:', error);
        removeMessage(typingElementId);
        appendMessage('error', `Error: ${error.message}. Large document translation might take time.`, '');
    }
    
    fileInput.value = ''; // Reset
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

    const sourceLang = "auto";
    const targetLang = savedTargetLang;

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
        
        // If auto-detect worked, the backend should return the real detected source_lang safely
        const displayLang = data.source_lang && data.source_lang !== 'auto' ? data.source_lang : 'auto';
        appendMessage('ai', data.translated_text, targetLang, data.cached, displayLang);
        
        // Refresh history to show new item
        loadHistory();

    } catch (error) {
        console.error('Translation Error:', error);
        removeMessage(typingElementId);
        appendMessage('error', `Error: ${error.message}. Is the backend running?`, '');
    }
}

function appendMessage(role, text, langCode, cached = false, overrideSourceLang = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-message' : role === 'ai' ? 'ai-message' : 'ai-message'}`;
    
    let avatarIcon = role === 'user' ? 'user' : 'languages';
    let avatarClass = role === 'user' ? 'user-avatar' : 'ai-avatar';
    
    // Format language name
    let langName = langCode ? (langNames[langCode] || langCode.toUpperCase()) : "Language";
    
    if (role === 'ai' && overrideSourceLang) {
        let detName = langNames[overrideSourceLang] || overrideSourceLang.toUpperCase();
        langName = `[Detected: ${detName}] &rarr; ${langName}`;
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
    
    const langName = langNames[targetLangCode] || targetLangCode.toUpperCase();

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
