// Configuration for backend connection and timeouts
let CONFIG = {
    API_BASE: "http://127.0.0.1:8000",
    ASK_ENDPOINT: "/ask",
    HEALTH_ENDPOINT: "/health",
    REQUEST_TIMEOUT: 30000 // 30 seconds
};

// Map of suggested actions based on detected provider
const SUGGESTIONS = {
    aws: [
        { label: "Current AWS Cost", icon: "💰", prompt: "What is my current AWS cost breakdown?" },
        { label: "Running EC2 Instances", icon: "🖥", prompt: "What EC2 instances are running?" },
        { label: "Public S3 Buckets", icon: "🪣", prompt: "Are any of my S3 buckets public?" },
        { label: "Cost Breakdown", icon: "📊", prompt: "Show my AWS cost breakdown for the last 30 days." },
        { label: "Security Review", icon: "🛡", prompt: "Run an IAM security review for my AWS account." }
    ],
    azure: [
        { label: "Current Azure Cost", icon: "💰", prompt: "What is my current Azure cost breakdown?" },
        { label: "Virtual Machines", icon: "🖥", prompt: "What Azure virtual machines are running?" },
        { label: "Storage Accounts", icon: "🗄", prompt: "Are any of my storage accounts public?" },
        { label: "Cost Breakdown", icon: "📊", prompt: "Show my Azure cost breakdown for the last 30 days." },
        { label: "Subscription Security", icon: "🛡", prompt: "Are there any security risks in my Azure storage or compute?" }
    ],
    gcp: [
        { label: "Current GCP Cost", icon: "💰", prompt: "What is my current GCP cost breakdown?" },
        { label: "Compute Engine", icon: "🖥", prompt: "What GCP compute engine instances are running?" },
        { label: "Storage Buckets", icon: "🪣", prompt: "Are any of my GCS buckets public?" },
        { label: "Cost Breakdown", icon: "📊", prompt: "Show my GCP cost breakdown for the last 30 days." },
        { label: "Security Review", icon: "🛡", prompt: "Run a security scan on my GCP resources." }
    ],
    unknown: [
        { label: "Cloud Cost Summary", icon: "💰", prompt: "What is my cloud cost breakdown?" },
        { label: "Running Resources", icon: "🖥", prompt: "What compute resources are running?" },
        { label: "Storage Security", icon: "🔒", prompt: "Are any of my storage buckets public?" },
        { label: "Cost Breakdown", icon: "📊", prompt: "Show my cloud cost breakdown for the last 30 days." },
        { label: "Security Review", icon: "🛡", prompt: "Are there any security risks in my storage or compute?" }
    ]
};

// DOM Element Bindings
const providerBadge = document.getElementById("provider-badge");
const sendBtn = document.getElementById("send-btn");
const sendBtnIcon = document.getElementById("send-btn-icon");
const sendBtnSpinner = document.getElementById("send-btn-spinner");
const questionInput = document.getElementById("question-input");
const chatLog = document.getElementById("chat-log");
const clearBtn = document.getElementById("clear-btn");
const exportBtn = document.getElementById("export-btn");
const connectionWarning = document.getElementById("connection-warning");

// Settings Modal DOM Elements
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const backendUrlInput = document.getElementById("backend-url-input");
const settingsSaveBtn = document.getElementById("settings-save-btn");
const settingsCancelBtn = document.getElementById("settings-cancel-btn");

// Global State
let currentProvider = "unknown";
let conversationHistory = []; // Stores objects of type: { id, role, provider, text, timestamp }
let lastUserQuestion = ""; // Tracks the last user question for Retry button behavior
let isBackendOnline = false;

/**
 * Loads backend configuration URL from local storage.
 */
function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get("backendUrl", (result) => {
            if (result.backendUrl) {
                CONFIG.API_BASE = result.backendUrl;
            }
            resolve();
        });
    });
}

/**
 * Checks server health periodically and updates status UI.
 */
async function checkHealth() {
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
        
        const response = await fetch(`${CONFIG.API_BASE}${CONFIG.HEALTH_ENDPOINT}`, {
            method: "GET",
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            statusDot.className = "status-dot online";
            statusText.textContent = "Connected";
            connectionWarning.classList.add("hidden");
            isBackendOnline = true;
            toggleInputs(false);
        } else {
            throw new Error("Status failed");
        }
    } catch (e) {
        statusDot.className = "status-dot offline";
        statusText.textContent = "Offline";
        connectionWarning.classList.remove("hidden");
        isBackendOnline = false;
        toggleInputs(true);
    }
}

/**
 * Toggles controls when connection changes.
 */
function toggleInputs(disabled) {
    // Only toggle if we are not loading an active query
    if (!sendBtn.classList.contains("loading")) {
        questionInput.disabled = disabled;
        sendBtn.disabled = disabled;
        if (disabled) {
            questionInput.placeholder = "Backend Offline — Check Settings";
        } else {
            questionInput.placeholder = "Ask about your cloud...";
        }
    }
}

/**
 * Returns the current time formatted as HH:MM AM/PM (e.g. 11:42 PM).
 */
function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * RegExp Markdown parser supporting headings, lists, bold text, and inline code.
 * HTML entities are escaped first to prevent XSS.
 */
function parseMarkdown(text) {
    if (!text) return "";
    
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");

    const lines = html.split("\n");
    let parsedLines = [];
    let inList = false;

    for (let line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith("### ")) {
            if (inList) { parsedLines.push("</ul>"); inList = false; }
            parsedLines.push(`<h3>${trimmed.substring(4)}</h3>`);
        } else if (trimmed.startsWith("## ")) {
            if (inList) { parsedLines.push("</ul>"); inList = false; }
            parsedLines.push(`<h2>${trimmed.substring(3)}</h2>`);
        } else if (trimmed.startsWith("# ")) {
            if (inList) { parsedLines.push("</ul>"); inList = false; }
            parsedLines.push(`<h1>${trimmed.substring(2)}</h1>`);
        } else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            if (!inList) {
                parsedLines.push("<ul>");
                inList = true;
            }
            parsedLines.push(`<li>${trimmed.substring(2)}</li>`);
        } else if (trimmed === "") {
            if (inList) { parsedLines.push("</ul>"); inList = false; }
            parsedLines.push("<br>");
        } else {
            if (inList) { parsedLines.push("</ul>"); inList = false; }
            parsedLines.push(line);
        }
    }

    if (inList) {
        parsedLines.push("</ul>");
    }

    return parsedLines.join("\n");
}

/**
 * Updates the header badge text and style class according to the active provider.
 */
function updateProviderBadge(provider) {
    providerBadge.className = "badge";

    if (provider === "aws") {
        providerBadge.textContent = "AWS";
        providerBadge.classList.add("badge-aws");
    } else if (provider === "azure") {
        providerBadge.textContent = "Azure";
        providerBadge.classList.add("badge-azure");
    } else if (provider === "gcp") {
        providerBadge.textContent = "GCP";
        providerBadge.classList.add("badge-gcp");
    } else {
        providerBadge.textContent = "Unknown";
        providerBadge.classList.add("badge-unknown");
    }
}

/**
 * Displays the dynamic Suggested Action Cards grid in place of the empty state.
 */
function renderEmptyState() {
    chatLog.className = "chat-log empty-state";
    
    const cards = SUGGESTIONS[currentProvider] || SUGGESTIONS.unknown;
    const cardsHtml = cards.map(card => `
        <button class="action-card" data-prompt="${card.prompt.replace(/"/g, '&quot;')}">
            <span class="card-icon">${card.icon}</span>
            <span class="card-title">${card.label}</span>
        </button>
    `).join("");

    chatLog.innerHTML = `
        <div class="placeholder-container">
            <div class="placeholder-icon">☁️</div>
            <p class="placeholder-text">Welcome to CloudPilot</p>
            <span class="placeholder-subtext">AI assistant for AWS, Azure and GCP.</span>
            <div id="suggested-actions" class="suggested-actions">
                ${cardsHtml}
            </div>
        </div>
    `;

    setupSuggestedActions();
}

/**
 * Attaches event listeners to the generated Suggested Action Cards.
 */
function setupSuggestedActions() {
    const cards = document.querySelectorAll(".action-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            if (!isBackendOnline) return;
            const prompt = card.getAttribute("data-prompt");
            if (prompt) {
                questionInput.value = prompt;
                sendQuestion();
            }
        });
    });
}

/**
 * Removes the default empty state wrapper prior to rendering messages.
 */
function removePlaceholder() {
    if (chatLog.classList.contains("empty-state")) {
        chatLog.classList.remove("empty-state");
        chatLog.innerHTML = "";
    }
}

/**
 * Scrolls the chat log container to its latest scroll height position.
 */
function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
}

/**
 * Formats the HTML markup for error bubbles containing the Retry action button.
 */
function createErrorContainer(icon, header, text) {
    return `
        <div class="error-container">
            <div class="error-header">
                <span class="error-icon">${icon}</span>
                <span>${header}</span>
            </div>
            <span class="error-text">${text}</span>
            <button class="retry-btn">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                Retry
            </button>
        </div>
    `;
}

/**
 * Returns a customized, user-facing error message based on provider, connection, and timeout.
 */
function getErrorMessage(provider, errorMsg, isTimeout) {
    let icon = "⚠";
    let headerText = "Error";
    let text = "Unable to complete request.";
    
    if (isTimeout) {
        icon = "⏱";
        headerText = "Timeout";
        text = "Request timed out. Please try again.";
    } else if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
        icon = "🔌";
        headerText = "Backend Offline";
        text = "Unable to connect to the CloudPilot server. Verify that the backend is running.";
    } else if (provider === "aws") {
        icon = "⚠";
        headerText = "AWS Error";
        if (errorMsg.includes("Permission") || errorMsg.includes("AccessDenied")) {
            text = "Permission denied. Please verify your AWS IAM keys.";
        } else {
            text = "Unable to retrieve AWS data.";
        }
    } else if (provider === "azure") {
        icon = "⚠";
        headerText = "Azure Error";
        text = "Azure Cost Management is unavailable for this subscription.";
    } else if (provider === "gcp") {
        icon = "⚠";
        headerText = "GCP Error";
        text = "GCP Billing APIs are not enabled.";
    } else {
        icon = "⚠";
        headerText = "API Error";
        text = "Unable to contact CloudPilot backend.";
    }
    
    return { icon, headerText, text };
}

/**
 * Appends a thinking dot bubble animation to represent loading states.
 */
function appendThinkingMessage() {
    removePlaceholder();
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot thinking";
    messageDiv.innerHTML = `
        <div class="typing-dots">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
        <div id="thinking-status" class="thinking-subtext">CloudPilot is thinking...</div>
    `;
    chatLog.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

/**
 * Appends a user message to the DOM.
 */
function appendUserMessage(text, timestamp) {
    removePlaceholder();
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user";
    messageDiv.textContent = text;
    
    const metaDiv = document.createElement("div");
    metaDiv.className = "message-metadata";
    metaDiv.innerHTML = `<span class="message-timestamp">${timestamp}</span>`;
    messageDiv.appendChild(metaDiv);
    
    chatLog.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Renders the saved conversation history array into the chat log.
 */
function renderHistory() {
    removePlaceholder();
    chatLog.innerHTML = "";

    conversationHistory.forEach(msg => {
        const messageDiv = document.createElement("div");
        
        if (msg.role === "user") {
            messageDiv.className = "message user";
            messageDiv.textContent = msg.text;
            
            const metaDiv = document.createElement("div");
            metaDiv.className = "message-metadata";
            metaDiv.innerHTML = `<span class="message-timestamp">${msg.timestamp || ""}</span>`;
            messageDiv.appendChild(metaDiv);
        } else if (msg.role === "bot-error") {
            messageDiv.className = "message bot error";
            
            // Reconstruct error object info
            const errObj = msg.errorInfo || { icon: "⚠", headerText: "Error", text: msg.text };
            messageDiv.innerHTML = createErrorContainer(errObj.icon, errObj.headerText, errObj.text);
            
            const metaDiv = document.createElement("div");
            metaDiv.className = "message-metadata";
            const displayProvider = msg.provider ? msg.provider.toUpperCase() : "UNKNOWN";
            metaDiv.innerHTML = `
                <span class="message-provider ${msg.provider}">${displayProvider}</span>
                <span class="message-timestamp">${msg.timestamp || ""}</span>
            `;
            messageDiv.appendChild(metaDiv);
            
            // Set up listener for the Retry action
            const retryBtn = messageDiv.querySelector(".retry-btn");
            if (retryBtn) {
                retryBtn.addEventListener("click", () => {
                    if (lastUserQuestion) {
                        questionInput.value = lastUserQuestion;
                        sendQuestion();
                    }
                });
            }
        } else {
            const providerClass = msg.provider || "unknown";
            messageDiv.className = `message bot ${providerClass}`;
            messageDiv.innerHTML = parseMarkdown(msg.text);
            
            const metaDiv = document.createElement("div");
            metaDiv.className = "message-metadata";
            const displayProvider = msg.provider ? msg.provider.toUpperCase() : "UNKNOWN";
            metaDiv.innerHTML = `
                <span class="message-provider ${msg.provider}">${displayProvider}</span>
                <span class="message-timestamp">${msg.timestamp || ""}</span>
            `;
            messageDiv.appendChild(metaDiv);
        }
        chatLog.appendChild(messageDiv);
    });

    scrollToBottom();
}

/**
 * Queries the background worker for the latest active console context.
 */
function getContextFromBackground() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getProvider" }, (response) => {
            resolve(response || null);
        });
    });
}

/**
 * Handles sending messages, API requests, timeouts, error rendering, and histories.
 */
async function sendQuestion() {
    const message = questionInput.value.trim();
    if (!message || !isBackendOnline) return;

    lastUserQuestion = message;
    questionInput.value = "";
    const timestamp = getFormattedTime();

    // Query active context from background worker dynamically before making request
    let activeContext = null;
    try {
        activeContext = await getContextFromBackground();
        if (activeContext && activeContext.provider) {
            currentProvider = activeContext.provider;
            updateProviderBadge(currentProvider);
        }
    } catch (e) {
        console.error("Failed to query context from background:", e);
    }

    // 1. Save user question to state history
    const userMsgObj = {
        id: Date.now() + "-user",
        role: "user",
        provider: currentProvider,
        text: message,
        timestamp: timestamp
    };
    conversationHistory.push(userMsgObj);
    chrome.storage.local.set({ conversationHistory });

    // 2. Render user bubble
    appendUserMessage(message, timestamp);

    // 3. Disable controls, hide button icon, show button spinner, and trigger thinking bubble
    sendBtn.disabled = true;
    questionInput.disabled = true;
    sendBtn.classList.add("loading");
    sendBtnIcon.classList.add("hidden");
    sendBtnSpinner.classList.remove("hidden");
    
    const thinkingDiv = appendThinkingMessage();
    const thinkingStatus = document.getElementById("thinking-status");

    // 4. Setup timers for step-wise progress status messages
    const workTimer5s = setTimeout(() => {
        if (thinkingStatus) thinkingStatus.textContent = "Still working...";
    }, 5000);
    
    const workTimer15s = setTimeout(() => {
        if (thinkingStatus) thinkingStatus.textContent = "Large cloud environments may take longer...";
    }, 15000);

    // 5. Dispatch API request with abort controller timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ASK_ENDPOINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                provider: currentProvider,
                context: activeContext // Pass the full structured context
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearTimeout(workTimer5s);
        clearTimeout(workTimer15s);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        // Replace thinking indicator with actual response
        thinkingDiv.classList.remove("thinking");
        thinkingDiv.classList.add(currentProvider);
        thinkingDiv.innerHTML = parseMarkdown(data.response);

        // Add metadata
        const metaDiv = document.createElement("div");
        metaDiv.className = "message-metadata";
        const displayProvider = currentProvider.toUpperCase();
        metaDiv.innerHTML = `
            <span class="message-provider ${currentProvider}">${displayProvider}</span>
            <span class="message-timestamp">${timestamp}</span>
        `;
        thinkingDiv.appendChild(metaDiv);

        // 6. Save bot message to state history
        const botMsgObj = {
            id: Date.now() + "-bot",
            role: "bot",
            provider: currentProvider,
            text: data.response,
            timestamp: timestamp
        };
        conversationHistory.push(botMsgObj);
        chrome.storage.local.set({ conversationHistory });

    } catch (error) {
        clearTimeout(timeoutId);
        clearTimeout(workTimer5s);
        clearTimeout(workTimer15s);
        
        const isTimeout = error.name === "AbortError";
        const errObj = getErrorMessage(currentProvider, error.message, isTimeout);

        // Render dynamic error bubble
        thinkingDiv.classList.remove("thinking");
        thinkingDiv.classList.add("error");
        thinkingDiv.innerHTML = createErrorContainer(errObj.icon, errObj.headerText, errObj.text);

        const metaDiv = document.createElement("div");
        metaDiv.className = "message-metadata";
        const displayProvider = currentProvider.toUpperCase();
        metaDiv.innerHTML = `
            <span class="message-provider ${currentProvider}">${displayProvider}</span>
            <span class="message-timestamp">${timestamp}</span>
        `;
        thinkingDiv.appendChild(metaDiv);

        // Save bot error to state history
        const errorMsgObj = {
            id: Date.now() + "-error",
            role: "bot-error",
            provider: currentProvider,
            text: errObj.text,
            errorInfo: errObj,
            timestamp: timestamp
        };
        conversationHistory.push(errorMsgObj);
        chrome.storage.local.set({ conversationHistory });

        // Bind listener to the Retry button inside the new error container
        const retryBtn = thinkingDiv.querySelector(".retry-btn");
        if (retryBtn) {
            retryBtn.addEventListener("click", () => {
                questionInput.value = lastUserQuestion;
                sendQuestion();
            });
        }
    } finally {
        sendBtn.disabled = false;
        questionInput.disabled = false;
        sendBtn.classList.remove("loading");
        sendBtnSpinner.classList.add("hidden");
        sendBtnIcon.classList.remove("hidden");
        questionInput.focus();
        scrollToBottom();
    }
}

// Settings modal trigger event bindings
settingsBtn.addEventListener("click", () => {
    backendUrlInput.value = CONFIG.API_BASE;
    settingsModal.classList.remove("hidden");
});

settingsCancelBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
});

settingsSaveBtn.addEventListener("click", () => {
    const newUrl = backendUrlInput.value.trim().replace(/\/$/, ""); // strip trailing slashes
    if (newUrl) {
        CONFIG.API_BASE = newUrl;
        chrome.storage.local.set({ backendUrl: newUrl }, () => {
            settingsModal.classList.add("hidden");
            checkHealth(); // Trigger healthcheck immediately
        });
    }
});

// Export Chat as Markdown file
exportBtn.addEventListener("click", () => {
    if (conversationHistory.length === 0) return;
    
    let md = "# CloudPilot Conversation\n\n";
    conversationHistory.forEach(msg => {
        const roleName = msg.role === "user" ? "User" : "Assistant";
        const providerName = msg.provider ? msg.provider.toUpperCase() : "UNKNOWN";
        md += `**${roleName}** (${providerName} - ${msg.timestamp || "N/A"}):\n`;
        md += `${msg.text}\n\n`;
        md += "---\n\n";
    });
    
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudpilot-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
});

// Clear chat history with prompt confirmation
clearBtn.addEventListener("click", () => {
    if (conversationHistory.length === 0) return;
    if (confirm("Are you sure you want to clear your conversation history?")) {
        conversationHistory = [];
        chrome.storage.local.remove("conversationHistory", () => {
            renderEmptyState();
        });
    }
});

// Keyboard submission listener (Enter / Ctrl+Enter support)
questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendQuestion();
    }
});

// Initialize settings, badging, health check intervals, and history rendering
document.addEventListener("DOMContentLoaded", async () => {
    await loadConfig();
    
    chrome.runtime.sendMessage({ action: "getProvider" }, (response) => {
        currentProvider = (response && response.provider) ? response.provider : "unknown";
        updateProviderBadge(currentProvider);
        
        // Load persisted conversation history
        chrome.storage.local.get("conversationHistory", (result) => {
            if (result.conversationHistory && result.conversationHistory.length > 0) {
                conversationHistory = result.conversationHistory;
                renderHistory();
            } else {
                renderEmptyState();
            }
        });
    });

    // Run health check initially and set up 15-second interval pings
    checkHealth();
    setInterval(checkHealth, 15000);
});
