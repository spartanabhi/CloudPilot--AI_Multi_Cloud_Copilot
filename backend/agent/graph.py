import os
import json
import re
from langgraph.prebuilt import create_react_agent
from agent.tools import ALL_TOOLS
from agent.prompts import SYSTEM_PROMPT
from llm.provider import get_llm

def build_agent():
    """
    Builds a LangGraph agent using the prebuilt ReAct pattern.
    
    This gives us the full "reason, call a tool, observe result,
    repeat until done" loop without writing the graph by hand.
    """
    llm = get_llm()
    agent = create_react_agent(llm, ALL_TOOLS, messages_modifier=SYSTEM_PROMPT)
    return agent

def format_cloud_context(context: dict) -> str:
    """
    Validates and formats the cloud context dictionary into a structured natural language block.
    
    Args:
        context: The context dictionary from the client.
        
    Returns:
        A structured string ready to be prepended to the user query, or empty string.
    """
    if not context or not isinstance(context, dict):
        return ""
        
    provider = context.get("provider", "unknown").upper()
    service = context.get("service", "unknown")
    page_type = context.get("pageType", "unknown")
    
    # Map service name to reader-friendly name
    service_map = {
        "ec2": "EC2", "s3": "S3", "iam": "IAM", "lambda": "Lambda", "rds": "RDS", "vpc": "VPC",
        "cloudwatch": "CloudWatch", "cloudformation": "CloudFormation", "ecs": "ECS", "eks": "EKS",
        "virtualMachines": "Virtual Machines", "storageAccounts": "Storage Accounts",
        "resourceGroups": "Resource Groups", "virtualNetwork": "Virtual Network",
        "functions": "Functions", "appServices": "App Services",
        "computeEngine": "Compute Engine", "cloudStorage": "Cloud Storage",
        "cloudFunctions": "Cloud Functions", "cloudRun": "Cloud Run"
    }
    service_display = service_map.get(service, service.title() if service else "Unknown")
    
    # Map page type to reader-friendly name
    page_map = {
        "list": "List View",
        "detail": "Detail View",
        "bucket": "Bucket View",
        "dashboard": "Dashboard"
    }
    page_display = page_map.get(page_type, page_type.title() if page_type else "Unknown")
    
    lines = [
        "==========================================================\n\n",
        "CURRENT CLOUD CONTEXT\n\n",
        f"Provider:\n{provider}\n\n",
        f"Service:\n{service_display}\n\n",
        f"Page Type:\n{page_display}\n\n"
    ]
    
    resource = context.get("resource")
    if resource and isinstance(resource, dict):
        lines.append("Current Resource\n\n")
        
        # Output properties dynamically with nice names
        for key, val in resource.items():
            if val and key != "resourceType":
                # Convert camelCase / snake_case to Title Case
                if key == "id":
                    if service == "ec2":
                        key_display = "Instance ID"
                    elif service in ("s3", "cloudStorage"):
                        key_display = "Bucket Name"
                    else:
                        key_display = "Resource ID"
                elif key == "subscriptionId":
                    key_display = "Subscription ID"
                elif key == "resourceGroup":
                    key_display = "Resource Group"
                elif key == "projectId":
                    key_display = "Project ID"
                elif key == "vmName":
                    key_display = "VM Name"
                elif key == "storageAccount":
                    key_display = "Storage Account"
                else:
                    key_display = re.sub(r'(?<!^)(?=[A-Z])', ' ', key).title().replace("_", " ")
                    
                lines.append(f"{key_display}:\n{val}\n\n")
        
        # Always output Resource Type if specified
        res_type = resource.get("resourceType")
        if res_type:
            lines.append(f"Resource Type:\n{res_type.replace('_', ' ').title() if hasattr(res_type, 'title') else str(res_type)}\n\n")
            
    lines.append("==========================================================\n\n")
    return "".join(lines)

def ask_agent(question: str, context: dict = None) -> str:
    """
    Runs a single question through the agent and returns the final answer.
    
    Args:
        question: The user query string.
        context: Optional dictionary containing active tab/resource metadata.
        
    Returns:
        The text content of the agent's final message response.
    """
    # Local development JSON debug logging
    if context:
        print("\n==========================================================")
        print("Cloud Context")
        print("==========================================================\n")
        print(json.dumps(context, indent=2))
        print("\n==========================================================\n")

    # Combine context and question
    formatted_prompt = ""
    if context:
        context_str = format_cloud_context(context)
        if context_str:
            formatted_prompt = (
                f"{context_str}"
                "USER REQUEST\n\n"
                f"{question}\n\n"
                "=========================================================="
            )
        else:
            formatted_prompt = question
    else:
        formatted_prompt = question

    agent = build_agent()
    result = agent.invoke({"messages": [("user", formatted_prompt)]})
    final_message = result["messages"][-1]
    return final_message.content
