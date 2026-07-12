"""
This file defines the SHAPE every cloud adapter must return.
It's not strict Python typing enforcement — just a clear contract
so AWS, Azure, and GCP adapters all hand back data that looks identical
to the agent above them.

Expected shape for compute instances:
{
    "name": str,
    "status": str, # normalized to: "running", "stopped", "other"
    "instance_type": str,
    "region": str,
    "provider": str # "aws", "azure", or "gcp"
}

Expected shape for cost data:
{
    "total_cost": float,
    "currency": str,
    "by_service": [
        {
            "service": str,
            "cost": float
        }
    ],
    "period": str, # e.g. "last 30 days"
    "provider": str
}

Expected shape for storage buckets:
{
    "name": str,
    "is_public": bool,
    "provider": str
}
"""
