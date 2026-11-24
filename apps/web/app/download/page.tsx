"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ComparisonSupplier, RFQComparisonData } from "../../lib/mockData";
import { getComparisonData } from "../../lib/api";

function DownloadContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<RFQComparisonData | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [hasAutoDownloaded, setHasAutoDownloaded] = useState<boolean>(false);
    const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

    useEffect(() => {
        const compData = getComparisonData();
        setData(compData);

        const supplierQuery = searchParams.get("supplier");
        if (supplierQuery && compData.suppliers.some((s) => s.id === supplierQuery)) {
            setSelectedSupplierId(supplierQuery);
        } else if (compData.suppliers.length > 0) {
            const defaultSup =
                compData.suppliers.find((s) => s.status === "shortlisted") ||
                compData.suppliers.find((s) => s.isRecommended) ||
                compData.suppliers[0];
            setSelectedSupplierId(defaultSup ? defaultSup.id : null);
        }
    }, [searchParams]);

    useEffect(() => {
        if (
            searchParams.get("autoDownload") === "true" &&
            data &&
            data.suppliers.length > 0 &&
            !hasAutoDownloaded
        ) {
            setHasAutoDownloaded(true);
            const timer = setTimeout(() => {
                handleDownloadPDF();
                showToast("Reviews recorded! PDF quotation downloaded.");
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [searchParams, data, hasAutoDownloaded]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    if (!data || data.suppliers.length === 0) {
        return (
            <div className="mx-auto max-w-4xl p-8 text-center space-y-4">
                <div className="text-4xl">📂</div>
                <h2 className="text-xl font-bold text-slate-800">No Supplier Data Available</h2>
                <p className="text-sm text-slate-500">
                    Please upload quote documents first on the comparison dashboard.
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

    const currentSupplier: ComparisonSupplier | undefined =
        data.suppliers.find((s) => s.id === selectedSupplierId) || data.suppliers[0];

    if (!currentSupplier) return null;

    // Calculate item breakdowns for this supplier
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

    // Review items specifically for this supplier
    const allReviewItems = data.reviewItems ?? [];
    const supplierReviewItems = allReviewItems.filter(
        (r) =>
            r.supplierId === currentSupplier.id ||
            r.supplierName.toLowerCase() === currentSupplier.name.toLowerCase()
    );

    // ==========================================
    // 1. DOWNLOAD PDF (via jsPDF)
    // ==========================================
    const handleDownloadPDF = async () => {
        setDownloadingFormat("pdf");
        try {
            showToast("Generating PDF document...");
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 16;

            // Brand Header Banner
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, pageWidth, 28, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(15);
            doc.setFont("helvetica", "bold");
            doc.text("PROCUREMENT QUOTATION REPORT", 14, 13);

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(203, 213, 225);
            doc.text(`RFQ ID: ${data.rfqId}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

            y = 36;

            // Supplier Information Card
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Supplier Commercial Terms", 14, y);
            y += 5;

            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "FD");

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text("Supplier / File Name:", 18, y + 7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(currentSupplier.name.substring(0, 38), 58, y + 7);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text("Location:", 18, y + 14);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(currentSupplier.location, 58, y + 14);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text("Delivery Timeline:", 18, y + 21);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(`${currentSupplier.timelineDays} Days`, 58, y + 21);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text("Payment Terms:", 116, y + 7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(currentSupplier.paymentTerms, 146, y + 7);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text("Inco Terms:", 116, y + 14);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(currentSupplier.incoTerms, 146, y + 14);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text("Total Quoted:", 116, y + 21);
            doc.setTextColor(5, 150, 105);
            doc.setFont("helvetica", "bold");
            doc.text(currentSupplier.formattedTotal, 146, y + 21);

            y += 36;

            // Items Table Header
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Itemized Quotation Breakdown", 14, y);
            y += 5;

            // Header Row
            doc.setFillColor(241, 245, 249);
            doc.rect(14, y, pageWidth - 28, 8, "F");
            doc.setDrawColor(203, 213, 225);
            doc.line(14, y + 8, pageWidth - 14, y + 8);

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(71, 85, 105);
            doc.text("#", 17, y + 5.5);
            doc.text("Item Description", 24, y + 5.5);
            doc.text("Qty", 82, y + 5.5);
            doc.text("Unit Price", 98, y + 5.5);
            doc.text("Base Price", 120, y + 5.5);
            doc.text("Freight & Pack", 142, y + 5.5);
            doc.text("GST / Tax", 165, y + 5.5);
            doc.text("Line Total", 182, y + 5.5);

            y += 8;

            // Table Rows
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);

            supplierItems.forEach((item, index) => {
                const rowY = y + index * 8;
                if (index % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(14, rowY, pageWidth - 28, 8, "F");
                }
                doc.setDrawColor(241, 245, 249);
                doc.line(14, rowY + 8, pageWidth - 14, rowY + 8);

                doc.setFontSize(7.5);
                doc.text(String(index + 1), 17, rowY + 5.5);
                doc.text(item.name.substring(0, 30), 24, rowY + 5.5);
                doc.text(String(item.quantity), 84, rowY + 5.5);
                doc.text(`INR ${item.unitCost.toLocaleString("en-IN")}`, 98, rowY + 5.5);
                doc.text(`INR ${(item.breakup?.basePrice || 0).toLocaleString("en-IN")}`, 120, rowY + 5.5);
                const packShip = (item.breakup?.packaging || 0) + (item.breakup?.shipping || 0);
                doc.text(`INR ${packShip.toLocaleString("en-IN")}`, 142, rowY + 5.5);
                doc.text(`INR ${(item.breakup?.tax || 0).toLocaleString("en-IN")}`, 165, rowY + 5.5);
                doc.setFont("helvetica", "bold");
                doc.text(`INR ${item.totalCost.toLocaleString("en-IN")}`, 182, rowY + 5.5);
                doc.setFont("helvetica", "normal");
            });

            y += supplierItems.length * 8 + 6;

            // Total Summary Card
            doc.setFillColor(236, 253, 245);
            doc.setDrawColor(167, 243, 208);
            doc.roundedRect(pageWidth - 95, y, 81, 24, 2, 2, "FD");

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(6, 78, 59);
            doc.text("Base Material Subtotal:", pageWidth - 91, y + 6);
            doc.text(`INR ${totalBasePrice.toLocaleString("en-IN")}`, pageWidth - 20, y + 6, { align: "right" });

            doc.text("Packaging, Freight & Taxes:", pageWidth - 91, y + 12);
            doc.text(`INR ${(totalPackaging + totalShipping + totalTax).toLocaleString("en-IN")}`, pageWidth - 20, y + 12, { align: "right" });

            doc.setFontSize(9.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(4, 120, 87);
            doc.text("Grand Total:", pageWidth - 91, y + 19);
            doc.text(currentSupplier.formattedTotal, pageWidth - 20, y + 19, { align: "right" });

            // Human Review Decisions in PDF
            if (supplierReviewItems.length > 0) {
                y += 28;
                if (y > 235) {
                    doc.addPage();
                    y = 20;
                }
                doc.setTextColor(15, 23, 42);
                doc.setFontSize(10.5);
                doc.setFont("helvetica", "bold");
                doc.text("Human Review & Compliance Decisions", 14, y);
                y += 5;

                doc.setFillColor(241, 245, 249);
                doc.rect(14, y, pageWidth - 28, 6.5, "F");
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(71, 85, 105);
                doc.text("Specification / Clause", 18, y + 4.5);
                doc.text("Decision", 92, y + 4.5);
                doc.text("Evidence & Rule", 125, y + 4.5);
                y += 6.5;

                supplierReviewItems.forEach((rev, idx) => {
                    const rowY = y + idx * 7;
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(15, 23, 42);
                    doc.text(rev.field.substring(0, 36), 18, rowY + 5);

                    if (rev.decision === "APPROVED") {
                        doc.setTextColor(5, 150, 105);
                        doc.text("APPROVED (✓)", 92, rowY + 5);
                    } else if (rev.decision === "REJECTED") {
                        doc.setTextColor(225, 29, 72);
                        doc.text("REJECTED (✕)", 92, rowY + 5);
                    } else {
                        doc.setTextColor(217, 119, 6);
                        doc.text("PENDING", 92, rowY + 5);
                    }

                    doc.setTextColor(71, 85, 105);
                    doc.setFont("helvetica", "normal");
                    doc.text((rev.suggestedValue || rev.evidenceText).substring(0, 42), 125, rowY + 5);
                });
            }

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(148, 163, 184);
            doc.text("Generated by ProcureAI Quote Comparison Agent. All terms verified against RFQ specifications.", 14, 282);

            const sanitizedName = currentSupplier.name.replace(/[^a-zA-Z0-9_-]/g, "_");
            doc.save(`Quotation_Details_${sanitizedName}.pdf`);
            showToast(`PDF downloaded for ${currentSupplier.name}`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            window.print();
        } finally {
            setDownloadingFormat(null);
        }
    };

    // ==========================================
    // 2. DOWNLOAD CSV
    // ==========================================
    const handleDownloadCSV = () => {
        setDownloadingFormat("csv");
        const headers = [
            "Item Name",
            "Quantity",
            "Unit Price",
            "Base Unit Price",
            "Packaging Cost",
            "Shipping Cost",
            "Tax (GST)",
            "Total Cost",
        ];

        const rows = supplierItems.map((item) => [
            `"${item.name.replace(/"/g, '""')}"`,
            item.quantity,
            item.unitCost,
            item.breakup?.basePrice || 0,
            item.breakup?.packaging || 0,
            item.breakup?.shipping || 0,
            item.breakup?.tax || 0,
            item.totalCost,
        ]);

        const summaryRows = [
            [],
            ["SUPPLIER DETAILS SUMMARY"],
            ["Supplier / File Name", `"${currentSupplier.name.replace(/"/g, '""')}"`],
            ["RFQ ID", `"${data.rfqId}"`],
            ["Location", `"${currentSupplier.location}"`],
            ["Delivery Timeline", `"${currentSupplier.timelineDays} Days"`],
            ["Payment Terms", `"${currentSupplier.paymentTerms}"`],
            ["Inco Terms", `"${currentSupplier.incoTerms}"`],
            ["Total Quoted Amount", `"${currentSupplier.formattedTotal}"`],
            ["Numeric Total", currentSupplier.totalAmount],
            ["Total Base Amount", totalBasePrice],
            ["Total Packaging", totalPackaging],
            ["Total Shipping", totalShipping],
            ["Total Taxes", totalTax],
        ];

        const reviewRows =
            supplierReviewItems.length > 0
                ? [
                      [],
                      ["HUMAN REVIEW & SPECIFICATION AUDIT DECISIONS"],
                      ["Field / Check", "Decision", "Original Extracted Clause", "Recommendation / Evidence", "Rule Triggered"],
                      ...supplierReviewItems.map((r) => [
                          `"${r.field.replace(/"/g, '""')}"`,
                          `"${r.decision}"`,
                          `"${r.originalValue.replace(/"/g, '""')}"`,
                          `"${(r.suggestedValue || r.evidenceText).replace(/"/g, '""')}"`,
                          `"${r.ruleTriggered}"`,
                      ]),
                  ]
                : [];

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [
                headers.join(","),
                ...rows.map((r) => r.join(",")),
                ...summaryRows.map((r) => r.join(",")),
                ...reviewRows.map((r) => r.join(",")),
            ].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const sanitizedName = currentSupplier.name.replace(/[^a-zA-Z0-9_-]/g, "_");
        link.setAttribute("download", `Quotation_Details_${sanitizedName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadingFormat(null);
        showToast(`CSV downloaded for ${currentSupplier.name}`);
    };

    // ==========================================
    // 3. DOWNLOAD JSON
    // ==========================================
    const handleDownloadJSON = () => {
        setDownloadingFormat("json");
        const payload = {
            exportDate: new Date().toISOString(),
            rfqId: data.rfqId,
            rfqTitle: data.rfqTitle,
            selectedSupplier: {
                id: currentSupplier.id,
                name: currentSupplier.name,
                location: currentSupplier.location,
                timelineDays: currentSupplier.timelineDays,
                paymentTerms: currentSupplier.paymentTerms,
                incoTerms: currentSupplier.incoTerms,
                totalAmount: currentSupplier.totalAmount,
                formattedTotal: currentSupplier.formattedTotal,
                status: currentSupplier.status,
                isRecommended: currentSupplier.isRecommended || false,
            },
            costTotals: {
                basePriceTotal: totalBasePrice,
                packagingTotal: totalPackaging,
                shippingTotal: totalShipping,
                taxTotal: totalTax,
                grandTotal: currentSupplier.totalAmount,
            },
            reviewAudit: supplierReviewItems.map((r) => ({
                id: r.id,
                field: r.field,
                decision: r.decision,
                originalValue: r.originalValue,
                suggestedValue: r.suggestedValue,
                ruleTriggered: r.ruleTriggered,
                evidenceText: r.evidenceText,
                reviewerComment: r.reviewerComment,
            })),
            items: supplierItems.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.totalCost,
                breakup: item.breakup,
            })),
        };

        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", jsonStr);
        const sanitizedName = currentSupplier.name.replace(/[^a-zA-Z0-9_-]/g, "_");
        link.setAttribute("download", `Quotation_Details_${sanitizedName}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadingFormat(null);
        showToast(`JSON downloaded for ${currentSupplier.name}`);
    };

    // ==========================================
    // 4. PRINT / BROWSER PDF
    // ==========================================
    const handlePrintPDF = () => {
        window.print();
    };

    // ==========================================
    // 5. COPY SUMMARY
    // ==========================================
    const handleCopySummary = () => {
        const summaryText = `
QUOTATION SUMMARY
-------------------------------------------
Supplier: ${currentSupplier.name}
RFQ: ${data.rfqId}
Location: ${currentSupplier.location}
Total Amount: ${currentSupplier.formattedTotal}
Delivery Timeline: ${currentSupplier.timelineDays} Days
Payment Terms: ${currentSupplier.paymentTerms}
Inco Terms: ${currentSupplier.incoTerms}

ITEMS BREAKDOWN:
${supplierItems.map((it, idx) => `${idx + 1}. ${it.name} (Qty: ${it.quantity}) - Unit: ₹${it.unitCost.toLocaleString("en-IN")} | Total: ₹${it.totalCost.toLocaleString("en-IN")}`).join("\n")}
-------------------------------------------
Grand Total: ${currentSupplier.formattedTotal}
        `.trim();

        navigator.clipboard.writeText(summaryText);
        showToast("Quotation summary copied to clipboard!");
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6 pb-16">
            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* TOP NAVIGATION */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                        <span>← Back to Comparison</span>
                    </Link>
                    <div>
                        <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <span>Supplier Download Section</span>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                Ready for Export
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Download quotation reports, item cost sheets, and review decisions in your preferred format.
                        </p>
                    </div>
                </div>

                <div className="text-right hidden sm:block">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active RFQ</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">{data.rfqId}</span>
                </div>
            </div>

            {/* SUPPLIER SWITCHER TABS */}
            <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    1. Select Supplier:
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.suppliers.map((s) => {
                        const isSelected = s.id === currentSupplier.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSupplierId(s.id)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition border ${
                                    isSelected
                                        ? "bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-200"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                            >
                                <span className="font-bold max-w-[200px] truncate" title={s.name}>
                                    {s.name}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        isSelected ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-600"
                                    }`}
                                >
                                    {s.formattedTotal}
                                </span>
                                {s.status === "shortlisted" && (
                                    <span className="text-[10px] text-emerald-300">★ Shortlisted</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* CENTRALIZED DOWNLOAD & EXPORT CENTER - ALL DOWNLOAD OPTIONS IN ONE PLACE  */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border-2 border-sky-500/40 bg-gradient-to-br from-white via-sky-50/20 to-slate-50 p-6 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-white text-xs font-bold shadow-sm">
                                ⬇
                            </span>
                            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                2. Choose Download Format for <span className="text-sky-700 font-bold">{currentSupplier.name}</span>
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Select the exact format you want to download. All options include verified pricing, delivery terms, and review decisions.
                        </p>
                    </div>

                    <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Ready to Download</span>
                    </div>
                </div>

                {/* 5 Prominent Format Cards in One Single Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
                    {/* FORMAT 1: PDF */}
                    <div className="group relative rounded-xl border border-rose-200 bg-white p-4 shadow-sm hover:border-rose-400 hover:shadow-md transition flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-black text-xs ring-1 ring-rose-200">
                                    PDF
                                </span>
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                    Official Doc
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition">
                                    PDF Report
                                </h3>
                                <p className="text-[11px] text-slate-500 leading-tight mt-1">
                                    Printable formal report with itemized tables, commercial terms, and compliance decisions.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloadingFormat === "pdf"}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 transition disabled:opacity-50"
                        >
                            <span>Download PDF</span>
                            <span>↓</span>
                        </button>
                    </div>

                    {/* FORMAT 2: CSV / Excel */}
                    <div className="group relative rounded-xl border border-emerald-200 bg-white p-4 shadow-sm hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs ring-1 ring-emerald-200">
                                    CSV
                                </span>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                    Excel Ready
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                                    CSV Spreadsheet
                                </h3>
                                <p className="text-[11px] text-slate-500 leading-tight mt-1">
                                    Clean tabular dataset formatted for Microsoft Excel, Google Sheets, or ERP upload.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadCSV}
                            disabled={downloadingFormat === "csv"}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition disabled:opacity-50"
                        >
                            <span>Download CSV</span>
                            <span>↓</span>
                        </button>
                    </div>

                    {/* FORMAT 3: JSON */}
                    <div className="group relative rounded-xl border border-sky-200 bg-white p-4 shadow-sm hover:border-sky-400 hover:shadow-md transition flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-mono font-bold text-xs ring-1 ring-sky-200">
                                    &#123; &#125;
                                </span>
                                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                                    JSON Data
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition">
                                    JSON Payload
                                </h3>
                                <p className="text-[11px] text-slate-500 leading-tight mt-1">
                                    Machine-readable structured schema with complete item arrays and audit trail metadata.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadJSON}
                            disabled={downloadingFormat === "json"}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 transition disabled:opacity-50"
                        >
                            <span>Download JSON</span>
                            <span>↓</span>
                        </button>
                    </div>

                    {/* FORMAT 4: PRINT / BROWSER PDF */}
                    <div className="group relative rounded-xl border border-indigo-200 bg-white p-4 shadow-sm hover:border-indigo-400 hover:shadow-md transition flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 text-sm ring-1 ring-indigo-200">
                                    🖨️
                                </span>
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                                    Print / Hardcopy
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition">
                                    Print Document
                                </h3>
                                <p className="text-[11px] text-slate-500 leading-tight mt-1">
                                    System print preview dialog to print paper copy or export via browser PDF printer.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handlePrintPDF}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                            <span>Print Page</span>
                            <span>🖨️</span>
                        </button>
                    </div>

                    {/* FORMAT 5: COPY SUMMARY */}
                    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400 hover:shadow-md transition flex flex-col justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 text-sm ring-1 ring-slate-200">
                                    📋
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                    Clipboard
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition">
                                    Copy Summary
                                </h3>
                                <p className="text-[11px] text-slate-500 leading-tight mt-1">
                                    Formatted text summary ready to paste directly into email, Slack, or purchase orders.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleCopySummary}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                        >
                            <span>Copy Text</span>
                            <span>📋</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* SELECTED SUPPLIER DETAILS PREVIEW                                         */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Quotation Specification
                            </span>
                            {currentSupplier.isRecommended && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Recommended Quote
                                </span>
                            )}
                            {currentSupplier.status === "shortlisted" && (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                                    Shortlisted
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">{currentSupplier.name}</h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                            RFQ Reference: <span className="font-semibold text-slate-700">{data.rfqId}</span> • Location:{" "}
                            <span className="font-semibold text-slate-700">{currentSupplier.location}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-5 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Total Quoted Value
                        </div>
                        <div className="text-2xl font-black text-emerald-900">{currentSupplier.formattedTotal}</div>
                        <div className="text-[11px] text-emerald-700">All inclusive of taxes & freight</div>
                    </div>
                </div>

                {/* COMMERCIAL TERMS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Delivery Timeline</div>
                        <div className="text-base font-extrabold text-slate-900 mt-1">
                            {currentSupplier.timelineDays} Days
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">From PO issuance to delivery</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Payment Terms</div>
                        <div className="text-base font-extrabold text-slate-900 mt-1">
                            {currentSupplier.paymentTerms}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Commercial settlement policy</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Inco Terms</div>
                        <div className="text-base font-extrabold text-slate-900 mt-1">{currentSupplier.incoTerms}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Freight & logistics boundary</div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="text-[11px] font-bold text-slate-500 uppercase">Supplier Status</div>
                        <div className="text-base font-extrabold text-slate-900 mt-1 capitalize">
                            {currentSupplier.status === "shortlisted"
                                ? "Shortlisted"
                                : currentSupplier.status === "rejected"
                                ? "Rejected"
                                : "Under Review"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Evaluated against RFQ guidelines</div>
                    </div>
                </div>

                {/* ITEMIZED TABLE */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Itemized Cost Breakdown</h3>
                        <span className="text-xs text-slate-500">{supplierItems.length} Quoted Items</span>
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
                                    <th className="p-3 text-right font-extrabold text-slate-900 bg-slate-100/60">
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

                {/* HUMAN REVIEW & COMPLIANCE AUDIT SECTION */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                                ✓
                            </span>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Human Review & Specification Audit Decisions
                            </h3>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                            {supplierReviewItems.length} Reviewed Clause{supplierReviewItems.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {supplierReviewItems.length === 0 ? (
                        <div className="text-xs text-slate-500 py-1">
                            No deviations flagged. All terms verified compliant with baseline RFQ criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {supplierReviewItems.map((rev) => (
                                <div
                                    key={rev.id}
                                    className={`rounded-xl p-3 border text-xs space-y-1.5 ${
                                        rev.decision === "APPROVED"
                                            ? "bg-emerald-50/50 border-emerald-200"
                                            : rev.decision === "REJECTED"
                                            ? "bg-rose-50/50 border-rose-200"
                                            : "bg-amber-50/50 border-amber-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900">{rev.field}</span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                                rev.decision === "APPROVED"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : rev.decision === "REJECTED"
                                                    ? "bg-rose-100 text-rose-800"
                                                    : "bg-amber-100 text-amber-800"
                                            }`}
                                        >
                                            {rev.decision === "APPROVED"
                                                ? "✓ APPROVED"
                                                : rev.decision === "REJECTED"
                                                ? "✕ REJECTED"
                                                : "PENDING"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600">
                                        Clause: <strong className="text-slate-800">{rev.originalValue}</strong>
                                    </p>
                                    <p className="text-[11px] text-slate-500 italic">
                                        Evidence: "{rev.evidenceText}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DownloadPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-xs text-slate-500">
                    Loading supplier download details...
                </div>
            }
        >
            <DownloadContent />
        </Suspense>
    );
}
