from dotenv import load_dotenv
import os
import sys

# Load env variables
load_dotenv()

# Verify presence of Azure credentials in environment
azure_client = os.getenv("AZURE_CLIENT_ID")
azure_secret = os.getenv("AZURE_CLIENT_SECRET")
azure_tenant = os.getenv("AZURE_TENANT_ID")
azure_sub = os.getenv("AZURE_SUBSCRIPTION_ID")

if not all([azure_client, azure_secret, azure_tenant, azure_sub]):
    print("WARNING: One or more Azure credentials are not set in the .env file.")
    print("Please populate AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID, and AZURE_SUBSCRIPTION_ID in backend/.env first.\n")

from adapters.azure_adapter import get_compute_instances, get_storage_buckets, get_cost_breakdown

print("==========================")
print("AZURE VIRTUAL MACHINES")
print("==========================")
try:
    instances = get_compute_instances()
    if not instances:
        print("No Azure VMs found in this subscription.")
    else:
        for idx, inst in enumerate(instances, 1):
            print(f"{idx}. Name: {inst['name']} | Status: {inst['status']} | Size: {inst['instance_type']} | Region: {inst['region']}")
except Exception as e:
    print(f"Error fetching Azure VMs: {e}")
    print("Please check your client credentials and verify the Service Principal has Reader role on the subscription.")

print("\n==========================")
print("AZURE STORAGE ACCOUNTS")
print("==========================")
try:
    buckets = get_storage_buckets()
    if not buckets:
        print("No Azure Storage Accounts found in this subscription.")
    else:
        for idx, bucket in enumerate(buckets, 1):
            print(f"{idx}. Name: {bucket['name']} | Public Access Allowed: {bucket['is_public']}")
except Exception as e:
    print(f"Error fetching Azure Storage Accounts: {e}")
    print("Please check your client credentials and verify the Service Principal has Reader role on the subscription.")

print("\n==========================")
print("AZURE COST BREAKDOWN")
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
    print(f"Error fetching Azure Cost Breakdown: {e}")
    print("Please check if the Service Principal has Cost Management Reader or Billing permissions on the subscription.")
