/**
 * simulation.js — Ağ simülasyon motoru
 *
 * Bu dosya DOM'a hiç dokunmaz. Girdi olarak sadece kanal parametrelerini
 * (bant genişliği, gecikme, jitter, fiziksel kayıp) alır; paket akışını,
 * arabellek (kuyruk) modelini ve basitleştirilmiş bir TCP tıkanıklık
 * kontrolü (AIMD) algoritmasını simüle eder.
 *
 * ui.js bu motoru her karede çağırır ve dönen durumu ekrana yansıtır.
 */
window.NetSim = window.NetSim || {};

NetSim.Engine = (function () {
  const HISTORY_LEN = 90;       // verim grafiği için tutulan örnek sayısı
  const CWND_HISTORY_LEN = 60;  // cwnd grafiği için tutulan tur sayısı

  let packets = [];
  let stats = { sent: 0, delivered: 0, physDropped: 0, congDropped: 0, latSum: 0, latCount: 0 };
  let throughputHistory = [];

  let cwnd = 1;
  let ssthresh = Infinity;
  let roundId = 0;
  let roundStartTime = null;
  let roundHadLoss = false;
  let currentBufferCap = 10;
  let cwndHistory = [];

  let windowGood = 0, windowBad = 0, windowT = 0;

  function getBufferCapacity(bw) {
    return Math.max(10, Math.min(80, Math.round(bw / 12)));
  }

  function reset() {
    packets = [];
    stats = { sent: 0, delivered: 0, physDropped: 0, congDropped: 0, latSum: 0, latCount: 0 };
    throughputHistory = [];
    cwnd = 1;
    ssthresh = Infinity;
    roundId = 0;
    roundStartTime = null;
    cwndHistory = [];
    windowGood = 0; windowBad = 0; windowT = 0;
  }

  function startRound(now, params) {
    const { bw, lat, jit, loss } = params;
    roundId++;
    roundHadLoss = false;
    roundStartTime = now;
    currentBufferCap = getBufferCapacity(bw);

    const n = Math.max(1, Math.round(cwnd));
    for (let i = 0; i < n; i++) {
      const congestionDrop = packets.length >= currentBufferCap;
      let physicalDrop = false;
      if (!congestionDrop) physicalDrop = Math.random() * 100 < loss;
      const dropped = congestionDrop || physicalDrop;
      if (dropped) roundHadLoss = true;

      const jitterMs = (Math.random() * 2 - 1) * jit;
      const travel = Math.max(120, lat * 2 + jitterMs);
      const dropAt = dropped
        ? (congestionDrop ? (0.04 + Math.random() * 0.06) : (0.3 + Math.random() * 0.45))
        : null;

      packets.push({
        p: 0, speedPerMs: 1 / travel, dropped, dropAt,
        dropKind: dropped ? (congestionDrop ? 'congestion' : 'physical') : null,
        lane: Math.random(), latencyMs: lat + jitterMs,
        size: 0.6 + Math.random() * 0.5, roundId,
      });

      stats.sent++;
      if (!dropped) { stats.latSum += Math.max(0, lat + jitterMs); stats.latCount++; }
    }
  }

  function finishRound(now, params) {
    // AIMD: toplamsal artış / çarpımsal azalış (basitleştirilmiş TCP Reno)
    if (roundHadLoss) {
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = ssthresh;
    } else if (cwnd < ssthresh) {
      cwnd = cwnd * 2;          // yavaş başlangıç: üstel büyüme
    } else {
      cwnd = cwnd + 1;          // tıkanıklık önleme: doğrusal büyüme
    }
    cwnd = Math.min(cwnd, 300);

    cwndHistory.push({
      round: roundId,
      cwnd,
      ssthresh: isFinite(ssthresh) ? Math.min(ssthresh, 300) : null,
    });
    if (cwndHistory.length > CWND_HISTORY_LEN) cwndHistory.shift();

    startRound(now, params);
  }

  /**
   * Bir kare ilerlet. params = { bw, lat, jit, loss } (o anki slider değerleri).
   * onDrop(kind) ve onDeliver() callback'leri, istatistikler değiştiğinde
   * ui.js'in anlık olarak ekranı güncelleyebilmesi için çağrılır (opsiyonel).
   */
  function step(now, dt, params, callbacks) {
    callbacks = callbacks || {};
    if (roundStartTime === null) startRound(now, params);

    const rttMs = Math.max(40, params.lat * 2);
    if (now - roundStartTime >= rttMs) finishRound(now, params);

    const bytesPerGoodPacket = 0.012;
    let goodThisFrame = 0, badThisFrame = 0;

    for (let i = packets.length - 1; i >= 0; i--) {
      const pk = packets[i];
      pk.p += pk.speedPerMs * dt;

      if (pk.dropped && pk.dropAt !== null && pk.p >= pk.dropAt && !pk.counted) {
        pk.counted = true;
        if (pk.dropKind === 'congestion') stats.congDropped++; else stats.physDropped++;
        badThisFrame += bytesPerGoodPacket;
        if (callbacks.onChange) callbacks.onChange();
      }
      if (!pk.dropped && pk.p >= 1) {
        stats.delivered++;
        goodThisFrame += bytesPerGoodPacket;
        packets.splice(i, 1);
        if (callbacks.onChange) callbacks.onChange();
        continue;
      }
      if (pk.dropped && pk.dropAt !== null && pk.p >= pk.dropAt + 0.04) {
        packets.splice(i, 1);
        continue;
      }
    }

    windowGood += goodThisFrame;
    windowBad += badThisFrame;
    windowT += dt;
    if (windowT >= 220) {
      const scale = 1000 / windowT;
      throughputHistory.push({ good: windowGood * scale * params.bw / 8, bad: windowBad * scale * params.bw / 8 });
      if (throughputHistory.length > HISTORY_LEN) throughputHistory.shift();
      windowGood = 0; windowBad = 0; windowT = 0;
      if (callbacks.onThroughputSample) callbacks.onThroughputSample();
    }
  }

  function getState() {
    return {
      packets, stats, throughputHistory, HISTORY_LEN,
      cwnd, ssthresh, roundId, currentBufferCap, cwndHistory, CWND_HISTORY_LEN,
    };
  }

  return { reset, step, getState, getBufferCapacity };
})();
