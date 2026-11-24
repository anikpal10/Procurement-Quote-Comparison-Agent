"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getComparisonData, updateComparisonReviewDecision, saveComparisonData } from "../../lib/api";
import { ComparisonSupplier, RFQComparisonData, ReviewItemData, sampleRFQComparisonData } from "../../lib/mockData";

function ReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<RFQComparisonData>(sampleRFQComparisonData);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const [filterDecision, setFilterDecision] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

    useEffect(() => {
        const comp = getComparisonData();
        setData(comp);

        const supplierQuery = searchParams.get("supplier");
        if (supplierQuery && comp.suppliers.some((s) => s.id === supplierQuery)) {
            setSelectedSupplierId(supplierQuery);
        } else if (comp.suppliers.length > 0) {
            const defaultSup =
                comp.suppliers.find((s) => s.status === "shortlisted") ||
                comp.suppliers.find((s) => s.isRecommended) ||
                comp.suppliers[0];
            setSelectedSupplierId(defaultSup ? defaultSup.id : null);
        }
    }, [searchParams]);

    const showToast = (msg: string) => {
        setSavedMessage(msg);
        setTimeout(() => setSavedMessage(null), 3500);
    };

    const handleAction = (item: ReviewItemData, decision: "APPROVED" | "REJECTED") => {
        const updated = updateComparisonReviewDecision(item.id, decision);
        setData(updated);
        showToast(`Review decision saved: "${item.field}" marked as ${decision}. Forwarding to Download section...`);
        setTimeout(() => {
            router.push(`/download?supplier=${encodeURIComponent(currentSupplier.id)}&autoDownload=true`);
        }, 700);
    };

    const handleShortlistSupplier = (sup: ComparisonSupplier) => {
        const updatedSuppliers = data.suppliers.map((s) =>
            s.id === sup.id
                ? { ...s, status: (s.status === "shortlisted" ? "none" : "shortlisted") as ComparisonSupplier["status"] }
                : s
        );
        const updated: RFQComparisonData = {
            ...data,
            suppliers: updatedSuppliers,
        };
        saveComparisonData(updated);
        setData(updated);
        showToast(
            sup.status === "shortlisted"
                ? `${sup.name} un-shortlisted.`
                : `${sup.name} shortlisted as approved vendor!`
        );
    };

    if (!data || data.suppliers.length === 0) {
        return (
            <div className="mx-auto max-w-4xl p-8 text-center space-y-4">
                <div className="text-4xl">📂</div>
                <h2 className="text-xl font-bold text-slate-800">No Supplier Quotes Available</h2>
                <p className="text-sm text-slate-500">
                    Upload your quote documents first on the comparison dashboard.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700 transition"
                >
                    ← Go to Upload & Comparison
                </Link>
            </div>
        );
    }

    const currentSupplier: ComparisonSupplier =
        data.suppliers.find((s) => s.id === selectedSupplierId) || data.suppliers[0];

    // Itemized breakdown for this chosen supplier
    const supplierItems = data.items.map((item) => {
        const costInfo = item.supplierCosts[currentSupplier.id] || {
            unitCost: 0,
            totalCost: 0,
            breakup: { basePrice: 0, packaging: 0, shipping: 0, tax: 0 },
        };
        return {
            ...item,
            ...costInfo,
        };
    });

    const totalBasePrice = supplierItems.reduce((acc, i) => acc + (i.breakup?.basePrice || 0) * i.quantity, 0);
    const totalPackaging = supplierItems.reduce((acc, i) => acc + (i.breakup?.packaging || 0) * i.quantity, 0);
    const totalShipping = supplierItems.reduce((acc, i) => acc + (i.breakup?.shipping || 0) * i.quantity, 0);
    const totalTax = supplierItems.reduce((acc, i) => acc + (i.breakup?.tax || 0) * i.quantity, 0);

    // Review items specifically associated with this supplier
    const allReviewItems = data.reviewItems ?? [];
    const supplierReviewItems = allReviewItems.filter(
        (r) =>
            r.supplierId === currentSupplier.id ||
            r.supplierName.toLowerCase() === currentSupplier.name.toLowerCase()
    );

    const pendingCount = supplierReviewItems.filter((r) => r.decision === "PENDING").length;

    const filteredReviewItems = supplierReviewItems.filter((item) => {
        if (filterDecision === "ALL") return true;
        return item.decision === filterDecision;
    });

    return (
        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-16">
            {/* TOAST MESSAGE */}
            {savedMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl flex items-center gap-2 animate-fade-in">
                    <span className="text-emerald-400">✓</span>
                    <span>{savedMessage}</span>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                            Human-in-the-Loop Review
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                            RFQ: <strong className="text-slate-700">{data.rfqId}</strong>
                        </span>
                    </div>
                    <h1 className="mt-1 text-2xl font-black text-slate-900">
                        Supplier Details & Specification Review
                    </h1>
                    <p className="mt-1 text-xs text-slate-600">
                        Choose any supplier below to inspect all commercial terms, item cost breakups, and compliance deviations.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                        ← Back to Comparison
                    </Link>
                    <Link
                        href={`/download?supplier=${encodeURIComponent(currentSupplier.id)}&autoDownload=true`}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition flex items-center gap-1.5"
                    >
                        <span>Confirm Reviews & Download (PDF/CSV) →</span>
                    </Link>
                </div>
            </div>

            {/* SUPPLIER CHOOSER TABS */}
            <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Choose Supplier to Inspect Details:</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                        Click on any supplier to switch review context
                    </span>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    {data.suppliers.map((sup) => {
                        const isChosen = sup.id === currentSupplier.id;
                        const supPending = allReviewItems.filter(
                            (r) =>
                                (r.supplierId === sup.id || r.supplierName.toLowerCase() === sup.name.toLowerCase()) &&
                                r.decision === "PENDING"
                        ).length;

                        return (
                            <button
                                key={sup.id}
                                onClick={() => {
                                    setSelectedSupplierId(sup.id);
                                    router.push(`/review?supplier=${encodeURIComponent(sup.id)}`);
                                }}
                                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition border ${
                                    isChosen
                                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-300"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                            >
                                <span className="max-w-[200px] truncate" title={sup.name}>
                                    {sup.name}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                        isChosen ? "bg-slate-800 text-emerald-300" : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    {sup.formattedTotal}
                                </span>
                                {supPending > 0 ? (
                                    <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                                        {supPending} pending
                                    </span>
                                ) : (
                                    <span className="text-emerald-400 text-xs">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 1: CHOSEN SUPPLIER OVERVIEW & COMMERCIAL TERMS                    */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Chosen Supplier Details
                            </span>
                            {currentSupplier.isRecommended && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Recommended Quote
                                </span>
                            )}
                            {currentSupplier.status === "shortlisted" && (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                                    ★ Shortlisted Vendor
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mt-1">{currentSupplier.name}</h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                            Location: <strong className="text-slate-700">{currentSupplier.location}</strong> | Status:{" "}
                            <span className="capitalize font-semibold text-slate-700">{currentSupplier.status}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <button
                            onClick={() => handleShortlistSupplier(currentSupplier)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                                currentSupplier.status === "shortlisted"
                                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                                    : "border-sky-300 text-sky-700 hover:bg-sky-50"
                            }`}
                        >
                            <span>{currentSupplier.status === "shortlisted" ? "✓ Shortlisted" : "★ Shortlist Supplier"}</span>
                        </button>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                Total Quoted Value
                            </div>
                            <div className="text-xl font-black text-emerald-900">{currentSupplier.formattedTotal}</div>
                        </div>
                    </div>
                </div>

                {/* COMMERCIAL TERMS TILES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Delivery Timeline</div>
                        <div className="text-base font-black text-slate-900 mt-1">
                            {currentSupplier.timelineDays} Days
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Delivery to destination</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Payment Terms</div>
                        <div className="text-base font-black text-slate-900 mt-1">
                            {currentSupplier.paymentTerms}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Invoice settlement agreement</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Inco Terms</div>
                        <div className="text-base font-black text-slate-900 mt-1">{currentSupplier.incoTerms}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Freight & liability terms</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Review Verification</div>
                        <div className="text-base font-black text-slate-900 mt-1">
                            {pendingCount === 0 ? "100% Compliant" : `${pendingCount} Items Pending`}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Gemini AI spec analysis</div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SECTION 2: CHOSEN SUPPLIER'S ITEMIZED COST BREAKDOWN TABLE                */}
                {/* ========================================================================= */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-slate-800">
                            Itemized Cost Breakdown ({supplierItems.length} Quoted Items)
                        </h3>
                        <span className="text-xs text-slate-500">All prices in INR</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                    <th className="p-3 w-8">#</th>
                                    <th className="p-3">Item Description</th>
                                    <th className="p-3 text-center">Qty</th>
                                    <th className="p-3 text-right">Unit Price</th>
                                    <th className="p-3 text-right">Base Price</th>
                                    <th className="p-3 text-right">Packaging</th>
                                    <th className="p-3 text-right">Shipping</th>
                                    <th className="p-3 text-right">GST / Tax</th>
                                    <th className="p-3 text-right font-black text-slate-900 bg-slate-100/60">
                                        Line Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplierItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-3 text-slate-400 font-medium">{index + 1}</td>
                                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                                        <td className="p-3 text-center font-bold text-slate-700">{item.quantity}</td>
                                        <td className="p-3 text-right font-medium text-slate-700">
                                            ₹{item.unitCost.toLocaleString("en-IN")}
                                        </td>
                                        <td className="p-3 text-right text-slate-500">
                                            ₹{(item.breakup?.basePrice || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="p-3 text-right text-slate-500">
                                            ₹{(item.breakup?.packaging || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="p-3 text-right text-slate-500">
                                            ₹{(item.breakup?.shipping || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="p-3 text-right text-slate-500">
                                            ₹{(item.breakup?.tax || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-900 bg-slate-50/40">
                                            ₹{item.totalCost.toLocaleString("en-IN")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-800">
                                    <td colSpan={4} className="p-3 text-right uppercase text-[11px] text-slate-500">
                                        Subtotals:
                                    </td>
                                    <td className="p-3 text-right text-slate-700">
                                        ₹{totalBasePrice.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-3 text-right text-slate-700">
                                        ₹{totalPackaging.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-3 text-right text-slate-700">
                                        ₹{totalShipping.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-3 text-right text-slate-700">
                                        ₹{totalTax.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-3 text-right text-sm font-black text-emerald-800 bg-emerald-50">
                                        {currentSupplier.formattedTotal}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 3: SPECIFICATION & COMPLIANCE REVIEW FOR THIS CHOSEN SUPPLIER     */}
            {/* ========================================================================= */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-3">
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                            Quality & Spec Checks for {currentSupplier.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                            Review identified deviations, compliance flags, and terms specific to this quotation.
                        </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5">
                        {[
                            { id: "ALL", label: `All (${supplierReviewItems.length})` },
                            { id: "PENDING", label: `Pending (${pendingCount})` },
                            { id: "APPROVED", label: "Approved" },
                            { id: "REJECTED", label: "Rejected" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterDecision(tab.id as typeof filterDecision)}
                                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                    filterDecision === tab.id
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredReviewItems.length === 0 ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-extrabold mx-auto">
                            ✓
                        </div>
                        <h4 className="text-sm font-bold text-emerald-950">
                            No Deviations or Pending Reviews for {currentSupplier.name}
                        </h4>
                        <p className="text-xs text-emerald-800 max-w-md mx-auto">
                            All extracted parameters and commercial terms for this supplier meet the required baseline criteria.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredReviewItems.map((item) => {
                            const isPending = item.decision === "PENDING";
                            const isApproved = item.decision === "APPROVED";
                            const isRejected = item.decision === "REJECTED";

                            return (
                                <article
                                    key={item.id}
                                    className={`rounded-2xl bg-white p-6 shadow-sm border transition ${
                                        isPending
                                            ? "border-amber-300 ring-1 ring-amber-100"
                                            : isApproved
                                            ? "border-emerald-200"
                                            : "border-rose-200"
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-slate-900">{item.field}</h4>
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        isPending
                                                            ? "bg-amber-100 text-amber-800"
                                                            : isApproved
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-rose-100 text-rose-800"
                                                    }`}
                                                >
                                                    {item.decision}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs font-medium text-slate-500">
                                                Rule: <strong className="text-slate-700">{item.ruleTriggered}</strong>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-slate-500">AI Confidence:</span>
                                            <span className="font-bold text-slate-800">
                                                {(item.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 md:grid-cols-2 text-xs">
                                        <div className="space-y-2">
                                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                                                <span className="text-slate-500">Extracted Evidence:</span>
                                                <p className="mt-0.5 font-medium text-slate-800 italic">
                                                    "{item.evidenceText}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200">
                                                    <span className="text-amber-800 font-semibold text-[11px]">
                                                        Extracted Clause
                                                    </span>
                                                    <p className="mt-1 font-bold text-slate-900">{item.originalValue}</p>
                                                </div>
                                                <div className="rounded-lg bg-sky-50 p-2.5 border border-sky-200">
                                                    <span className="text-sky-800 font-semibold text-[11px]">
                                                        AI Recommendation
                                                    </span>
                                                    <p className="mt-1 font-bold text-slate-900">{item.suggestedValue}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold text-slate-600">Decision Status</p>
                                                <p className="mt-1 text-xs text-slate-800 font-medium">
                                                    {item.reviewerComment ||
                                                        (isPending
                                                            ? "Awaiting your review decision for this supplier quote."
                                                            : `Reviewer marked as ${item.decision}.`)}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(item, "REJECTED")}
                                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                                        isRejected
                                                            ? "bg-rose-600 text-white"
                                                            : "border border-rose-300 text-rose-700 hover:bg-rose-50"
                                                    }`}
                                                >
                                                    ✕ Reject Clause
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(item, "APPROVED")}
                                                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                                                        isApproved
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                    }`}
                                                >
                                                    ✓ Approve Clause
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function ReviewPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-xs text-slate-500">
                    Loading supplier review details...
                </div>
            }
        >
            <ReviewContent />
        </Suspense>
    );
}
