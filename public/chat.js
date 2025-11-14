document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-button');
    const messagesDiv = document.getElementById('messages');
    const typingIndicator = document.getElementById('typing');
    const currentTexEl = document.getElementById('current-tex');
    const proposedTexEl = document.getElementById('proposed-tex');
    const acceptBtn = document.getElementById('accept-btn');
    const declineBtn = document.getElementById('decline-btn');
    const proposalExplanation = document.getElementById('proposal-explanation');

    // Socket.IO client
    let socket = null;
    try {
        socket = io();
        // If server assigns a uid, store it in a cookie for persistence
        socket.on('uid:assign', (data) => {
            if (data?.uid) document.cookie = `uid=${data.uid}; path=/; SameSite=Lax`;
        });

        socket.on('resume:updatePreview', (payload) => {
            // payload: { proposedTex, explanation, valid, errors?, committed? }
            if (payload.proposedTex) {
                proposedTexEl.textContent = payload.proposedTex;
                proposalExplanation.textContent = payload.explanation || '';
            } else {
                proposedTexEl.textContent = '';
                proposalExplanation.textContent = payload.explanation || '';
            }
            if (payload.committed) {
                // server informed that pending was committed
                fetchCurrentTex();
            }
        });
    } catch (e) {
        console.warn('Socket.IO not available', e);
    }

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = 'message ' + sender;
        msg.innerHTML = text;
        messagesDiv.appendChild(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function showTyping(show){
        typingIndicator.style.display = show ? 'block' : 'none';
    }

    async function handleUserMessage(text){
        addMessage(escapeHtml(text), 'user');
        showTyping(true);

        // Send to backend REST endpoint which will call Gro and emit preview via sockets
        try {
            const resp = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await resp.json();
            showTyping(false);
            if (data && data.explanation) addMessage(escapeHtml('Sir: ' + (data.explanation || 'Proposal ready.')), 'bot');
            // proposedTex will arrive via socket event; also update proposed area now if present
            if (data && data.proposedTex) {
                proposedTexEl.textContent = data.proposedTex;
                proposalExplanation.textContent = data.explanation || '';
            }
        } catch (err) {
            showTyping(false);
            addMessage('Error contacting server: ' + err.message, 'bot');
        }
    }

    sendBtn.addEventListener('click', () => {
        const userText = input.value.trim();
        if (!userText) return;
        input.value = '';
        handleUserMessage(userText);
        input.focus();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    function escapeHtml(str){
        return str.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
    }

    async function getBotReply(question){
        // Placeholder intelligent replies - replace with real API calls
        const q = question.toLowerCase();
        if (q.includes('hello') || q.includes('hi')) return 'Hello — how can I assist you today?';
        if (q.includes('resume')) return 'I can help improve your resume. Tell me the job title and your experience.';
        if (q.includes('thanks') || q.includes('thank')) return "You\'re welcome — happy to help!";
        // fallback
        return "I\'m Sir — I can answer questions, improve your resume, or give tips. Try asking me for a resume summary.";
    }

    // initial greeting
    setTimeout(()=> addMessage('Hi, I\'m Sir — how can I help today?', 'bot'), 600);

    // Load initial template (basic) to seed currentTex
    async function fetchCurrentTex(){
        try {
            const r = await fetch('/api/resume/template/basic');
            const j = await r.json();
            if (j?.currentTex) {
                currentTexEl.textContent = j.currentTex;
            }
        } catch (e) {
            currentTexEl.textContent = 'Unable to load template: ' + (e.message || e);
        }
    }
    fetchCurrentTex();

    // Accept / Decline handlers
    acceptBtn?.addEventListener('click', async () => {
        try {
            const r = await fetch('/api/resume/accept', { method: 'POST' });
            const j = await r.json();
            if (j.currentTex) {
                currentTexEl.textContent = j.currentTex;
                proposedTexEl.textContent = '';
                proposalExplanation.textContent = '';
            }
        } catch (e) {
            alert('Accept failed: ' + (e.message || e));
        }
    });

    declineBtn?.addEventListener('click', async () => {
        try {
            const r = await fetch('/api/resume/decline', { method: 'POST' });
            const j = await r.json();
            if (j.ok) {
                proposedTexEl.textContent = 'No proposal.';
                proposalExplanation.textContent = '';
            }
        } catch (e) {
            alert('Decline failed: ' + (e.message || e));
        }
    });
});