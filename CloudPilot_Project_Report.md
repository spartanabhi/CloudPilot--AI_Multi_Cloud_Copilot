# CloudPilot: Multi-Cloud AI Copilot (Chrome Extension + LangGraph)

### Project Overview
CloudPilot is a context-aware AI assistant designed to help cloud engineers analyze, monitor, and audit multi-cloud infrastructure directly inside their browser. It bridges the gap between complex cloud dashboards and natural language by embedding a persistent side panel in AWS Console, Azure Portal, and Google Cloud Console. Powered by LangGraph and Groq (Llama-3.3), the system dynamically inspects compute resources, evaluates storage bucket permissions, and displays service billing summaries on demand using read-only API integration.

### Core Features
*   **Context-Aware Dialogues**: Tracks browser navigation in real-time, extracts resource metadata (ID, region, service) from active console tabs, and injects this information directly into prompt payloads.
*   **Multi-Cloud Adapter Pattern**: Normalizes diverse vendor structures (EC2, Azure VMs, GCP Compute Engine) into a unified interface, decoupling cloud SDK logic from the AI agent.
*   **Sleek Glassmorphic Frontend**: Features a modern, responsive side panel interface with backdrop blurring, animated loading states, and custom scrollbars.
*   **Settings Persistence**: Allows configuring and saving custom backend URLs directly inside the extension.
*   **Health-Checking Indicators**: Dispatches health checks every 15 seconds to monitor server availability and toggle inputs dynamically.
*   **Export and Clear Controls**: Supports single-click Markdown chat exports and history clearing with confirmation checks.

---

### System Architecture
The application is built around a decoupled 3-tier architecture:

1.  **Chrome Extension (Frontend)**: Standard HTML5, CSS3 (glassmorphism), and ES6 JavaScript. Monitors browser tab switches and communicates with the FastAPI backend.
2.  **FastAPI REST Server (API Layer)**: Serves as the API gateway, hosting `/ask` and `/health` endpoints and managing CORS controls.
3.  **Multi-Cloud Adapter Layer**: Translates generic tool requests into cloud-specific SDK commands (Boto3 for AWS, Azure Management SDKs for Azure, and Google Cloud client libraries for GCP).

---

### Step-by-Step Data Flow
1.  **Context Detection**: The background service worker intercepts URL changes and parses metadata.
2.  **Payload Generation**: The user submits a prompt, and the sidebar joins it with active browser context.
3.  **Inference Preamble**: FastAPI receives the POST payload, formats the context into natural language, and prepends it to the user's human message.
4.  **Agent Reasoning Loop**: The LangGraph ReAct agent reads the prompt, determines what cloud data is required, and invokes the corresponding tool.
5.  **Adapter Routing**: The tool queries the unified cloud adapter, which routes the request to the active SDK client.
6.  **Response Generation**: The adapter returns normalized JSON, the agent reasons over the data, and FastAPI responds with the final markdown text.

---

### Technology Stack
*   **Frontend**: HTML5, CSS3, ES6 JavaScript, Chrome Extension MV3, Side Panel API
*   **Backend & API**: Python 3.12, FastAPI, Uvicorn, Pydantic, python-dotenv
*   **Agent Framework**: LangGraph, LangChain, Groq API (Llama-3.3-70b-versatile)
*   **Cloud SDKs**: Boto3 (AWS), Azure SDKs for Python (Azure), Google Cloud Client Libraries (GCP)
*   **Credentials & Security**: AWS IAM User (ReadOnlyAccess), Azure Service Principal (Reader), GCP Service Account (Viewer)
