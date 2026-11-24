import { ProcurementCase, ReviewItem } from "../types";

export interface CostItemBreakup {
    basePrice: number;
    packaging: number;
    shipping: number;
    tax: number;
}

export interface QuoteComparisonItem {
    id: string;
    name: string;
    quantity: number;
    supplierCosts: Record<string, {
        unitCost: number;
        totalCost: number;
        breakup: CostItemBreakup;
    }>;
}

export interface ComparisonSupplier {
    id: string;
    name: string;
    location: string;
    timelineDays: number;
    paymentTerms: string;
    incoTerms: string;
    totalAmount: number;
    formattedTotal: string;
    isRecommended?: boolean;
    status: "none" | "shortlisted" | "rejected" | "po_created";
}

export interface ReviewItemData {
    id: string;
    supplierId: string;
    supplierName: string;
    field: string;
    originalValue: string;
    suggestedValue: string;
    currentValue: string;
    confidence: number;
    decision: "PENDING" | "APPROVED" | "REJECTED";
    ruleTriggered: string;
    evidenceText: string;
    reviewerComment?: string;
}

export interface RFQComparisonData {
    rfqId: string;
    rfqTitle: string;
    user: {
        name: string;
        initials: string;
    };
    suppliers: ComparisonSupplier[];
    items: QuoteComparisonItem[];
    reviewItems: ReviewItemData[];
}

export const initialReviewItems: ReviewItemData[] = [
    {
        id: "rev-1",
        supplierId: "sup-2",
        supplierName: "Supplier 2 (Pune)",
        field: "Manufacturing Method (Seamless vs Welded)",
        originalValue: "Welded & Drawn Pipe",
        suggestedValue: "Requires Engineering Exemption for Welded Construction",
        currentValue: "Welded & Drawn",
        confidence: 0.84,
        decision: "PENDING",
        ruleTriggered: "MANDATORY_SPEC_CHECK",
        evidenceText: "Quote Page 2, Technical Annex: 'Tubing produced via TIG welded strip with cold drawing reduction'",
    },
    {
        id: "rev-2",
        supplierId: "sup-4",
        supplierName: "Supplier 4 (Bangalore)",
        field: "Commercial Payment Terms (20% Advance)",
        originalValue: "20% advance payment required",
        suggestedValue: "Verify Against Corporate Credit Policy (30 Days Credit Standard)",
        currentValue: "20% advance payment",
        confidence: 0.95,
        decision: "PENDING",
        ruleTriggered: "COMMERCIAL_TERMS_RISK",
        evidenceText: "Clause 4.1: 'Initial mobilization advance of 20% required upon PO confirmation'",
    },
    {
        id: "rev-3",
        supplierId: "sup-3",
        supplierName: "Supplier 3 (Delhi)",
        field: "Material Grade (TP316L vs TP304)",
        originalValue: "Grade TP316L Marine Grade",
        suggestedValue: "Approved - Exceeds Base ASTM A312 TP304 Specification",
        currentValue: "Grade TP316L (Exceeds spec)",
        confidence: 0.97,
        decision: "APPROVED",
        ruleTriggered: "SPECIFICATION_UPGRADE_REVIEW",
        evidenceText: "Section 3.1: 'We quote TP316L dual certified as our standard mill run'",
        reviewerComment: "Approved by materials team: 316L exceeds requirements for marine corrosion.",
    },
    {
        id: "rev-4",
        supplierId: "sup-1",
        supplierName: "Supplier 1 (Mumbai)",
        field: "Delivery & Inco Terms (Freight Destination)",
        originalValue: "Consider shipping to Delhi depot",
        suggestedValue: "Confirm Delivery Address at Site (DDP)",
        currentValue: "Consider shipping to Delhi",
        confidence: 0.91,
        decision: "PENDING",
        ruleTriggered: "INCOTERM_DESTINATION_CHECK",
        evidenceText: "Section 2: 'Estimated road carriage up to Delhi transit depot included, offloading by consignee'",
    },
];

export const sampleRFQComparisonData: RFQComparisonData = {
    rfqId: "KA001020",
    rfqTitle: "Industrial Pipe & Valve Procurement",
    user: {
        name: "Shubham P.",
        initials: "SP",
    },
    suppliers: [
        {
            id: "sup-1",
            name: "Supplier 1",
            location: "Mumbai",
            timelineDays: 20,
            paymentTerms: "30 days credit",
            incoTerms: "Consider shipping to Delhi",
            totalAmount: 120000,
            formattedTotal: "1,20,000/-",
            isRecommended: true,
            status: "none",
        },
        {
            id: "sup-2",
            name: "Supplier 2",
            location: "Pune",
            timelineDays: 15,
            paymentTerms: "50% advance payment",
            incoTerms: "Consider shipping to Mumbai",
            totalAmount: 150000,
            formattedTotal: "1,50,000/-",
            status: "none",
        },
        {
            id: "sup-3",
            name: "Supplier 3",
            location: "Delhi",
            timelineDays: 18,
            paymentTerms: "20 days credit",
            incoTerms: "Consider shipping to Blr",
            totalAmount: 125000,
            formattedTotal: "1,25,000/-",
            status: "none",
        },
        {
            id: "sup-4",
            name: "Supplier 4",
            location: "Bangalore",
            timelineDays: 15,
            paymentTerms: "20% advance payment",
            incoTerms: "Consider shipping to Pune",
            totalAmount: 140000,
            formattedTotal: "1,40,000/-",
            status: "none",
        },
        {
            id: "sup-5",
            name: "Supplier 5",
            location: "Mumbai",
            timelineDays: 20,
            paymentTerms: "30 days credit",
            incoTerms: "Consider shipping to Delhi",
            totalAmount: 110000,
            formattedTotal: "1,10,000/-",
            status: "none",
        },
    ],
    items: [
        {
            id: "item-1",
            name: "Item name 1",
            quantity: 20,
            supplierCosts: {
                "sup-1": { unitCost: 1000, totalCost: 20000, breakup: { basePrice: 850, packaging: 50, shipping: 60, tax: 40 } },
                "sup-2": { unitCost: 1500, totalCost: 30000, breakup: { basePrice: 1300, packaging: 80, shipping: 70, tax: 50 } },
                "sup-3": { unitCost: 1000, totalCost: 20000, breakup: { basePrice: 860, packaging: 40, shipping: 60, tax: 40 } },
                "sup-4": { unitCost: 2000, totalCost: 40000, breakup: { basePrice: 1750, packaging: 100, shipping: 90, tax: 60 } },
                "sup-5": { unitCost: 1500, totalCost: 30000, breakup: { basePrice: 1320, packaging: 60, shipping: 70, tax: 50 } },
            },
        },
        {
            id: "item-2",
            name: "Item name 2",
            quantity: 10,
            supplierCosts: {
                "sup-1": { unitCost: 2000, totalCost: 20000, breakup: { basePrice: 1700, packaging: 100, shipping: 120, tax: 80 } },
                "sup-2": { unitCost: 2000, totalCost: 20000, breakup: { basePrice: 1720, packaging: 90, shipping: 110, tax: 80 } },
                "sup-3": { unitCost: 1500, totalCost: 15000, breakup: { basePrice: 1280, packaging: 70, shipping: 90, tax: 60 } },
                "sup-4": { unitCost: 3000, totalCost: 30000, breakup: { basePrice: 2600, packaging: 150, shipping: 150, tax: 100 } },
                "sup-5": { unitCost: 2500, totalCost: 25000, breakup: { basePrice: 2150, packaging: 120, shipping: 130, tax: 100 } },
            },
        },
        {
            id: "item-3",
            name: "Item name 3",
            quantity: 15,
            supplierCosts: {
                "sup-1": { unitCost: 1200, totalCost: 18000, breakup: { basePrice: 1020, packaging: 60, shipping: 70, tax: 50 } },
                "sup-2": { unitCost: 1400, totalCost: 21000, breakup: { basePrice: 1200, packaging: 70, shipping: 80, tax: 50 } },
                "sup-3": { unitCost: 1100, totalCost: 16500, breakup: { basePrice: 940, packaging: 50, shipping: 60, tax: 50 } },
                "sup-4": { unitCost: 1800, totalCost: 27000, breakup: { basePrice: 1550, packaging: 90, shipping: 90, tax: 70 } },
                "sup-5": { unitCost: 1300, totalCost: 19500, breakup: { basePrice: 1110, packaging: 60, shipping: 70, tax: 60 } },
            },
        },
    ],
    reviewItems: initialReviewItems,
};

export const initialProcurementCase: ProcurementCase = {
    id: "case-2026-001",
    caseNumber: "RFQ id: KA001020",
    title: "Industrial Pipe & Valve Procurement",
    department: "Plant Operations",
    ownerId: "user-buyer-01",
    ownerName: "Shubham P.",
    status: "COMPARABLE",
    baseCurrency: "INR",
    deliveryLocation: "Mumbai & Delhi, India",
    targetDeliveryDate: "2026-12-15",
    createdAt: "2026-11-20T09:30:00Z",
    updatedAt: "2026-11-22T14:15:00Z",
    version: 3,
    requirements: [
        {
            id: "req-1",
            name: "Item name 1",
            quantity: 20,
            unit: "Units",
            mandatory: true,
            technicalSpecs: ["Grade A standard"],
        },
    ],
    quotes: [
        {
            id: "sup-1",
            supplierName: "Supplier 1",
            quoteNumber: "Q-MUM-01",
            fileName: "Supplier1_Quote.pdf",
            fileSize: 320000,
            fileType: "application/pdf",
            checksum: "sha256-sup1",
            uploadDate: "2026-11-21T10:14:00Z",
            validUntil: "2026-12-31",
            paymentTerms: "30 days credit",
            incoterms: "Consider shipping to Delhi",
            leadTimeWeeks: 3,
            warrantyMonths: 12,
            status: "COMPARABLE",
            extractionConfidence: 0.98,
            pricing: {
                baseCurrency: "INR",
                originalCurrency: "INR",
                exchangeRate: 1.0,
                subtotal: 120000,
                freight: 0,
                customsDuty: 0,
                insurance: 0,
                taxes: 0,
                discounts: 0,
                totalLandedCost: 120000,
                effectiveUnitCost: 2666,
            },
            lineItems: [],
        },
    ],
    reviewItems: [
        {
            id: "rev-1",
            quoteId: "sup-2",
            supplierName: "Supplier 2 (Pune)",
            field: "Manufacturing Method (Seamless vs Welded)",
            originalValue: "Welded & Drawn",
            suggestedValue: "Requires Engineering Exemption for Welded Construction",
            currentValue: "Welded & Drawn",
            confidence: 0.84,
            decision: "PENDING",
            ruleTriggered: "MANDATORY_SPEC_CHECK",
            evidenceText: "Quote page 2, Technical Annex: 'Tubing produced via TIG welded strip with cold drawing reduction'",
            pageNumber: 2,
        },
        {
            id: "rev-2",
            quoteId: "sup-4",
            supplierName: "Supplier 4 (Bangalore)",
            field: "Commercial Payment Terms",
            originalValue: "20% advance payment required",
            suggestedValue: "Verify Against Corporate Credit Policy",
            currentValue: "20% advance payment",
            confidence: 0.95,
            decision: "PENDING",
            ruleTriggered: "COMMERCIAL_TERMS_RISK",
            evidenceText: "Clause 4.1: 'Initial mobilization advance of 20% required upon PO confirmation'",
            pageNumber: 1,
        },
        {
            id: "rev-3",
            quoteId: "sup-3",
            supplierName: "Supplier 3 (Delhi)",
            field: "Material Grade Upgrade (TP316L vs TP304)",
            originalValue: "Grade 316L",
            suggestedValue: "Approved - Accept higher corrosion resistance",
            currentValue: "Grade 316L",
            confidence: 0.97,
            decision: "APPROVED",
            reviewerComment: "Accepted by materials team: 316L exceeds requirements for marine atmosphere.",
            ruleTriggered: "SPECIFICATION_UPGRADE_REVIEW",
            evidenceText: "Section 3.1: 'We quote TP316L dual certified as our standard mill run'",
            pageNumber: 1,
        },
        {
            id: "rev-4",
            quoteId: "sup-1",
            supplierName: "Supplier 1 (Mumbai)",
            field: "Freight Delivery Clarification",
            originalValue: "Consider shipping to Delhi depot",
            suggestedValue: "Confirm Site Destination Delivery",
            currentValue: "Consider shipping to Delhi",
            confidence: 0.91,
            decision: "PENDING",
            ruleTriggered: "INCOTERM_DESTINATION_CHECK",
            evidenceText: "Section 2: 'Estimated road carriage up to Delhi transit depot included'",
            pageNumber: 1,
        },
    ],
};
