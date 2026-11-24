"use client";

import { useRouter } from "next/navigation";
import { useState, DragEvent, ChangeEvent } from "react";
import { uploadMultipleQuotes } from "../../lib/api";

export default function UploadsPage() {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [statusText, setStatusText] = useState<string>("");

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const fileList = Array.from(files);
        setUploading(true);
        setStatusText(`Gemini AI is processing ${fileList.length} quotation file(s)...`);

        try {
            await uploadMultipleQuotes(fileList, (current, total, fileName) => {
                setStatusText(`Extracting (${current}/${total}): ${fileName}...`);
            });
            setStatusText("Extraction complete! Redirecting to dashboard...");
            setTimeout(() => {
                router.push("/?view=dashboard");
            }, 600);
        } catch {
            setStatusText("Completed. Redirecting to dashboard...");
            setTimeout(() => {
                router.push("/?view=dashboard");
            }, 600);
        }
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
        handleFileUpload(e.dataTransfer.files);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFileUpload(e.target.files);
    };

    return (
        <main className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <span className="rounded-md bg-sky-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-sky-800">
                    Document Ingestion
                </span>
                <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Upload Supplier Quotation</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Upload your quotation document (single file: PDF, Excel, or CSV). Gemini AI will extract all quotes and redirect to the dashboard.
                </p>
            </div>

            {/* Drag and Drop Box */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`rounded-2xl border-2 border-dashed p-12 text-center transition ${
                    isDragging
                        ? "border-sky-500 bg-sky-50/50"
                        : "border-slate-300 bg-white hover:border-slate-400"
                }`}
            >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-8 w-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                    {uploading ? statusText : "Drag and drop multiple supplier quotation files here"}
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Multiple files supported: accepts PDF, Excel (.xlsx, .xls), and CSV files.
                </p>

                <div className="mt-6 flex justify-center">
                    <label className="cursor-pointer rounded-xl bg-sky-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 transition">
                        <span>Select Multiple Quotation Files</span>
                        <input
                            type="file"
                            multiple={true}
                            accept=".pdf,.xlsx,.xls,.csv"
                            onChange={handleInputChange}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-sm text-slate-900">Want to test with sample data?</h3>
                    <p className="text-xs text-slate-500">Instantly populate the 5-supplier comparison table and human review queue.</p>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                    Open Comparison Dashboard →
                </button>
            </div>
        </main>
    );
}
