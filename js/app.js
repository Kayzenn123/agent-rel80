/* REL80 — mesin: rel horizontal, perencana, marquee, tema */
(function () {
  'use strict';
  document.documentElement.classList.add("js");

  /* ---------- DATA ---------- */
  var STASIUN = [
    ["Jakarta Kota","jakarta-kota"],["Jayakarta","jayakarta"],["Mangga Besar","mangga-besar"],
    ["Sawah Besar","sawah-besar"],["Juanda","juanda"],["Cikini","cikini"],["Gondangdia","gondangdia"],
    ["Tebet","tebet"],["Cawang","cawang"],["Duren Kalibata","duren-kalibata"],
    ["Pasar Minggu","pasar-minggu"],["Pasar Minggu Baru","pasar-minggu-baru"],
    ["Tanjung Barat","tanjung-barat"],["Lenteng Agung","lenteng-agung"],
    ["Universitas Indonesia","ui"],["Pondok Cina","pondok-cina"],["Depok Baru","depok-baru"],
    ["Depok","depok"],["Citayam","citayam"],["Bojonggede","bojonggede"],["Cilebut","cilebut"],["Bogor","bogor"]
  ];
  var TEMAS = ["hijau","biru","merah"];
  var LS_KEY = "rel80-v1";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function slugKeIndex(slug) {
    for (var i = 0; i < STASIUN.length; i++) if (STASIUN[i][1] === slug) return i;
    return -1;
  }
  function loadLS() {
    try { var d = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); return (d && typeof d === "object") ? d : {}; }
    catch (e) { return {}; }
  }
  function saveLS(patch) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(Object.assign(loadLS(), patch))); } catch (e) {}
  }

  /* ---------- BANGUN PANEL STASIUN ---------- */
  function depContoh(idx) {
    // 3 keberangkatan contoh berikutnya, deterministik dari indeks stasiun
    var now = new Date(), out = [], base = (idx * 7) % 60;
    var mins = [7, 27, 47].map(function (m) { return (m + base) % 60; }).sort(function (a, b) { return a - b; });
    var t = new Date(now.getTime()); t.setSeconds(0, 0);
    while (out.length < 3) {
      for (var k = 0; k < mins.length && out.length < 3; k++) {
        var c = new Date(t.getTime()); c.setMinutes(mins[k], 0, 0);
        if (c > now) out.push(c);
      }
      t.setHours(t.getHours() + 1); t.setMinutes(0, 0, 0);
    }
    return out;
  }
  function fmtJam(d) {
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  var rows = { a: $('[data-row="a"]'), b: $('[data-row="b"]'), c: $('[data-row="c"]') };
  var dinamisSiap = false;
  function bangunDinamis() {
    if (dinamisSiap) return;
    dinamisSiap = true;
    STASIUN.forEach(function (st, i) {
    var nama = st[0], slug = st[1];
    var art = document.createElement("article");
    art.className = "stasiun";
    art.id = "st-" + slug;
    art.tabIndex = 0;
    art.setAttribute("aria-label", "Stasiun " + nama);
    art.setAttribute("data-tema", TEMAS[i % 3]);
    art.setAttribute("data-i", i);
    var deps = depContoh(i);
    var depLi = deps.map(function (d, k) {
      return '<li><span>' + fmtJam(d) + '</span><span class="tujuan">' + (k % 2 ? "Bogor" : "Jakarta Kota") + '</span></li>';
    }).join("");
    art.innerHTML =
      '<p class="nomor">𐍐 ' + ("0" + (i + 1)).slice(-2) + '/22</p>' +
      '<h2 class="nama' + (nama.length > 13 ? " nama-panjang" : "") + '" aria-label="' + nama + '"><span aria-hidden="true">' + nama + '</span><span class="isi" aria-hidden="true">' + nama + '</span></h2>' +
      '<div class="papan"><h3>Keberangkatan <span class="stempel">CONTOH</span></h3>' +
      '<ul class="dep">' + depLi + '</ul>' +
      '<p class="countdown">Berikutnya <strong data-cd="' + i + '">' + fmtJam(deps[0]) + '</strong></p></div>' +
      '<div class="st-aksi"><button class="btn btn-kecil" data-dari="' + i + '">DARI SINI</button>' +
      '<button class="btn btn-kecil btn-ghost" data-ke="' + i + '">KE SINI</button></div>';
    (i < 7 ? rows.a : i < 15 ? rows.b : rows.c).appendChild(art);
    });
    bangunDenah();
    panelStasiun = $$(".stasiun");
    ukurPanel();
    // daftar stasiun mobile
    var dl = $("#denahList");
    STASIUN.forEach(function (st, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "tbtn denah-btn";
      b.textContent = ("0" + (i + 1)).slice(-2) + " · " + st[0];
      b.addEventListener("click", function () { setTema(TEMAS[i % 3], true); lompatKeStasiun(i); });
      dl.appendChild(b);
    });
    cobaBangun();
  }

  /* ---------- SELECTS ---------- */
  var selDari = $("#selDari"), selKe = $("#selKe"), selLompat = $("#lompatStasiun");
  var optAwal = '<option value="">— pilih —</option>';
  var opts = STASIUN.map(function (st, i) { return '<option value="' + i + '">' + st[0] + '</option>'; }).join("");
  selDari.innerHTML = optAwal + opts;
  selKe.innerHTML = optAwal + opts;
  selLompat.innerHTML = '<option value="">— stasiun —</option>' + opts;

  var ls = loadLS();
  if (ls.tema && TEMAS.indexOf(ls.tema) > -1) setTema(ls.tema, false);
  if (typeof ls.favDari === "number") selDari.value = ls.favDari;
  if (typeof ls.favKe === "number") selKe.value = ls.favKe;

  /* ---------- DENAH SVG ---------- */
  function bangunDenah() {
    var svg = $("#denah"), NS = "http://www.w3.org/2000/svg";
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M40,150 C250,150 300,60 520,60 C740,60 800,150 960,150");
    path.setAttribute("class", "rel-denah");
    svg.appendChild(path);
    var p0 = { x: 40, y: 150 }, p1 = { x: 960, y: 150 };
    STASIUN.forEach(function (st, i) {
      var t = i / (STASIUN.length - 1);
      var x = p0.x + (p1.x - p0.x) * t;
      var y = 150 - Math.sin(t * Math.PI) * 90;
      var g = document.createElementNS(NS, "g");
      g.setAttribute("class", "titik-wrap");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", "Lompat ke stasiun " + st[0]);
      var hit = document.createElementNS(NS, "rect");
      hit.setAttribute("x", x - 22); hit.setAttribute("y", y - 22);
      hit.setAttribute("width", 44); hit.setAttribute("height", 44);
      hit.setAttribute("fill", "#000"); hit.setAttribute("fill-opacity", "0");
      hit.setAttribute("aria-hidden", "true");
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 13);
      c.setAttribute("class", "titik");
      var label = document.createElementNS(NS, "text");
      label.setAttribute("x", x); label.setAttribute("y", y + 34);
      label.setAttribute("text-anchor", "middle"); label.setAttribute("class", "nama-st");
      label.textContent = st[0].split(" ")[0];
      function go() { setTema(TEMAS[i % 3], true); lompatKeStasiun(i); }
      g.addEventListener("click", go);
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      g.addEventListener("mouseenter", function () { setTema(TEMAS[i % 3], true); });
      g.addEventListener("focus", function () { setTema(TEMAS[i % 3], true); });
      g.appendChild(hit); g.appendChild(c); g.appendChild(label); svg.appendChild(g);
    });
  }

  /* ---------- TEMA ---------- */
  function setTema(t, simpan) {
    document.documentElement.setAttribute("data-theme", t);
    $$(".tema-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-tema") === t ? "true" : "false");
    });
    if (simpan) saveLS({ tema: t });
  }
  $$(".tema-btn").forEach(function (b) {
    b.addEventListener("click", function () { setTema(b.getAttribute("data-tema"), true); });
  });
  // hover panel stasiun = ganti tema halaman (mekanik D)
  document.addEventListener("mouseover", function (e) {
    var p = e.target.closest ? e.target.closest(".stasiun") : null;
    if (p && !ringan) setTema(p.getAttribute("data-tema"), false);
  });

  /* ---------- COUNTDOWN ---------- */
  var panelStasiun = $$(".stasiun");
  var panelPos = []; // [offsetLeft, width] — di-cache, tanpa getBoundingClientRect per detik
  function ukurPanel() {
    panelPos = panelStasiun.map(function (p) { return [p.offsetLeft, p.offsetWidth]; });
  }
  function stasiunAktif() {
    if (!panelPos.length) ukurPanel();
    var vw = window.innerWidth;
    var trackX = G.siap ? Math.min(window.scrollY, G.maxX)
      : (window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)) * Math.max($("#track").scrollWidth - vw, 0);
    var cx = vw / 2, best = null, bestD = 1e9;
    for (var i = 0; i < panelStasiun.length; i++) {
      var d = Math.abs(panelPos[i][0] - trackX + panelPos[i][1] / 2 - cx);
      if (d < bestD) { bestD = d; best = panelStasiun[i]; }
    }
    return best;
  }
  window.addEventListener("resize", ukurPanel);
  setInterval(function () {
    var p = stasiunAktif(); if (!p) return;
    var i = +p.getAttribute("data-i");
    var next = depContoh(i)[0];
    var s = Math.max(0, Math.round((next - Date.now()) / 1000));
    var el = p.querySelector("[data-cd]");
    if (el) el.textContent = Math.floor(s / 60) + " mnt " + ("0" + (s % 60)).slice(-2) + " dtk";
  }, 1000);

  /* ---------- PERENCANA ---------- */
  var form = $("#formRencana"), formError = $("#formError"), hasil = $("#hasilRencana");
  function tarifContoh(stops) { return Math.round((3000 + stops * 750) / 500) * 500; }
  function rp(n) { return "Rp" + n.toLocaleString("id-ID"); }
  function rencanaData(a, b) {
    var stops = Math.abs(b - a);
    return { dari: STASIUN[a][0], ke: STASIUN[b][0], berhenti: stops, durasi: stops * 3 + 4, tarif: tarifContoh(stops) };
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formError.hidden = true;
    var a = selDari.value === "" ? -1 : +selDari.value;
    var b = selKe.value === "" ? -1 : +selKe.value;
    if (a < 0 || b < 0) {
      formError.textContent = "Sinyal merah — pilih stasiun asal dan tujuan dulu.";
      formError.hidden = false; return;
    }
    if (a === b) {
      formError.textContent = "Sinyal merah — asal dan tujuan sama, keretanya bingung mau ke mana.";
      formError.hidden = false; return;
    }
    var r = rencanaData(a, b);
    $("#hDari").textContent = r.dari; $("#hKe").textContent = r.ke;
    $("#hBerhenti").textContent = r.berhenti + " stasiun";
    $("#hDurasi").textContent = "± " + r.durasi + " mnt";
    $("#hTarif").textContent = rp(r.tarif);
    hasil.hidden = false;
    var url = new URL(location.href);
    url.searchParams.set("dari", STASIUN[a][1]); url.searchParams.set("ke", STASIUN[b][1]);
    history.replaceState(null, "", url);
  });
  $("#btnTukar").addEventListener("click", function () {
    var t = selDari.value; selDari.value = selKe.value; selKe.value = t;
  });
  $("#btnFavorit").addEventListener("click", function () {
    if (selDari.value === "" || selKe.value === "") {
      formError.textContent = "Sinyal merah — pilih dulu asal-tujuannya sebelum disimpan.";
      formError.hidden = false; return;
    }
    saveLS({ favDari: +selDari.value, favKe: +selKe.value });
    formError.textContent = "Siap — favorit tersimpan di loket ini (perambanmu).";
    formError.hidden = false;
  });
  function salinTeks(t, okMsg) {
    function ok() {
      formError.textContent = okMsg; formError.hidden = false;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(ok, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); }
      catch (e) { formError.textContent = "Sinyal merah — clipboard ditolak peramban."; formError.hidden = false; }
      document.body.removeChild(ta);
    }
  }
  $("#btnSalin").addEventListener("click", function () {
    salinTeks("REL80 (contoh): " + $("#hDari").textContent + " → " + $("#hKe").textContent +
      " · " + $("#hBerhenti").textContent + " · " + $("#hDurasi").textContent + " · " + $("#hTarif").textContent,
      "Rencana tersalin. Silakan ditempel di mana saja.");
  });
  function unduh(nama, isi, tipe) {
    var blob = new Blob([isi], { type: tipe }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  $("#btnUnduhJson").addEventListener("click", function () {
    var r = { contoh: true, dari: $("#hDari").textContent, ke: $("#hKe").textContent, berhenti: $("#hBerhenti").textContent, durasi: $("#hDurasi").textContent, tarif: $("#hTarif").textContent };
    unduh("rel80-rencana.json", JSON.stringify(r, null, 2), "application/json");
  });
  $("#btnUnduhCsv").addEventListener("click", function () {
    unduh("rel80-rencana.csv", "dari,ke,berhenti,durasi,tarif\n" +
      [$("#hDari").textContent, $("#hKe").textContent, $("#hBerhenti").textContent, $("#hDurasi").textContent, $("#hTarif").textContent].join(",") + "\n", "text/csv");
  });

  /* ---------- TIKET ---------- */
  var tiketWrap = $("#tiketWrap"), tiket = $("#tiket");
  $("#btnTiket").addEventListener("click", function () {
    $("#tDari").textContent = $("#hDari").textContent;
    $("#tKe").textContent = $("#hKe").textContent;
    $("#tNomor").textContent = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);
    tiketWrap.hidden = false;
    tiketWrap.scrollIntoView({ block: "nearest" });
  });
  tiket.addEventListener("dblclick", function () {
    $("#tNomor").textContent = ("000000" + Math.floor(Math.random() * 1000000)).slice(-6);
  });
  if (!ringan) tiket.addEventListener("pointermove", function (e) {
    var r = tiket.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    tiket.style.transform = "perspective(700px) rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 14) + "deg)";
  });
  tiket.addEventListener("pointerleave", function () { tiket.style.transform = ""; });

  /* tombol DARI SINI / KE SINI di tiap stasiun */
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-dari]"), k = e.target.closest("[data-ke]");
    if (d) { selDari.value = d.getAttribute("data-dari"); lompatKe("bengkel"); }
    if (k) { selKe.value = k.getAttribute("data-ke"); lompatKe("bengkel"); }
  });
  selLompat.addEventListener("change", function () {
    if (selLompat.value !== "") lompatKeStasiun(+selLompat.value);
  });

  /* ---------- EKSPOR SEMUA (terminus) ---------- */
  function semuaJadwalCsv() {
    var baris = ["stasiun,keberangkatan_contoh_1,keberangkatan_contoh_2,keberangkatan_contoh_3"];
    STASIUN.forEach(function (st, i) {
      baris.push(st[0] + "," + depContoh(i).map(fmtJam).join(","));
    });
    return baris.join("\n") + "\n";
  }
  $("#btnSalinSemua").addEventListener("click", function () {
    salinTeks("REL80 — jadwal CONTOH lintas Bogor–Jakarta Kota\n" + semuaJadwalCsv(), "Semua jadwal contoh tersalin.");
  });
  $("#btnUnduhSemua").addEventListener("click", function () {
    unduh("rel80-jadwal-contoh.csv", semuaJadwalCsv(), "text/csv");
  });

  /* ---------- EASTER EGG: klakson ---------- */
  var buf = "";
  document.addEventListener("keydown", function (e) {
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-7);
      if (buf === "klakson") {
        buf = "";
        var k = document.createElement("div");
        k.setAttribute("role", "status");
        k.style.cssText = "position:fixed;top:38%;left:-40vw;z-index:300;font-weight:900;font-size:clamp(40px,9vw,120px);color:var(--accent-2);white-space:nowrap;pointer-events:none;text-transform:uppercase;";
        k.textContent = "TOOOOT!";
        document.body.appendChild(k);
        requestAnimationFrame(function () {
          k.style.transition = "transform 1.6s cubic-bezier(.5,0,.8,.4)";
          k.style.transform = "translateX(150vw)";
        });
        setTimeout(function () { k.remove(); }, 1700);
      }
    }
  });

  /* ---------- GERAK (mesin sendiri: sticky + satu rAF, tanpa dependency) ---------- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ringan = (navigator.hardwareConcurrency || 8) <= 4 || !!navigator.deviceMemory && navigator.deviceMemory <= 4 || (navigator.connection && navigator.connection.saveData);
  if (reduced) document.documentElement.classList.add("reduced");
  var gerakNyala = !reduced;
  var btnGerak = $("#btnGerak");

  var G = {
    siap: false, wrapH: 0, maxX: 0, trackW: 0,
    layers: [], sp: [], kmNow: null, kemajuanIsi: null, judulUtama: null,
    relA: null, relB: null, relALen: 1, relBLen: 1,
    pitaEls: [], pitaWrap: [1, 1], pitaX: [0, 0],
    lastY: -1, lastT: 0, lastWght: -1, lastWghtT: 0, raf: 0
  };
  function gerakAktif() {
    return gerakNyala && !reduced && !document.documentElement.classList.contains("gerak-mati");
  }
  function setGerak(nyala) {
    gerakNyala = nyala;
    document.documentElement.classList.toggle("gerak-mati", !nyala);
    btnGerak.setAttribute("aria-pressed", nyala ? "true" : "false");
    btnGerak.textContent = nyala ? "Gerak: Nyala" : "Gerak: Mati";
    if (!nyala) {
      if (G.raf) { cancelAnimationFrame(G.raf); G.raf = 0; }
      G.lastY = -1;
      if (G.trackEl) { G.trackEl.style.transform = ""; G.worldEl.style.transform = ""; }
      for (var i = 0; i < G.layers.length; i++) G.layers[i].style.transform = "";
      $$(".stasiun .nama .isi").forEach(function (el) { el.style.clipPath = ""; });
      if (G.relA) { G.relA.style.strokeDashoffset = G.relALen; G.relB.style.strokeDashoffset = G.relBLen; }
    } else if (G.siap) { mulaiLoop(); }
  }
  btnGerak.addEventListener("click", function () { setGerak(!gerakNyala); });
  if (reduced) setGerak(false);

  /* pita marquee */
  var ikonKereta = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M4 10h16M8 20l-2 2M16 20l2 2M8 16h.01M16 16h.01"/></svg>';
  var pitaTeks = ["PERHATIAN", "JADWAL INI CONTOH", "TIKET HARAP DISIAPKAN", "DILARANG BERSANDAR DI PINTU", "REL80 · EDISI 80"];
  ["pita1", "pita2"].forEach(function (id) {
    var el = document.getElementById(id), html = "";
    for (var r = 0; r < 4; r++) pitaTeks.forEach(function (t) { html += "<span>" + t + "</span>" + ikonKereta; });
    el.innerHTML = html;
  });
  var pitaJalan = true;
  $("#btnMarquee").addEventListener("click", function () {
    pitaJalan = !pitaJalan;
    this.setAttribute("aria-pressed", pitaJalan ? "true" : "false");
    this.innerHTML = pitaJalan ? "⏸ Pita" : "▶ Pita";
  });
  function ukurPita() {
    G.pitaEls.forEach(function (el, i) { G.pitaWrap[i] = el.scrollWidth / 2 || 1; });
  }

  function siapkanGerak() {
    if (G.siap) return;
    var track = $("#track"), viewport = $("#viewport"), wrap = $("#pinWrap");
    G.trackW = track.scrollWidth;
    var vw = window.innerWidth, vh = window.innerHeight;
    G.maxX = Math.max(G.trackW - vw, 0);
    G.wrapH = G.maxX + vh * 1.4;
    wrap.style.height = G.wrapH + "px";
    var h = viewport.clientHeight, w = G.trackW, y = h * 0.80;
    var svg = $("#relSvg");
    svg.setAttribute("width", w); svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    G.relA = $("#relA"); G.relB = $("#relB");
    G.relA.setAttribute("d", "M0," + y + " H" + w);
    G.relB.setAttribute("d", "M0," + (y + 26) + " H" + w);
    G.relALen = G.relA.getTotalLength(); G.relBLen = G.relB.getTotalLength();
    G.relA.style.strokeDasharray = G.relALen; G.relA.style.strokeDashoffset = G.relALen;
    G.relB.style.strokeDasharray = G.relBLen; G.relB.style.strokeDashoffset = G.relBLen;
    G.layers = $$(".parallax .layer");
    G.sp = ringan ? [0.05, 0.12, 0.2] : [0.08, 0.2, 0.45, 0.75, 1.12];
    G.kmNow = $("#kmNow"); G.kemajuanIsi = $("#kemajuanIsi"); G.judulUtama = $(".judul-utama");
    G.trackEl = $("#track"); G.worldEl = $("#world");
    G.isiEls = panelStasiun.map(function (p) { return p.querySelector(".nama .isi"); });
    G.pitaEls = [$("#pita1"), $("#pita2")];
    ukurPita(); ukurPanel();
    G.siap = true;
    if (!G.resizeTerpasang) {
      G.resizeTerpasang = true;
      window.addEventListener("resize", function () { G.siap = false; siapkanGerak(); });
    }
    jalankanDeepLink();
    if (gerakAktif()) mulaiLoop();
  }

  function bingkai(t) {
    G.raf = requestAnimationFrame(bingkai);
    if (!gerakAktif()) return;
    var y = window.scrollY;
    var dt = Math.min(t - (G.lastT || t), 100); G.lastT = t;
    var vw = window.innerWidth, vh = window.innerHeight;
    var scrollLen = Math.max(G.wrapH - vh, 1);
    var p = Math.max(0, Math.min(y / scrollLen, 1));
    var trackX = Math.min(y, G.maxX);
    var track = G.trackEl, world = G.worldEl;
    track.style.transform = "translate3d(" + (-trackX) + "px,0,0)";
    var zoomT = G.maxX >= scrollLen ? 0 : Math.max(0, Math.min((y - G.maxX) / (scrollLen - G.maxX), 1));
    world.style.transform = zoomT > 0 ? "scale(" + (1 - zoomT * 0.58).toFixed(4) + ")" : "";
    for (var li = 0; li < G.layers.length; li++) {
      G.layers[li].style.transform = "translate3d(" + (-trackX * (G.sp[li] || 0.1)).toFixed(1) + "px,0,0)";
    }
    var km = Math.round(p * 48);
    if (G.kmNow && G.kmNow._v !== km) { G.kmNow._v = km; G.kmNow.textContent = "KM " + km; }
    if (G.kemajuanIsi) G.kemajuanIsi.style.width = (p * 100).toFixed(2) + "%";
    if (G.judulUtama && p < 0.1 && t - G.lastWghtT > 200) {
      var wght = 600 + Math.round(300 * Math.abs(Math.sin(p * 240)));
      if (Math.abs(wght - G.lastWght) >= 50) {
        G.lastWght = wght; G.lastWghtT = t;
        G.judulUtama.style.fontVariationSettings = '"wght" ' + wght;
      }
    }
    var dp = Math.max(0, Math.min(trackX / Math.max(G.maxX, 1), 1));
    G.relA.style.strokeDashoffset = (G.relALen * (1 - Math.min(dp / 0.7, 1))).toFixed(1);
    G.relB.style.strokeDashoffset = (G.relBLen * (1 - Math.max(0, Math.min((dp - 0.15) / 0.7, 1)))).toFixed(1);
    for (var i = 0; i < panelStasiun.length; i++) {
      var sx = panelPos[i][0] - trackX;
      if (sx < -panelPos[i][1] || sx > vw + 200) continue;
      var wt = Math.max(0, Math.min((vw * 0.8 - sx) / (vw * 0.45), 1));
      var isi = G.isiEls[i];
      if (isi) isi.style.clipPath = wt >= 1 ? "inset(0 0% 0 0)" : "inset(0 " + ((1 - wt) * 100).toFixed(1) + "% 0 0)";
    }
    if (pitaJalan) {
      var v = G.lastY < 0 ? 0 : (y - G.lastY) / Math.max(dt, 1) * 16.7;
      G.lastY = y;
      var boost = 1 + Math.min(Math.abs(v) / 40, 4);
      var skew = Math.abs(v) > 0.5 ? Math.max(-18, Math.min(18, -v * 0.5)) : 0;
      var base = (ringan ? 0.6 : 1.4) * dt / 16.7;
      for (var m = 0; m < 2; m++) {
        G.pitaX[m] -= base * boost * (m ? -1 : 1);
        var w = G.pitaWrap[m];
        if (G.pitaX[m] < -w) G.pitaX[m] += w;
        if (G.pitaX[m] > 0) G.pitaX[m] -= w;
        G.pitaEls[m].style.transform = "translateX(" + G.pitaX[m].toFixed(1) + "px)" + (skew ? " skewX(" + skew.toFixed(1) + "deg)" : "");
      }
    } else { G.lastY = y; }
  }
  function mulaiLoop() {
    if (G.raf) return;
    G.lastY = -1; G.lastT = 0;
    G.raf = requestAnimationFrame(bingkai);
  }

  function scrollUntukFraksi(frac) {
    return frac * Math.max(G.wrapH - window.innerHeight, 1);
  }
  function lompatKe(id) {
    var el = document.getElementById(id); if (!el) return;
    if (!G.siap || !gerakAktif()) { el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); return; }
    var frac = el.offsetLeft / Math.max(G.maxX, 1);
    window.scrollTo({ top: scrollUntukFraksi(Math.max(0, Math.min(frac, 1))), behavior: "smooth" });
  }
  function lompatKeStasiun(i) {
    var p = panelStasiun[i]; if (!p) return;
    if (!G.siap || !gerakAktif()) { p.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); return; }
    if (!panelPos.length) ukurPanel();
    var frac = panelPos[i][0] / Math.max(G.maxX, 1);
    window.scrollTo({ top: scrollUntukFraksi(Math.max(0, Math.min(frac, 1))), behavior: "smooth" });
  }
  $("#btnNaik").addEventListener("click", function () { lompatKeStasiun(0); });
  $("#btnAwal").addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("#btnPrev").addEventListener("click", function () { geserStasiun(-1); });
  $("#btnNext").addEventListener("click", function () { geserStasiun(1); });
  function geserStasiun(dir) {
    var p = stasiunAktif(); if (!p || !G.siap) return;
    var i = Math.min(21, Math.max(0, +p.getAttribute("data-i") + dir));
    lompatKeStasiun(i);
  }

  var fontSiap = false;
  function cobaBangun() {
    if (!fontSiap || !dinamisSiap || G.siap) return;
    siapkanGerak();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fontSiap = true; cobaBangun(); });
  else fontSiap = true;

  /* ---------- DEEP-LINK (dijalankan setelah pin siap / langsung saat reduced) ---------- */
  function jalankanDeepLink() {
    var q = new URLSearchParams(location.search);
    var a = slugKeIndex(q.get("dari") || ""), b = slugKeIndex(q.get("ke") || "");
    if (a > -1 && b > -1 && a !== b) {
      selDari.value = a; selKe.value = b;
      form.dispatchEvent(new Event("submit", { cancelable: true }));
      lompatKe("bengkel");
    } else {
      var s = slugKeIndex(q.get("stasiun") || "");
      if (s > -1) lompatKeStasiun(s);
    }
  }
  if (reduced || !gerakNyala) {
    // tanpa pin: langsung jalan
    setTimeout(jalankanDeepLink, 400);
  }

  /* ---------- BANGUN DINAMIS DI IDLE (di luar jalur kritis LCP) ---------- */
  if (window.requestIdleCallback) requestIdleCallback(function () { bangunDinamis(); }, { timeout: 2500 });
  else setTimeout(bangunDinamis, 400);
})();
