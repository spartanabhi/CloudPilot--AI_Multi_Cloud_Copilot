import os
import boto3
from datetime import datetime, timedelta

def _get_session():
    return boto3.Session(
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "ap-south-1")
    )

def get_compute_instances() -> list[dict]:
    """Returns all EC2 instances, normalized to the common shape."""
    session = _get_session()
    ec2 = session.client("ec2")
    response = ec2.describe_instances()
    instances = []
    for reservation in response["Reservations"]:
        for inst in reservation["Instances"]:
            name = "unnamed"
            for tag in inst.get("Tags", []):
                if tag["Key"] == "Name":
                    name = tag["Value"]
            raw_state = inst["State"]["Name"] # running, stopped, terminated, etc.
            status = "running" if raw_state == "running" else (
                "stopped" if raw_state == "stopped" else "other")
            instances.append({
                "name": name,
                "status": status,
                "instance_type": inst["InstanceType"],
                "region": os.getenv("AWS_REGION", "ap-south-1"),
                "provider": "aws"
            })
    return instances

def get_storage_buckets() -> list[dict]:
    """Returns S3 buckets with their public-access status."""
    session = _get_session()
    s3 = session.client("s3")
    response = s3.list_buckets()
    buckets = []
    for b in response["Buckets"]:
        bucket_name = b["Name"]
        is_public = False
        try:
            acl = s3.get_bucket_acl(Bucket=bucket_name)
            for grant in acl["Grants"]:
                grantee = grant.get("Grantee", {})
                if grantee.get("URI", "").endswith("AllUsers"):
                    is_public = True
        except Exception:
            pass # if we can't check, default to flagging as unknown, not silently safe
        buckets.append({
            "name": bucket_name,
            "is_public": is_public,
            "provider": "aws"
        })
    return buckets

def get_cost_breakdown(days: int = 30) -> dict:
    """Returns cost breakdown by service for the last N days using Cost Explorer."""
    session = _get_session()
    ce = session.client("ce")
    end = datetime.utcnow().date()
    start = end - timedelta(days=days)
    response = ce.get_cost_and_usage(
        TimePeriod={"Start": str(start), "End": str(end)},
        Granularity="MONTHLY",
        Metrics=["UnblendedCost"],
        GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}]
    )
    by_service = []
    total = 0.0
    for result in response["ResultsByTime"]:
        for group in result["Groups"]:
            service = group["Keys"][0]
            cost = float(group["Metrics"]["UnblendedCost"]["Amount"])
            if cost > 0:
                by_service.append({"service": service, "cost": round(cost, 2)})
                total += cost
    by_service.sort(key=lambda x: x["cost"], reverse=True)
    return {
        "total_cost": round(total, 2),
        "currency": "USD",
        "by_service": by_service,
        "period": f"last {days} days",
        "provider": "aws"
    }
