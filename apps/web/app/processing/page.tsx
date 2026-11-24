"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PipelineStage } from "../../types";
import { ArrowPathIcon, CheckCircleIcon, ScalesIcon, SparklesIcon } from "../../components/Icons";

const initialStages: PipelineStage[] = [
    {
        id: "stage-1",
        name: "Document Ingestion & Checksum Verification",
        description: "Validates PDF/Excel file structures, generates SHA-256 integrity hashes and scans for duplicate bids.",
        status: "completed",
        progressPct: 100,
        details: "3 quotation documents verified. Zero duplicates detected.",
    },
    {
        id: "stage-2",
        name: "Gemini 2.5 Pro Multimodal Extraction",
        description: "Extracts supplier headers, line items, pricing tiers, incoterms, freight, and technical specification tables.",
        status: "completed",
        progressPct: 100,
        details: "Structured JSON schema enforced. Average confidence: 92.7%.",
    },
    {
        id: "stage-3",
        name: "Technical Specification Matching",
        description: "Compares offered material grades, outer diameters, wall thicknesses, and test certificates against buyer RFQ.",
        status: "completed",
        progressPct: 100,
        details: "1 exact match, 1 equivalent (welded vs seamless), 1 upgraded material grade flagged for review.",
    },
    {
        id: "stage-4",
        name: "Deterministic Landed-Cost Normalization",
        description: "Calculates total landed cost using Python decimal arithmetic, normalizing incoterms, currency conversion, and freight.",
        status: "completed",
        progressPct: 100,
        details: "Acero Global: £63,850.00 | BritMetals: £61,350.00 | Continental Tube: £67,540.00.",
    },
    {
        id: "stage-5",
        name: "Human-in-the-Loop Review Gating",
        description: "Flags low-confidence parameters and specification deviations for mandatory reviewer sign-off.",
        status: "completed",
        progressPct: 100,
        details: "2 items routed to Reviewer Queue; 1 pre-approved upgrade.",
    },
];

const mockLogs: string[] = [
    "[16:14:02] [INGESTION] Received 3 supplier quotation payloads for case RFQ-2026-UK-084.",
    "[16:14:03] [SHA256] Verified Acero_Global_Quote_Steel_Pipes.pdf: 8f7b2c91d4e0a5e8f1b2c3d4e5f6a7b8.",
    "[16:14:04] [GEMINI_ORCHESTRATOR] Initialized Gemini 2.5 Pro session with structured Pydantic extraction schema.",
    "[16:14:06] [GEMINI_ORCHESTRATOR] Extracted 1 line items, Incoterm DDP, payment terms 'Net 30' (confidence: 0.98).",
    "[16:14:08] [SPEC_VALIDATOR] BritMetals: Offered Welded & Drawn instead of Seamless. Triggering Rule 'MANDATORY_SPEC_CHECK'.",
    "[16:14:10] [CURRENCY_ENGINE] Converted Continental Tube EUR 155.30/m @ 0.85 GBP/EUR rate. Customs duty estimated: £1,320.00.",
    "[16:14:11] [DECIMAL_MATH] Landed cost computation complete with zero float rounding errors.",
    "[16:14:12] [PIPELINE] Ready for Human-in-the-Loop review and comparative analysis.",
];

export default function ProcessingPage() {
    const [stages, setStages] = useState<PipelineStage[]>(initialStages);
    const [isReRunning, setIsReRunning] = useState<boolean>(false);
    const [activeStageIndex, setActiveStageIndex] = useState<number>(5);

    const handleReRun = () => {
        setIsReRunning(true);
        setActiveStageIndex(0);

        setStages((prev) =>
            prev.map((s, idx) => ({
                ...s,
                status: idx === 0 ? "in_progress" : "idle",
                progressPct: idx === 0 ? 30 : 0,
            }))
        );

        let current = 0;
        const interval = setInterval(() => {
            current += 1;
            setActiveStageIndex(current);

            setStages((prev) =>
                prev.map((s, idx) => {
                    if (idx < current) {
                        return { ...s, status: "completed", progressPct: 100 };
                    }
                    if (idx === current) {
                        return { ...s, status: "in_progress", progressPct: 65 };
                    }
                    return { ...s, status: "idle", progressPct: 0 };
                })
            );

            if (current >= 5) {
                clearInterval(interval);
                setIsReRunning(false);
                setStages(initialStages);
            }
        }, 1200);
    };

    return (
        <main className="p-8">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-800">
                            AI Agent Pipeline
                        </span>
                        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Extraction & Matching Engine</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Real-time tracking of Gemini 2.5 Pro multimodal extraction, specification verification, and landed-cost rules.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReRun}
                            disabled={isReRunning}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${isReRunning ? "animate-spin text-sky-600" : ""}`} />
                            {isReRunning ? "Running Pipeline..." : "Re-run Extraction"}
                        </button>
                        <Link
                            href="/comparison"
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 transition"
                        >
                            <ScalesIcon className="h-4 w-4" />
                            Open Comparison Workbench →
                        </Link>
                    </div>
                </div>

                {/* Pipeline Stages Card */}
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Operational Execution Stages
                    </h2>

                    <div className="mt-6 space-y-6">
                        {stages.map((stage, idx) => {
                            const isCompleted = stage.status === "completed";
                            const isInProgress = stage.status === "in_progress";

                            return (
                                <div key={stage.id} className="relative flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                                                isCompleted
                                                    ? "bg-emerald-600 text-white"
                                                    : isInProgress
                                                    ? "bg-sky-600 text-white ring-4 ring-sky-100 animate-pulse"
                                                    : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : idx + 1}
                                        </div>
                                        {idx < stages.length - 1 && (
                                            <div
                                                className={`mt-2 h-12 w-0.5 ${
                                                    isCompleted ? "bg-emerald-300" : "bg-slate-200"
                                                }`}
                                            />
                                        )}
                                    </div>

                                    <div className="flex-1 pb-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <h3 className="text-sm font-bold text-slate-900">{stage.name}</h3>
                                            <span
                                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block w-fit ${
                                                    isCompleted
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : isInProgress
                                                        ? "bg-sky-50 text-sky-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {isCompleted ? "Completed" : isInProgress ? "Processing..." : "Pending"}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{stage.description}</p>

                                        {stage.details && (
                                            <div className="mt-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 border border-slate-100">
                                                {stage.details}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Live Console Output Card */}
                <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm ring-1 ring-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <h2 className="text-xs font-mono font-semibold text-slate-300">
                                Gemini Agent Execution Log Stream
                            </h2>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Model: gemini-2.5-pro</span>
                    </div>

                    <div className="mt-4 space-y-1.5 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto">
                        {mockLogs.map((log, i) => (
                            <p key={i} className="leading-relaxed">
                                {log}
                            </p>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
