"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateConfidence = estimateConfidence;
function estimateConfidence(params) {
    let score = params.baseScore;
    const factors = { positive: [], negative: [] };
    const supBonus = Math.min(params.supportingEvidenceCount, 4) * 0.03;
    if (supBonus > 0) {
        score += supBonus;
        factors.positive.push(`+${(supBonus * 100).toFixed(0)}% from supporting evidence`);
    }
    const indBonus = Math.min(Math.max(0, params.independentSourceCount - 1), 3) * 0.04;
    if (indBonus > 0) {
        score += indBonus;
        factors.positive.push(`+${(indBonus * 100).toFixed(0)}% from independent sources`);
    }
    const linkPen = params.missingLinkCount * 0.12;
    if (linkPen > 0) {
        score -= linkPen;
        factors.negative.push(`-${(linkPen * 100).toFixed(0)}% from missing logical links`);
    }
    if (params.temporalGapSeconds > 120) {
        score -= 0.05;
        factors.negative.push('-5% from temporal gap > 120s');
    }
    if (!params.hasPayloadData) {
        score -= 0.08;
        factors.negative.push('-8% due to missing payload data');
    }
    if (!params.hasParentChildTelemetry) {
        score -= 0.10;
        factors.negative.push('-10% due to missing parent-child telemetry');
    }
    score = Math.max(0.05, Math.min(0.97, score));
    return { score, factors };
}
