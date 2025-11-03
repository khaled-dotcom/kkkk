// ===============================
//  EmpowerBot Chat Assistant
// ===============================
const GROQ_API_KEY = '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'; // test key
const GROQ_API_URL = 'https://api.groq.com/v1/chat/completions';

class GroqChat {
  constructor() {
    this.initChat();
    this.addListeners();
  }

  initChat() {
    if (!document.getElementById('groq-chat-container')) {
      const html = `
        <div id="groq-chat-container" class="chat-container">
          <div class="chat-header">
            <h3>EmpowerBot Assistant</h3>
            <button id="chat-minimize">−</button>
          </div>
          <div id="chat-messages" class="chat-messages"></div>
          <div class="chat-input-container">
            <textarea id="chat-input" placeholder="Type your question..." rows="1"></textarea>
            <button id="chat-send">Send</button>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
    }
  }

  addListeners() {
    const input = document.getElementById('chat-input');
    const send = document.getElementById('chat-send');
    const minimize = document.getElementById('chat-minimize');
    const container = document.getElementById('groq-chat-container');

    send.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    minimize.addEventListener('click', () => {
      container.classList.toggle('minimized');
      minimize.textContent = container.classList.contains('minimized') ? '+' : '−';
    });
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const send = document.getElementById('chat-send');
    const msg = input.value.trim();
    if (!msg) return;

    this.addMessage(msg, 'user');
    input.value = '';
    input.disabled = true;
    send.disabled = true;
    const typing = this.showTyping();

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: "You are EmpowerBot — a friendly assistant that helps users understand and use the website."
            },
            { role: 'user', content: msg }
          ],
          temperature: 0.7,
          max_tokens: 512
        })
      });

      this.removeTyping(typing);

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I didn’t understand that.";
      this.addMessage(reply, 'assistant');

    } catch (err) {
      console.error('Chat error:', err);
      this.removeTyping(typing);
      this.addMessage('⚠️ Error contacting chat service.', 'assistant');
    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  }

  addMessage(text, role) {
    const box = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = `chat-message ${role}-message`;
    msg.innerHTML = this.formatText(text);
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
  }

  formatText(text) {
    const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const linked = safe.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    return linked.replace(/\n/g, '<br>');
  }

  showTyping() {
    const id = 'typing-' + Date.now();
    const html = `<div id="${id}" class="chat-message assistant-message typing-indicator"><span></span><span></span><span></span></div>`;
    const box = document.getElementById('chat-messages');
    box.insertAdjacentHTML('beforeend', html);
    box.scrollTop = box.scrollHeight;
    return id;
  }

  removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => new GroqChat());
