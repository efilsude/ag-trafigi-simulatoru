/**
 * charts.js — çizim katmanı
 *
 * Bu dosya hiçbir simülasyon mantığı içermez. Kendisine verilen veriyi
 * (paketler, verim geçmişi, cwnd geçmişi) bir canvas bağlamına çizer.
 * simulation.js'in ürettiği durumu ekrana dökmekten başka bir işi yoktur.
 */
window.NetSim = window.NetSim || {};

NetSim.Charts = (function () {

  function drawPipe(ctx, w, h, packets) {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAF6';
    ctx.fillRect(0, 0, w, h);

    const marginX = 60 * dpr;
    const midY = h / 2;
    const laneSpread = h * 0.30;

    ctx.strokeStyle = '#16160F';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(marginX, midY);
    ctx.lineTo(w - marginX, midY);
    ctx.stroke();

    ctx.strokeRect(marginX - 22 * dpr, midY - 16 * dpr, 22 * dpr, 32 * dpr);
    ctx.strokeRect(w - marginX, midY - 16 * dpr, 22 * dpr, 32 * dpr);
    ctx.fillStyle = '#16160F';
    ctx.font = (11 * dpr) + "px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TX', marginX - 11 * dpr, midY);
    ctx.fillText('RX', w - marginX + 11 * dpr, midY);

    for (const pk of packets) {
      const x = marginX + (w - 2 * marginX) * Math.min(pk.p, 1);
      const y = midY + (pk.lane - 0.5) * laneSpread;
      let color = '#1D4E89';
      if (pk.dropped) color = '#9C2B2B';
      else if (pk.latencyMs > 100) color = '#8A6A1D';
      const s = pk.size * 7 * dpr;
      ctx.fillStyle = color;
      ctx.globalAlpha = (pk.dropped && pk.dropAt !== null && pk.p >= pk.dropAt) ? Math.max(0, 1 - (pk.p - pk.dropAt) / 0.04) : 1;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.globalAlpha = 1;
    }
  }

  function drawAxisGrid(ctx, w, h, leftPad, plotW, plotH) {
    const dpr = window.devicePixelRatio || 1;
    ctx.strokeStyle = '#E6E4D3';
    ctx.lineWidth = 1;
    for (let gx = leftPad; gx <= w; gx += 20 * dpr) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, plotH); ctx.stroke(); }
    for (let gy = 0; gy <= plotH; gy += 18 * dpr) { ctx.beginPath(); ctx.moveTo(leftPad, gy); ctx.lineTo(w, gy); ctx.stroke(); }
  }

  function drawThroughputChart(ctx, w, h, throughputHistory, HISTORY_LEN) {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAF6';
    ctx.fillRect(0, 0, w, h);

    const leftPad = 34 * dpr;
    const bottomPad = 18 * dpr;
    const plotW = w - leftPad - 6 * dpr;
    const plotH = h - bottomPad;

    drawAxisGrid(ctx, w, h, leftPad, plotW, plotH);

    const maxVal = throughputHistory.length
      ? Math.max(1, ...throughputHistory.map(d => d.good + d.bad)) * 1.15
      : 10;

    ctx.strokeStyle = '#16160F';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#55564A';
    ctx.font = (10 * dpr) + "px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) {
      const y = (plotH / 3) * i;
      ctx.beginPath(); ctx.moveTo(leftPad, y); ctx.lineTo(w, y); ctx.stroke();
      const val = maxVal * (1 - i / 3);
      ctx.fillText(val.toFixed(0), leftPad - 6 * dpr, Math.min(Math.max(y, 7 * dpr), plotH - 2 * dpr));
    }
    ctx.beginPath(); ctx.moveTo(leftPad, 0); ctx.lineTo(leftPad, plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(leftPad, plotH); ctx.lineTo(w, plotH); ctx.stroke();

    const totalSeconds = Math.round(HISTORY_LEN * 0.22);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('-' + totalSeconds + 's', leftPad + 2 * dpr, h - 4 * dpr);
    ctx.textAlign = 'center';
    ctx.fillText('-' + Math.round(totalSeconds / 2) + 's', leftPad + plotW / 2, h - 4 * dpr);
    ctx.textAlign = 'right';
    ctx.fillText('şimdi', w - 2 * dpr, h - 4 * dpr);

    if (throughputHistory.length < 2) return;
    const stepX = plotW / (HISTORY_LEN - 1);
    const startIdx = HISTORY_LEN - throughputHistory.length;

    function pathFor(stacked) {
      ctx.beginPath();
      throughputHistory.forEach((d, i) => {
        const x = leftPad + (startIdx + i) * stepX;
        const val = stacked ? d.good + d.bad : d.good;
        const y = plotH - (val / maxVal) * plotH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
    }
    ctx.lineWidth = 1.5 * dpr;
    pathFor(true); ctx.strokeStyle = '#9C2B2B'; ctx.stroke();
    pathFor(false); ctx.strokeStyle = '#1D4E89'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
  }

  function drawCwndChart(ctx, w, h, cwndHistory, CWND_HISTORY_LEN) {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FAFAF6';
    ctx.fillRect(0, 0, w, h);

    const leftPad = 34 * dpr;
    const bottomPad = 18 * dpr;
    const plotW = w - leftPad - 6 * dpr;
    const plotH = h - bottomPad;

    drawAxisGrid(ctx, w, h, leftPad, plotW, plotH);

    const maxVal = cwndHistory.length
      ? Math.max(4, ...cwndHistory.map(d => d.cwnd)) * 1.2
      : 20;

    ctx.strokeStyle = '#16160F';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#55564A';
    ctx.font = (10 * dpr) + "px 'IBM Plex Mono', monospace";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) {
      const y = (plotH / 3) * i;
      ctx.beginPath(); ctx.moveTo(leftPad, y); ctx.lineTo(w, y); ctx.stroke();
      const val = maxVal * (1 - i / 3);
      ctx.fillText(val.toFixed(0), leftPad - 6 * dpr, Math.min(Math.max(y, 7 * dpr), plotH - 2 * dpr));
    }
    ctx.beginPath(); ctx.moveTo(leftPad, 0); ctx.lineTo(leftPad, plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(leftPad, plotH); ctx.lineTo(w, plotH); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('tur', leftPad + plotW / 2, h - 4 * dpr);

    if (cwndHistory.length < 2) return;
    const stepX = plotW / (CWND_HISTORY_LEN - 1);
    const startIdx = CWND_HISTORY_LEN - cwndHistory.length;

    // ssthresh kesikli referans çizgisi
    ctx.beginPath();
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    cwndHistory.forEach((d, i) => {
      if (d.ssthresh === null) return;
      const x = leftPad + (startIdx + i) * stepX;
      const y = plotH - (Math.min(d.ssthresh, maxVal) / maxVal) * plotH;
      if (i === 0 || cwndHistory[i - 1].ssthresh === null) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#9C2B2B';
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
    ctx.setLineDash([]);

    // cwnd çizgisi (testere dişi)
    ctx.beginPath();
    cwndHistory.forEach((d, i) => {
      const x = leftPad + (startIdx + i) * stepX;
      const y = plotH - (Math.min(d.cwnd, maxVal) / maxVal) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#1D4E89';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();
  }

  return { drawPipe, drawThroughputChart, drawCwndChart };
})();
