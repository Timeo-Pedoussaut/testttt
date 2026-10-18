/*
  Sections « Carte de la famille » et « Statistiques » + navigation par onglets.
  Tout est calculé dans le navigateur à partir de data.js (et des modifications non publiées).
*/
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const P = App.parseDate;
  const MONTH_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const MONTHS = App.MONTHS;

  let tab = "tree";

  // ==========================================================
  // Onglets
  // ==========================================================
  function showTab(t) {
    if (t === tab && document.body.dataset.tab === t) return;
    tab = t;
    document.body.dataset.tab = t;
    document.querySelectorAll(".tabs [role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
    $("page-map").hidden = t !== "map";
    $("page-stats").hidden = t !== "stats";
    try {
      if (t === "map") history.replaceState(null, "", "#carte");
      else if (t === "stats") history.replaceState(null, "", "#stats");
      else if (/^#(carte|stats)$/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    } catch (e) { /* file:// */ }
    if (t === "tree") App.redrawMinimap();
    if (t === "map") mapPage.show();
    if (t === "stats") statsPage.render();
  }

  document.querySelectorAll(".tabs [role=tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  document.querySelector(".tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const btns = Array.from(document.querySelectorAll(".tabs [role=tab]"));
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    const n = btns[(i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length];
    n.focus(); showTab(n.dataset.tab);
  });

  // ==========================================================
  // Statistiques
  // ==========================================================
  const fmt = (n, d) => (n == null ? "–" : n.toFixed(d == null ? 1 : d).replace(".", ","));
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const yr = (text) => { const p = P(text); return p ? p.y : App.yearOf(text); };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const plural = (n, one, many) => n + " " + (n > 1 ? many : one);
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  function ageAt(bText, eText) {
    const b = P(bText), e = P(eText);
    const by = b ? b.y : App.yearOf(bText), ey = e ? e.y : App.yearOf(eText);
    if (by == null || ey == null) return null;
    let a = ey - by;
    if (b && e && b.m && e.m && (e.m < b.m || (e.m === b.m && b.d && e.d && e.d < b.d))) a -= 1;
    return a;
  }

  function personLink(id, label) {
    const b = el("button", "who", label || App.displayName(App.getState().people[id]));
    b.type = "button";
    b.addEventListener("click", () => App.openPanel(id));
    return b;
  }

  function tile(value, label, note, whoId) {
    const t = el("div", "stat-tile");
    t.appendChild(el("div", "v", value));
    const l = el("div", "l", label);
    if (whoId) { l.appendChild(document.createTextNode(" · ")); l.appendChild(personLink(whoId)); }
    t.appendChild(l);
    if (note) t.appendChild(el("div", "n", note));
    return t;
  }

  function box(title, content) {
    const b = el("div", "stat-box");
    b.appendChild(el("h3", null, title));
    b.appendChild(content);
    return b;
  }

  const emptyMsg = (t) => el("p", "empty", t);

  function barList(items, opts) {
    if (!items.length) return emptyMsg("Pas encore assez de données.");
    const max = Math.max.apply(null, items.map((i) => i.count));
    const ul = el("ul", "bars");
    items.forEach((it) => {
      const li = el("li");
      if (opts && opts.search) {
        const b = el("button", "name", it.name); b.type = "button"; b.title = "Chercher « " + it.name + " » dans l'arbre";
        b.addEventListener("click", () => App.searchFor(it.name));
        li.appendChild(b);
      } else li.appendChild(el("span", "name", it.name));
      const tr = el("span", "track"), f = el("span", "fill");
      f.style.width = Math.max(4, (it.count / max) * 100) + "%";
      tr.appendChild(f); li.appendChild(tr);
      li.appendChild(el("span", "count", String(it.count)));
      ul.appendChild(li);
    });
    return ul;
  }

  function columns(items) {
    const max = Math.max.apply(null, items.map((i) => i.value).concat([1]));
    const wrap = el("div", "columns");
    items.forEach((it) => {
      const c = el("div", "col");
      c.appendChild(el("b", null, it.value ? String(it.value) : ""));
      const bar = el("i"); bar.style.height = (it.value / max) * 100 + "%"; bar.title = it.label + " : " + it.value;
      c.appendChild(bar);
      c.appendChild(el("span", null, it.label));
      wrap.appendChild(c);
    });
    return wrap;
  }

  function top(map, n) {
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr")).slice(0, n);
  }
  function tally(map, key, name) {
    const k = norm(key);
    if (!k) return;
    const cur = map.get(k);
    if (cur) cur.count++; else map.set(k, { name, count: 1 });
  }

  // --- anniversaires
  function birthdayEvents(st, idx) {
    const ev = [];
    Object.keys(st.people).forEach((id) => {
      const p = st.people[id];
      if (App.isUnknown(p)) return;
      const b = P(p.birth), d = P(p.death);
      if (b && b.d && b.m) ev.push({ kind: "birth", id, m: b.m, d: b.d, y: b.y, dead: App.isDead(p) });
      if (d && d.d && d.m) ev.push({ kind: "death", id, m: d.m, d: d.d, y: d.y });
    });
    st.families.forEach((f) => {
      const md = f.marriage && P(f.marriage.date);
      const a = st.people[f.husb], b = st.people[f.wife];
      if (md && md.d && md.m && a && b) ev.push({ kind: "marriage", ids: [f.husb, f.wife], m: md.m, d: md.d, y: md.y });
    });
    return ev;
  }

  function buildBirthdays(st, idx) {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const items = birthdayEvents(st, idx).map((e) => {
      let occ = new Date(today.getFullYear(), e.m - 1, e.d);
      if (occ < today) occ = new Date(today.getFullYear() + 1, e.m - 1, e.d);
      return Object.assign(e, { days: Math.round((occ - today) / 864e5), n: occ.getFullYear() - e.y, occ });
    }).sort((a, b) => a.days - b.days);

    const wrap = el("div");
    const head = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const line = (e) => {
      const li = el("li");
      const when = el("span", "when" + (e.days === 0 ? " today" : ""),
        e.days === 0 ? "Aujourd'hui" : e.days === 1 ? "Demain" : "Dans " + e.days + " j · " + e.occ.getDate() + " " + MONTH_SHORT[e.occ.getMonth()]);
      li.appendChild(when);
      const body = el("span");
      if (e.kind === "marriage") {
        body.appendChild(personLink(e.ids[0])); body.appendChild(document.createTextNode(" et ")); body.appendChild(personLink(e.ids[1]));
        body.appendChild(el("small", null, " · " + plural(e.n, "an", "ans") + " de mariage (" + e.y + ")"));
      } else {
        body.appendChild(personLink(e.id));
        const p = st.people[e.id], f = p.sex === "F";
        const txt = e.kind === "death"
          ? " · " + (f ? "décédée" : "décédé") + " il y a " + plural(e.n, "an", "ans") + " (" + e.y + ")"
          : e.dead ? " · aurait " + plural(e.n, "an", "ans") + " (" + (f ? "née" : "né") + " en " + e.y + ")" : " · " + plural(e.n, "an", "ans") + " (" + (f ? "née" : "né") + " en " + e.y + ")";
        body.appendChild(el("small", null, txt));
      }
      li.appendChild(body);
      return li;
    };
    const todays = items.filter((e) => e.days === 0), next = items.filter((e) => e.days > 0 && e.days <= 60).slice(0, 8);
    const a = el("ul", "birthdays");
    if (todays.length) todays.forEach((e) => a.appendChild(line(e)));
    else a.appendChild(el("li", null, "Aucun anniversaire dans l'arbre le " + head + "."));
    wrap.appendChild(a);
    if (next.length) {
      wrap.appendChild(el("h3", null, "Prochainement"));
      wrap.lastChild.style.margin = "1rem 0 0.5rem";
      const b = el("ul", "birthdays"); next.forEach((e) => b.appendChild(line(e))); wrap.appendChild(b);
    }
    return box("Anniversaires du jour · " + head, wrap);
  }

  const statsPage = {
    render() {
      const root = $("stats-root");
      const st = App.getState();
      const ix = TreeLayout.buildIndex(st);
      const ids = Object.keys(st.people).filter((id) => !App.isUnknown(st.people[id]));
      root.textContent = "";
      root.appendChild(el("h2", null, "Statistiques de la famille"));
      root.appendChild(el("p", "muted small", "Calculées en direct à partir de l'arbre. « n » indique le nombre de personnes qui ont les dates nécessaires au calcul."));

      // ---- anniversaires
      const s0 = el("section"); s0.appendChild(buildBirthdays(st, ix)); root.appendChild(s0);

      // ---- chiffres clés
      const s1 = el("section"); s1.appendChild(el("h2", null, "En chiffres"));
      const g1 = el("div", "grid-cards");
      const dead = ids.filter((i) => App.isDead(st.people[i])).length;
      const living = ids.filter((i) => App.isLiving(st.people[i])).length;
      const men = ids.filter((i) => st.people[i].sex === "H").length, women = ids.filter((i) => st.people[i].sex === "F").length;
      let gens = 0; try { gens = App.allGenerations(); } catch (e) { /* rien */ }
      const oldest = ids.map((i) => ({ i, y: yr(st.people[i].birth) })).filter((x) => x.y != null).sort((a, b) => a.y - b.y)[0];
      g1.appendChild(tile(String(ids.length), "personnes", plural(st.families.filter((f) => (f.husb && f.wife) || (f.children || []).length).length, "union", "unions")));
      g1.appendChild(tile(String(gens), "générations", "sur la ligne la plus longue"));
      g1.appendChild(tile(String(dead), "décédé(e)s", living ? living + " vivant(e)s connu(e)s" : null));
      g1.appendChild(tile(men + " / " + women, "hommes / femmes"));
      if (oldest) g1.appendChild(tile(String(oldest.y), "plus ancienne naissance", null, oldest.i));
      g1.appendChild(tile(String(ids.filter((i) => st.people[i].photo).length), "personnes avec photo"));
      s1.appendChild(g1); root.appendChild(s1);

      // ---- durée de vie
      const s2 = el("section"); s2.appendChild(el("h2", null, "Durée de vie"));
      const ages = ids.map((i) => ({ i, a: ageAt(st.people[i].birth, st.people[i].death), by: yr(st.people[i].birth) }))
        .filter((x) => x.a != null && x.a >= 0 && x.a <= 120);
      const vals = ages.map((x) => x.a);
      const g2 = el("div", "grid-cards");
      if (vals.length) {
        const old = ages.slice().sort((a, b) => b.a - a.a)[0], young = ages.slice().sort((a, b) => a.a - b.a)[0];
        g2.appendChild(tile(fmt(mean(vals)) + " ans", "âge moyen au décès", "n = " + vals.length));
        g2.appendChild(tile(fmt(median(vals), 0) + " ans", "âge médian au décès"));
        g2.appendChild(tile(old.a + " ans", "le plus longtemps vécu", null, old.i));
        g2.appendChild(tile(young.a + " ans", "décès le plus précoce", null, young.i));
      } else g2.appendChild(emptyMsg("Il faut des dates de naissance et de décès pour calculer les âges."));
      s2.appendChild(g2);
      const c2 = el("div", "stat-cols"); c2.style.marginTop = "1rem";
      const bins = []; for (let d = 0; d < 10; d++) bins.push({ label: d === 9 ? "90+" : d * 10 + "–" + (d * 10 + 9), value: 0 });
      vals.forEach((a) => { bins[Math.min(9, Math.floor(a / 10))].value++; });
      c2.appendChild(box("Âge au décès (par tranche de 10 ans)", vals.length ? columns(bins) : emptyMsg("Pas encore assez de données.")));
      const periods = [["avant 1900", (y) => y < 1900], ["1900 – 1949", (y) => y >= 1900 && y < 1950], ["1950 et après", (y) => y >= 1950]];
      const tbl = el("table", "stat-table");
      const th = el("tr"); ["Né(e)", "n", "Âge moyen"].forEach((h) => th.appendChild(el("th", null, h))); tbl.appendChild(th);
      let rows = 0;
      periods.forEach(([label, test]) => {
        const v = ages.filter((x) => x.by != null && test(x.by)).map((x) => x.a);
        if (!v.length) return;
        rows++;
        const tr = el("tr"); tr.appendChild(el("td", null, label)); tr.appendChild(el("td", null, String(v.length))); tr.appendChild(el("td", null, fmt(mean(v)) + " ans")); tbl.appendChild(tr);
      });
      c2.appendChild(box("Espérance de vie selon l'époque de naissance", rows ? tbl : emptyMsg("Pas encore assez de données.")));
      s2.appendChild(c2); root.appendChild(s2);

      // ---- famille
      const s3 = el("section"); s3.appendChild(el("h2", null, "Famille"));
      const g3 = el("div", "grid-cards");
      const famsKids = st.families.filter((f) => (f.children || []).filter((c) => st.people[c]).length);
      const kidsAvg = mean(famsKids.map((f) => f.children.filter((c) => st.people[c]).length));
      const firstAge = { H: [], F: [] }, marrAge = [];
      ids.forEach((id) => {
        const p = st.people[id];
        const kb = (ix.famsOf[id] || []).flatMap((f) => (f.children || []).map((c) => st.people[c] && st.people[c].birth)).filter(Boolean)
          .map((b) => ({ b, y: yr(b) })).filter((x) => x.y != null).sort((a, b) => a.y - b.y)[0];
        if (kb && p.birth && (p.sex === "H" || p.sex === "F")) { const a = ageAt(p.birth, kb.b); if (a != null && a >= 12 && a <= 60) firstAge[p.sex].push(a); }
      });
      st.families.forEach((f) => {
        const d = f.marriage && f.marriage.date;
        if (!d) return;
        [f.husb, f.wife].forEach((pid) => { const p = st.people[pid]; if (p && p.birth) { const a = ageAt(p.birth, d); if (a != null && a >= 14 && a <= 90) marrAge.push(a); } });
      });
      g3.appendChild(tile(famsKids.length ? fmt(kidsAvg) : "–", "enfants par union", "unions avec enfants connus : " + famsKids.length));
      g3.appendChild(tile(firstAge.F.length ? fmt(mean(firstAge.F)) + " ans" : "–", "âge moyen des mères au 1er enfant", "n = " + firstAge.F.length));
      g3.appendChild(tile(firstAge.H.length ? fmt(mean(firstAge.H)) + " ans" : "–", "âge moyen des pères au 1er enfant", "n = " + firstAge.H.length));
      g3.appendChild(tile(marrAge.length ? fmt(mean(marrAge)) + " ans" : "–", "âge moyen au mariage", "n = " + marrAge.length));
      s3.appendChild(g3); root.appendChild(s3);

      // ---- métiers, prénoms, noms
      const s4 = el("section"); s4.appendChild(el("h2", null, "Métiers et noms"));
      const jobs = new Map(), given = new Map(), sur = new Map();
      ids.forEach((id) => {
        const p = st.people[id];
        const seen = new Set();
        (p.job || "").replace(/\s*\(.*?\)/g, "").split(",").map((j) => j.trim()).filter(Boolean).forEach((j) => { if (!seen.has(norm(j))) { seen.add(norm(j)); tally(jobs, j, cap(j)); } });
        const gs = new Set();
        (p.given || "").split(/\s+/).filter((g) => g.length > 1).forEach((g) => { if (!gs.has(norm(g))) { gs.add(norm(g)); tally(given, g, g); } });
        if (p.surname) tally(sur, p.surname, p.surname);
      });
      const c4 = el("div", "stat-cols");
      c4.appendChild(box("Métiers les plus fréquents", barList(top(jobs, 10), { search: true })));
      c4.appendChild(box("Prénoms les plus fréquents", barList(top(given, 10), { search: true })));
      c4.appendChild(box("Noms de famille", barList(top(sur, 8), { search: true })));
      s4.appendChild(c4); root.appendChild(s4);

      // ---- saisonnalité et lieux
      const s5 = el("section"); s5.appendChild(el("h2", null, "Naissances et lieux"));
      const months = MONTH_SHORT.map((l) => ({ label: l, value: 0 }));
      ids.forEach((id) => { const b = P(st.people[id].birth); if (b && b.m) months[b.m - 1].value++; });
      const c5 = el("div", "stat-cols");
      c5.appendChild(box("Mois de naissance", months.some((m) => m.value) ? columns(months) : emptyMsg("Pas encore assez de données.")));
      const bp = new Map(), dp = new Map();
      ids.forEach((id) => { const p = st.people[id]; if (p.birthPlace) tally(bp, shortPlace(p.birthPlace), shortPlace(p.birthPlace)); if (p.deathPlace) tally(dp, shortPlace(p.deathPlace), shortPlace(p.deathPlace)); });
      c5.appendChild(box("Lieux de naissance les plus fréquents", barList(top(bp, 6), { search: true })));
      c5.appendChild(box("Lieux de décès les plus fréquents", barList(top(dp, 6), { search: true })));
      s5.appendChild(c5); root.appendChild(s5);
    },
  };

  function shortPlace(s) { return (s || "").split(",")[0].trim(); }

  // ==========================================================
  // Carte de toute la famille
  // ==========================================================
  const mapPage = (function () {
    let L = null, map = null, layer = null, started = false, fitted = false, runId = 0;
    const coords = new Map();       // lieu -> { lat, lon } | null
    const arrows = [];
    const markersByPlace = new Map();
    let lastGenCache = new Map(), lastMaxGen = 0;   // génération de chaque personne, calculées au dernier redraw()
    let animPlaying = false, animTimer = null;

    // génération d'une personne : 0 pour un ancêtre sans parent connu, +1 à chaque génération.
    // Les conjoints ne comptent pas une génération de plus (même logique que le reste du site).
    function genOf(ix, cache, id) {
      if (cache.has(id)) return cache.get(id);
      cache.set(id, 0);              // protège d'un éventuel cycle de données
      const pf = ix.parentFam[id];
      let g = 0;
      if (pf) {
        const gh = pf.husb && ix.people[pf.husb] ? genOf(ix, cache, pf.husb) + 1 : 0;
        const gw = pf.wife && ix.people[pf.wife] ? genOf(ix, cache, pf.wife) + 1 : 0;
        g = Math.max(gh, gw);
      }
      cache.set(id, g);
      return g;
    }

    function stopAnim() {
      if (animTimer) { clearInterval(animTimer); animTimer = null; }
      animPlaying = false;
      $("anim-play").textContent = "▶";
      $("anim-play").setAttribute("aria-pressed", "false");
      $("anim-play").setAttribute("aria-label", "Lecture");
    }
    function startAnim() {
      const slider = $("anim-slider");
      if (+slider.value >= +slider.max) slider.value = 0;
      animPlaying = true;
      $("anim-play").textContent = "❚❚";
      $("anim-play").setAttribute("aria-pressed", "true");
      $("anim-play").setAttribute("aria-label", "Pause");
      animTimer = setInterval(() => {
        const s = $("anim-slider"), v = +s.value;
        if (v >= +s.max) { stopAnim(); return; }
        s.value = v + 1;
        redraw();
        updateAnimLabel();
      }, 1300);
    }
    function updateAnimLabel() {
      const v = +$("anim-slider").value;
      const years = [];
      lastGenCache.forEach((g, id) => { if (g === v) { const y = yr(App.getState().people[id].birth); if (y != null) years.push(y); } });
      const range = years.length ? " · " + Math.min.apply(null, years) + (Math.max.apply(null, years) !== Math.min.apply(null, years) ? " – " + Math.max.apply(null, years) : "") : "";
      $("anim-label").textContent = "Génération " + v + " / " + lastMaxGen + range;
    }

    const setMsg = (t) => {
      let m = $("family-map").querySelector(".map-msg");
      if (!t) { if (m) m.remove(); return; }
      if (!m) { m = el("span", "map-msg"); $("family-map").appendChild(m); }
      m.textContent = t;
    };

    // « 1970 » ou « 2/4 rue du Parc » saisis dans un champ lieu : erreurs de saisie probables, on ne les cherche pas
    const badPlace = (pl) => /^\d{3,4}$/.test(pl.trim()) || /^\d+[\d\/\-]*\s*(bis|ter)?\s*(rue|boulevard|bd|avenue|av\.|chemin|impasse|place|route|allée)\b/i.test(pl.trim());

    function allPlaces(st) {
      const s = new Set();
      Object.keys(st.people).forEach((id) => { const p = st.people[id]; if (p.birthPlace && !Array.isArray(p.birthCoords) && !badPlace(p.birthPlace)) s.add(p.birthPlace); if (p.deathPlace && !badPlace(p.deathPlace)) s.add(p.deathPlace); });
      return Array.from(s);
    }

    async function resolveAll() {
      const my = ++runId;
      const places = allPlaces(App.getState()).filter((pl) => !coords.has(pl) || coords.get(pl) === undefined);
      let done = 0;
      $("map-status").textContent = places.length ? "Localisation des lieux… 0/" + places.length : "";
      for (const pl of places) {
        if (my !== runId) return;
        let c = null;
        try { c = await App.resolvePlace(pl); } catch (e) { c = null; }
        coords.set(pl, c);
        done++;
        $("map-status").textContent = done < places.length ? "Localisation des lieux… " + done + "/" + places.length : "";
        redraw();
      }
      redraw();
    }

    function ll(p, kind) {
      if (kind === "birth") {
        if (Array.isArray(p.birthCoords) && p.birthCoords.length === 2) return { lat: +p.birthCoords[0], lon: +p.birthCoords[1] };
        return p.birthPlace ? coords.get(p.birthPlace) || null : null;
      }
      return p.deathPlace ? coords.get(p.deathPlace) || null : null;
    }

    const angleOf = (a, b) => { const pa = map.latLngToContainerPoint(a), pb = map.latLngToContainerPoint(b); return Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180 / Math.PI; };
    const arrowIcon = (deg) => L.divIcon({ className: "mig-arrow", html: '<svg viewBox="0 0 24 24" style="transform:rotate(' + deg + 'deg)"><path d="M3 5l18 7-18 7 4-7z"/></svg>', iconSize: [16, 16], iconAnchor: [8, 8] });
    function updateArrows() { if (map) arrows.forEach((x) => x.m.setIcon(arrowIcon(angleOf(x.a, x.b)))); }

    function drawLink(a, b, color, weight, dash, tip) {
      const line = L.polyline([a, b], { color, weight, opacity: 0.75, dashArray: dash || null }).addTo(layer);
      line.bindTooltip(tip, { sticky: true });
      const pa = map.latLngToContainerPoint(a), pb = map.latLngToContainerPoint(b);
      if (Math.hypot(pb.x - pa.x, pb.y - pa.y) > 28) {
        const mid = [a[0] + (b[0] - a[0]) * 0.55, a[1] + (b[1] - a[1]) * 0.55];
        const m = L.marker(mid, { icon: arrowIcon(angleOf(a, b)), interactive: false, keyboard: false }).addTo(layer);
        arrows.push({ m, a, b });
      }
    }

    function popupFor(agg, showB, showD, st) {
      const d = el("div", "map-popup");
      d.appendChild(el("h3", null, agg.place));
      const list = (title, ids) => {
        d.appendChild(el("p", null, title + " (" + ids.length + ")"));
        ids.slice(0, 14).forEach((id) => {
          const b = el("button", null, App.displayName(st.people[id])); b.type = "button";
          b.addEventListener("click", () => App.openPanel(id));
          d.appendChild(b);
        });
        if (ids.length > 14) d.appendChild(el("span", null, " … +" + (ids.length - 14)));
      };
      if (showB && agg.births.length) list("Nés ici", agg.births);
      if (showD && agg.deaths.length) list("Décédés ici", agg.deaths);
      return d;
    }

    function redraw() {
      if (!map) return;
      layer.clearLayers(); arrows.length = 0; markersByPlace.clear();
      const st = App.getState();
      const ix = TreeLayout.buildIndex(st);
      const showB = $("mo-births").checked, showD = $("mo-deaths").checked, showGen = $("mo-gen").checked, showLife = $("mo-life").checked;
      const animOn = $("mo-anim").checked;
      const from = $("mo-from").value === "" ? null : +$("mo-from").value, to = $("mo-to").value === "" ? null : +$("mo-to").value;

      const genCache = new Map();
      Object.keys(st.people).forEach((id) => { if (!App.isUnknown(st.people[id])) genOf(ix, genCache, id); });
      lastGenCache = genCache;
      lastMaxGen = genCache.size ? Math.max.apply(null, Array.from(genCache.values())) : 0;
      if (animOn) { $("anim-slider").max = String(lastMaxGen); }
      const animGen = animOn ? +$("anim-slider").value : null;

      const inRange = (id) => {
        if (animOn) return genCache.has(id) && genCache.get(id) <= animGen;
        if (from == null && to == null) return true;
        const y = yr(st.people[id].birth); return y != null && (from == null || y >= from) && (to == null || y <= to);
      };
      const cB = cssVar("--ok"), cD = cssVar("--ink-soft"), cM = cssVar("--brass"), cG = cssVar("--accent");

      const agg = new Map();
      const add = (place, pos, id, kind) => {
        let a = agg.get(place);
        if (!a) { a = { place, pos, births: [], deaths: [] }; agg.set(place, a); }
        (kind === "birth" ? a.births : a.deaths).push(id);
      };
      const missing = new Set(), ignored = new Set();
      Object.keys(st.people).forEach((id) => {
        const p = st.people[id];
        if (App.isUnknown(p) || !inRange(id)) return;
        if (p.birthPlace && badPlace(p.birthPlace) && !Array.isArray(p.birthCoords)) ignored.add(p.birthPlace);
        else if (p.birthPlace) { const c = ll(p, "birth"); if (c) add(p.birthPlace, c, id, "birth"); else if (coords.has(p.birthPlace)) missing.add(p.birthPlace); }
        if (p.deathPlace && badPlace(p.deathPlace)) ignored.add(p.deathPlace);
        else if (p.deathPlace) { const c = ll(p, "death"); if (c) add(p.deathPlace, c, id, "death"); else if (coords.has(p.deathPlace)) missing.add(p.deathPlace); }
      });

      // migrations : lieu de naissance du parent -> lieu de naissance de l'enfant
      const gen = new Map();
      if (showGen) {
        st.families.forEach((f) => {
          (f.children || []).forEach((k) => {
            const kid = st.people[k];
            if (!kid || !inRange(k)) return;
            const kc = ll(kid, "birth");
            if (!kc) return;
            [f.husb, f.wife].forEach((pid) => {
              const par = st.people[pid];
              const pc = par && ll(par, "birth");
              if (!pc || !par.birthPlace || !kid.birthPlace || par.birthPlace === kid.birthPlace) return;
              const key = par.birthPlace + "\\u0000" + kid.birthPlace;
              const g = gen.get(key) || { a: [pc.lat, pc.lon], b: [kc.lat, kc.lon], from: par.birthPlace, to: kid.birthPlace, n: 0 };
              g.n++; gen.set(key, g);
            });
          });
        });
      }
      const life = new Map();
      if (showLife) {
        Object.keys(st.people).forEach((id) => {
          const p = st.people[id];
          if (App.isUnknown(p) || !inRange(id) || !p.birthPlace || !p.deathPlace || p.birthPlace === p.deathPlace) return;
          const bc = ll(p, "birth"), dc = ll(p, "death");
          if (!bc || !dc) return;
          const key = p.birthPlace + "\\u0000" + p.deathPlace;
          const g = life.get(key) || { a: [bc.lat, bc.lon], b: [dc.lat, dc.lon], from: p.birthPlace, to: p.deathPlace, n: 0 };
          g.n++; life.set(key, g);
        });
      }
      life.forEach((g) => drawLink(g.a, g.b, cM, 1.5 + Math.min(4, g.n * 0.8), "6 6", g.from + " → " + g.to + " : " + plural(g.n, "personne", "personnes") + " (de la naissance au décès)"));
      gen.forEach((g) => drawLink(g.a, g.b, cG, 1.8 + Math.min(6, g.n * 1.1), null, g.from + " → " + g.to + " : " + plural(g.n, "naissance", "naissances") + " (du lieu de naissance du parent à celui de l'enfant)"));

      // lieux
      const bounds = [];
      const rows = [];
      agg.forEach((a) => {
        const b = showB ? a.births.length : 0, d = showD ? a.deaths.length : 0;
        if (b + d === 0) return;
        const color = b && d ? cM : b ? cB : cD;
        const m = L.circleMarker([a.pos.lat, a.pos.lon], { radius: 6 + 3 * Math.sqrt(b + d), color: "#fff", weight: 1.5, fillColor: color, fillOpacity: 0.88 }).addTo(layer);
        m.bindTooltip(a.place + " — " + [b && plural(b, "naissance", "naissances"), d && plural(d, "décès", "décès")].filter(Boolean).join(", "));
        m.bindPopup(popupFor(a, showB, showD, st));
        markersByPlace.set(a.place, m);
        bounds.push([a.pos.lat, a.pos.lon]);
        rows.push({ a, b, d });
      });
      if (!fitted && bounds.length) { map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 }); fitted = true; }
      updateArrows();

      // liste latérale
      const box = $("map-places");
      box.textContent = "";
      rows.sort((x, y) => (y.b + y.d) - (x.b + x.d) || x.a.place.localeCompare(y.a.place, "fr")).forEach(({ a, b, d }) => {
        const btn = el("button", "map-place"); btn.type = "button";
        btn.appendChild(el("span", null, a.place));
        btn.appendChild(el("small", null, [b && plural(b, "naissance", "naissances"), d && plural(d, "décès", "décès")].filter(Boolean).join(" · ")));
        btn.addEventListener("click", () => { map.setView([a.pos.lat, a.pos.lon], Math.max(map.getZoom(), 8)); const m = markersByPlace.get(a.place); if (m) m.openPopup(); });
        box.appendChild(btn);
      });
      $("map-missing").textContent = [
        missing.size ? "Lieux introuvables sur la carte : " + Array.from(missing).join(" ; ") + ". Ajoute leurs coordonnées dans PLACES (data.js), voir le README." : "",
        ignored.size ? "Ignorés (ressemblent à une erreur de saisie, à corriger dans MyHeritage) : " + Array.from(ignored).join(" ; ") + "." : "",
      ].filter(Boolean).join(" ");
      if (!rows.length && !$("map-status").textContent) setMsg(Object.keys(st.people).some((i) => st.people[i].birthPlace || st.people[i].deathPlace) ? "Aucun lieu à afficher avec ces réglages." : "Aucun lieu de naissance ou de décès n'est renseigné.");
      else setMsg("");
      $("map-status").dataset.count = rows.length;
      if (animOn) updateAnimLabel();
    }

    async function init() {
      setMsg("Chargement de la carte…");
      try { L = await App.loadLeaflet(); }
      catch (e) { setMsg("La carte n'a pas pu être chargée (connexion ?)."); started = false; return; }
      map = L.map($("family-map"), { worldCopyJump: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map);
      layer = L.layerGroup().addTo(map);
      map.setView([47, 3], 5);
      map.on("zoomend", updateArrows);
      const fit = el("button", "btn", "Recentrer la carte"); fit.type = "button";
      fit.addEventListener("click", () => { fitted = false; redraw(); });
      $("map-status").after(fit);
      setMsg("");
      setTimeout(() => map.invalidateSize(), 60);
      resolveAll();
    }

    ["mo-births", "mo-deaths", "mo-gen", "mo-life", "mo-from", "mo-to"].forEach((id) => { $(id).addEventListener("input", () => redraw()); $(id).addEventListener("change", () => redraw()); });
    $("mo-anim").addEventListener("change", () => {
      const on = $("mo-anim").checked;
      $("anim-controls").hidden = !on;
      $("mo-range-field").hidden = on;
      stopAnim();
      if (on) { redraw(); $("anim-slider").value = 0; }   // redraw calcule d'abord le nombre de générations (met à jour anim-slider.max)
      redraw();
      updateAnimLabel();
    });
    $("anim-slider").addEventListener("input", () => { stopAnim(); redraw(); updateAnimLabel(); });
    $("anim-play").addEventListener("click", () => { if (animPlaying) stopAnim(); else startAnim(); });
    new MutationObserver(() => { if (tab === "map") redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", () => { if (map && tab === "map") map.invalidateSize(); });

    return {
      show() {
        if (!started) { started = true; init(); }
        else { setTimeout(() => map && map.invalidateSize(), 60); resolveAll(); }
      },
      refresh() { if (map) resolveAll(); },
      stop() { stopAnim(); },
    };
  })();

  // les modifications de l'arbre (brouillon) mettent à jour la page affichée
  App.onChange(() => {
    if (tab === "stats") statsPage.render();
    else if (tab === "map") mapPage.refresh();
  });

  window.Extras = { showTab, tab: () => tab };

  // ouverture directe par l'adresse : …/#carte ou …/#stats
  document.body.dataset.tab = "tree";
  if (location.hash === "#carte") showTab("map");
  else if (location.hash === "#stats") showTab("stats");
})();
