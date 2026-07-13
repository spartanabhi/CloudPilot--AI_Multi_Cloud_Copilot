# CloudPilot — AI Multi-Cloud Copilot

An AI copilot Chrome Extension and FastAPI backend that integrates directly into AWS Console, Azure Portal, and Google Cloud Console, enabling engineers to inspect compute resources, check bucket security configurations, and query billing snapshots using natural language.

---

## Folder Structure

```
cloudpilot/
├── backend/                  # FastAPI Backend API & AI Agent
│   ├── agent/                # LangGraph & ReAct agent architecture
│   │   ├── prompts.py        # System prompt with context integration
│   │   ├── tools.py          # Centralized multi-cloud adapter router
│   │   └── graph.py          # LangGraph agent setup
│   ├── adapters/             # Multi-Cloud Adapter Pattern implementations
│   │   ├── base.py           # Normalization contract definitions
│   │   ├── aws_adapter.py    # AWS SDK adapter (EC2, S3, Cost Explorer)
│   │   ├── azure_adapter.py  # Azure SDK adapter (VM, Storage, Cost Mgmt)
│   │   └── gcp_adapter.py    # GCP SDK adapter (Compute Engine, GCS, Billing)
│   ├── llm/                  # Centralized LLM provider factories
│   │   └── provider.py       # ChatGroq config
│   ├── main.py               # FastAPI server entry point
│   ├── requirements.txt      # Backend Python dependencies
│   └── .env                  # Local credentials configuration (Ignored in Git)
├── extension/                # Chrome Extension Frontend (Manifest V3)
│   ├── icons/                # Placeholder UI icons
│   ├── background.js         # Service worker tracking active tabs & resources
│   ├── sidepanel.html        # Sidebar layout HTML structure
│   ├── sidepanel.css         # Glassmorphic Dark UI styles
│   ├── sidepanel.js          # Chat, settings, health checks, & rendering
│   └── manifest.json         # Extension MV3 settings
├── LICENSE                   # MIT License
└── README.md                 # Project documentation
```

---

## Tech Stack

*   **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism, custom animations), Vanilla Javascript (ES6, Chrome API wrappers)
*   **Backend**: FastAPI (Python 3.12), Pydantic (data validation), Uvicorn (ASGI server)
*   **AI Agent**: LangGraph (ReAct framework), LangChain (ChatGroq), Groq API (`llama-3.3-70b-versatile`)
*   **Cloud Integrations**: Boto3 (AWS SDK), Azure SDK (mgmt-compute, mgmt-storage, mgmt-costmanagement), Google Cloud SDK (compute, storage, billing)

---

## Features

1.  **Context-Aware Dialogues**: The background service worker extracts the active provider, service (EC2/S3/VM/Storage Accounts/Compute Engine), page type (list, detail, bucket), and unique resource ID (like instance ID or bucket name) from the browser tab URL and injects it into prompt payloads.
2.  **Centralized Routing Layer (Adapter Pattern)**: All cloud adapters conform to a single normalization contract. Tool calls dynamically fetch from AWS, Azure, or GCP based on the console context.
3.  **UI Glassmorphic Styling**: Sleek purple-accented dark interface designed specifically for browser side panels.
4.  **Health-Pinging Status Indicators**: Periodically validates backend server availability, disabling chat inputs when offline and turning status dots red.
5.  **Step-Wise Progress Messengers**: Updates loading text (0s-5s: dots, 5s-15s: "Still working...", 15s+: "Large cloud environments may take longer...") to keep users engaged.
6.  **Interactive Suggested Action Cards**: Dynamic, provider-themed quick-action cards populate empty chats.
7.  **Markdown Renderers**: Formats raw text lists, bold styles, and inline code blocks inside chat bubbles.
8.  **Persistent Storage**: Saves structured message logs in `chrome.storage.local` to restore conversation history on extension reloads.
9.  **Markdown Conversation Exporter**: Formats and downloads sidepanel dialogues to local Markdown files.
10. **Settings Control Panels**: Allows configuring and persisting the FastAPI endpoint address.

---

## Installation

### Prerequisites
*   Python 3.12+
*   Google Chrome Browser
*   Groq API Key
*   Access keys / credentials for AWS, Azure, and GCP

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` configuration file in the `backend/` directory:
   ```env
   GROQ_API_KEY=your_groq_api_key
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=ap-south-1
   AZURE_SUBSCRIPTION_ID=your_azure_subscription_id
   AZURE_CLIENT_ID=your_azure_client_id
   AZURE_TENANT_ID=your_azure_tenant_id
   AZURE_CLIENT_SECRET=your_azure_secret
   GOOGLE_APPLICATION_CREDENTIALS=path_to_gcp_json_key.json
   GCP_PROJECT_ID=your_gcp_project_id
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

### 2. Chrome Extension Installation
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle switch in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `cloudpilot/extension/` folder containing `manifest.json`.
5. Pin the **CloudPilot** extension to your toolbar. Click the icon to open the Multi-Cloud AI Copilot sidebar!

---

## Future Improvements

*   **Resource Metrics charts**: Fetch and display dynamic graphs (CPU, network, disk) inside assistant messages using canvas libraries.
*   **Write/Modification Commands**: Introduce sandbox-bounded write commands (e.g. stopping idle EC2s or editing S3 bucket CORS headers) with interactive user approval buttons.
*   **Multilingual Interface**: Support localization for international operations groups.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
