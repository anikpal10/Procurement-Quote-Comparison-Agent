"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { saveActiveCase } from "../../../lib/api";
import { ProcurementCase } from "../../../types";

interface CaseFormData {
    companyName: string;
    rfqName: string;
    productName: string;
    category: string;
    quantity: number;
    unit: string;
    targetUnitPrice: number;
    baseCurrency: string;
    deliveryLocation: string;
    targetDeliveryDate: string;
    technicalSpecs: string[];
    additionalNotes: string;
}

export default function NewComparisonPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<CaseFormData>({
        companyName: "Acme Industrial Infrastructure Ltd",
        rfqName: "RFQ-2026-VALVE-092",
        productName: "High Pressure Flanged Ball Valves 2-inch Class 300",
        category: "Valves & Actuators",
        quantity: 120,
        unit: "Units",
        targetUnitPrice: 450.0,
        baseCurrency: "GBP",
        deliveryLocation: "Grangemouth Refinery, UK",
        targetDeliveryDate: "2026-12-28",
        technicalSpecs: [
            "Body Material: Carbon Steel ASTM A216 WCB / Stainless Ball 316",
            "Fire-Safe Design: Certified to API 607 / ISO 10497",
            "End Connection: ASME B16.5 Class 300 Raised Face (RF)",
            "Pressure Test: 100% Hydrostatic and Low-Pressure Gas Shell Tested",
        ],
        additionalNotes: "Vendor must provide 3.1 Material Inspection Certificates prior to dispatch.",
    });

    const [newSpec, setNewSpec] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleAddSpec = () => {
        if (!newSpec.trim()) return;
        setFormData((prev) => ({
            ...prev,
            technicalSpecs: [...prev.technicalSpecs, newSpec.trim()],
        }));
        setNewSpec("");
    };

    const handleRemoveSpec = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            technicalSpecs: prev.technicalSpecs.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const newCase: ProcurementCase = {
            id: `case-${Date.now()}`,
            caseNumber: formData.rfqName,
            title: formData.productName,
            department: formData.companyName,
            ownerId: "user-buyer-01",
            ownerName: "Sarah Jenkins",
            status: "CREATED",
            baseCurrency: formData.baseCurrency,
            deliveryLocation: formData.deliveryLocation,
            targetDeliveryDate: formData.targetDeliveryDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            requirements: [
                {
                    id: `req-${Date.now()}`,
                    name: formData.productName,
                    category: formData.category,
                    quantity: Number(formData.quantity),
                    unit: formData.unit,
                    targetUnitPrice: Number(formData.targetUnitPrice),
                    mandatory: true,
                    technicalSpecs: formData.technicalSpecs,
                },
            ],
            quotes: [],
            reviewItems: [],
        };

        saveActiveCase(newCase);
        router.push("/uploads");
    };

    return (
        <main className="p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div>
                    <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-800">
                        RFQ Specification
                    </span>
                    <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Create Procurement Case</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Define buyer requirements, commercial terms, and mandatory specifications before uploading supplier quotations.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Information Card */}
                    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                            1. Commercial & Operational Details
                        </h2>

                        <div className="mt-4 grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Company / Department Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">RFQ Reference Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.rfqName}
                                    onChange={(e) => setFormData({ ...formData, rfqName: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Delivery Destination</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.deliveryLocation}
                                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Target Delivery Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.targetDeliveryDate}
                                    onChange={(e) => setFormData({ ...formData, targetDeliveryDate: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Product & Quantity Card */}
                    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                            2. Product Requirements & Quantity
                        </h2>

                        <div className="mt-4 grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700">Target Product / Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Product Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Base Currency</label>
                                <select
                                    value={formData.baseCurrency}
                                    onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
                                >
                                    <option value="GBP">GBP (£)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Required Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Measurement Unit</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    placeholder="Units, Meters, Tons..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Technical Specifications Tag System */}
                    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                            3. Mandatory Technical Specifications
                        </h2>
                        <p className="mt-2 text-xs text-slate-500">
                            The AI extraction agent will check each supplier's quote against these exact technical constraints.
                        </p>

                        <div className="mt-4 space-y-2">
                            {formData.technicalSpecs.map((spec, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800"
                                >
                                    <span>{spec}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSpec(index)}
                                        className="text-rose-600 hover:text-rose-800 font-semibold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                type="text"
                                value={newSpec}
                                onChange={(e) => setNewSpec(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddSpec();
                                    }
                                }}
                                placeholder="Add technical specification constraint (e.g., API 6D standard, NACE MR0175 compliance)"
                                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                            <button
                                type="button"
                                onClick={handleAddSpec}
                                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                                + Add Spec
                            </button>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-sky-700 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 transition disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : "Save RFQ & Proceed to Uploads →"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
