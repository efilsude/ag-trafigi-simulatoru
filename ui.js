/**
 * ui.js — kontrolcü katmanı
 *
 * Bu dosya, simulation.js'teki motoru ve charts.js'teki çizim fonksiyonlarını
 * DOM'a bağlar: slider'ları okur, butonları dinler, tabloları günceller ve
 * ana animasyon döngüsünü (requestAnimationFrame) yönetir. Simülasyon
 * mantığının veya çizim detaylarının hiçbiri burada yok — sadece ikisini
 * birbirine ve ekrana bağlıyor.
 */
(function () {
  const Engine = NetSim.Engine;
  const Charts = NetSim.Charts;
  const $ = (id) => document.getElementById(id);

  const bwEl = $('bw'), latEl = $('lat'), jitEl = $('jit'), lossEl = $('loss');
  const vBw = $('vBw'), vLat = $('vLat'), vJit = $('vJit'), vLoss = $('vLoss');
  const pipeCanvas = $('pipe'), chartCanvas = $('chart'), cwndCanvas = $('cwndChart');
  const pctx = pipeCanvas.getContext('2d');
  const cctx = chartCanvas.getContext('2d');
  const wctx = cwndCanvas.getContext('2d');
  const statusDot = $('statusDot'), statusText = $('statusText');
  const toggleBtn = $('toggleBtn'), resetBtn = $('resetBtn');
  const sSent = $('sSent'), sDelivered = $('sDelivered'), sLatency = $('sLatency');
  const sPhys = $('sPhys'), sPhysWrap = $('sPhysWrap'), sCong = $('sCong'), sCongWrap = $('sCongWrap');
  const realLatEl = $('realLat'), realBwEl = $('realBw'), realLossEl = $('realLoss'), applyRealBtn = $('applyRealBtn');
  const compareTable = $('compareTable'), cmpReal = $('cmpReal'), cmpSim = $('cmpSim');
  const phaseBadge = $('phaseBadge'), cwndVal = $('cwndVal'), ssthreshVal = $('ssthreshVal'), bufferVal = $('bufferVal'), roundVal = $('roundVal');

  const presets = [
    { name: 'Fiber (FTTH)', bw: 500, lat: 4, jit: 1, loss: 0.1 },
    { name: '4G LTE', bw: 60, lat: 35, jit: 8, loss: 1 },
    { name: '3G', bw: 6, lat: 120, jit: 25, loss: 3 },
    { name: 'Uydu bağlantısı', bw: 25, lat: 320, jit: 15, loss: 2 },
    { name: 'Sıkışık Wi-Fi', bw: 20, lat: 45, jit: 40, loss: 8 },
    { name: 'Zayıf sinyal', bw: 3, lat: 180, jit: 60, loss: 15 },
  ];

  const presetsWrap = $('presets');
  presets.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'preset-btn';
    b.textContent = p.name;
    b.addEventListener('click', () => applyPreset(i));
    presetsWrap.appendChild(b);
  });
  function applyPreset(i) {
    const p = presets[i];
    bwEl.value = p.bw; latEl.value = p.lat; jitEl.value = p.jit; lossEl.value = p.loss;
    updateLabels();
    [...presetsWrap.children].forEach((el, idx) => el.classList.toggle('active', idx === i));
  }

  function updateLabels() {
    vBw.textContent = bwEl.value;
    vLat.textContent = latEl.value;
    vJit.textContent = jitEl.value;
    vLoss.textContent = parseFloat(lossEl.value).toFixed(1);
  }
  [bwEl, latEl, jitEl, lossEl].forEach(el => el.addEventListener('input', () => {
    [...presetsWrap.children].forEach(c => c.classList.remove('active'));
    updateLabels();
  }));
  updateLabels();

  function currentParams() {
    return {
      bw: parseFloat(bwEl.value),
      lat: parseFloat(latEl.value),
      jit: parseFloat(jitEl.value),
      loss: parseFloat(lossEl.value),
    };
  }

  function resizeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    [pipeCanvas, chartCanvas, cwndCanvas].forEach(c => {
      const rect = c.getBoundingClientRect();
      c.width = Math.max(1, rect.width * dpr);
      c.height = Math.max(1, rect.height * dpr);
    });
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  let running = true;
  toggleBtn.addEventListener('click', () => {
    running = !running;
    toggleBtn.textContent = running ? 'Duraklat' : 'Devam et';
    statusDot.classList.toggle('paused', !running);
    statusText.textContent = running ? 'durum: çalışıyor' : 'durum: duraklatıldı';
  });
  resetBtn.addEventListener('click', () => {
    Engine.reset();
    updateStatsUI();
    updatePhaseUI();
  });

  applyRealBtn.addEventListener('click', () => {
    const rl = parseFloat(realLatEl.value);
    const rb = parseFloat(realBwEl.value);
    const rloss = parseFloat(realLossEl.value);
    if (!isNaN(rl)) latEl.value = Math.max(0, Math.min(400, rl));
    if (!isNaN(rb)) bwEl.value = Math.max(1, Math.min(1000, rb));
    if (!isNaN(rloss)) lossEl.value = Math.max(0, Math.min(30, rloss));
    [...presetsWrap.children].forEach(c => c.classList.remove('active'));
    updateLabels();
    if (!isNaN(rb)) {
      cmpReal.textContent = rb.toFixed(1) + ' Mbps';
      compareTable.style.display = '';
      updateCompareSim();
    }
  });

  function updateCompareSim() {
    if (compareTable.style.display === 'none') return;
    const state = Engine.getState();
    if (!state.throughputHistory.length) { cmpSim.textContent = 'ölçülüyor…'; return; }
    const latest = state.throughputHistory[state.throughputHistory.length - 1];
    cmpSim.textContent = latest.good.toFixed(1) + ' Mbps';
  }

  function updateStatsUI() {
    const { stats } = Engine.getState();
    sSent.textContent = stats.sent;
    sDelivered.textContent = stats.delivered;
    const physPct = stats.sent ? (stats.physDropped / stats.sent * 100) : 0;
    const congPct = stats.sent ? (stats.congDropped / stats.sent * 100) : 0;
    sPhys.textContent = physPct.toFixed(1);
    sCong.textContent = congPct.toFixed(1);
    sPhysWrap.className = 'result-loss ' + (physPct > 10 ? 'bad' : physPct > 3 ? 'warn' : '');
    sCongWrap.className = 'result-loss ' + (congPct > 10 ? 'bad' : congPct > 3 ? 'warn' : '');
    const avgLat = stats.latCount ? (stats.latSum / stats.latCount) : 0;
    sLatency.textContent = Math.round(avgLat) + ' ms';
  }

  function updatePhaseUI() {
    const s = Engine.getState();
    const inSlowStart = s.cwnd < s.ssthresh;
    phaseBadge.textContent = inSlowStart ? 'YAVAŞ BAŞLANGIÇ' : 'TIKANIKLIK ÖNLEME';
    cwndVal.textContent = Math.round(s.cwnd) + ' paket';
    ssthreshVal.textContent = isFinite(s.ssthresh) ? Math.round(s.ssthresh) + ' paket' : '∞';
    bufferVal.textContent = s.currentBufferCap + ' paket';
    roundVal.textContent = s.roundId;
  }

  let lastT = performance.now();

  function tick(now) {
    const dt = Math.min(50, now - lastT);
    lastT = now;
    requestAnimationFrame(tick);

    if (running) {
      Engine.step(now, dt, currentParams(), {
        onChange: updateStatsUI,
        onThroughputSample: updateCompareSim,
      });
      updatePhaseUI();
    }

    const state = Engine.getState();
    Charts.drawPipe(pctx, pipeCanvas.width, pipeCanvas.height, state.packets);
    Charts.drawThroughputChart(cctx, chartCanvas.width, chartCanvas.height, state.throughputHistory, state.HISTORY_LEN);
    Charts.drawCwndChart(wctx, cwndCanvas.width, cwndCanvas.height, state.cwndHistory, state.CWND_HISTORY_LEN);
  }

  updatePhaseUI();
  requestAnimationFrame(tick);
})();
