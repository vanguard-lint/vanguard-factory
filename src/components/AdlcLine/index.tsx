import React, { useEffect, useRef } from 'react';

export default function AdlcLine(): React.JSX.Element {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st: [string, number][] = [
      ['Triage', 0],
      ['Spec', 1],
      ['Build', 0],
      ['Review', 1],
      ['Verify', 0],
      ['Ship', 1],
      ['Monitor', 0],
    ];

    function mk(t: string, a: Record<string, string | number>, p?: Element): SVGElement {
      const e = document.createElementNS(NS, t);
      for (const k in a) e.setAttribute(k, String(a[k]));
      (p || svg)!.appendChild(e);
      return e;
    }

    type Gate = {
      ring: SVGElement | null;
      cx: number;
      cy: number;
      stop: number;
      o: number;
      w: boolean;
    };

    type Token = {
      c: SVGElement;
      l: SVGElement;
      pos: number;
      s: string;
      passed: Record<number, boolean>;
      rej: boolean;
      doRej: boolean;
      tm: number;
      gi: number;
      tgt: number;
    };

    let gates: Gate[] = [];
    let tokens: Token[] = [];
    let path: SVGPathElement | null = null;
    let L = 0;
    let END = 0;
    let STEP = 0;
    let vert = false;
    let W = 0;
    let raf = 0;
    let last: number | null = null;
    const V = 140;
    const R = 26;
    const OFF = 44;
    let frac = [0, 1 / 3, 2 / 3];

    function place(k: Token) {
      if (!path) return;
      const p = path.getPointAtLength(((k.pos % L) + L) % L);
      const w = k.s !== 'move';
      k.c.setAttribute('cx', String(p.x));
      k.c.setAttribute('cy', String(p.y));
      k.c.setAttribute('class', 'tk' + (w ? ' w' : ''));
      if (vert) {
        k.l.setAttribute('x', String(p.x + 14));
        k.l.setAttribute('y', String(p.y + 4.5));
      } else {
        k.l.setAttribute('x', String(p.x));
        k.l.setAttribute('y', String(p.y + 40));
      }
      k.l.setAttribute('class', 'tl' + (w ? ' w' : ''));
      k.l.textContent = lab(k);
    }

    function lab(k: Token) {
      const v: Record<string, string> = { wait: 'approval', back: 'concerns', fix: 'fixing' };
      if (v[k.s]) return v[k.s];
      if (k.pos > END) return 'new ticket';
      if (gates[2] && k.pos > gates[2].stop + 24) return 'done';
      return 'in progress';
    }

    let ang = 0;
    function frame(t: number) {
      if (last === null) last = t;
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;

      gates.forEach(function (g) {
        g.w = false;
      });

      tokens.forEach(function (k) {
        if (k.s === 'move') {
          let np = k.pos + V * dt;
          for (let i = 0; i < gates.length; i++) {
            const g = gates[i];
            if (k.pos < g.stop && np >= g.stop && !k.passed[i]) {
              np = g.stop;
              k.s = 'wait';
              k.tm = k.doRej && i === 1 && !k.rej ? 1.2 : 0.9;
              k.gi = i;
            }
          }
          k.pos = np;
          if (k.pos >= L) {
            k.pos -= L;
            k.passed = {};
            k.rej = false;
            k.doRej = Math.random() < 0.5;
          }
        } else if (k.s === 'wait') {
          gates[k.gi].w = true;
          k.tm -= dt;
          if (k.tm <= 0) {
            if (k.doRej && k.gi === 1 && !k.rej) {
              k.s = 'back';
              k.rej = true;
              k.tgt = gates[0].stop + STEP;
            } else {
              k.passed[k.gi] = true;
              k.s = 'move';
            }
          }
        } else if (k.s === 'back') {
          k.pos -= V * 1.5 * dt;
          if (k.pos <= k.tgt) {
            k.pos = k.tgt;
            k.s = 'fix';
            k.tm = 1.1;
          }
        } else {
          k.tm -= dt;
          if (k.tm <= 0) k.s = 'move';
        }
        place(k);
      });

      ang += dt * 30;
      gates.forEach(function (g) {
        g.o += ((g.w ? 1 : 0) - g.o) * Math.min(1, dt * 10);
        if (g.ring) {
          g.ring.setAttribute('opacity', g.o.toFixed(2));
          g.ring.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ' ' + g.cx + ' ' + g.cy + ')');
        }
      });
      raf = requestAnimationFrame(frame);
    }

    function build() {
      cancelAnimationFrame(raf);
      last = null;
      if (tokens.length && L) frac = tokens.map((k) => k.pos / L);
      W = Math.round(wrap!.clientWidth);
      vert = W < 760;

      while (svg!.firstChild) svg!.removeChild(svg!.firstChild);

      let H = 0;
      const P: [number, number][] = [];
      let pd = 0;
      let x0 = 0;
      let y0 = 0;
      let d = '';

      if (!vert) {
        H = 206;
        pd = Math.max(64, W * 0.06);
        x0 = pd;
        STEP = (W - 2 * pd) / 6;
        const Y = 92;
        const YB = 176;
        END = W - 2 * pd;
        mk('line', { class: 'dash', x1: 0, x2: W, y1: 0.5, y2: 0.5 });
        mk('line', { class: 'dash', x1: 0, x2: W, y1: H - 0.5, y2: H - 0.5 });
        mk('line', { class: 'rail', x1: 0, x2: W, y1: Y, y2: Y });
        mk('path', { class: 'dash', d: 'M' + (W - pd) + ' ' + Y + ' V' + YB + ' H' + pd + ' V' + Y });
        mk('path', {
          class: 'dash',
          d: 'M' + (pd - 5) + ' ' + (Y + 18) + ' L' + pd + ' ' + (Y + 10) + ' L' + (pd + 5) + ' ' + (Y + 18),
          'stroke-dasharray': 'none',
        });
        mk('text', { class: 'cap', x: W / 2, y: YB + 20, 'text-anchor': 'middle' }).textContent =
          'finished tickets return as new requests';
        d = 'M' + pd + ' ' + Y + ' H' + (W - pd) + ' V' + YB + ' H' + pd + ' Z';
        st.forEach(function (_, i) {
          P.push([x0 + i * STEP, Y]);
        });
      } else {
        y0 = 44;
        STEP = 84;
        pd = 44;
        const RX = 44;
        const RR = W - 26;
        const YE = y0 + 6 * STEP + 56;
        H = YE + 56;
        END = YE - y0;
        mk('line', { class: 'dash', x1: 0, x2: W, y1: 0.5, y2: 0.5 });
        mk('line', { class: 'dash', x1: 0, x2: W, y1: H - 0.5, y2: H - 0.5 });
        mk('line', { class: 'rail', x1: RX, x2: RX, y1: 0, y2: H });
        mk('path', { class: 'dash', d: 'M' + RX + ' ' + YE + ' H' + RR + ' V' + y0 + ' H' + RX });
        mk('text', { class: 'cap', x: W / 2, y: YE + 24, 'text-anchor': 'middle' }).textContent =
          'finished tickets return as new requests';
        d = 'M' + RX + ' ' + y0 + ' V' + YE + ' H' + RR + ' V' + y0 + ' Z';
        st.forEach(function (_, i) {
          P.push([RX, y0 + i * STEP]);
        });
      }

      svg!.setAttribute('height', String(H));
      svg!.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

      gates = [];
      st.forEach(function (s, i) {
        const x = P[i][0];
        const y = P[i][1];
        const g = mk('g', {});
        let ring: SVGElement | null = null;
        if (s[1]) ring = mk('circle', { class: 'ring', cx: x, cy: y, r: R + 9, opacity: 0 }, g);
        mk('circle', { class: 'disc' + (s[1] ? ' h' : ''), cx: x, cy: y, r: R }, g);
        mk('text', { class: 'num', x: x, y: y + 5.5 }, g).textContent = '0' + (i + 1);
        const nm = mk(
          'text',
          vert ? { class: 'nm', x: x + R + 22, y: y + 6 } : { class: 'nm', x: x, y: y - R - 16, 'text-anchor': 'middle' },
          g
        );
        nm.textContent = s[0];
        if (s[1]) gates.push({ ring: ring, cx: x, cy: y, stop: vert ? y - OFF - y0 : x - OFF - x0, o: 0, w: false });
      });

      path = mk('path', { d: d, fill: 'none' }) as SVGPathElement;
      path.style.display = 'none';
      L = path.getTotalLength();

      tokens = [0, 1, 2].map(function (i) {
        const c = mk('circle', { class: 'tk', r: 7 });
        const l = mk('text', vert ? { class: 'tl', x: 14, y: 4.5 } : { class: 'tl', 'text-anchor': 'middle', y: 40 });
        return { c: c, l: l, pos: frac[i] * L, s: 'move', passed: {}, rej: false, doRej: i === 1, tm: 0, gi: 0, tgt: 0 };
      });

      tokens.forEach(place);
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (Math.round(wrap!.clientWidth) !== W) build();
      });
      ro.observe(wrap);
    } else {
      window.addEventListener('resize', build);
    }

    build();

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', build);
    };
  }, []);

  return (
    <section ref={wrapRef} className="adlc-life" aria-label="ADLC lifecycle">
      <div className="head">
        <h2>Lifecycle</h2>
        <div className="lg">
          <span>
            <i />
            agent
          </span>
          <span>
            <i className="h" />
            human approval
          </span>
        </div>
      </div>
      <svg
        ref={svgRef}
        id="al"
        role="img"
        aria-label="Tickets move through 7 ADLC stages; Spec, Review and Ship wait for a human approval, and a ticket can be sent back for fixes"
      />
    </section>
  );
}
