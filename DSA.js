// --- 1. DOM ELEMENTS & API KEY ---
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

// --- WARNING: This key is visible to anyone visiting the website. ---
// --- Use this for personal/demo purposes only. ---
const API_KEY = "AIzaSyDxO2-GKwd8lQNEVeFDuGW5v4fTCCbCofI";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;


// --- 2. PARTICLE.JS BACKGROUND INITIALIZATION ---
particlesJS('particles-js', {
  particles: {
    number: { value: 80, density: { enable: true, value_area: 800 } },
    color: { value: "#00bcd4" },
    shape: { type: "circle" },
    opacity: { value: 0.5, random: false, anim: { enable: false } },
    size: { value: 3, random: true, anim: { enable: false } },
    line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.1, width: 1 },
    move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
  },
  interactivity: {
    detect_on: "canvas",
    events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
    modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
  },
  retina_detect: true
});

// --- 3. EVENT LISTENER FOR FORM SUBMISSION ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();

    if (!userMessage) return;

    // Display user's message and clear input
    displayMessage(userMessage, 'user');
    userInput.value = '';

    // Show typing indicator and fetch AI response
    showTypingIndicator();
    try {
        const aiResponse = await getAIResponse(userMessage);
        hideTypingIndicator();
        // The API might return markdown. We format it for proper display.
        const formattedResponse = formatAIResponse(aiResponse);
        displayMessage(formattedResponse, 'ai');
    } catch (error) {
        hideTypingIndicator();
        displayMessage(`Oops! Something went wrong. ${error.message}`, 'ai');
    }
});

// --- 4. API CALL FUNCTION (Replicates CURL) ---
async function getAIResponse(prompt) {
    // The incorrect API key check has been removed.

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        systemInstruction: {
            parts: [{
                text: `You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
                       Data structure and Algorithm. You have to solve query of user in simplest way.
                       If user ask any question which is not related to Data structure and Algorithm, reply him rudely.
                       Example: If user asks, 'How are you', you will reply: 'You dumb! Ask me a sensible question related to DSA.'
                       You have to reply him rudely if question is not related to Data structure and Algorithm.
                       Else reply him politely with a simple explanation, using markdown for code blocks if necessary.`
            }]
        },
        generationConfig: {
            // Optional: configure temperature, etc.
            // temperature: 0.7
        }
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error.message}`);
    }

    const data = await response.json();
    // Safely access the text from the response
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
}


// --- 5. HELPER FUNCTIONS FOR DISPLAY ---

/**
 * Creates and appends a message bubble to the chat window.
 * @param {string} message - The text content of the message.
 * @param {string} sender - 'user' or 'ai'.
 */
function displayMessage(message, sender) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${sender}-message`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = message; // Use innerHTML to render formatted text

    messageContainer.appendChild(messageContent);
    chatWindow.appendChild(messageContainer);

    // Scroll to the latest message
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Displays the typing indicator.
 */
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'message ai-message typing-indicator';
    indicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    chatWindow.appendChild(indicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Removes the typing indicator.
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Formats the AI's text response, converting markdown code blocks to HTML <pre><code>.
 * @param {string} text - The raw text from the AI.
 * @returns {string} - HTML-formatted text.
 */
function formatAIResponse(text) {
    // Replace markdown code blocks (```) with <pre><code> tags
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let formattedText = text.replace(codeBlockRegex, (match, lang, code) => {
        // **FIXED:** Properly escape HTML characters to prevent them from being rendered.
        const escapedCode = code
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>');
        return `<pre><code class="language-${lang || 'plaintext'}">${escapedCode.trim()}</code></pre>`;
    });

    // Convert newlines to <br> for text outside of code blocks
    formattedText = formattedText.replace(/(<pre>[\s\S]*?<\/pre>)|(\n)/g, (match, pre, nl) => {
        return pre ? pre : (nl ? '<br>' : '');
    });

    return formattedText;
}