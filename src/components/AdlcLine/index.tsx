import React, { useEffect, useRef } from 'react';

export default function AdlcLine(): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const staticRef = useRef<SVGGElement | null>(null);
  const gatesRef = useRef<SVGGElement | null>(null);
  const tokensRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const S = staticRef.current;
    const G = gatesRef.current;
    const T = tokensRef.current;
    if (!svg || !S || !G || !T) return;

    S.innerHTML = '';
    G.innerHTML = '';
    T.innerHTML = '';

    const NS = 'http://www.w3.org/2000/svg';
    function mk(t: string, a: Record<string, string | number>, p?: Element): SVGElement {
      const e = document.createElementNS(NS, t);
      for (const k in a) e.setAttribute(k, String(a[k]));
      (p || svg).appendChild(e);
      return e;
    }

    const Y = 128, BOT = 172, X0 = 90, X1 = 1150, DX = (X1 - X0) / 6, PW = 140;
    const st: [string, number, string][] = [
      ['Triage', 0, 'M-14 -11 H14 L4 2 V13 L-4 9 V2 Z'],
      ['Spec', 1, 'M-10 -14 H5 L10 -9 V14 H-10 Z M-4 -3 H4 M-4 3 H4'],
      ['Build', 0, 'M-5 -9 L-14 0 L-5 9 M5 -9 L14 0 L5 9'],
      ['Review', 1, 'M-13 -7 H-3 M-8 -12 V-2 M3 7 H13 M9 -13 L-9 13'],
      ['Verify', 0, 'M-13 0 L-5 8 L13 -9'],
      ['Ship', 1, 'M0 12 V-10 M-9 -2 L0 -11 L9 -2'],
      ['Monitor', 0, 'M-14 0 H-8 L-4 -10 L2 11 L5 0 H14']
    ];

    mk('path', { class: 'rail', d: 'M' + X0 + ' ' + Y + ' H' + X1 }, S);
    mk('path', { class: 'rail back', d: 'M' + X1 + ' ' + Y + ' V' + BOT + ' H' + X0 + ' V' + (Y + 8) }, S);
    mk('path', { class: 'chev', d: 'M' + (X0 - 7) + ' ' + (Y + 20) + ' L' + X0 + ' ' + (Y + 10) + ' L' + (X0 + 7) + ' ' + (Y + 20) }, S);
    mk('text', { class: 'cap', x: (X0 + X1) / 2, y: BOT + 34 }, S).textContent = 'Finished tickets loop back as new requests';

    type Gate = { el: SVGLineElement; stop: number; o: number; t: number };
    const gates: Gate[] = [];

    st.forEach(function (s, i) {
      const x = X0 + i * DX;
      const g = mk('g', { class: 'st' + (s[1] ? ' h' : ''), transform: 'translate(' + x + ',0)' }, S);
      mk('rect', { x: -PW / 2, y: 24, width: PW, height: 56, rx: 8 }, g);
      mk('path', { class: 'ic', d: s[2], transform: 'translate(-40,52) scale(.85)' }, g);
      mk('text', { class: 'nm', x: -18, y: 59 }, g).textContent = s[0];
      if (s[1]) {
        mk('circle', { class: 'badge', cx: PW / 2 - 4, cy: 24, r: 13 }, g);
        mk('circle', { class: 'ppd', cx: PW / 2 - 4, cy: 20.5, r: 3 }, g);
        mk('path', { class: 'pp', d: 'M' + (PW / 2 - 9.5) + ' 30 Q' + (PW / 2 - 4) + ' 22 ' + (PW / 2 + 1.5) + ' 30' }, g);
      }
      const gx = x + DX / 2;
      if (i < 6 && !s[1]) {
        mk('path', { class: 'chev', d: 'M' + (gx - 4) + ' ' + (Y - 8) + ' L' + (gx + 4) + ' ' + Y + ' L' + (gx - 4) + ' ' + (Y + 8) }, S);
      }
      if (s[1]) {
        const gl = mk('line', { class: 'gate', x1: gx, x2: gx, y1: 92, y2: Y }, G) as SVGLineElement;
        gates.push({ el: gl, stop: gx - 26 - X0, o: 0, t: 0 });
      }
    });

    const path = mk('path', { d: 'M' + X0 + ' ' + Y + ' H' + X1 + ' V' + BOT + ' H' + X0 + ' Z', fill: 'none' }, S) as SVGPathElement;
    const L = path.getTotalLength(), END = X1 - X0;

    type Token = {
      g: SVGGElement;
      l: SVGTextElement;
      pos: number;
      s: string;
      passed: Record<number, boolean>;
      rej: boolean;
      doRej: boolean;
      tm?: number;
      gi?: number;
      tgt?: number;
    };

    function TK(): Token {
      const g = mk('g', { class: 'tk' }, T) as SVGGElement;
      mk('rect', { x: -17, y: -12, width: 34, height: 24, rx: 5 }, g);
      mk('path', { d: 'M-8 -3 H8 M-8 4 H3', stroke: 'var(--ifm-color-content-secondary)', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
      return { g, l: mk('text', { class: 'l', y: -20 }, g) as SVGTextElement, pos: 0, s: 'move', passed: {}, rej: false, doRej: false };
    }

    function label(k: Token) {
      const v: Record<string, string> = { wait: 'review', back: 'concerns', fix: 'fixing' };
      if (v[k.s]) return v[k.s];
      if (k.pos > END) return 'new ticket';
      if (k.pos > gates[2].stop + 20) return 'done';
      return 'in progress';
    }

    function place(k: Token) {
      const p = path.getPointAtLength(((k.pos % L) + L) % L);
      k.g.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
      k.g.setAttribute('class', 'tk' + (k.s === 'wait' || k.s === 'back' || k.s === 'fix' ? ' w' : ''));
      k.l.textContent = label(k);
    }

    const tokens: Token[] = [0, 1, 2].map(function (i) {
      const k = TK();
      k.pos = (i * L) / 3;
      k.s = 'move';
      k.passed = {};
      k.rej = false;
      k.doRej = i === 1;
      return k;
    });

    tokens.forEach(place);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const V = 150;
    let last: number | null = null;
    let animId: number;

    function frame(t: number) {
      if (last === null) last = t;
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;

      tokens.forEach(function (k) {
        if (k.s === 'move') {
          let np = k.pos + V * dt;
          for (let i = 0; i < gates.length; i++) {
            const g = gates[i];
            if (k.pos < g.stop && np >= g.stop && !k.passed[i]) {
              np = g.stop;
              k.s = 'wait';
              k.tm = k.doRej && i === 1 && !k.rej ? 1.1 : 0.95;
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
          k.tm = (k.tm ?? 0) - dt;
          if (k.tm <= 0) {
            if (k.doRej && k.gi === 1 && !k.rej) {
              k.s = 'back';
              k.rej = true;
              k.tgt = gates[0].stop + DX;
            } else {
              k.s = 'open';
              k.tm = 0.3;
              if (k.gi !== undefined) {
                gates[k.gi].t = 1;
                k.passed[k.gi] = true;
              }
            }
          }
        } else if (k.s === 'back') {
          k.pos -= V * 1.4 * dt;
          if (k.pos <= (k.tgt ?? 0)) {
            k.pos = k.tgt ?? 0;
            k.s = 'fix';
            k.tm = 1.1;
          }
        } else {
          k.tm = (k.tm ?? 0) - dt;
          if (k.tm <= 0) k.s = 'move';
        }
        place(k);
      });

      gates.forEach(function (g) {
        if (g.t > 0) g.t -= dt;
        g.o += ((g.t > 0 ? 1 : 0) - g.o) * Math.min(1, dt * 9);
        g.el.setAttribute('y2', String(Y - (Y - 92) * g.o));
      });

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="adlc-line" aria-label="ADLC pipeline">
      <div className="scroll">
        <svg
          ref={svgRef}
          viewBox="0 0 1240 230"
          role="img"
          aria-label="Tickets move through 7 ADLC stages; three red gates need a human approval and a ticket can be sent back for fixes">
          <g ref={staticRef} id="static" />
          <g ref={gatesRef} id="gates" />
          <g ref={tokensRef} id="tokens" />
        </svg>
      </div>
    </section>
  );
}
