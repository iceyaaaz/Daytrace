export function SolidPattern({ theme, animated = false }) {
  return <svg className="x1-pattern" viewBox="0 0 390 180" aria-hidden="true" focusable="false" data-animated={animated}>
    {theme === 'paper' && <>
      <path d="M208 51h182m-182 31h182m-182 31h182m-182 31h182" fill="none" stroke="var(--hairline)" strokeWidth="1.6" />
      <path d="M322 19v57l12-8 12 8V19Z" fill="var(--brand)" opacity=".74" />
    </>}
    {theme === 'mist' && <g fill="var(--brand)" opacity=".17">
      <path d="M222 98c4-15 23-20 39-22 2-17 31-28 48-15 20-13 55 3 52 23 18 2 31 8 28 18-7 18-153 19-167-4Z" />
      <ellipse cx="349" cy="130" rx="44" ry="10" />
    </g>}
    {theme === 'oat' && <g fill="none" stroke="var(--brand)">
      <circle cx="304" cy="84" r="48" strokeWidth="3" opacity=".35" />
      <circle cx="304" cy="84" r="36" fill="var(--brand)" stroke="none" opacity=".12" />
      <path d="M299 110q13-18 5-44m1 14q-18-3-16-16 12 2 16 16Zm1 13q17-6 18-17-12 0-18 17Zm-2 10q-18-5-17-15 12 1 17 15Z" strokeWidth="2" opacity=".44" />
      <ellipse cx="223" cy="119" rx="11" ry="7" transform="rotate(-30 223 119)" fill="var(--brand)" opacity=".31" />
      <ellipse cx="245" cy="146" rx="10" ry="6" transform="rotate(20 245 146)" fill="var(--brand)" opacity=".31" />
    </g>}
    {theme === 'blush' && <g fill="var(--brand)" opacity=".21">
      <path d="M250 54c-17-3-23-12-23-24 15-2 32 7 23 24Zm64 21c-21 5-36-2-41-14 19-10 34 0 41 14Zm45-26c-13-9-16-22-9-32 14 7 22 22 9 32ZM286 119c-15-2-24-12-23-22 17-4 30 7 23 22Zm64-10c-19 6-28 0-32-11 13-9 31-3 32 11Zm15 37c-13 2-21-4-22-12 10-5 23 2 22 12Z" />
    </g>}
    {theme === 'ink' && <g fill="var(--text)">
      <circle cx="228" cy="41" r="2" opacity=".48" /><circle className="x1-star" cx="287" cy="79" r="3" opacity=".5" />
      <circle cx="341" cy="36" r="1.8" opacity=".4" /><circle cx="365" cy="115" r="2.5" opacity=".57" />
      <circle className="x1-star" cx="249" cy="125" r="2.4" opacity=".5" /><circle cx="317" cy="151" r="2.8" opacity=".5" />
    </g>}
  </svg>;
}
