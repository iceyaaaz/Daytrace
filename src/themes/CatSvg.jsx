import { useId } from 'react';

export function PawPrint() {
  return <g>
    <path d="M6 16c-4-1-4-5-1-7a5 5 0 0 1 6 0c3 2 3 6-1 7Z" />
    <circle cx="2.5" cy="7" r="2" /><circle cx="8" cy="3" r="2" /><circle cx="13.5" cy="7" r="2" />
  </g>;
}

export function CatSvg({ svgRef, portrait = false, state = 'active', covering = false, animated = false, reaction }) {
  const id = useId();
  const part = (name) => ({ id: id + '-' + name, 'data-part': name });

  return <svg ref={svgRef} className={portrait ? 'x1-cat x1-portrait' : 'x1-cat theme-cat'}
    viewBox={portrait ? '0 0 240 150' : '0 0 390 180'} aria-hidden="true" focusable="false"
    data-state={state} data-covering={covering} data-animated={animated} data-reaction={reaction}>
    {!portrait && <g fill="var(--hairline)">
      <g transform="translate(187 121) rotate(-18)"><PawPrint /></g>
      <g transform="translate(216 143) rotate(14)"><PawPrint /></g>
    </g>}
    <g transform={portrait ? undefined : 'translate(178 19) scale(.98)'}>
      {!portrait && <g {...part('body')} className="x1-cat-body" fill="var(--c-idea)">
        <path d="M71 128q30-21 82-3 21 8 23 24 0 12-19 13H83q-19-1-19-11 0-13 7-23Z" />
        <path {...part('tail')} className="x1-tail" d="M159 148q31 11 41-11" fill="none"
          stroke="var(--c-idea)" strokeWidth="12" strokeLinecap="round" />
      </g>}
      <g {...part('head')} className="x1-head">
        <g {...part('ears')} className="x1-ears">
          <path d="M70 65 79 18q1-6 6-2l33 31h5l33-31q5-4 6 2l9 47Z" fill="var(--c-idea)" />
          <path d="m80 54 5-28 23 24m24 0 23-24 5 28" fill="var(--c-exercise)" opacity=".55" />
        </g>
        <path d="M173 86c0 31-21 52-53 52-33 0-54-20-54-51 0-30 21-49 54-49 32 0 53 19 53 48Z" fill="var(--c-idea)" />
        <path d="M111 49q9-3 18 0m-16 7 5-2m7 1 4 3" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" opacity=".48" />
        <g {...part('cheeks')} fill="var(--x-cat-cheeks)"><ellipse cx="86" cy="102" rx="8" ry="6" /><ellipse cx="154" cy="102" rx="8" ry="6" /></g>
        <g className="x1-eyes">
          <g {...part('eyes')} fill="var(--surface)"><ellipse cx="100" cy="80" rx="11" ry="10" /><ellipse cx="140" cy="80" rx="11" ry="10" /></g>
          <g {...part('pupils')} className="x1-pupils" fill="var(--text)">
            <circle cx="100" cy="80" r="5.5" /><circle cx="140" cy="80" r="5.5" />
            <path d="M103 77a1.5 1.5 0 1 1-3 0 1.5 1.5 0 1 1 3 0m40 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 1 1 3 0" fill="var(--surface)" />
          </g>
        </g>
        <g {...part('lids')} className="x1-lids" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round">
          <path d="M91 81q9 7 18 0m22 0q9 7 18 0" />
        </g>
        <g {...part('nose-mouth')}>
          <path d="M115 94h10l-5 6Z" fill="var(--c-exercise)" />
          <path className="x1-mouth" d="M120 100v3m0 0q-4 5-8 1m8-1q4 5 8 1" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
          <path className="x1-smile" d="M109 102q11 15 22 0" fill="none" stroke="var(--text)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
        <path {...part('whiskers')} d="m73 97-19-6m18 12-18 1m113-7 19-6m-18 12 18 1"
          fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      {portrait && <g {...part('paws')} className="x1-paws" fill="var(--x-cat-paws)">
        <ellipse cx="100" cy="140" rx="17" ry="11" /><ellipse cx="140" cy="140" rx="17" ry="11" />
        <path d="M94 136v1m6-3v1m6 1v1m28-1v1m6-3v1m6 1v1" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" opacity=".65" />
      </g>}
    </g>
    {!portrait && state === 'sleep' && <g className="x1-sleep-signs" fill="none" stroke="var(--text-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M350 69h9l-9 9h9" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M362 52h8l-8 8h8" />
      <path d="M375 36h7l-7 7h7" />
    </g>}
  </svg>;
}
