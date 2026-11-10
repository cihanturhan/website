/* Cihan Turhan – Website-Skript (ohne externe Bibliotheken) */
(function () {
  "use strict";

  // ===== Einstellungen =====
  var CONFIG = {
    // Meta-Pixel-ID hier eintragen (nur Ziffern). Leer = Pixel bleibt aus.
    META_PIXEL_ID: "",
    FORM_EMAIL: "turhanvertrieb@gmail.com",
    CONSENT_KEY: "ct_consent_v1"
  };

  var root = document.body.getAttribute("data-root") || "";

  function store(type) {
    try { return window[type]; } catch (e) { return null; }
  }
  function getItem(type, k) { var s = store(type); try { return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function setItem(type, k, v) { var s = store(type); try { if (s) s.setItem(k, v); } catch (e) {} }
  function removeItem(type, k) { var s = store(type); try { if (s) s.removeItem(k); } catch (e) {} }

  // ===== Jahr im Footer =====
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ===== Mobiles Menü =====
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  // ===== Bereiche ohne Fotos/Videos ausblenden (Fallback für ältere Browser) =====
  document.querySelectorAll(".media-section").forEach(function (sec) {
    if (!sec.querySelector(".media-item")) sec.hidden = true;
  });
  document.querySelectorAll("[data-optional-img]").forEach(function (img) {
    function drop() {
      var box = img.closest("[data-media-box]");
      var grid = img.closest("[data-media-grid]");
      if (box) box.remove();
      if (grid) grid.classList.add("no-media");
    }
    if (!img.getAttribute("src")) drop();
    else if (img.complete && img.naturalWidth === 0) drop();
    else img.addEventListener("error", drop);
  });

  // ===== UTM-Quelle merken (nur für diese Sitzung) =====
  var UTM_KEY = "ct_utm";
  (function captureUtm() {
    var p = new URLSearchParams(location.search);
    var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var found = {};
    var any = false;
    keys.forEach(function (k) { var v = p.get(k); if (v) { found[k] = v.slice(0, 120); any = true; } });
    if (any || !getItem("sessionStorage", UTM_KEY)) {
      found.einstiegsseite = location.pathname;
      var ref = "";
      try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
      if (ref && ref !== location.hostname) found.referrer = ref;
      setItem("sessionStorage", UTM_KEY, JSON.stringify(found));
    }
  })();
  function getUtm() {
    try { return JSON.parse(getItem("sessionStorage", UTM_KEY) || "{}"); } catch (e) { return {}; }
  }

  // ===== Cookie-Banner & Meta Pixel =====
  var pixelLoaded = false;
  function loadPixel() {
    if (pixelLoaded || !/^\d{6,20}$/.test(CONFIG.META_PIXEL_ID)) return;
    pixelLoaded = true;
    /* Offizieller Meta-Pixel-Code, wird erst nach Einwilligung geladen */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", CONFIG.META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
  function trackLead() {
    if (pixelLoaded && window.fbq) { try { window.fbq("track", "Lead"); } catch (e) {} }
  }

  var banner = null;
  function buildBanner() {
    banner = document.createElement("div");
        banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "cookie-title");
    banner.className = "cookie dark";
    banner.innerHTML =
      '<div class="cookie-in"><div><h2 id="cookie-title">Kurz zum Datenschutz</h2>' +
      '<p>Mit deiner Zustimmung nutze ich den Meta Pixel, um zu sehen, welche Instagram- und Facebook-Anzeigen funktionieren. Ohne Zustimmung wird nichts davon geladen. ' +
      'Ändern kannst du das jederzeit unter „Cookie-Einstellungen“ im Fußbereich. <a href="' + root + 'datenschutz.html">Datenschutzerklärung</a></p></div>' +
      '<div class="btns"><button type="button" class="btn line" data-consent="necessary">Ablehnen</button>' +
      '<button type="button" class="btn mint" data-consent="all">Einverstanden</button></div></div>';
    document.body.appendChild(banner);
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var val = b.getAttribute("data-consent");
      var prev = getItem("localStorage", CONFIG.CONSENT_KEY);
      setItem("localStorage", CONFIG.CONSENT_KEY, val);
      banner.hidden = true;
      if (val === "all") loadPixel();
      else if (prev === "all" && pixelLoaded) location.reload(); // Widerruf: Pixel sofort beenden
    });
  }
  function showBanner() { if (!banner) buildBanner(); banner.hidden = false; }
  var consent = getItem("localStorage", CONFIG.CONSENT_KEY);
  if (consent === "all") loadPixel();
  else if (!consent) showBanner();
  document.querySelectorAll("[data-cookie-settings]").forEach(function (b) {
    b.addEventListener("click", function () { showBanner(); });
  });

  // ===== Eigener Videoplayer =====
  var ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>'
  };
  function fmt(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }

  document.querySelectorAll(".player").forEach(function (pl) {
    var v = pl.querySelector("video");
    if (!v) return;
    var start = parseFloat(pl.getAttribute("data-start") || "0") || 0;
    var started = false;

    function removePlayer() {
      var wrap = pl.closest("[data-media-box]") || pl;
      var grid = pl.closest("[data-media-grid]");
      wrap.remove();
      if (grid) grid.classList.add("no-media");
    }
    var srcEl = v.querySelector("source");
    if (srcEl) srcEl.addEventListener("error", removePlayer);
    v.addEventListener("error", removePlayer);

    v.removeAttribute("controls");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    pl.insertAdjacentHTML("beforeend",
      '<button type="button" class="big-play" aria-label="Video abspielen">' + ICONS.play + '</button>' +
      '<div class="bar">' +
      '<button type="button" class="pbtn p-play" aria-label="Abspielen / Pause"><span class="ico-play">' + ICONS.play + '</span><span class="ico-pause">' + ICONS.pause + '</span></button>' +
      '<div class="track" role="slider" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i><b></b></i></div>' +
      '<span class="time">0:00</span>' +
      '<button type="button" class="pbtn p-mute" aria-label="Ton an / aus"><span class="ico-sound">' + ICONS.sound + '</span><span class="ico-muted">' + ICONS.muted + '</span></button>' +
      '<button type="button" class="pbtn p-full" aria-label="Vollbild">' + ICONS.full + '</button>' +
      '</div>');

    var bar = pl.querySelector(".track b");
    var track = pl.querySelector(".track");
    var time = pl.querySelector(".time");
    var idleT;

    function setMutedUi() { pl.classList.toggle("muted", v.muted); }
    function play() {
      if (!started && start > 0) { try { v.currentTime = start; } catch (e) {} }
      started = true;
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    }
    function toggle() { if (v.paused || v.ended) play(); else v.pause(); }
    function wake() {
      pl.classList.remove("idle");
      clearTimeout(idleT);
      idleT = setTimeout(function () { if (!v.paused) pl.classList.add("idle"); }, 2500);
    }

    pl.querySelector(".big-play").addEventListener("click", play);
    pl.querySelector(".p-play").addEventListener("click", toggle);
    v.addEventListener("click", function () { if (pl.classList.contains("idle")) { wake(); return; } toggle(); });
    pl.addEventListener("pointermove", wake);
    pl.addEventListener("touchstart", wake, { passive: true });

    v.addEventListener("play", function () { pl.classList.add("playing"); wake(); });
    v.addEventListener("pause", function () { pl.classList.remove("playing", "idle"); });
    v.addEventListener("ended", function () { pl.classList.remove("playing", "idle"); started = false; });
    v.addEventListener("timeupdate", function () {
      var d = v.duration || 0;
      var pct = d ? (v.currentTime / d) * 100 : 0;
      bar.style.width = pct + "%";
      track.setAttribute("aria-valuenow", Math.round(pct));
      time.textContent = fmt(v.currentTime);
    });
    v.addEventListener("volumechange", setMutedUi);
    setMutedUi();

    pl.querySelector(".p-mute").addEventListener("click", function () { v.muted = !v.muted; });

    function seekTo(clientX) {
      var r = track.getBoundingClientRect();
      var x = Math.min(Math.max(0, clientX - r.left), r.width);
      if (v.duration) { v.currentTime = (x / r.width) * v.duration; started = true; }
    }
    var dragging = false;
    track.addEventListener("pointerdown", function (e) { dragging = true; try { track.setPointerCapture(e.pointerId); } catch (er) {} seekTo(e.clientX); });
    track.addEventListener("pointermove", function (e) { if (dragging) seekTo(e.clientX); });
    track.addEventListener("pointerup", function () { dragging = false; });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); e.preventDefault(); }
      if (e.key === "ArrowLeft") { v.currentTime = Math.max(0, v.currentTime - 5); e.preventDefault(); }
    });

    pl.querySelector(".p-full").addEventListener("click", function () {
      var d = document;
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      } else if (pl.requestFullscreen) {
        pl.requestFullscreen().catch(function () { if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); });
      } else if (pl.webkitRequestFullscreen) {
        pl.webkitRequestFullscreen();
      } else if (v.webkitEnterFullscreen) {
        v.webkitEnterFullscreen(); // iPhone
      }
    });
  });

  // ===== Bewerbungsformular in Schritten =====
  var QUESTIONS = [
    { name: "vertriebserfahrung", label: "Vertriebserfahrung", q: "Hast du Erfahrung im Vertrieb?", a: ["Ja, habe ich.", "Nein, noch nicht."] },
    { name: "selbststaendig", label: "Bereit zur Selbstständigkeit", q: "Bist du bereit, dich selbstständig zu machen?", a: ["Ja, ich bin bereit.", "Nein, auf keinen Fall."] },
    { name: "zeit_pro_woche", label: "Zeit pro Woche", q: "Wie viel Zeit pro Woche bringst du mit?", a: ["Unter 20 Stunden", "Über 20 Stunden", "Über 40 Stunden"] }
  ];
  var TOTAL = QUESTIONS.length + 1;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  document.querySelectorAll("[data-apply]").forEach(function (box, idx) {
    var answers = {};
    var id = "f" + idx;
    var html = '<div class="prog" aria-hidden="true"><span class="pc">Frage 1 / ' + TOTAL + '</span><i><b></b></i></div>';
    QUESTIONS.forEach(function (q, i) {
      html += '<div class="step" data-step="' + i + '"' + (i ? " hidden" : "") + '><h3 id="' + id + 'q' + i + '">' + esc(q.q) + '</h3><div class="opts" role="group" aria-labelledby="' + id + 'q' + i + '">';
      q.a.forEach(function (a) { html += '<button type="button" class="opt" data-q="' + q.name + '" data-v="' + esc(a) + '"><span class="dot"></span>' + esc(a) + '</button>'; });
      html += '</div>' + (i ? '<button type="button" class="back">← Zurück</button>' : '') + '</div>';
    });
    html += '<form class="step" data-step="' + QUESTIONS.length + '" hidden novalidate>' +
      '<h3>Letzter Schritt: Wie erreiche ich dich?</h3>' +
      '<div class="row2"><div class="field"><label for="' + id + 'vn">Vorname</label><input id="' + id + 'vn" name="vorname" autocomplete="given-name" required></div>' +
      '<div class="field"><label for="' + id + 'nn">Nachname</label><input id="' + id + 'nn" name="nachname" autocomplete="family-name" required></div></div>' +
      '<div class="field"><label for="' + id + 'plz">Postleitzahl</label><input id="' + id + 'plz" name="plz" inputmode="numeric" autocomplete="postal-code" maxlength="5" pattern="[0-9]{5}" required></div>' +
      '<div class="field"><label for="' + id + 'em">E-Mail</label><input id="' + id + 'em" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="field"><label for="' + id + 'tel">Telefon</label><input id="' + id + 'tel" name="telefon" type="tel" autocomplete="tel" required></div>' +
      '<input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="check"><input type="checkbox" name="datenschutz" required><span>Ich habe die <a href="' + root + 'datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin einverstanden, dass meine Angaben zur Bearbeitung meiner Bewerbung verwendet werden und ich telefonisch kontaktiert werde.</span></label>' +
      '<p class="form-err" role="alert" hidden></p>' +
      '<button type="submit" class="btn block">Bewerbung abschicken <span class="arr">→</span></button>' +
      '<button type="button" class="back">← Zurück</button>' +
      '<p class="form-note">Dauert ca. 1 Minute · Rückmeldung in 24–48 Stunden</p>' +
      '</form>';
    box.innerHTML = html;

    var steps = box.querySelectorAll(".step");
    var pc = box.querySelector(".pc");
    var pb = box.querySelector(".prog b");
    var cur = 0;
    function go(n) {
      cur = n;
      steps.forEach(function (s, i) { s.hidden = i !== n; });
      pc.textContent = "Frage " + (n + 1) + " / " + TOTAL;
      pb.style.width = ((n + 1) / TOTAL) * 100 + "%";
      var h = steps[n].querySelector("h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      var r = box.getBoundingClientRect();
      if (r.top < 60) box.scrollIntoView({ block: "start" });
    }
    box.addEventListener("click", function (e) {
      var o = e.target.closest(".opt");
      if (o) {
        var q = o.getAttribute("data-q");
        answers[q] = o.getAttribute("data-v");
        o.parentNode.querySelectorAll(".opt").forEach(function (x) { x.classList.toggle("sel", x === o); x.setAttribute("aria-pressed", x === o ? "true" : "false"); });
        setTimeout(function () { go(cur + 1); }, 180);
        return;
      }
      if (e.target.closest(".back")) go(Math.max(0, cur - 1));
    });

    var form = box.querySelector("form");
    var err = form.querySelector(".form-err");
    var btn = form.querySelector('button[type="submit"]');
    function fail(msg, el) {
      err.textContent = msg; err.hidden = false;
      if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); }
    }
    form.addEventListener("input", function (e) { e.target.removeAttribute("aria-invalid"); err.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var vn = f.vorname.value.trim(), nn = f.nachname.value.trim(), plz = f.plz.value.trim(), em = f.email.value.trim(), tel = f.telefon.value.trim();
      if (vn.length < 2) return fail("Bitte gib deinen Vornamen ein.", f.vorname);
      if (nn.length < 2) return fail("Bitte gib deinen Nachnamen ein.", f.nachname);
      if (!/^\d{5}$/.test(plz)) return fail("Bitte gib eine gültige 5-stellige Postleitzahl ein.", f.plz);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return fail("Bitte gib eine gültige E-Mail-Adresse ein.", f.email);
      if (tel.replace(/\D/g, "").length < 6) return fail("Bitte gib eine gültige Telefonnummer ein.", f.telefon);
      if (!f.datenschutz.checked) return fail("Bitte bestätige die Datenschutzerklärung.", f.datenschutz);
      if (f._honey.value) return; // Spam

      var utm = getUtm();
      var payload = {
        _subject: "Neue Bewerbung: " + vn + " " + nn + " (" + (utm.utm_source || "Website") + ")",
        _template: "table",
        _captcha: "false",
        Vorname: vn, Nachname: nn, PLZ: plz, "E-Mail": em, Telefon: tel,
        _replyto: em
      };
      QUESTIONS.forEach(function (q) { payload[q.label] = answers[q.name] || "–"; });
      payload["Formular-Seite"] = location.pathname;
      payload["Quelle (utm_source)"] = utm.utm_source || "–";
      payload["Medium (utm_medium)"] = utm.utm_medium || "–";
      payload["Kampagne (utm_campaign)"] = utm.utm_campaign || "–";
      payload["Anzeige (utm_content)"] = utm.utm_content || "–";
      payload["Keyword (utm_term)"] = utm.utm_term || "–";
      payload["Einstiegsseite"] = utm.einstiegsseite || "–";
      payload["Verweis von"] = utm.referrer || "–";
      payload["Datenschutz akzeptiert"] = "Ja, " + new Date().toLocaleString("de-DE");

      btn.disabled = true; btn.textContent = "Wird gesendet …";
      fetch("https://formsubmit.co/ajax/" + CONFIG.FORM_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        trackLead();
        setItem("sessionStorage", "ct_sent", "1");
        setTimeout(function () { location.href = root + "danke.html"; }, 350);
      }).catch(function () {
        btn.disabled = false; btn.innerHTML = 'Bewerbung abschicken <span class="arr">→</span>';
        fail("Das Senden hat leider nicht geklappt. Bitte versuch es erneut oder schreib mir an " + CONFIG.FORM_EMAIL + ".");
      });
    });
  });

  // ===== Sticky-Button (Funnel) ausblenden, wenn Formular sichtbar =====
  var sticky = document.querySelector(".sticky-cta");
  var target = document.getElementById("bewerben");
  if (sticky && target && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      sticky.classList.toggle("hide", en[0].isIntersecting);
    }, { threshold: 0.15 }).observe(target);
  }
})();
