// Utilities to estimate QR scan reliability heuristically.

export interface ScanAssessment {
    contrastRatio: number; // WCAG style ratio
    contrastOk: boolean;
    logoRisk: 'low' | 'moderate' | 'high';
    recommendations: string[];
}

// relative luminance
function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const a = [r, g, b].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function contrastRatio(foreground: string, background: string): number {
    const L1 = luminance(foreground);
    const L2 = luminance(background);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return +(((lighter + 0.05) / (darker + 0.05))).toFixed(2);
}

export function assessScanability(params: { foreground: string; background: string; errorCorrection: string; logoSizeRatio: number; margin: number; }): ScanAssessment {
    const cr = contrastRatio(params.foreground, params.background);
    const contrastOk = cr >= 4.5; // threshold for small text analogous
    // Rough logo risk heuristic combining size and error correction.
    const size = params.logoSizeRatio;
    let logoRisk: ScanAssessment['logoRisk'];
    if (size < 0.18) logoRisk = 'low';
    else if (size < 0.28) logoRisk = params.errorCorrection === 'H' ? 'moderate' : 'high';
    else logoRisk = 'high';
    const rec: string[] = [];
    if (!contrastOk) rec.push('Increase contrast between foreground and background.');
    if (logoRisk !== 'low') rec.push('Reduce logo size or raise error correction to H.');
    if (params.margin < 2) rec.push('Increase margin (quiet zone) to at least 2.');
    return { contrastRatio: cr, contrastOk, logoRisk, recommendations: rec };
}
