from dotenv import load_dotenv
import os
import sys

# Load env variables
load_dotenv()

# Verify presence of GCP credentials in environment
gcp_project = os.getenv("GCP_PROJECT_ID")
gcp_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if not gcp_project or not gcp_creds:
    print("WARNING: GCP credentials are not set in the .env file.")
    print("Please populate GCP_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS in backend/.env first.\n")

import sys
from google.cloud.billing import budgets_v1
import google.cloud
google.cloud.billing_budgets_v1 = budgets_v1
sys.modules['google.cloud.billing_budgets_v1'] = budgets_v1

from adapters.gcp_adapter import get_compute_instances, get_storage_buckets, get_cost_breakdown

print("==========================")
print("GCP COMPUTE INSTANCES")
print("==========================")
try:
    instances = get_compute_instances()
    if not instances:
        print("No GCP Compute instances found in this project.")
    else:
        for idx, inst in enumerate(instances, 1):
            print(f"{idx}. Name: {inst['name']} | Status: {inst['status']} | Machine Type: {inst['instance_type']} | Zone: {inst['region']}")
except Exception as e:
    print(f"Error fetching GCP instances: {e}")
    print("Please check your service account key file, and verify it has compute.viewer role on the project.")

print("\n==========================")
print("GCP STORAGE BUCKETS")
print("==========================")
try:
    buckets = get_storage_buckets()
    if not buckets:
        print("No GCP Storage buckets found in this project.")
    else:
        for idx, bucket in enumerate(buckets, 1):
            print(f"{idx}. Name: {bucket['name']} | Public Access: {bucket['is_public']}")
except Exception as e:
    print(f"Error fetching GCP storage buckets: {e}")
    print("Please check your service account key file, and verify it has storage.objectViewer role on the project.")

print("\n==========================")
print("GCP COST BREAKDOWN")
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
    if "note" in costs:
        print(f"Note: {costs['note']}")
except Exception as e:
    print(f"Error fetching GCP cost breakdown: {e}")
    print("Please verify the Service Account has Billing Account Viewer or billing.viewer role.")
