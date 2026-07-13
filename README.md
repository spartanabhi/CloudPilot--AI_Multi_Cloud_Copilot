# ☁️ CloudPilot: AI-Powered Multi-Cloud Copilot

<p align="center">
  <img src="https://img.shields.io/badge/Manifest_V3-Chrome_Extension-6c5ce7?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/FastAPI-Framework-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangGraph-Agentic_AI-orange?style=for-the-badge&logo=python&logoColor=white" alt="LangGraph" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

An intelligent, context-aware browser extension side panel that embeds directly into the **AWS Console**, **Azure Portal**, and **Google Cloud Console**. CloudPilot dynamically detects which cloud service or resource page you are viewing, injects this active context, and answers complex infrastructure, security, and cost questions in plain English using **LangGraph ReAct agents** and live, read-only APIs

---

## 📸 Interactive Showcase & Console Integration

### 1. AWS Console Integration (EC2 & S3)
*Automatically detects the active region, service context, and EC2 instance IDs or S3 bucket names from tab URLs.*

<p align="center">
  <img src="SS/AWS%202.png" width="85%" alt="AWS Context Detection" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
</p>
<p align="center"><i>Fig 1: CloudPilot auditing active EC2 instance details</i></p>

<p align="center">
  <img src="SS/AWS%20.png" width="85%" alt="AWS Cost Explorer" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
</p>
<p align="center"><i>Fig 2: AI-driven Cost Explorer query and analysis</i></p>

---

### 2. Azure Portal Integration (VMs & Storage)
*Parses Azure hash routes to extract Subscription IDs, Resource Groups, VM names, and Storage Account scopes.*

<p align="center">
  <img src="SS/AZURE.png" width="85%" alt="Azure VM Audit" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
</p>
<p align="center"><i>Fig 3: Checking Azure Virtual Machine status and types</i></p>

<p align="center">
  <img src="SS/AZURE%202.png" width="85%" alt="Azure Storage Audit" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
</p>
<p align="center"><i>Fig 4: Public access evaluation for Azure Storage Accounts</i></p>

---

### 3. GCP Console Integration
*Audits GCP project IDs, compute zones, and Cloud Storage bucket profiles, with graceful permission fail-safes.*

<p align="center">
  <img src="SS/GCP.png" width="85%" alt="GCP Dashboard" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
</p>
<p align="center"><i>Fig 5: GCP billing budgets and Storage buckets security review</i></p>

---

## ⚡ Key Highlights & Architecture

*   **🔍 Tab Context Injection**: Monitors browser active tabs using regular expressions. Instantly extracts cloud resource IDs (like `i-00129abc817` or `my-bucket`) and regions from the URL, automatically appending them to user queries behind the scenes.
*   **🧩 Multi-Cloud Adapter Pattern**: Standardizes disparate cloud client response shapes (AWS Boto3, Azure Management SDKs, and Google Cloud libraries) into a normalized contract. The AI agent, API models, and extension remain completely provider-agnostic.
*   **🔮 ReAct Agent Orchestration**: Uses LangGraph to build stateful reasoning loops (Reasoning + Acting). The LLM determines which cloud tools to call, inspects the responses, and iterates until it compiles a grounded, plain-English answer.
*   **🟢 Health-Checking Status Dot**: Checks backend availability every 15 seconds, toggling header dots (Green: Connected, Red: Offline) and disabling sidebar inputs when the API server is unreachable.
*   **⏳ Step-wise Progress Messages**: Employs timer triggers to update thinking indicators dynamically (0s: Dots, 5s: *"Still working..."*, 15s: *"Large cloud environments may take longer..."*).
*   **📁 Markdown Exporter**: Generates and downloads the conversation history as a formatted Markdown file (`.md`) with a single click.

---

## 📐 System Flow Diagram

```
                  ┌────────────────────────────────────────┐
                  │          Chrome Web Browser            │
                  │  ┌───────────────┐   ┌──────────────┐  │
                  │  │  Side Panel   │   │  Background  │  │
                  │  │  Chat (HTML/  │◄─►│   Worker     │  │
                  │  │  CSS/JS)      │   │  (context)   │  │
                  │  └───────┬───────┘   └──────────────┘  │
                  └──────────┼─────────────────────────────┘
                             │ HTTP POST /ask (JSON context)
                             ▼
                  ┌────────────────────────────────────────┐
                  │           FastAPI Backend              │
                  │  ┌───────────────┐   ┌──────────────┐  │
                  │  │  /ask Route   │◄─►│  LangGraph   │  │
                  │  └───────────────┘   │  Agent (LLM) │  │
                  │                      └──────┬───────┘  │
                  │                             │          │
                  │                      ┌──────▼───────┐  │
                  │                      │ Multi-Cloud  │  │
                  │                      │ │  Adapter   │  │
                  │                      └──────┬───────┘  │
                  └─────────────────────────────┼──────────┘
                                                ▼
                                         Cloud Provider APIs
                                         (AWS, Azure, GCP)
```

---

## 🛠️ Technology Stack

*   **Frontend UI**: HTML5 · CSS3 (Glassmorphic dark theme) · ES6 Vanilla JavaScript
*   **Chrome Extension APIs**: Manifest V3 · Side Panel API · Tabs API · Local Storage API
*   **Backend Server**: FastAPI · Uvicorn · Pydantic (validation) · python-dotenv
*   **Agent framework**: LangGraph · LangChain · Groq LLM Client (`llama-3.3-70b-versatile`)
*   **Cloud SDKs**: Boto3 (AWS) · Azure Management SDKs (Azure) · Google Cloud Python Clients (GCP)
*   **Deployment**: AWS EC2 · pm2

---

## 🔒 Security & Least Privilege
CloudPilot conforms strictly to enterprise-grade read-only governance:
*   **AWS**: Scoped to the `ReadOnlyAccess` managed policy.
*   **Azure**: Assigned the `Reader` role at the target Subscription scope.
*   **GCP**: Bound only to the project `Viewer` role.

The application contains **no write, creation, or deletion capabilities**, preventing it from making any modifications to your cloud resources.

---

<details>
<summary>📂 Project Directory Tree</summary>

```
cloudpilot/
├── extension/                 ← Chrome extension frontend (Manifest V3)
│   ├── icons/                 ← Extension PNG icons (16, 48, 128)
│   ├── background.js          ← Service worker: URL matching & context tracking
│   ├── sidepanel.html         ← Sidebar panel DOM structure
│   ├── sidepanel.css          ← Glassmorphic UI stylesheet
│   ├── sidepanel.js           ← Frontend scripts: chat logs, export, settings
│   └── manifest.json          ← Extension permission settings
└── backend/                   ← FastAPI backend and agent code
    ├── agent/                 ← LangGraph orchestration
    │   ├── graph.py           ← ReAct graph compiler
    │   ├── tools.py           ← Tool schemas and adapter router
    │   └── prompts.py         ← Central system instructions
    ├── adapters/              ← Normalization adapter layer
    │   ├── base.py            ← BaseCloudAdapter class interface
    │   ├── aws_adapter.py     ← AWS Boto3 client adapter
    │   ├── azure_adapter.py   ← Azure SDK client adapter
    │   └── gcp_adapter.py     ← Google Cloud SDK client adapter
    ├── llm/                   ← LLM provider factory
    │   └── provider.py        │ ChatGroq client config
    ├── main.py                ← FastAPI entry point & routers
    └── requirements.txt       ← Python package dependencies
```
</details>

---

## 📝 Setup & Installation

<details>
<summary>💻 1. Local Backend Setup</summary>

1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Set up and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\Activate.ps1
    # macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file from the reference template:
    ```bash
    cp .env.example .env
    ```
5.  Open `.env` and fill in your cloud credential variables (AWS Access Keys, Azure Tenant IDs, GCP Service Account path, and Groq API Key).
6.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
    The server will start at `http://127.0.0.1:8000`.
</details>

<details>
<summary>🔌 2. Chrome Extension Load</summary>

1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Toggle on **Developer mode** in the top-right corner.
3.  Click **Load unpacked** in the top-left corner.
4.  Select the `cloudpilot/extension/` directory.
5.  Pin the **CloudPilot** extension to your toolbar. Click the icon to launch the sidebar panel!
</details>

<details>
<summary>🌐 3. Production Deployment (EC2 + pm2)</summary>

1.  SSH into your Ubuntu EC2 instance:
    ```bash
    ssh -i key.pem ubuntu@YOUR_EC2_IP
    ```
2.  Install Python dependencies and Node/pm2:
    ```bash
    sudo apt update && sudo apt install -y python3-pip python3-venv npm
    sudo npm install -g pm2
    ```
3.  Clone the repository, configure virtual environment, and install `requirements.txt`.
4.  Create the `.env` file containing your production credentials.
5.  Start the server with pm2:
    ```bash
    pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name cloudpilot
    pm2 save
    pm2 startup
    ```
6.  Update the **Backend URL** settings in the Chrome Extension to `http://YOUR_EC2_IP:8000`.
</details>

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
