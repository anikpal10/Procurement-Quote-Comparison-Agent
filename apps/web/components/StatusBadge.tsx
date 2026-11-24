import { CaseStatus, MatchStatus, ReviewDecision } from "../types";

interface StatusBadgeProps {
    status: CaseStatus | MatchStatus | ReviewDecision | string;
    size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
    const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs";

    const getColors = (val: string): string => {
        switch (val) {
            case "EXACT_MATCH":
            case "APPROVED":
            case "COMPARABLE":
            case "Verified":
                return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
            case "EQUIVALENT":
            case "OVERRIDDEN":
            case "NEEDS_REVIEW":
            case "Needs review":
            case "UPLOADING":
            case "QUEUED":
            case "EXTRACTING":
                return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
            case "SPEC_MISMATCH":
            case "REJECTED":
            case "FAILED":
            case "Specification mismatch":
                return "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20";
            case "CREATED":
            case "PENDING":
                return "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20";
            default:
                return "bg-slate-100 text-slate-700 ring-1 ring-slate-300";
        }
    };

    const formatLabel = (val: string): string => {
        return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    };

    return (
        <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${getColors(status)}`}>
            {formatLabel(status)}
        </span>
    );
}
