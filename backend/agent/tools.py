from langchain_core.tools import tool
from adapters import aws_adapter, azure_adapter, gcp_adapter

def _get_adapter(provider: str):
    provider_lower = provider.lower()
    if provider_lower == "aws":
        return aws_adapter
    elif provider_lower == "azure":
        return azure_adapter
    elif provider_lower == "gcp":
        return gcp_adapter
    else:
        raise ValueError(f"Unknown provider '{provider}'. Must be aws, azure, or gcp.")

def _handle_adapter_error(provider: str, action: str, e: Exception) -> str:
    err_msg = str(e)
    if provider.lower() == "gcp":
        err_lower = err_msg.lower()
        # Look for indicators of missing credentials, disabled APIs, or billing errors
        indicators = ["default credentials", "credentials were not found", "api_key", "disabled", "billing", "unauthorized", "permission"]
        if any(ind in err_lower for ind in indicators):
            return "GCP resources could not be queried because the required Google Cloud APIs are unavailable or billing is not enabled."
    return f"Error fetching {provider} {action}: {err_msg}"

@tool
def list_compute_instances(provider: str) -> str:
    """
    Lists all virtual machine / compute instances for the given cloud provider.
    provider must be one of: "aws", "azure", "gcp"
    Returns instance name, status (running/stopped), and type.
    """
    try:
        adapter = _get_adapter(provider)
        instances = adapter.get_compute_instances()
    except ValueError as ve:
        return str(ve)
    except Exception as e:
        return _handle_adapter_error(provider, "instances", e)
        
    if not instances:
        return f"No compute instances found in this {provider} account."
    return str(instances)

@tool
def list_storage_buckets(provider: str) -> str:
    """
    Lists storage buckets for the given cloud provider and flags any
    that are publicly accessible (a potential security risk).
    provider must be one of: "aws", "azure", "gcp"
    """
    try:
        adapter = _get_adapter(provider)
        buckets = adapter.get_storage_buckets()
    except ValueError as ve:
        return str(ve)
    except Exception as e:
        return _handle_adapter_error(provider, "storage", e)
        
    if not buckets:
        return f"No storage buckets found in this {provider} account."
    return str(buckets)

@tool
def get_cost_summary(provider: str, days: int = 30) -> str:
    """
    Returns a cost breakdown by service for the given cloud provider
    over the last N days (default 30).
    provider must be one of: "aws", "azure", "gcp"
    """
    try:
        adapter = _get_adapter(provider)
        cost_data = adapter.get_cost_breakdown(days)
    except ValueError as ve:
        return str(ve)
    except Exception as e:
        return _handle_adapter_error(provider, "cost data", e)
        
    return str(cost_data)

ALL_TOOLS = [list_compute_instances, list_storage_buckets, get_cost_summary]
