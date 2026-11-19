// svg.js: diamant-navigation til siden svg.html (indlæses ud over din almindelige script.js).
(() => {
  const rute = document.getElementById("rute"); // usynlig sti i SVG'en (lukket løkke)
  const diamant = document.getElementById("diamant");
  const boder = document.querySelectorAll(".bod");
  const punkter = document.querySelectorAll("details[data-bod]");
  if (!rute || !diamant || !boder.length) return;

  const laengde = rute.getTotalLength();
  const start = rute.getPointAtLength(0); // diamantens startplads
  const mindreBevaegelse = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Placér diamanten på et punkt langs ruten
  function placer(s) {
    const p = rute.getPointAtLength(((s % laengde) + laengde) % laengde);
    diamant.setAttribute(
      "transform",
      `translate(${p.x - start.x} ${p.y - start.y})`,
    );
  }

  // Find det sted på ruten, der ligger tættest på hver bod
  function afstandTilFirkant(px, py, r) {
    const dx = Math.max(r.x - px, 0, px - (r.x + r.width));
    const dy = Math.max(r.y - py, 0, py - (r.y + r.height));
    return Math.hypot(dx, dy);
  }
  const stop = {};
  boder.forEach((bod) => {
    const hit = bod.querySelector(".hit");
    const r = {
      x: +hit.getAttribute("x"),
      y: +hit.getAttribute("y"),
      width: +hit.getAttribute("width"),
      height: +hit.getAttribute("height"),
    };
    let bedst = Infinity;
    for (let s = 0; s < laengde; s += 2) {
      const p = rute.getPointAtLength(s);
      const d = afstandTilFirkant(p.x, p.y, r);
      if (d < bedst) {
        bedst = d;
        stop[bod.id] = s;
      }
    }
  });

  let nu = 0; // diamantens nuværende position (længde langs ruten)
  let anim = null;

  function koerTil(maal) {
    cancelAnimationFrame(anim);
    // vælg den korteste vej rundt i løkken
    let delta = (((maal - nu) % laengde) + laengde) % laengde;
    if (delta > laengde / 2) delta -= laengde;

    if (mindreBevaegelse || Math.abs(delta) < 1) {
      nu = maal;
      placer(nu);
      return;
    }

    const fra = nu;
    const varighed = Math.min(2500, Math.max(700, Math.abs(delta) / 0.6)); // ca. 600 px/sek
    const t0 = performance.now();

    function billede(t) {
      const k = Math.min((t - t0) / varighed, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease-in-out
      nu = fra + delta * e;
      placer(nu);
      if (k < 1) {
        anim = requestAnimationFrame(billede);
      } else {
        nu = ((maal % laengde) + laengde) % laengde;
        placer(nu);
      }
    }
    anim = requestAnimationFrame(billede);
  }

  // Klik (eller Enter/mellemrum) på en bod åbner dens punkt i accordionen
  boder.forEach((bod) => {
    const aabn = () => {
      const punkt = document.querySelector(`details[data-bod="${bod.id}"]`);
      if (punkt) punkt.open = true;
      else koerTil(stop[bod.id]); // boden har intet punkt: kør bare derhen
    };
    bod.addEventListener("click", aabn);
    bod.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        aabn();
      }
    });
  });

  // Når et punkt åbnes: fremhæv boden og send diamanten derhen
  punkter.forEach((punkt) => {
    punkt.addEventListener("toggle", () => {
      const bod = document.getElementById(punkt.dataset.bod);
      if (!bod) return;
      bod.classList.toggle("aktiv", punkt.open);
      if (punkt.open) koerTil(stop[bod.id]);
    });
  });
})();
