# Claude Prompt to Generate/Customize CloudPilot Project Report

Copy and paste the prompt below into Claude (or any other AI assistant) to generate, refine, or translate your CloudPilot project report. It includes a comprehensive description of the system architecture, file structure, and step-by-step flows.

---

```text
Act as an expert Site Reliability Engineer (SRE), software architect, and technical writer. I want you to write a comprehensive, publication-ready technical project report for my project: "CloudPilot". 

CloudPilot is a context-aware AI assistant that integrates as a side panel Chrome Extension directly inside the AWS Console, Azure Portal, and Google Cloud Console. It communicates with a FastAPI Python backend powered by a LangGraph ReAct agent and Groq LLM (Llama-3.3-70b) to query read-only cloud metrics (compute resources, storage permissions, and billing data) using custom adapters.

I want the report to follow the structure and style of a professional project report. Do NOT include any interview Q&A or study tips sections. 

Here is the exact description of my project architecture, directory structure, files, and workflows that you must use to build the report:

1. CORE PIECES & ARCHITECTURE
- Frontend: Manifest V3 Chrome Extension. Monitors browser active tabs and uses regular expressions on URLs (path & hashes) to detect provider, active service, region, and active resource IDs. Dispatches POST /ask payloads containing the user question and the parsed browser context. Pings /health every 15 seconds to monitor backend server availability, showing status dots (Connected/Offline) and disabling inputs when server is offline.
- Backend API Gateway: FastAPI Python server. Exposes POST /ask and GET /health endpoints, manages CORS middleware origins for Chrome Extension IDs, and validates schemas using Pydantic models (ChatRequest, ChatResponse).
- Orchestration Graph: LangGraph ReAct agent. Prepend formatted tab context as a natural language header block to the user prompt. Executes tool queries conditionally using Boto3 (AWS), Azure SDKs, and Google Cloud client libraries.

2. PROJECT DIRECTORY STRUCTURE
cloudpilot/
├── extension/                 ← Chrome extension frontend (Manifest V3)
│   ├── background.js          ← Service worker URL matching & context tracking
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
    └── main.py                ← FastAPI entry point & routers

3. FILE-BY-FILE AND FUNCTION SPECIFICATIONS
- backend/main.py: App configuration, CORS middleware setup, ChatRequest Pydantic schemas, and endpoints (/ask, /health, /).
- backend/agent/graph.py: build_agent() compiles the ReAct agent. format_cloud_context(context) parses raw browser context dictionary into natural language. ask_agent(question, context) manages LLM invocations and development JSON logging.
- backend/agent/tools.py: get_cloud_adapter(), list_compute_resources(), list_storage_buckets(), and get_cost_summary() route tool calling logic to the adapters.
- backend/adapters/base.py: BaseCloudAdapter abstract base class enforcing get_cost_summary(), list_compute_resources(), and check_storage_security() implementations.
- backend/adapters/aws_adapter.py: _get_session() configuration. EC2 describe_instances(), S3 list_buckets() / get_bucket_acl(), and CE get_cost_and_usage() queries.
- backend/adapters/azure_adapter.py: _get_credential() ClientSecretCredential. VM list_all() / instance_view(), Storage Accounts list(), and CostManagement query.usage().
- backend/adapters/gcp_adapter.py: VM InstancesClient zone iteration, Storage list_buckets() IAM allUsers verification, and BudgetServiceClient list_budgets().
- extension/background.js: detectProvider(url) and detectCloudContext(url) regex matches for AWS services, Azure path hashes, and GCP project parameters.
- extension/sidepanel.js: loadConfig() settings, checkHealth() ping timers, parseMarkdown() sanitizers, sendQuestion() payload triggers, exportBtn and clearBtn handlers.

4. STEP-BY-STEP DATA FLOW
1. User types in sidebar.
2. background.js parses tab URL and extracts context.
3. sidepanel.js joins prompt + context, posts to FastAPI /ask.
4. FastAPI validates schema and sends variables to ask_agent().
5. graph.py prepends context block and triggers LLM reasoning.
6. LangGraph agent calls list_compute_resources tool with provider parameter.
7. Adapter translates tool query to cloud-specific SDK command.
8. Cloud returns raw values, adapter standardizes keys.
9. Agent receives normalized JSON and generates final plain English answer.
10. FastAPI responds and sidepanel.js renders markdown details.

Please write the complete project report detailing:
- Title: CloudPilot: Agentic Multi-Cloud Copilot & AIOps Assistant
- Executive Summary, Problem Statement, and Solution
- Detailed Architectural breakdown of the 3 tiers (with diagrams)
- Complete Directory structure layout
- File-by-file and function-by-function reference section
- Step-by-step end-to-end data flow tracing
- Complete configuration and environment variables table
- Production deployment guide using EC2 & pm2
- Troubleshooting common setup errors (CORS, health checks, credentials)

Write this report in clear, formal, and simple technical words. Make it ready to be saved as a document.
```
