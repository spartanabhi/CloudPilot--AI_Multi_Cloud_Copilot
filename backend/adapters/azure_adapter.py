import os
from azure.identity import DefaultAzureCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.costmanagement import CostManagementClient

def _get_credential():
    """Returns a DefaultAzureCredential instance for authentication."""
    return DefaultAzureCredential()

def get_compute_instances() -> list[dict]:
    """Returns all Azure Virtual Machines, normalized to the common shape."""
    credential = _get_credential()
    subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
    compute_client = ComputeManagementClient(credential, subscription_id)
    instances = []
    
    # list_all lists all VMs in the subscription
    for vm in compute_client.virtual_machines.list_all():
        # Extract resource group from the full Azure resource ID
        # Format: /subscriptions/.../resourceGroups/{resource_group_name}/...
        resource_group = vm.id.split("/")[4]
        
        # Get live status of the VM
        instance_view = compute_client.virtual_machines.instance_view(
            resource_group, vm.name
        )
        
        power_state = "other"
        for status in instance_view.statuses:
            if status.code.startswith("PowerState/"):
                state = status.code.split("/")[-1] # "running", "deallocated", etc.
                power_state = "running" if state == "running" else "stopped"
                
        instances.append({
            "id": vm.id,
            "name": vm.name,
            "status": power_state,
            "instance_type": vm.hardware_profile.vm_size,
            "region": vm.location,
            "provider": "azure"
        })
    return instances

def get_storage_buckets() -> list[dict]:
    """Returns Azure Storage Accounts normalized as storage buckets."""
    from azure.mgmt.storage import StorageManagementClient
    credential = _get_credential()
    subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
    storage_client = StorageManagementClient(credential, subscription_id)
    buckets = []
    
    for account in storage_client.storage_accounts.list():
        is_public = account.allow_blob_public_access is True
        buckets.append({
            "name": account.name,
            "is_public": is_public,
            "provider": "azure"
        })
    return buckets

def get_cost_breakdown(days: int = 30) -> dict:
    """Returns Azure cost breakdown by service for the last N days."""
    from datetime import datetime, timedelta
    credential = _get_credential()
    subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
    cost_client = CostManagementClient(credential)
    scope = f"/subscriptions/{subscription_id}"
    
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    
    query = {
        "type": "ActualCost",
        "timeframe": "Custom",
        "time_period": {"from_property": start, "to_property": end, "to": end},
        "dataset": {
            "granularity": "None",
            "aggregation": {"totalCost": {"name": "Cost", "function": "Sum"}},
            "grouping": [{"type": "Dimension", "name": "ServiceName"}]
        }
    }
    
    result = cost_client.query.usage(scope, query)
    by_service = []
    total = 0.0
    
    for row in result.rows:
        cost = float(row[0])
        service = row[1]
        if cost > 0:
            by_service.append({"service": service, "cost": round(cost, 2)})
            total += cost
            
    by_service.sort(key=lambda x: x["cost"], reverse=True)
    return {
        "total_cost": round(total, 2),
        "currency": "USD",
        "by_service": by_service,
        "period": f"last {days} days",
        "provider": "azure"
    }
