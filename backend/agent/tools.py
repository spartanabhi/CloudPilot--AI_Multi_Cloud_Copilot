from langchain_core.tools import tool
from adapters.aws_adapter import get_compute_instances, get_storage_buckets, get_cost_breakdown

@tool
def list_compute_instances(provider: str) -> str:
    """
    Lists all virtual machine / compute instances for the given cloud provider.
    provider must be one of: "aws", "azure", "gcp"
    Returns instance name, status (running/stopped), and type.
    """
    if provider == "aws":
        instances = get_compute_instances()
    else:
        return f"Provider '{provider}' not yet implemented in this build."
    
    if not instances:
        return "No compute instances found in this account."
    return str(instances)

@tool
def list_storage_buckets(provider: str) -> str:
    """
    Lists storage buckets for the given cloud provider and flags any
    that are publicly accessible (a potential security risk).
    provider must be one of: "aws", "azure", "gcp"
    """
    if provider == "aws":
        buckets = get_storage_buckets()
    else:
        return f"Provider '{provider}' not yet implemented in this build."
    
    if not buckets:
        return "No storage buckets found."
    return str(buckets)

@tool
def get_cost_summary(provider: str, days: int = 30) -> str:
    """
    Returns a cost breakdown by service for the given cloud provider
    over the last N days (default 30).
    provider must be one of: "aws", "azure", "gcp"
    """
    if provider == "aws":
        cost_data = get_cost_breakdown(days)
    else:
        return f"Provider '{provider}' not yet implemented in this build."
    return str(cost_data)

ALL_TOOLS = [list_compute_instances, list_storage_buckets, get_cost_summary]
