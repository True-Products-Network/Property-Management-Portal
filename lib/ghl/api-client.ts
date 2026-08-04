// GHL API Client
// Handles all API calls to GoHighLevel

import { getGhlCredentials } from "./credentials";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

// Rate limiting
const RATE_LIMIT = 100; // requests per minute
let requestCount = 0;
let resetTime = Date.now() + 60000;

async function checkRateLimit() {
  const now = Date.now();
  if (now > resetTime) {
    requestCount = 0;
    resetTime = now + 60000;
  }
  
  if (requestCount >= RATE_LIMIT) {
    const waitTime = resetTime - now;
    console.log(`[GHL] Rate limit reached, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return checkRateLimit();
  }
  
  requestCount++;
}

async function getAuthHeaders() {
  const creds = await getGhlCredentials();
  if (!creds) {
    throw new Error("GHL not connected");
  }
  
  const token = creds.type === "oauth" ? creds.accessToken : creds.apiKey;
  
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Version": "2021-07-28",
  };
}

// Generic API call with error handling
async function ghlApiCall(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
) {
  await checkRateLimit();
  
  const headers = await getAuthHeaders();
  const url = `${GHL_API_BASE}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[GHL] API Error: ${response.status} ${errorText}`);
    throw new Error(`GHL API Error: ${response.status} - ${errorText}`);
  }
  
  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

// ============================================
// Contacts API
// ============================================

export interface GhlContact {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  customFields?: Array<{
    id?: string;
    key?: string;
    fieldKey?: string;
    value: string;
  }>;
  tags?: string[];
  source?: string;
  country?: string;
  dateOfBirth?: string;
}

export async function getContact(contactId: string): Promise<GhlContact> {
  return ghlApiCall(`/contacts/${contactId}`);
}

export async function createContact(contact: GhlContact): Promise<{ id: string }> {
  const result = await ghlApiCall("/contacts/", "POST", contact);
  return { id: result.id };
}

export async function updateContact(
  contactId: string,
  contact: Partial<GhlContact>
): Promise<GhlContact> {
  return ghlApiCall(`/contacts/${contactId}`, "PUT", contact);
}

export async function deleteContact(contactId: string): Promise<void> {
  return ghlApiCall(`/contacts/${contactId}`, "DELETE");
}

export async function searchContacts(query: string): Promise<{ contacts: GhlContact[] }> {
  return ghlApiCall(`/contacts/search?query=${encodeURIComponent(query)}`);
}

// ============================================
// Companies API (Associations)
// ============================================

export interface GhlCompany {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  customFields?: Array<{
    id?: string;
    key?: string;
    fieldKey?: string;
    value: string;
  }>;
}

export async function getCompany(companyId: string): Promise<GhlCompany> {
  return ghlApiCall(`/companies/${companyId}`);
}

export async function createCompany(company: GhlCompany): Promise<{ id: string }> {
  const result = await ghlApiCall("/companies/", "POST", company);
  return { id: result.id };
}

export async function updateCompany(
  companyId: string,
  company: Partial<GhlCompany>
): Promise<GhlCompany> {
  return ghlApiCall(`/companies/${companyId}`, "PUT", company);
}

export async function deleteCompany(companyId: string): Promise<void> {
  return ghlApiCall(`/companies/${companyId}`, "DELETE");
}

export async function searchCompanies(query: string): Promise<{ companies: GhlCompany[] }> {
  return ghlApiCall(`/companies/search?query=${encodeURIComponent(query)}`);
}

// ============================================
// Custom Objects API (Properties, Units, etc.)
// ============================================

export interface GhlCustomObject {
  id?: string;
  objectKey: string;
  properties: Record<string, unknown>;
}

export async function getCustomObject(
  objectKey: string,
  objectId: string
): Promise<GhlCustomObject> {
  return ghlApiCall(`/objects/${objectKey}/records/${objectId}`);
}

export async function createCustomObject(
  objectKey: string,
  data: Record<string, unknown>
): Promise<{ id: string }> {
  const result = await ghlApiCall(`/objects/${objectKey}/records`, "POST", { properties: data });
  return { id: result.id };
}

export async function updateCustomObject(
  objectKey: string,
  objectId: string,
  data: Record<string, unknown>
): Promise<GhlCustomObject> {
  return ghlApiCall(`/objects/${objectKey}/records/${objectId}`, "PUT", { properties: data });
}

export async function deleteCustomObject(objectKey: string, objectId: string): Promise<void> {
  return ghlApiCall(`/objects/${objectKey}/records/${objectId}`, "DELETE");
}

export async function searchCustomObjects(
  objectKey: string,
  filters?: Record<string, unknown>
): Promise<{ records: GhlCustomObject[] }> {
  const queryString = filters
    ? `?${new URLSearchParams(filters as Record<string, string>).toString()}`
    : "";
  return ghlApiCall(`/objects/${objectKey}/records${queryString}`);
}

// ============================================
// Location/Agency Info
// ============================================

export async function getLocation(): Promise<{
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}> {
  return ghlApiCall("/locations/me");
}

// ============================================
// Webhook Registration
// ============================================

export async function registerWebhook(
  eventType: string,
  webhookUrl: string
): Promise<{ id: string }> {
  return ghlApiCall("/webhooks", "POST", {
    eventType,
    webhookUrl,
  });
}

export async function listWebhooks(): Promise<{ webhooks: Array<{ id: string; eventType: string; webhookUrl: string }> }> {
  return ghlApiCall("/webhooks");
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  return ghlApiCall(`/webhooks/${webhookId}`, "DELETE");
}
