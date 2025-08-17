const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
/**
 * Appends a new message to the chat box.
 * @param {string} sender - The sender of the message ('user' or 'bot').
 * @param {string} text - The text content of the message.
 * @returns {HTMLElement} The created message element.
 */
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', sender);

  // Jika pengirimnya adalah bot dan ada library 'marked', proses sebagai Markdown
  if (sender === 'bot' && window.marked) {
    const unsafeHtml = marked.parse(text);
    msgDiv.innerHTML = DOMPurify.sanitize(unsafeHtml);
  } else {
    msgDiv.textContent = text;
  }
  chatBox.appendChild(msgDiv);
  // Scroll to the bottom to ensure the latest message is visible
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgDiv;
}
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage('user', userMessage);
  input.value = '';

  // Show a temporary "Thinking..." message and get a reference to it
  const botMessageDiv = appendMessage('bot', 'Gemini is thinking...');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      // Try to get a specific error message from the server's JSON response
      const errorData = await response.json().catch(() => ({ error: `Server responded with status: ${response.status}` }));
      throw new Error(errorData.error || 'Failed to get response from server.');
    }

    const data = await response.json();

    if (data && data.result) {
      // Ubah Markdown menjadi HTML yang aman dan perbarui pesan bot
      const unsafeHtml = marked.parse(data.result);
      botMessageDiv.innerHTML = DOMPurify.sanitize(unsafeHtml);
    } else {
      // Handle cases where the response is successful but contains no result
      botMessageDiv.textContent = 'Sorry, no response received.';
    }
  } catch (error) {
    console.error('Error fetching chat response:', error);
    // Tampilkan pesan error dengan aman
    const unsafeErrorHtml = marked.parse(error.message);
    botMessageDiv.innerHTML = DOMPurify.sanitize(unsafeErrorHtml);
  }
});
