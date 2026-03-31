// Initialize Lucide icons
try {
    lucide.createIcons();
} catch (e) {
    console.warn("Lucide icons failed to load:", e);
}
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const swapBtn = document.getElementById('swapBtn');
const translateBtn = document.getElementById('translateBtn');
const loading = document.getElementById('loading');
const cacheBadge = document.getElementById('cacheBadge');

// Local API URL (Ensure FastAPI is running on port 8000)
const API_URL = 'http://localhost:8000/translate';

// Swap languages and text
swapBtn.addEventListener('click', () => {
    const tempLang = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = tempLang;

    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;
    
    // Hide cache badge on swap
    cacheBadge.classList.add('hidden');
});

// Translation Logic
translateBtn.addEventListener('click', async () => {
    const text = sourceText.value.trim();
    if (!text) {
        alert("Please enter text to translate.");
        return;
    }

    if (sourceLang.value === targetLang.value) {
        targetText.value = text;
        return;
    }

    // Show loading UI
    loading.classList.remove('hidden');
    cacheBadge.classList.add('hidden');
    targetText.value = '';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                source_lang: sourceLang.value,
                target_lang: targetLang.value
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Translation failed');
        }

        const data = await response.json();
        
        targetText.value = data.translated_text;

        // Show cache badge if returned from SQLite
        if (data.cached) {
            cacheBadge.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Translation Error:', error);
        alert(`Error: ${error.message}. Is the local backend running?`);
    } finally {
        // Hide loading UI
        loading.classList.add('hidden');
    }
});
