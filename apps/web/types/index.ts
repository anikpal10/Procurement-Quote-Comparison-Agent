export type UserRole = "BUYER" | "REVIEWER" | "ADMINISTRATOR";

export type CaseStatus =
    | "CREATED"
    | "UPLOADING"
    | "QUEUED"
    | "EXTRACTING"
    | "NEEDS_REVIEW"
    | "COMPARABLE"
    | "APPROVED"
    | "EXPORTED"
    | "FAILED"
    | "RETRYABLE"
    | "CANCELLED";

export type MatchStatus =
    | "EXACT_MATCH"
    | "EQUIVALENT"
    | "NEEDS_REVIEW"
    | "SPEC_MISMATCH"
    | "MISSING_INFO";

export type ReviewDecision = "PENDING" | "APPROVED" | "OVERRIDDEN" | "REJECTED";

export interface ProcurementRequirement {
    id: string;
    name: string;
    category?: string;
    quantity: number;
    unit: string;
    targetUnitPrice?: number;
    mandatory: boolean;
    technicalSpecs: string[];
}

export interface QuoteLineItem {
    id: string;
    description: string;
    partNumber?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    extendedPrice: number;
    matchStatus: MatchStatus;
    specDeviations?: string[];
    confidence: number;
}

export interface LandedCostBreakdown {
    baseCurrency: string;
    originalCurrency: string;
    exchangeRate: number;
    subtotal: number;
    freight: number;
    customsDuty: number;
    insurance: number;
    taxes: number;
    discounts: number;
    totalLandedCost: number;
    effectiveUnitCost: number;
}

export interface SupplierQuote {
    id: string;
    supplierName: string;
    quoteNumber: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    checksum: string;
    uploadDate: string;
    validUntil: string;
    paymentTerms: string;
    incoterms: string;
    leadTimeWeeks: number;
    warrantyMonths: number;
    status: CaseStatus;
    extractionConfidence: number;
    pricing: LandedCostBreakdown;
    lineItems: QuoteLineItem[];
    notes?: string;
}

export interface ReviewItem {
    id: string;
    quoteId: string;
    supplierName: string;
    field: string;
    originalValue: string;
    suggestedValue: string;
    currentValue: string;
    confidence: number;
    decision: ReviewDecision;
    reviewerComment?: string;
    ruleTriggered: string;
    evidenceText: string;
    pageNumber?: number;
}

export interface ProcurementCase {
    id: string;
    caseNumber: string;
    title: string;
    department: string;
    ownerId: string;
    ownerName: string;
    status: CaseStatus;
    baseCurrency: string;
    deliveryLocation: string;
    targetDeliveryDate: string;
    createdAt: string;
    updatedAt: string;
    version: number;
    requirements: ProcurementRequirement[];
    quotes: SupplierQuote[];
    reviewItems: ReviewItem[];
}

export interface PipelineStage {
    id: string;
    name: string;
    description: string;
    status: "idle" | "in_progress" | "completed" | "failed";
    progressPct: number;
    details?: string;
}

export interface HealthResponse {
    status: string;
    service: string;
    environment: string;
}
