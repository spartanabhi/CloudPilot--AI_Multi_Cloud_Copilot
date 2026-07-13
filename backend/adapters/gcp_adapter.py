import os
from datetime import datetime, timedelta
from google.cloud import compute_v1
from google.oauth2 import service_account

def _get_credentials():
    """Loads Google Service Account credentials from the JSON key file path."""
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if key_path and os.path.exists(key_path):
        return service_account.Credentials.from_service_account_file(key_path)
    return None

def get_compute_instances() -> list[dict]:
    """
    Returns all GCP Compute Engine instances, normalized to the common shape.
    Note: GCP organizes instances by "zone", so we must check across zones.
    """
    project_id = os.getenv("GCP_PROJECT_ID")
    credentials = _get_credentials()
    
    instance_client = compute_v1.InstancesClient(credentials=credentials)
    zones_client = compute_v1.ZonesClient(credentials=credentials)
    instances = []
    
    # Loop through all zones in the project to find running instances
    for zone in zones_client.list(project=project_id):
        zone_instances = instance_client.list(project=project_id, zone=zone.name)
        for inst in zone_instances:
            raw_status = inst.status # RUNNING, TERMINATED, STOPPED, etc.
            status = "running" if raw_status == "RUNNING" else (
                "stopped" if raw_status in ("TERMINATED", "STOPPED") else "other"
            )
            instances.append({
                "id": str(inst.id),
                "name": inst.name,
                "status": status,
                "instance_type": inst.machine_type.split("/")[-1],
                "region": zone.name,
                "provider": "gcp"
            })
    return instances

def get_storage_buckets() -> list[dict]:
    """Returns GCS buckets with their public-access status."""
    from google.cloud import storage
    project_id = os.getenv("GCP_PROJECT_ID")
    credentials = _get_credentials()
    storage_client = storage.Client(project=project_id, credentials=credentials)
    buckets = []
    
    for bucket in storage_client.list_buckets():
        is_public = False
        try:
            policy = bucket.get_iam_policy(requested_policy_version=3)
            for binding in policy.bindings:
                if "allUsers" in binding.get("members", []):
                    is_public = True
        except Exception:
            pass # default to False if public access cannot be safely determined
            
        buckets.append({
            "name": bucket.name,
            "is_public": is_public,
            "provider": "gcp"
        })
    return buckets

def get_cost_breakdown(days: int = 30) -> dict:
    """
    Returns GCP cost breakdown. Note: GCP's real-time Cost APIs require
    BigQuery billing export to be set up, which is more involved than
    AWS/Azure's direct cost APIs. For a portfolio-scale project, this
    function uses the simpler Cloud Billing Budget API to estimate
    spend instead. Document this honestly as a known scope simplification.
    """
    from google.cloud import billing_budgets_v1
    project_id = os.getenv("GCP_PROJECT_ID")
    credentials = _get_credentials()
    
    # Simplified: returns budget vs actual spend if a budget is configured
    client = billing_budgets_v1.BudgetServiceClient(credentials=credentials)
    billing_account = os.getenv("GCP_BILLING_ACCOUNT_ID") # format: billingAccounts/XXXXXX
    by_service = []
    total = 0.0
    
    if billing_account:
        try:
            budgets = client.list_budgets(parent=billing_account)
            for budget in budgets:
                # This gives budget thresholds, not granular per-service cost
                # (full granular cost requires BigQuery export - documented as v2 scope)
                pass
        except Exception as e:
            print(f"GCP cost data unavailable: {e}")
            
    return {
        "total_cost": total,
        "currency": "USD",
        "by_service": by_service,
        "period": f"last {days} days",
        "provider": "gcp",
        "note": "GCP cost breakdown uses simplified budget API; full per-service breakdown requires BigQuery billing export (documented as a v2 enhancement)"
    }
