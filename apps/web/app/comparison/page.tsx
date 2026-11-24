"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getActiveCase } from "../../lib/api";
import { ProcurementCase, SupplierQuote } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { DownloadIcon, ScalesIcon, ShieldCheckIcon } from "../../components/Icons";

export default function ComparisonPage() {
    const [procCase, setProcCase] = useState<ProcurementCase | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "pricing" | "commercial" | "technical">("all");

    useEffect(() => {
        setProcCase(getActiveCase());
    }, []);

    const quotes: SupplierQuote[] = procCase?.quotes ?? [];

    const lowestCostQuote = quotes.length > 0
        ? [...quotes].sort((a, b) => a.pricing.totalLandedCost - b.pricing.totalLandedCost)[0]
        : null;

    const handleExportCSV = () => {
        if (!quotes.length) return;
        const headers = ["Metric", ...quotes.map((q) => `"${q.supplierName}"`)];
        const rowsData = [
            ["Quote Number", ...quotes.map((q) => `"${q.quoteNumber}"`)],
            ["Unit Price", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.lineItems[0]?.unitPrice.toFixed(2)}"` )],
            ["Quantity", ...quotes.map((q) => `"${q.lineItems[0]?.quantity} ${q.lineItems[0]?.unit}"`)],
            ["Goods Subtotal", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.pricing.subtotal.toFixed(2)}"` )],
            ["Freight Charges", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.pricing.freight.toFixed(2)}"` )],
            ["Customs & Tariffs", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.pricing.customsDuty.toFixed(2)}"` )],
            ["Transit Insurance", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.pricing.insurance.toFixed(2)}"` )],
            ["Total Landed Cost", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.pricing.totalLandedCost.toFixed(2)}"` )],
            ["Effective Unit Cost", ...quotes.map((q) => `"${procCase?.baseCurrency} ${q.pricing.effectiveUnitCost.toFixed(2)}"` )],
            ["Incoterms", ...quotes.map((q) => `"${q.incoterms}"`)],
            ["Payment Terms", ...quotes.map((q) => `"${q.paymentTerms}"`)],
            ["Lead Time (Weeks)", ...quotes.map((q) => `"${q.leadTimeWeeks}"`)],
            ["Warranty (Months)", ...quotes.map((q) => `"${q.warrantyMonths}"`)],
            ["Match Status", ...quotes.map((q) => `"${q.lineItems[0]?.matchStatus}"`)],
            ["Extraction Confidence", ...quotes.map((q) => `"${(q.extractionConfidence * 100).toFixed(1)}%"` )],
        ];

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rowsData.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ProcureAI_Comparison_${procCase?.caseNumber ?? "RFQ"}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-800">
                            Deterministic Analysis
                        </span>
                        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Supplier Comparison Matrix</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Side-by-side landed-cost breakdown, incoterm normalization, and technical specification compliance.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                            <DownloadIcon className="h-4 w-4 text-slate-600" />
                            Export Matrix (CSV)
                        </button>
                        <Link
                            href="/review"
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 transition"
                        >
                            <ShieldCheckIcon className="h-4 w-4" />
                            Review & Approval Queue →
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
                    {[
                        { id: "all", label: "All Attributes" },
                        { id: "pricing", label: "Landed Cost Breakdown" },
                        { id: "commercial", label: "Commercial Terms" },
                        { id: "technical", label: "Technical Compliance" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`rounded-lg px-4 py-2 transition ${
                                activeTab === tab.id
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Matrix Table */}
                <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="w-1/4 px-6 py-4 text-left font-bold text-slate-700 uppercase tracking-wider">
                                        Evaluation Metric
                                    </th>
                                    {quotes.map((q) => {
                                        const isLowest = lowestCostQuote?.id === q.id;
                                        return (
                                            <th key={q.id} className="px-6 py-4 text-left font-bold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <span>{q.supplierName}</span>
                                                    {isLowest && (
                                                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                            LOWEST
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 font-normal text-slate-500">{q.quoteNumber}</p>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                                {/* SECTION: Pricing & Landed Cost */}
                                {(activeTab === "all" || activeTab === "pricing") && (
                                    <>
                                        <tr className="bg-slate-50/70">
                                            <td colSpan={quotes.length + 1} className="px-6 py-2.5 font-bold text-slate-700">
                                                Financial & Landed-Cost Breakdown
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Unit Price (Base)</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 font-semibold text-slate-900">
                                                    £{q.lineItems[0]?.unitPrice.toFixed(2)} / {q.lineItems[0]?.unit}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Goods Subtotal (500m)</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    £{q.pricing.subtotal.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Freight & Carriage</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    £{q.pricing.freight.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Customs / Tariffs</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    £{q.pricing.customsDuty.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Insurance</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    £{q.pricing.insurance.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr className="bg-sky-50/50">
                                            <td className="px-6 py-3.5 font-bold text-slate-900">Total Landed Cost</td>
                                            {quotes.map((q) => {
                                                const isLowest = lowestCostQuote?.id === q.id;
                                                return (
                                                    <td
                                                        key={q.id}
                                                        className={`px-6 py-3.5 font-extrabold text-base ${
                                                            isLowest ? "text-emerald-700" : "text-slate-900"
                                                        }`}
                                                    >
                                                        £{q.pricing.totalLandedCost.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                                                    </td>
                                                );
                                            })}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Effective Unit Cost</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 font-bold text-slate-800">
                                                    £{q.pricing.effectiveUnitCost.toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}

                                {/* SECTION: Commercial Terms */}
                                {(activeTab === "all" || activeTab === "commercial") && (
                                    <>
                                        <tr className="bg-slate-50/70">
                                            <td colSpan={quotes.length + 1} className="px-6 py-2.5 font-bold text-slate-700">
                                                Commercial Terms & Risk Factors
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Incoterms</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 font-semibold text-slate-800">
                                                    {q.incoterms}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Payment Terms</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    {q.paymentTerms}
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Lead Time</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    {q.leadTimeWeeks} weeks
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Warranty</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 text-slate-800">
                                                    {q.warrantyMonths} months
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}

                                {/* SECTION: Technical Compliance */}
                                {(activeTab === "all" || activeTab === "technical") && (
                                    <>
                                        <tr className="bg-slate-50/70">
                                            <td colSpan={quotes.length + 1} className="px-6 py-2.5 font-bold text-slate-700">
                                                Technical Compliance & AI Validation
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Match Status</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3">
                                                    <StatusBadge status={q.lineItems[0]?.matchStatus ?? "EXACT_MATCH"} size="sm" />
                                                </td>
                                            ))}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Specification Deviations</td>
                                            {quotes.map((q) => {
                                                const devs = q.lineItems[0]?.specDeviations ?? [];
                                                return (
                                                    <td key={q.id} className="px-6 py-3 text-slate-600">
                                                        {devs.length > 0 ? (
                                                            <ul className="list-disc pl-4 space-y-1 text-amber-800">
                                                                {devs.map((d, i) => (
                                                                    <li key={i}>{d}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-emerald-700 font-medium">None (Fully compliant)</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>

                                        <tr>
                                            <td className="px-6 py-3 font-medium text-slate-600">Gemini Extraction Confidence</td>
                                            {quotes.map((q) => (
                                                <td key={q.id} className="px-6 py-3 font-semibold text-slate-800">
                                                    {(q.extractionConfidence * 100).toFixed(0)}%
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
