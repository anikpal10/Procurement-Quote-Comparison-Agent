"use client";

import { useState, useEffect, ChangeEvent, DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    getComparisonData,
    resetComparisonToDemo,
    updateComparisonReviewDecision,
    uploadAndExtractMultipleQuotes,
} from "../lib/api";
import {
    ComparisonSupplier,
    RFQComparisonData,
    ReviewItemData,
    sampleRFQComparisonData,
} from "../lib/mockData";

export default function QuoteComparisonPage() {
    const router = useRouter();
    const [data, setData] = useState<RFQComparisonData>(sampleRFQComparisonData);
    // Flow: false = Upload Screen first; true = Dashboard output view
    const [hasUploaded, setHasUploaded] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<"cost_asc" | "cost_desc" | "timeline">("cost_asc");
    const [locationFilter, setLocationFilter] = useState<string>("all");
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [lastUploadedFiles, setLastUploadedFiles] = useState<File[]>([]);
    const [breakupItem, setBreakupItem] = useState<{ name: string; cost: number } | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

    useEffect(() => {
        setData(getComparisonData());
        const updateView = () => {
            if (typeof window === "undefined") return;
            const params = new URLSearchParams(window.location.search);
            if (params.get("view") === "dashboard") {
                setHasUploaded(true);
            } else if (params.get("view") === "upload") {
                setHasUploaded(false);
            }
        };
        updateView();
        window.addEventListener("popstate", updateView);
        return () => window.removeEventListener("popstate", updateView);
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Fast Parallel Multiple Files Extraction via Gemini AI (reflects exact uploaded file names)
    const processFiles = async (fileList: File[], isAppend: boolean = false) => {
        if (fileList.length === 0) return;

        if (!isAppend) {
            setLastUploadedFiles(fileList);
        } else {
            setLastUploadedFiles((prev) => [...prev, ...fileList]);
        }

        setIsUploading(true);
        showToast(`Extracting ${fileList.length} quotation file(s) in parallel with Gemini AI...`);

        try {
            const updated = await uploadAndExtractMultipleQuotes(fileList, isAppend, (current, total, fileName) => {
                setUploadProgress({ current, total, fileName });
            });
            setData(updated);
            setHasUploaded(true);
            showToast(`Output ready! Extracted ${fileList.length} quote(s).`);
        } catch {
            setHasUploaded(true);
            showToast("Quotation files loaded. Dashboard ready.");
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>, isAppend: boolean = false) => {
        if (!e.target.files) return;
        const fileList = Array.from(e.target.files);
        processFiles(fileList, isAppend);
        e.target.value = "";
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!e.dataTransfer.files) return;
        const fileList = Array.from(e.dataTransfer.files);
        processFiles(fileList, false);
    };

    // Instant Demo: loads 5 sample suppliers
    const handleLoadDemo = () => {
        const demo = resetComparisonToDemo();
        setData(demo);
        setHasUploaded(true);
        showToast("Loaded 5 sample supplier quotes.");
    };

    // OK ACTION: Directly goes to the review section for the selected supplier
    const handleGoToReview = () => {
        const targetId = activeSelectedSupplier?.id;
        if (targetId) {
            router.push(`/review?supplier=${encodeURIComponent(targetId)}`);
        } else {
            router.push("/review");
        }
    };

    const handleShortlist = (sup: ComparisonSupplier) => {
        const updated = {
            ...data,
            suppliers: data.suppliers.map((s) =>
                s.id === sup.id
                    ? { ...s, status: (s.status === "shortlisted" ? "none" : "shortlisted") as ComparisonSupplier["status"] }
                    : s
            ),
        };
        setData(updated);
        setSelectedSupplierId(sup.id);
        showToast(`${sup.name} shortlisted & selected for download.`);
    };

    const handleRejectSupplier = (sup: ComparisonSupplier) => {
        const updated = {
            ...data,
            suppliers: data.suppliers.map((s) =>
                s.id === sup.id
                    ? { ...s, status: (s.status === "rejected" ? "none" : "rejected") as ComparisonSupplier["status"] }
                    : s
            ),
        };
        setData(updated);
        showToast(`${sup.name} marked as rejected.`);
    };

    const handleReviewAction = (item: ReviewItemData, decision: "APPROVED" | "REJECTED") => {
        const updated = updateComparisonReviewDecision(item.id, decision);
        setData(updated);
        showToast(`Review item ${item.field} set to ${decision}.`);
    };

    // Filter and Sort
    const filteredSuppliers = data.suppliers.filter((s) => {
        if (locationFilter === "all") return true;
        return s.location.toLowerCase() === locationFilter.toLowerCase();
    });

    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
        if (sortBy === "cost_asc") return a.totalAmount - b.totalAmount;
        if (sortBy === "cost_desc") return b.totalAmount - a.totalAmount;
        return a.timelineDays - b.timelineDays;
    });

    const activeSelectedSupplier =
        sortedSuppliers.find((s) => s.id === selectedSupplierId) ||
        sortedSuppliers.find((s) => s.status === "shortlisted") ||
        sortedSuppliers.find((s) => s.isRecommended) ||
        sortedSuppliers[0];

    const reviewItems = data.reviewItems ?? [];
    const pendingReviews = reviewItems.filter((r) => r.decision === "PENDING").length;

    return (
        <main className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Notification Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl animate-fade-in">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* ========================================================================= */}
            {/* INITIAL STEP: MULTIPLE FILE UPLOAD SCREEN FIRST                           */}
            {/* ========================================================================= */}
            {!hasUploaded ? (
                <div className="mx-auto max-w-2xl py-10 space-y-8 animate-fade-in">
                    <div className="text-center space-y-2">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-8 w-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Upload Supplier Quotations
                        </h1>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Upload multiple quotation files (PDF, XLSX, or CSV). Gemini AI processes all files in parallel and opens the Dashboard with Human Review.
                        </p>
                    </div>

                    {/* Drag-and-drop / Multiple Files Selector Card */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`rounded-2xl border-2 border-dashed p-10 text-center shadow-sm transition ${
                            isDragging
                                ? "border-sky-500 bg-sky-50/70 scale-[1.01]"
                                : "border-slate-300 bg-white hover:border-sky-500"
                        }`}
                    >
                        <label className="cursor-pointer flex flex-col items-center justify-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <div>
                                <span className="inline-block rounded-xl bg-sky-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-800 transition">
                                    {isUploading
                                        ? uploadProgress
                                            ? `Extracting (${uploadProgress.current}/${uploadProgress.total}): ${uploadProgress.fileName}...`
                                            : "Extracting in parallel..."
                                        : "Select Multiple Quotation Files"}
                                </span>
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Drop files here or select multiple (PDF, Excel .xlsx/.xls, CSV)
                                </p>
                            </div>
                            <input
                                type="file"
                                multiple={true}
                                accept=".pdf,.xlsx,.xls,.csv"
                                onChange={(e) => handleFileInput(e, false)}
                                disabled={isUploading}
                                className="hidden"
                            />
                        </label>

                        {/* Fast Progress Indicator */}
                        {uploadProgress && (
                            <div className="mt-6 max-w-xs mx-auto space-y-1.5">
                                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                    <span>Processing file {uploadProgress.current} of {uploadProgress.total}</span>
                                    <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full bg-sky-600 transition-all duration-300"
                                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Instant Demo Option */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-3">
                        <div className="text-xs font-bold text-slate-700">Don't have quotation files right now?</div>
                        <p className="text-[11px] text-slate-500">
                            Load the 5-supplier demo comparison dataset to test the full comparison matrix and human review features immediately.
                        </p>
                        <button
                            onClick={handleLoadDemo}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                            <span>⚡ Load 5-Supplier Demo & Open Dashboard</span>
                        </button>
                    </div>
                </div>
            ) : (
                /* ========================================================================= */
                /* NEXT STEP: COMPARISON DASHBOARD & EMBEDDED HUMAN REVIEW                   */
                /* ========================================================================= */
                <div className="space-y-5 animate-fade-in">
                    {/* OUTPUT ACTION BANNER WITH [OK] AND [RECHECK] OPTIONS */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-slate-900 px-6 py-4 text-white shadow-md gap-4 border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-sm">
                                ✓
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                                    <span>Dashboard Output Ready ({sortedSuppliers.length} Quote{sortedSuppliers.length !== 1 ? "s" : ""})</span>
                                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                                        AI Extracted
                                    </span>
                                    {activeSelectedSupplier && (
                                        <span
                                            className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2.5 py-0.5 text-[10px] font-bold max-w-[240px] truncate"
                                            title={`Selected Supplier: ${activeSelectedSupplier.name}`}
                                        >
                                            Selected: {activeSelectedSupplier.name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Click <strong>OK</strong> to inspect supplier specifications, approve/reject clauses, and proceed to download.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* OK BUTTON: Directly goes to review section for the selected supplier */}
                            <button
                                onClick={handleGoToReview}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow"
                                title="Accept output and proceed to review supplier specifications"
                            >
                                <span>OK (Proceed to Review) →</span>
                            </button>
                        </div>
                    </div>

                    {/* SECTION 1: QUOTE COMPARISON TABLE */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        {/* Control Bar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setHasUploaded(false)}
                                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition flex items-center gap-1"
                                >
                                    <span>← Back to Upload Screen</span>
                                </button>
                                <span className="text-slate-300">|</span>
                                <span className="text-xs font-bold text-slate-800">RFQ id: KA001020</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Upload More Quotes Button (Multiple Files Supported) */}
                                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-800 transition">
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-3.5 w-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    <span>{isUploading ? "Extracting..." : "+ Add More Quotes"}</span>
                                    <input
                                        type="file"
                                        multiple={true}
                                        accept=".pdf,.xlsx,.xls,.csv"
                                        onChange={(e) => handleFileInput(e, true)}
                                        disabled={isUploading}
                                        className="hidden"
                                    />
                                </label>

                                {/* Filter by Location */}
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <span className="text-slate-400 font-medium">Filter:</span>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
                                    >
                                        <option value="all">All Locations</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Bangalore">Bangalore</option>
                                    </select>
                                </div>

                                {/* Sort by Controls */}
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                    <span className="text-slate-400 font-medium mr-0.5">Sort by:</span>
                                    <button
                                        onClick={() => setSortBy("cost_asc")}
                                        className={`rounded-lg px-2.5 py-1 font-medium transition ${
                                            sortBy === "cost_asc"
                                                ? "bg-sky-600 text-white font-semibold"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                        Cost - Low to High
                                    </button>
                                    <button
                                        onClick={() => setSortBy("cost_desc")}
                                        className={`rounded-lg px-2.5 py-1 font-medium transition ${
                                            sortBy === "cost_desc"
                                                ? "bg-sky-600 text-white font-semibold"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                        Cost - High to Low
                                    </button>
                                    <button
                                        onClick={() => setSortBy("timeline")}
                                        className={`rounded-lg px-2.5 py-1 font-medium transition ${
                                            sortBy === "timeline"
                                                ? "bg-sky-600 text-white font-semibold"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                        Timeline
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comparison Matrix Table (Create PO option removed!) */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="p-3 font-bold text-slate-500 w-44 bg-slate-50/60">
                                            Parameters
                                        </th>
                                        {sortedSuppliers.map((sup) => {
                                            const isBest = sup.isRecommended;
                                            const isSelected = activeSelectedSupplier?.id === sup.id;
                                            return (
                                                <th
                                                    key={sup.id}
                                                    className={`p-3 text-center border-l border-slate-200 min-w-[165px] transition ${
                                                        isSelected
                                                            ? "bg-sky-50/80 ring-2 ring-inset ring-sky-500 shadow-inner"
                                                            : isBest
                                                            ? "bg-emerald-50/70"
                                                            : "bg-white"
                                                    }`}
                                                >
                                                    <div
                                                        className="font-bold text-slate-900 text-xs sm:text-sm max-w-[170px] truncate mx-auto cursor-pointer hover:text-sky-600 transition"
                                                        title={`Click to select: ${sup.name}`}
                                                        onClick={() => setSelectedSupplierId(sup.id)}
                                                    >
                                                        {sup.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mb-1.5">{sup.location}</div>

                                                    {/* Select for Download Button */}
                                                    <button
                                                        onClick={() => setSelectedSupplierId(sup.id)}
                                                        className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 mb-2 ${
                                                            isSelected
                                                                ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-400"
                                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                                                        }`}
                                                        title="Select this supplier for quotation download"
                                                    >
                                                        {isSelected ? "✓ Selected" : "Select"}
                                                    </button>

                                                    {/* Clean Shortlist / Reject Actions (NO Create PO option) */}
                                                    <div className="flex items-center justify-center gap-3 py-0.5">
                                                        {/* Shortlist check */}
                                                        <button
                                                            onClick={() => handleShortlist(sup)}
                                                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                                                sup.status === "shortlisted"
                                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                                    : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                                            }`}
                                                            title="Shortlist Supplier"
                                                        >
                                                            ✓
                                                        </button>

                                                        {/* Reject cross */}
                                                        <button
                                                            onClick={() => handleRejectSupplier(sup)}
                                                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                                                sup.status === "rejected"
                                                                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                                                                    : "border-rose-300 text-rose-600 hover:bg-rose-50"
                                                            }`}
                                                            title="Reject Supplier"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {/* Timeline */}
                                    <tr>
                                        <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Timeline</td>
                                        {sortedSuppliers.map((sup) => (
                                            <td
                                                key={sup.id}
                                                className={`p-3 text-center border-l border-slate-200 ${
                                                    sup.isRecommended ? "bg-emerald-50/30 font-semibold text-emerald-900" : ""
                                                }`}
                                            >
                                                {sup.timelineDays} Days
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Payment Terms */}
                                    <tr>
                                        <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Payment Terms</td>
                                        {sortedSuppliers.map((sup) => (
                                            <td
                                                key={sup.id}
                                                className={`p-3 text-center border-l border-slate-200 ${
                                                    sup.isRecommended ? "bg-emerald-50/30" : ""
                                                }`}
                                            >
                                                {sup.paymentTerms}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Inco Terms */}
                                    <tr>
                                        <td className="p-3 font-semibold text-slate-600 bg-slate-50/40">Inco Terms</td>
                                        {sortedSuppliers.map((sup) => (
                                            <td
                                                key={sup.id}
                                                className={`p-3 text-center border-l border-slate-200 text-[11px] ${
                                                    sup.isRecommended ? "bg-emerald-50/30" : ""
                                                }`}
                                            >
                                                {sup.incoTerms}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Total Amount */}
                                    <tr className="bg-slate-50/80 font-bold border-t border-b border-slate-200">
                                        <td className="p-3 text-slate-900">Total Amount</td>
                                        {sortedSuppliers.map((sup) => (
                                            <td
                                                key={sup.id}
                                                className={`p-3 text-center border-l border-slate-200 text-slate-900 ${
                                                    sup.isRecommended ? "bg-emerald-100/60 text-emerald-950 font-extrabold" : ""
                                                }`}
                                            >
                                                ₹{sup.totalAmount.toLocaleString("en-IN")}/-
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Cost Line Items matching mockup */}
                                    {data.items.map((item) => (
                                        <tr key={item.id} className="border-t border-slate-200">
                                            <td className="p-3 bg-slate-50/40">
                                                <div className="font-bold text-slate-800">{item.name}</div>
                                                <div className="text-[11px] text-slate-500">Qty: {item.quantity} units</div>
                                            </td>
                                            {sortedSuppliers.map((sup) => {
                                                const cost = item.supplierCosts[sup.id];
                                                return (
                                                    <td
                                                        key={sup.id}
                                                        className={`p-3 text-center border-l border-slate-200 ${
                                                            sup.isRecommended ? "bg-emerald-50/30" : ""
                                                        }`}
                                                    >
                                                        <div className="font-semibold text-slate-800">
                                                            ₹{cost?.unitCost.toLocaleString("en-IN") ?? "—"}
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                setBreakupItem({
                                                                    name: `${item.name} (${sup.name})`,
                                                                    cost: cost?.unitCost ?? 1000,
                                                                })
                                                            }
                                                            className="text-[10px] text-sky-600 underline hover:text-sky-800"
                                                        >
                                                            View Breakup
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Breakup Modal */}
            {breakupItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-xs font-bold text-slate-900">{breakupItem.name}</h3>
                            <button
                                onClick={() => setBreakupItem(null)}
                                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span>Base Manufacturing Cost:</span>
                                <span className="font-bold text-slate-800">
                                    ₹{Math.round(breakupItem.cost * 0.85).toLocaleString("en-IN")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Packaging:</span>
                                <span>₹{Math.round(breakupItem.cost * 0.05).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Freight & Logistics:</span>
                                <span>₹{Math.round(breakupItem.cost * 0.06).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Applicable Taxes:</span>
                                <span>₹{Math.round(breakupItem.cost * 0.04).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                                <span>Total Unit Cost:</span>
                                <span>₹{breakupItem.cost.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setBreakupItem(null)}
                            className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
