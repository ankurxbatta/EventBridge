"use client";

import { EventBlueprint, Vendor, VendorStatus } from "@/types";

interface Props {
  blueprint: EventBlueprint;
  shortlistedVendors: Array<{ vendor: Vendor; status: VendorStatus; outreach: string }>;
}

export default function ExportButton({ blueprint, shortlistedVendors }: Props) {
  const handleExport = () => {
    const content = buildHTML(blueprint, shortlistedVendors);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(content);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:border-violet-500/30 hover:text-white transition-all"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export Brief
    </button>
  );
}

function buildHTML(
  bp: EventBlueprint,
  vendors: Array<{ vendor: Vendor; status: VendorStatus; outreach: string }>
): string {
  const statusLabel: Record<VendorStatus, string> = {
    none: "", contacted: "Contacted", interested: "Interested", passed: "Passed",
  };

  const vendorRows = vendors.map(({ vendor, status, outreach }) => `
    <div class="vendor-card">
      <div class="vendor-header">
        <div>
          <strong>${vendor.name}</strong>
          <span class="category">${vendor.category}</span>
          ${status !== "none" ? `<span class="status status-${status}">${statusLabel[status]}</span>` : ""}
        </div>
        <div class="fit-score">${vendor.fitScore}% fit</div>
      </div>
      <p class="meta">${vendor.location} · ${vendor.priceRange}</p>
      <p class="why">${vendor.whyMatched}</p>
      ${outreach ? `<div class="outreach"><p class="outreach-label">Outreach Message</p><p>${outreach}</p></div>` : ""}
    </div>
  `).join("");

  const riskItems = bp.risks.map((r) => `<li>${r}</li>`).join("");
  const serviceItems = bp.requiredServices.map((s) => `<span class="tag">${s}</span>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${bp.eventName} — Event Brief</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 2rem; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
  .subtitle { color: #6366f1; font-size: 0.9rem; font-weight: 600; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.1em; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6366f1; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .field { background: #f9fafb; border-radius: 8px; padding: 12px; }
  .field label { display: block; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: #9ca3af; margin-bottom: 4px; }
  .field p { font-size: 0.9rem; font-weight: 600; color: #1f2937; }
  .summary { background: #f5f3ff; border-radius: 8px; padding: 16px; font-size: 0.9rem; line-height: 1.6; color: #374151; }
  .tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag { background: #ede9fe; color: #5b21b6; border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; font-weight: 500; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; font-size: 0.9rem; color: #374151; }
  .vendor-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
  .vendor-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
  .vendor-header strong { font-size: 1rem; color: #1f2937; }
  .category { margin-left: 8px; font-size: 0.75rem; color: #6366f1; font-weight: 500; }
  .status { margin-left: 8px; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .status-contacted { background: #dbeafe; color: #1d4ed8; }
  .status-interested { background: #d1fae5; color: #065f46; }
  .status-passed { background: #f3f4f6; color: #6b7280; }
  .fit-score { font-weight: 700; color: #059669; font-size: 0.9rem; }
  .meta { font-size: 0.8rem; color: #9ca3af; margin-bottom: 6px; }
  .why { font-size: 0.85rem; color: #374151; margin-bottom: 8px; }
  .outreach { background: #f0fdf4; border-radius: 6px; padding: 12px; margin-top: 8px; }
  .outreach-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #059669; margin-bottom: 6px; }
  .outreach p { font-size: 0.85rem; color: #374151; white-space: pre-wrap; }
  .footer { margin-top: 40px; text-align: center; font-size: 0.75rem; color: #9ca3af; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <p class="subtitle">Event Brief — EventBridge</p>
  <h1>${bp.eventName}</h1>

  <div class="section" style="margin-top:24px">
    <p class="section-title">Blueprint</p>
    <div class="grid">
      <div class="field"><label>Event Type</label><p>${bp.eventType}</p></div>
      <div class="field"><label>Location</label><p>${bp.location}</p></div>
      <div class="field"><label>Audience Size</label><p>${bp.audienceSize}</p></div>
      <div class="field"><label>Duration</label><p>${bp.duration}</p></div>
      <div class="field"><label>Budget</label><p>${bp.estimatedBudget}</p></div>
      <div class="field"><label>Vibe</label><p>${bp.vibe}</p></div>
    </div>
    <div class="summary" style="margin-top:12px">${bp.summary}</div>
  </div>

  <div class="section">
    <p class="section-title">Required Services</p>
    <div class="tags">${serviceItems}</div>
  </div>

  <div class="section">
    <p class="section-title">Operational Risks</p>
    <ul>${riskItems}</ul>
  </div>

  ${vendors.length > 0 ? `
  <div class="section">
    <p class="section-title">Shortlisted Vendors (${vendors.length})</p>
    ${vendorRows}
  </div>` : ""}

  <p class="footer">Generated by EventBridge · ${new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>
</body>
</html>`;
}
