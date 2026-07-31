import { delay } from "@/lib/utils";

// Mock GHL Adapter for development and testing
// This simulates GHL responses without making actual API calls

export interface MockContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  portalAccessStatus: "active" | "inactive" | "pending";
  associationIds: string[];
  propertyIds: string[];
  unitIds: string[];
}

export interface MockAssociation {
  id: string;
  name: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyCount: number;
  unitCount: number;
}

export interface MockProperty {
  id: string;
  associationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unitCount: number;
}

export interface MockUnit {
  id: string;
  propertyId: string;
  associationId: string;
  unitNumber: string;
  status: "occupied" | "vacant" | "maintenance";
  ownerIds: string[];
}

export interface MockMaintenanceRequest {
  id: string;
  requestNumber: string;
  propertyId: string;
  unitId?: string;
  associationId: string;
  reportedById: string;
  assignedVendorId?: string;
  assignedStaffId?: string;
  title: string;
  description: string;
  urgency: "low" | "medium" | "high" | "emergency";
  status: string;
  category: string;
  reportedDate: string;
  scheduledDate?: string;
  completionDate?: string;
}

// TEST Fixtures as specified in build specification Section 32
const TEST_ASSOCIATIONS: MockAssociation[] = [
  {
    id: "TEST-ASSOC-RIDGELAND",
    name: "Ridgeland Condominium Association",
    legalName: "Ridgeland Condominium Association",
    address: "6722 S Ridgeland Ave",
    city: "Chicago",
    state: "IL",
    zip: "60649",
    propertyCount: 1,
    unitCount: 12,
  },
];

const TEST_PROPERTIES: MockProperty[] = [
  {
    id: "TEST-PROP-RIDGELAND",
    associationId: "TEST-ASSOC-RIDGELAND",
    name: "6722 S Ridgeland",
    address: "6722 S Ridgeland Ave",
    city: "Chicago",
    state: "IL",
    zip: "60649",
    unitCount: 12,
  },
];

const TEST_UNITS: MockUnit[] = [
  {
    id: "TEST-UNIT-3S",
    propertyId: "TEST-PROP-RIDGELAND",
    associationId: "TEST-ASSOC-RIDGELAND",
    unitNumber: "3S",
    status: "occupied",
    ownerIds: ["TEST-CONTACT-MARY"],
  },
];

const TEST_CONTACTS: MockContact[] = [
  {
    id: "TEST-CONTACT-MARY",
    firstName: "Mary",
    lastName: "Jones",
    email: "mary.jones.test@example.com",
    roles: ["Owner"],
    portalAccessStatus: "active",
    associationIds: ["TEST-ASSOC-RIDGELAND"],
    propertyIds: ["TEST-PROP-RIDGELAND"],
    unitIds: ["TEST-UNIT-3S"],
  },
  {
    id: "TEST-CONTACT-ALEX",
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan.test@example.com",
    roles: ["Admin User"],
    portalAccessStatus: "active",
    associationIds: ["TEST-ASSOC-RIDGELAND"],
    propertyIds: [],
    unitIds: [],
  },
  {
    id: "TEST-CONTACT-JORDAN",
    firstName: "Jordan",
    lastName: "Lee",
    email: "jordan.lee.test@example.com",
    roles: ["Owner", "Board Member"],
    portalAccessStatus: "active",
    associationIds: ["TEST-ASSOC-RIDGELAND"],
    propertyIds: ["TEST-PROP-RIDGELAND"],
    unitIds: ["TEST-UNIT-3S"],
  },
  {
    id: "TEST-VENDOR-ABC",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@abcplumbing.test",
    roles: ["Vendor Contact"],
    portalAccessStatus: "active",
    associationIds: ["TEST-ASSOC-RIDGELAND"],
    propertyIds: [],
    unitIds: [],
  },
];

const TEST_MAINTENANCE_REQUESTS: MockMaintenanceRequest[] = [
  {
    id: "TEST-MNT-001",
    requestNumber: "MNT-2026-0047",
    propertyId: "TEST-PROP-RIDGELAND",
    unitId: "TEST-UNIT-3S",
    associationId: "TEST-ASSOC-RIDGELAND",
    reportedById: "TEST-CONTACT-MARY",
    assignedVendorId: "TEST-VENDOR-ABC",
    title: "Water leak under kitchen sink",
    description: "There is a water leak under the kitchen sink that needs immediate attention.",
    urgency: "high",
    status: "Vendor Assigned",
    category: "Plumbing",
    reportedDate: "2026-07-28T10:00:00Z",
    scheduledDate: "2026-07-31T14:00:00Z",
  },
];

export class MockGhlAdapter {
  private delayMs: number;

  constructor(delayMs: number = 500) {
    this.delayMs = delayMs;
  }

  private async simulateDelay(): Promise<void> {
    await delay(this.delayMs);
  }

  // Contact operations
  async getContact(id: string): Promise<MockContact | null> {
    await this.simulateDelay();
    return TEST_CONTACTS.find((c) => c.id === id) || null;
  }

  async getContactByEmail(email: string): Promise<MockContact | null> {
    await this.simulateDelay();
    return TEST_CONTACTS.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getContactsByAssociation(associationId: string): Promise<MockContact[]> {
    await this.simulateDelay();
    return TEST_CONTACTS.filter((c) => c.associationIds.includes(associationId));
  }

  // Association operations
  async getAssociation(id: string): Promise<MockAssociation | null> {
    await this.simulateDelay();
    return TEST_ASSOCIATIONS.find((a) => a.id === id) || null;
  }

  async getAllAssociations(): Promise<MockAssociation[]> {
    await this.simulateDelay();
    return TEST_ASSOCIATIONS;
  }

  // Property operations
  async getProperty(id: string): Promise<MockProperty | null> {
    await this.simulateDelay();
    return TEST_PROPERTIES.find((p) => p.id === id) || null;
  }

  async getPropertiesByAssociation(associationId: string): Promise<MockProperty[]> {
    await this.simulateDelay();
    return TEST_PROPERTIES.filter((p) => p.associationId === associationId);
  }

  // Unit operations
  async getUnit(id: string): Promise<MockUnit | null> {
    await this.simulateDelay();
    return TEST_UNITS.find((u) => u.id === id) || null;
  }

  async getUnitsByProperty(propertyId: string): Promise<MockUnit[]> {
    await this.simulateDelay();
    return TEST_UNITS.filter((u) => u.propertyId === propertyId);
  }

  async getUnitsByOwner(ownerId: string): Promise<MockUnit[]> {
    await this.simulateDelay();
    return TEST_UNITS.filter((u) => u.ownerIds.includes(ownerId));
  }

  // Maintenance Request operations
  async getMaintenanceRequest(id: string): Promise<MockMaintenanceRequest | null> {
    await this.simulateDelay();
    return TEST_MAINTENANCE_REQUESTS.find((r) => r.id === id) || null;
  }

  async getMaintenanceRequestsByAssociation(associationId: string): Promise<MockMaintenanceRequest[]> {
    await this.simulateDelay();
    return TEST_MAINTENANCE_REQUESTS.filter((r) => r.associationId === associationId);
  }

  async getMaintenanceRequestsByProperty(propertyId: string): Promise<MockMaintenanceRequest[]> {
    await this.simulateDelay();
    return TEST_MAINTENANCE_REQUESTS.filter((r) => r.propertyId === propertyId);
  }

  async getMaintenanceRequestsByReporter(contactId: string): Promise<MockMaintenanceRequest[]> {
    await this.simulateDelay();
    return TEST_MAINTENANCE_REQUESTS.filter((r) => r.reportedById === contactId);
  }

  async getMaintenanceRequestsByVendor(vendorId: string): Promise<MockMaintenanceRequest[]> {
    await this.simulateDelay();
    return TEST_MAINTENANCE_REQUESTS.filter((r) => r.assignedVendorId === vendorId);
  }

  async createMaintenanceRequest(data: Partial<MockMaintenanceRequest>): Promise<MockMaintenanceRequest> {
    await this.simulateDelay();
    const newRequest: MockMaintenanceRequest = {
      id: `TEST-MNT-${Date.now()}`,
      requestNumber: `MNT-2026-${String(TEST_MAINTENANCE_REQUESTS.length + 1).padStart(4, "0")}`,
      propertyId: data.propertyId || "",
      unitId: data.unitId,
      associationId: data.associationId || "",
      reportedById: data.reportedById || "",
      assignedVendorId: data.assignedVendorId,
      assignedStaffId: data.assignedStaffId,
      title: data.title || "",
      description: data.description || "",
      urgency: data.urgency || "medium",
      status: "New",
      category: data.category || "General",
      reportedDate: new Date().toISOString(),
    };
    TEST_MAINTENANCE_REQUESTS.push(newRequest);
    return newRequest;
  }

  // Workflow triggers (mock)
  async triggerWorkflow(workflowCode: string, context: Record<string, unknown>): Promise<{
    success: boolean;
    correlationId: string;
    mock: boolean;
  }> {
    await this.simulateDelay();
    console.log(`[MOCK] Workflow ${workflowCode} triggered`, context);
    return {
      success: true,
      correlationId: `MOCK-${Date.now()}`,
      mock: true,
    };
  }
}

// Singleton instance
export const mockGhlAdapter = new MockGhlAdapter();
