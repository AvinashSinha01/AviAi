function change(id, delta) {
  const el = document.getElementById(id);
  const min = parseInt(el.min) || 0;
  const max = parseInt(el.max) || 99;
  el.value = Math.min(max, Math.max(min, parseInt(el.value || 0) + delta));
}

async function predict() {
  const area = document.getElementById('area').value;
  const bedrooms = document.getElementById('bedrooms').value;
  const bathrooms = document.getElementById('bathrooms').value;
  const parking = document.getElementById('parking').value;

  if (!area) {
    document.getElementById('area').focus();
    document.getElementById('area').style.borderColor = '#ef4444';
    setTimeout(() => document.getElementById('area').style.borderColor = '', 2000);
    return;
  }

  document.getElementById('predict-btn-text').classList.add('hidden');
  document.getElementById('predict-loader').classList.remove('hidden');

  try {
    const body = new FormData();
    body.append('area', area);
    body.append('bedrooms', bedrooms);
    body.append('bathrooms', bathrooms);
    body.append('parking', parking);

    const res = await fetch('/predict', { method: 'POST', body });
    const data = await res.json();

    if (data.result) {
      document.getElementById('result-empty').classList.add('hidden');
      document.getElementById('result-filled').classList.remove('hidden');
      document.getElementById('result-card').style.alignItems = 'flex-start';
      animatePrice(data.result);
      document.getElementById('r-area').textContent = area + ' sq ft';
      document.getElementById('r-bed').textContent = bedrooms + ' BHK';
      document.getElementById('r-bath').textContent = bathrooms;
      document.getElementById('r-park').textContent = parking;
      document.getElementById('result-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('Server error. Make sure Flask is running.');
  } finally {
    document.getElementById('predict-btn-text').classList.remove('hidden');
    document.getElementById('predict-loader').classList.add('hidden');
  }
}

function animatePrice(priceStr) {
  const el = document.getElementById('result-price');
  const numeric = parseInt(priceStr.replace(/[₹,]/g, ''));
  const duration = 1200;
  const steps = 60;
  const increment = numeric / steps;
  let current = 0, step = 0;
  const timer = setInterval(() => {
    step++;
    current = Math.min(numeric, Math.round(increment * step));
    el.textContent = '₹' + current.toLocaleString('en-IN');
    if (step >= steps) clearInterval(timer);
  }, duration / steps);
}

function askAIAboutResult() {
  const area = document.getElementById('r-area').textContent;
  const bed = document.getElementById('r-bed').textContent;
  const price = document.getElementById('result-price').textContent;
  const msg = `I have a ${bed} flat of ${area}. The estimated price is ${price}. Is this a good deal? What should I consider before buying?`;
  document.getElementById('chat-section').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    document.getElementById('chat-input').value = msg;
    sendChat();
  }, 800);
}

let isSending = false;

async function sendChat() {
  if (isSending) return;
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  isSending = true;
  input.value = '';
  document.getElementById('send-btn').disabled = true;
  document.getElementById('chat-suggestions').style.display = 'none';

  addMessage(msg, 'user');
  const typingId = addTyping();

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    removeTyping(typingId);
    addMessage(data.reply || data.error, 'bot');
  } catch (err) {
    removeTyping(typingId);
    addMessage('Sorry, something went wrong. Please try again.', 'bot');
  } finally {
    isSending = false;
    document.getElementById('send-btn').disabled = false;
    input.focus();
  }
}

function addMessage(text, role) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `msg msg--${role}`;
  div.innerHTML = `
    <div class="msg-avatar">${role === 'bot' ? 'AI' : '👤'}</div>
    <div class="msg-bubble">${formatMessage(text)}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function formatMessage(text) {
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function addTyping() {
  const container = document.getElementById('chat-messages');
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'msg msg--bot msg-typing';
  div.id = id;
  div.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="msg-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function sendSuggestion(btn) {
  document.getElementById('chat-input').value = btn.textContent;
  sendChat();
}

function clearChat() {
  document.getElementById('chat-messages').innerHTML = `
    <div class="msg msg--bot">
      <div class="msg-avatar">AI</div>
      <div class="msg-bubble">
        👋 Hello! I'm your AI real estate assistant. Ask me anything about property prices, buying tips, investment advice, or specific cities in India!
      </div>
    </div>
  `;
  document.getElementById('chat-suggestions').style.display = 'flex';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement.id === 'chat-input') sendChat();
});