from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

# Verify presence of AWS credentials in environment
aws_key = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret = os.getenv("AWS_SECRET_ACCESS_KEY")

if not aws_key or not aws_secret:
    print("WARNING: AWS credentials are not set in the .env file.")
    print("Please populate AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env first.\n")

from adapters.aws_adapter import get_compute_instances, get_storage_buckets, get_cost_breakdown

print("==========================")
print("EC2 INSTANCES")
print("==========================")
try:
    instances = get_compute_instances()
    if not instances:
        print("No EC2 instances found in this account/region.")
    else:
        for idx, inst in enumerate(instances, 1):
            print(f"{idx}. Name: {inst['name']} | Status: {inst['status']} | Type: {inst['instance_type']} | Region: {inst['region']}")
except Exception as e:
    print(f"Error fetching EC2 instances: {e}")
    print("Please verify your AWS credentials and check if your IAM user has ec2:DescribeInstances permission.")

print("\n==========================")
print("S3 BUCKETS")
print("==========================")
try:
    buckets = get_storage_buckets()
    if not buckets:
        print("No S3 buckets found in this account.")
    else:
        for idx, bucket in enumerate(buckets, 1):
            print(f"{idx}. Name: {bucket['name']} | Public Access: {bucket['is_public']}")
except Exception as e:
    print(f"Error fetching S3 buckets: {e}")
    print("Please verify your AWS credentials and check if your IAM user has s3:ListAllMyBuckets permission.")

print("\n==========================")
print("COST BREAKDOWN")
print("==========================")
try:
    costs = get_cost_breakdown()
    print(f"Period: {costs['period']}")
    print(f"Total Cost: {costs['total_cost']} {costs['currency']}")
    print("By Service:")
    if not costs['by_service']:
        print("  No cost data found for this period.")
    else:
        for service_cost in costs['by_service']:
            print(f"  - {service_cost['service']}: ${service_cost['cost']}")
except Exception as e:
    print(f"Error fetching Cost Explorer breakdown: {e}")
    print("Note: Cost Explorer calls require ce:GetCostAndUsage permission. If you just created the account, Cost Explorer may not be enabled yet (enable it in AWS Billing Console).")
