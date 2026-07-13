/**
 * Parses AWS console URL paths and hashes to detect specific services and page types.
 */
function detectAwsContext(urlObj) {
    const path = urlObj.pathname;
    const hash = urlObj.hash;
    
    let service = "unknown";
    let pageType = "unknown";
    
    if (path.includes("/ec2/")) {
        service = "ec2";
        if (hash.includes("Instances:")) {
            pageType = "list";
        } else if (hash.includes("InstanceDetails:")) {
            pageType = "detail";
        } else if (hash.includes("Home:")) {
            pageType = "dashboard";
        } else {
            pageType = "list"; // default fallback for EC2 sub-views
        }
    } else if (path.includes("/s3/")) {
        service = "s3";
        if (path.includes("/buckets/") || path.includes("/bucket/")) {
            pageType = "bucket";
        } else if (path.includes("/buckets")) {
            pageType = "list";
        } else {
            pageType = "dashboard";
        }
    } else if (path.includes("/iam/") || path.includes("/iamv2/")) {
        service = "iam";
        if (path.includes("/users") || hash.includes("/users") || path.includes("/roles") || hash.includes("/roles")) {
            pageType = "list";
        } else {
            pageType = "dashboard";
        }
    } else if (path.includes("/lambda/")) {
        service = "lambda";
        if (path.includes("/functions/")) {
            pageType = "detail";
        } else if (path.includes("/functions")) {
            pageType = "list";
        } else {
            pageType = "dashboard";
        }
    } else if (path.includes("/rds/")) {
        service = "rds";
        if (path.includes("/database/")) {
            pageType = "detail";
        } else if (path.includes("/databases")) {
            pageType = "list";
        } else {
            pageType = "dashboard";
        }
    } else if (path.includes("/vpc/")) {
        service = "vpc";
        if (hash.includes("vpcs:") || hash.includes("subnets:") || hash.includes("RouteTables:")) {
            pageType = "list";
        } else {
            pageType = "dashboard";
        }
    } else if (path.includes("/cloudwatch/")) {
        service = "cloudwatch";
        pageType = "dashboard";
    } else if (path.includes("/cloudformation/")) {
        service = "cloudformation";
        if (path.includes("/stacks/")) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    } else if (path.includes("/ecs/")) {
        service = "ecs";
        if (path.includes("/clusters/")) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    } else if (path.includes("/eks/")) {
        service = "eks";
        if (path.includes("/clusters/")) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    }
    
    return { service, pageType };
}

/**
 * Extracts resource metadata for detected AWS services.
 */
function extractAwsResources(urlObj, service, pageType) {
    const path = urlObj.pathname;
    const hash = urlObj.hash;
    
    const getParam = (name) => {
        const searchParams = new URLSearchParams(urlObj.search);
        if (searchParams.has(name)) return searchParams.get(name);
        
        const hashParts = hash.split("?");
        if (hashParts[1]) {
            const hashParams = new URLSearchParams(hashParts[1]);
            if (hashParams.has(name)) return hashParams.get(name);
        }
        return null;
    };
    
    const region = getParam("region") || urlObj.hostname.split(".")[0] || "unknown";
    
    if (service === "ec2" && pageType === "detail") {
        const idMatch = hash.match(/instanceId=([^&?#]+)/);
        return {
            id: idMatch ? idMatch[1] : null,
            region: region,
            resourceType: "instance"
        };
    }
    
    if (service === "s3" && pageType === "bucket") {
        const bucketMatch = path.match(/\/buckets\/([^/?#]+)/) || path.match(/\/bucket\/([^/?#]+)/);
        return {
            id: bucketMatch ? bucketMatch[1] : null,
            region: region, // S3 is global but console views can have region parameter
            resourceType: "bucket"
        };
    }
    
    if (service === "iam") {
        const userMatch = hash.match(/\/users\/([^/?#]+)/) || path.match(/\/users\/([^/?#]+)/);
        if (userMatch) {
            return {
                id: userMatch[1],
                userName: userMatch[1],
                resourceType: "user"
            };
        }
        const roleMatch = hash.match(/\/roles\/([^/?#]+)/) || path.match(/\/roles\/([^/?#]+)/);
        if (roleMatch) {
            return {
                id: roleMatch[1],
                roleName: roleMatch[1],
                resourceType: "role"
            };
        }
    }
    
    if (service === "lambda" && pageType === "detail") {
        const funcMatch = hash.match(/\/functions\/([^/?#]+)/) || path.match(/\/functions\/([^/?#]+)/);
        return {
            id: funcMatch ? funcMatch[1] : null,
            region: region,
            resourceType: "function"
        };
    }
    
    if (service === "rds" && pageType === "detail") {
        const dbMatch = hash.match(/database:id=([^&?#]+)/) || hash.match(/databaseId=([^&?#]+)/);
        return {
            id: dbMatch ? dbMatch[1] : null,
            region: region,
            resourceType: "database"
        };
    }
    
    return null;
}

/**
 * Parses Azure Portal URLs (using decoded hash & pathname) to detect services and page types.
 */
function detectAzureContext(urlObj) {
    const fullPath = urlObj.pathname + urlObj.hash;
    const decodedPath = decodeURIComponent(fullPath);
    
    let service = "unknown";
    let pageType = "unknown";
    
    if (decodedPath.includes("Microsoft.Compute/virtualMachines") || decodedPath.includes("Microsoft.Compute/virtualmachines")) {
        service = "virtualMachines";
        if (decodedPath.match(/\/providers\/Microsoft\.Compute\/virtualMachines\/[^\/]+/i)) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    } else if (decodedPath.includes("Microsoft.Storage/storageAccounts")) {
        service = "storageAccounts";
        if (decodedPath.match(/\/providers\/Microsoft\.Storage\/storageAccounts\/[^\/]+/i)) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    } else if (decodedPath.includes("Microsoft.Network/virtualNetworks")) {
        service = "virtualNetwork";
        if (decodedPath.match(/\/providers\/Microsoft\.Network\/virtualNetworks\/[^\/]+/i)) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    } else if (decodedPath.includes("/resourceGroups") || decodedPath.includes("/resourcegroups")) {
        const rgMatch = decodedPath.match(/\/resourceGroups\/([^\/]+)/i);
        if (rgMatch) {
            if (decodedPath.includes("/providers/")) {
                pageType = "detail";
            } else {
                service = "resourceGroups";
                pageType = "detail";
            }
        } else {
            service = "resourceGroups";
            pageType = "list";
        }
    } else if (decodedPath.includes("Microsoft.Web/sites")) {
        if (decodedPath.toLowerCase().includes("functionapp")) {
            service = "functions";
        } else {
            service = "appServices";
        }
        if (decodedPath.match(/\/providers\/Microsoft\.Web\/sites\/[^\/]+/i)) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    }
    
    return { service, pageType };
}

/**
 * Extracts resource metadata for detected Azure services.
 */
function extractAzureResources(urlObj, service, pageType) {
    const fullPath = urlObj.pathname + urlObj.hash;
    const decodedPath = decodeURIComponent(fullPath);
    
    const pattern = /\/subscriptions\/([^\/]+)\/resourceGroups\/([^\/]+)(?:\/providers\/([^\/]+)\/([^\/]+)\/([^\/]+))?/i;
    const match = decodedPath.match(pattern);
    
    if (match) {
        const res = {
            subscriptionId: match[1],
            resourceGroup: match[2]
        };
        
        if (match[5]) {
            res.id = match[5];
            res.resourceType = service;
            
            if (service === "virtualMachines") {
                res.vmName = match[5];
            } else if (service === "storageAccounts") {
                res.storageAccount = match[5];
            }
        }
        return res;
    }
    
    const rgOnlyPattern = /\/resourceGroups\/([^\/]+)/i;
    const rgMatch = decodedPath.match(rgOnlyPattern);
    if (rgMatch) {
        return {
            resourceGroup: rgMatch[1],
            resourceType: "resourceGroup"
        };
    }
    
    return null;
}

/**
 * Parses GCP console URL pathnames to detect specific services and page types.
 */
function detectGcpContext(urlObj) {
    const path = urlObj.pathname;
    
    let service = "unknown";
    let pageType = "unknown";
    
    if (path.includes("/compute/")) {
        service = "computeEngine";
        if (path.includes("/instancesDetail")) {
            pageType = "detail";
        } else if (path.includes("/instances")) {
            pageType = "list";
        } else {
            pageType = "dashboard";
        }
    } else if (path.includes("/storage/")) {
        service = "cloudStorage";
        const parts = path.split("/storage/browser");
        if (parts[1] && parts[1].replace(/^\//, "") !== "") {
            pageType = "bucket";
        } else {
            pageType = "list";
        }
    } else if (path.includes("/functions/")) {
        service = "cloudFunctions";
        if (path.includes("/details")) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    } else if (path.includes("/networking/")) {
        service = "vpc";
        pageType = "list";
    } else if (path.includes("/run")) {
        service = "cloudRun";
        if (path.includes("/detail")) {
            pageType = "detail";
        } else {
            pageType = "list";
        }
    }
    
    return { service, pageType };
}

/**
 * Extracts resource metadata for detected GCP services.
 */
function extractGcpResources(urlObj, service, pageType) {
    const path = urlObj.pathname;
    const searchParams = new URLSearchParams(urlObj.search);
    const projectId = searchParams.get("project");
    
    if (service === "computeEngine" && pageType === "detail") {
        const match = path.match(/\/instancesDetail\/zones\/([^\/]+)\/instances\/([^\/]+)/);
        if (match) {
            return {
                projectId: projectId,
                zone: match[1],
                id: match[2],
                instance: match[2],
                resourceType: "computeEngine"
            };
        }
    }
    
    if (service === "cloudStorage" && pageType === "bucket") {
        const match = path.match(/\/storage\/browser\/([^\/?#]+)/);
        if (match) {
            return {
                projectId: projectId,
                id: match[1],
                bucket: match[1],
                resourceType: "bucket"
            };
        }
    }
    
    if (service === "cloudFunctions" && pageType === "detail") {
        const match = path.match(/\/functions\/details\/([^\/]+)\/([^\/]+)/);
        if (match) {
            return {
                projectId: projectId,
                zone: match[1],
                id: match[2],
                resourceType: "function"
            };
        }
    }
    
    if (projectId) {
        return {
            projectId: projectId
        };
    }
    
    return null;
}

/**
 * Main detection coordinator. Takes a URL and extracts a full cloud context object.
 */
function detectContext(url) {
    const defaultContext = {
        provider: "unknown",
        service: "unknown",
        pageType: "unknown",
        resource: null
    };
    
    if (!url) return defaultContext;
    
    try {
        const urlObj = new URL(url);
        const host = urlObj.hostname;
        
        if (host.includes("console.aws.amazon.com")) {
            const { service, pageType } = detectAwsContext(urlObj);
            const resource = extractAwsResources(urlObj, service, pageType);
            return { provider: "aws", service, pageType, resource };
        }
        
        if (host.includes("portal.azure.com")) {
            const { service, pageType } = detectAzureContext(urlObj);
            const resource = extractAzureResources(urlObj, service, pageType);
            return { provider: "azure", service, pageType, resource };
        }
        
        if (host.includes("console.cloud.google.com")) {
            const { service, pageType } = detectGcpContext(urlObj);
            const resource = extractGcpResources(urlObj, service, pageType);
            return { provider: "gcp", service, pageType, resource };
        }
    } catch (e) {
        // Safe fallback using simple substring checks
        if (url.includes("console.aws.amazon.com")) {
            return { provider: "aws", service: "unknown", pageType: "unknown", resource: null };
        }
        if (url.includes("portal.azure.com")) {
            return { provider: "azure", service: "unknown", pageType: "unknown", resource: null };
        }
        if (url.includes("console.cloud.google.com")) {
            return { provider: "gcp", service: "unknown", pageType: "unknown", resource: null };
        }
    }
    
    return defaultContext;
}

/**
 * Legacy provider detection function (maintained for backward compatibility).
 */
function detectProvider(url) {
    return detectContext(url).provider;
}

// Global state variables
let currentProvider = "unknown";
let currentContext = {
    provider: "unknown",
    service: "unknown",
    pageType: "unknown",
    resource: null
};

/**
 * Updates context in memory and in local chrome storage.
 */
function updateProvider(url) {
    currentContext = detectContext(url);
    currentProvider = currentContext.provider;
    chrome.storage.local.set({ 
        currentProvider: currentProvider,
        currentContext: currentContext
    });
}

// Tab State Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        updateProvider(tab.url);
    } catch (e) {
        updateProvider(null);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        updateProvider(changeInfo.url);
    }
});

// Runtime Messaging Router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.action === "getProvider") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let context = { provider: "unknown", service: "unknown", pageType: "unknown", resource: null };
            if (tabs && tabs[0] && tabs[0].url) {
                context = detectContext(tabs[0].url);
            }
            currentContext = context;
            currentProvider = context.provider;
            
            chrome.storage.local.set({ 
                currentProvider: currentProvider,
                currentContext: currentContext 
            }, () => {
                sendResponse(currentContext); // Return the structured context object
            });
        });
        return true; // Keep response channel open for async callback
    }
});

// Configure Side Panel behavior on extension installation
chrome.runtime.onInstalled.addListener(() => {
    try {
        if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
            chrome.sidePanel.setPanelBehavior({
                openPanelOnActionClick: true
            });
        }
    } catch (e) {
        console.error("Error setting side panel behavior on install:", e);
    }
});
