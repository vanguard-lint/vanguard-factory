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

    // Reset children on mount/remount
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

    const Y = 176, X0 = 100, DX = 1000 / 6, BOT = 262;
    const st: [string, string, number, string][] = [
      ['Triage', 'triage agent', 0, 'M-16 -12 H16 L5 2 V14 L-5 10 V2 Z'],
      ['Đặc tả', 'duyệt spec', 1, 'M-12 -16 H8 L12 -12 V16 H-12 Z M-6 -6 H6 M-6 0 H6 M-6 6 H1'],
      ['Triển khai', 'sandbox agent', 0, 'M-6 -10 L-16 0 L-6 10 M6 -10 L16 0 L6 10 M2 -14 L-2 14'],
      ['Review code', 'duyệt pull request', 1, 'M-14 -8 H-2 M-8 -14 V-2 M2 8 H14 M10 -14 L-10 14'],
      ['Kiểm thử', 'test forge', 0, 'M-14 -8 L-10 -4 L-4 -12 M2 -8 H14 M-14 8 L-10 12 L-4 4 M2 8 H14'],
      ['Phát hành', 'duyệt phát hành', 1, 'M0 9 V-9 M-7 -2 L0 -9 L7 -2 M-14 14 H14'],
      ['Giám sát', 'observability', 0, 'M-16 0 H-8 L-4 -10 L2 12 L6 0 H16']
    ];

    // Đường ray
    mk('path', { class: 'rail', d: 'M' + X0 + ' ' + Y + ' H1100' }, S);
    mk('path', { class: 'rail back', d: 'M1100 ' + Y + ' V' + BOT + ' H' + X0 + ' V' + (Y + 10) }, S);
    mk('path', { class: 'chev', d: 'M94 ' + (Y + 22) + ' L100 ' + (Y + 12) + ' L106 ' + (Y + 22) }, S);
    mk('text', { class: 'cap', x: 600, y: BOT + 26 }, S).textContent = 'Ticket hoàn tất đi vòng về đầu thành yêu cầu mới';

    type Gate = { el: SVGLineElement; stop: number; o: number; t: number; idx: number };
    const gates: Gate[] = [];

    st.forEach(function (s, i) {
      const x = X0 + i * DX;
      const g = mk('g', { class: 'st' + (s[2] ? ' h' : ''), transform: 'translate(' + x + ',0)' }, S);
      mk('rect', { x: -36, y: 64, width: 72, height: 72, rx: 6 }, g);
      mk('path', { class: 'ic', d: s[3], transform: 'translate(0,100)' }, g);
      mk('text', { class: 'nm', y: 208 }, g).textContent = s[0];
      mk('text', { class: 'sub', y: 226 }, g).textContent = s[1];
      if (i < 6) mk('path', { class: 'chev', d: 'M' + (DX / 2 + 4) + ' ' + (Y - 6) + ' L' + (DX / 2 + 10) + ' ' + Y + ' L' + (DX / 2 + 4) + ' ' + (Y + 6) }, g);
      if (s[2]) {
        mk('circle', { class: 'badge', cx: 36, cy: 64, r: 10 }, g);
        mk('circle', { class: 'ppd', cx: 36, cy: 61, r: 2.4 }, g);
        mk('path', { class: 'pp', d: 'M31.5 69 Q36 62.5 40.5 69' }, g);
        const gl = mk('line', { class: 'gate', x1: x + 50, x2: x + 50, y1: 112, y2: Y }, G) as SVGLineElement;
        gates.push({ el: gl, stop: x + 32 - X0, o: 0, t: 0, idx: i });
      }
    });

    const path = mk('path', { d: 'M' + X0 + ' ' + Y + ' H1100 V' + BOT + ' H' + X0 + ' Z', fill: 'none' }, S) as SVGPathElement;
    const L = path.getTotalLength();
    const END = 1000;

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
      mk('rect', { x: -13, y: -9, width: 26, height: 18, rx: 3 }, g);
      mk('path', { d: 'M-6 -2 H6 M-6 3 H2', stroke: 'var(--ifm-color-content-secondary)', 'stroke-width': 1.4, 'stroke-linecap': 'round' }, g);
      const l = mk('text', { class: 'l', y: -16 }, g) as SVGTextElement;
      return { g, l, pos: 0, s: 'move', passed: {}, rej: false, doRej: false };
    }

    function label(k: Token) {
      const v: Record<string, string> = { wait: 'chờ duyệt', back: 'concerns', fix: 'đang sửa' };
      if (v[k.s]) return v[k.s];
      if (k.pos > END) return 'ticket mới';
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
      k.pos = i * L / 3;
      k.s = 'move';
      k.passed = {};
      k.rej = false;
      k.doRej = (i === 1);
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
              k.tgt = gates[0].stop + DX + 10;
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
        } else if (k.s === 'fix') {
          k.tm = (k.tm ?? 0) - dt;
          if (k.tm <= 0) {
            k.s = 'move';
          }
        } else if (k.s === 'open') {
          k.tm = (k.tm ?? 0) - dt;
          if (k.tm <= 0) {
            k.s = 'move';
          }
        }
        place(k);
      });

      gates.forEach(function (g) {
        if (g.t > 0) g.t -= dt;
        g.o += ((g.t > 0 ? 1 : 0) - g.o) * Math.min(1, dt * 9);
        g.el.setAttribute('y2', String(Y - (Y - 112) * g.o));
      });

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="adlc-line" aria-label="Dây chuyền ADLC">
      <div className="scroll">
        <svg
          ref={svgRef}
          viewBox="0 0 1200 300"
          role="img"
          aria-label="Ticket đi qua 7 trạm ADLC; ba cổng đỏ cần người duyệt, ticket có thể bị trả về để sửa">
          <g ref={staticRef} id="static" />
          <g ref={gatesRef} id="gates" />
          <g ref={tokensRef} id="tokens" />
        </svg>
      </div>
    </section>
  );
}
