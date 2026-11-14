import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Icon } from '../components/DiaryUI.jsx';
import { greetingByHour, pupilOffset } from '../domain/interaction.js';
import { CatSvg, PawPrint } from '../themes/CatSvg.jsx';
import { SolidPattern } from '../themes/SolidPattern.jsx';

const companionLines = ['我在这儿陪你。', '不想写也没关系，允许空白。', '今天也来记一笔吗？'];

function useKeyboardViewport(layout) {
  useLayoutEffect(() => {
    const root = layout.current;
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    let frame;
    function measure() {
      const focused = root.contains(document.activeElement) && document.activeElement.matches('input');
      const visible = Math.round(viewport.height);
      const keyboard = viewport.scale < 1.05 && focused && window.innerHeight - visible > 100;
      root.dataset.keyboard = String(keyboard);
      root.style.setProperty('--x-visible-height', visible + 'px');
      // 等场景收起后再滚动文档，避免与 Safari 自己的键盘滚动相互抢占。
      cancelAnimationFrame(frame);
      if (keyboard) frame = requestAnimationFrame(() => {
        const target = document.activeElement;
        if (!root.contains(target)) return;
        const box = target.getBoundingClientRect();
        const top = viewport.offsetTop;
        if (box.top < top || box.bottom > top + viewport.height) {
          target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        }
      });
    }
    measure();
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    root.addEventListener('focusin', measure);
    const blur = () => queueMicrotask(measure);
    root.addEventListener('focusout', blur);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
      root.removeEventListener('focusin', measure);
      root.removeEventListener('focusout', blur);
    };
  }, [layout]);
}

export function Login({ client, theme, motion, setLoginInProgress }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [shown, setShown] = useState(false);
  const [focus, setFocus] = useState('');
  const [line, setLine] = useState(0);
  const [authBubble, setAuthBubble] = useState('');
  const [reaction, setReaction] = useState(null);
  const [success, setSuccess] = useState(false);
  const layout = useRef(null);
  const cat = useRef(null);
  const emailField = useRef(null);
  const passwordField = useRef(null);
  const pointerFrame = useRef(0);
  const touchTimer = useRef(0);
  const pointer = useRef(null);
  const locked = useRef(false);
  const isBeast = theme.id === 'beast';
  const greeting = greetingByHour(new Date().getHours());
  const bubble = authBubble || [greeting, ...companionLines][line];
  const covering = focus === 'password' && !shown && !authBubble && !pending;
  const currentX = focus === 'email' ? ((email.length + 6) % 13 - 6) * .5 : 0;

  useKeyboardViewport(layout);

  useEffect(() => {
    if (!success) return undefined;
    if (!motion || document.hidden) {
      setLoginInProgress(false);
      return undefined;
    }
    const complete = () => setLoginInProgress(false);
    const onVisibility = () => { if (document.hidden) complete(); };
    const timer = window.setTimeout(complete, 800);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [success, motion, setLoginInProgress]);

  useEffect(() => {
    if (!motion || !isBeast || focus || pending || success) return undefined;
    function center() {
      cat.current?.style.removeProperty('--pupil-x');
      cat.current?.style.removeProperty('--pupil-y');
    }
    function draw() {
      pointerFrame.current = 0;
      if (document.hidden || !cat.current || !pointer.current) return;
      const { x, y } = pointer.current;
      const box = cat.current.getBoundingClientRect();
      const scale = box.width / 240;
      if (!scale) return;
      const [dx, dy] = pupilOffset(x - (box.left + 120 * scale), y - (box.top + 80 * scale));
      cat.current.style.setProperty('--pupil-x', dx + 'px');
      cat.current.style.setProperty('--pupil-y', dy + 'px');
    }
    function move(event) {
      if (!event.isPrimary || document.hidden) return;
      clearTimeout(touchTimer.current);
      pointer.current = { x: event.clientX, y: event.clientY };
      if (!pointerFrame.current) pointerFrame.current = requestAnimationFrame(draw);
    }
    function release(event) {
      if (event.pointerType === 'touch') touchTimer.current = setTimeout(center, 140);
    }
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      cancelAnimationFrame(pointerFrame.current);
      pointerFrame.current = 0;
      clearTimeout(touchTimer.current);
      center();
    };
  }, [focus, isBeast, motion, pending, success]);

  function react(kind) {
    setReaction((current) => ({ kind, id: (current?.id ?? 0) + 1 }));
  }

  function fail(message, field, showBubble = false) {
    setError(message);
    setAuthBubble(showBubble ? message : '');
    react('shake');
    field?.current?.focus({ preventScroll: true });
  }

  async function submit(event) {
    event.preventDefault();
    if (!client || locked.current) return;
    if (!email.trim()) { fail('请输入邮箱', emailField); return; }
    if (!password) { fail('请输入密码', passwordField); return; }
    if (!emailField.current.validity.valid) { emailField.current.reportValidity(); return; }
    if (!navigator.onLine) { fail('当前无网络，无法登录'); return; }
    locked.current = true;
    setError('');
    setAuthBubble('');
    setReaction(null);
    setPending(true);
    setLoginInProgress(true);
    try {
      const result = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      document.activeElement?.blur();
      if (motion && !document.hidden) setSuccess(true);
      else setLoginInProgress(false);
    } catch {
      fail(navigator.onLine ? '邮箱或密码不正确' : '当前无网络，无法登录', undefined, navigator.onLine);
      locked.current = false;
      setPending(false);
      setLoginInProgress(false);
    }
  }

  function tapScene() {
    setAuthBubble('');
    setLine((current) => (current + 1) % 4);
    react('hop');
  }

  return <main className="x1-login" ref={layout} data-success={success} data-auth-pending={pending}>
    <div className="x1-login-content">
      <div className="x1-scene">
        {!isBeast && <SolidPattern theme={theme.id} />}
        <div className="x1-bubble" aria-hidden="true">{bubble}</div>
        <div className="x1-stage" data-focus={focus} data-covering={covering} style={{ '--email-pupil': currentX }}>
          <button type="button" className="x1-scene-button" data-kind={isBeast ? 'cat' : 'dot'}
            aria-label="切换问候语" disabled={pending} onClick={tapScene}>
            <span className="x1-performer" key={reaction?.id ?? 0} data-reaction={reaction?.kind} aria-hidden="true">
              {isBeast ? <CatSvg svgRef={cat} portrait covering={covering} /> : <span className="x1-login-dot" />}
            </span>
          </button>
          {isBeast && success && <svg className="x1-login-prints" viewBox="0 0 240 150" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => <g key={index} transform={`translate(${62 + index * 32} ${120 - index * 32})`}>
              <g className="x1-login-print" style={{ '--print-index': index }}><PawPrint /></g>
            </g>)}
          </svg>}
        </div>
      </div>
      <header className="x1-login-title"><h1>日迹</h1><p>时间与成长记录</p></header>
      <form onSubmit={submit} noValidate>
        <div className="x1-login-fields">
          <input ref={emailField} aria-label="邮箱" name="email" type="email" autoComplete="username" inputMode="email"
            enterKeyHint="next" placeholder="name@example.com" value={email} readOnly={pending}
            onChange={(event) => { setEmail(event.target.value); setError(''); setAuthBubble(''); }}
            onFocus={() => setFocus('email')} onKeyDown={(event) => {
              if (event.key === 'Enter' && !password && emailField.current.validity.valid && email.trim()) {
                event.preventDefault();
                passwordField.current.focus();
              }
            }} onBlur={() => setFocus('')} />
          <div className="x1-password">
            <input ref={passwordField} aria-label="密码" name="password" type={shown ? 'text' : 'password'}
              autoComplete="current-password" enterKeyHint="go" placeholder="输入密码" readOnly={pending}
              value={password} onChange={(event) => { setPassword(event.target.value); setError(''); setAuthBubble(''); }}
              onFocus={() => setFocus('password')} onBlur={() => setFocus('')} />
            <button type="button" className="v1-icon" aria-label={shown ? '隐藏密码' : '显示密码'} disabled={pending}
              onPointerDown={(event) => { if (document.activeElement === passwordField.current) event.preventDefault(); }}
              onClick={() => setShown((current) => !current)}><Icon as={shown ? EyeOff : Eye} /></button>
          </div>
        </div>
        <p className="x1-login-error" aria-live="polite" aria-atomic="true">{error}</p>
        <button className="primary x1-login-submit" type="submit" disabled={!client || pending}>{pending ? '正在登录…' : '登录'}</button>
      </form>
      {!client && <p className="x1-login-config" role="status">还没有连接 Supabase。请按 README 设置项目网址和公开密钥，再重启本地网页。</p>}
    </div>
  </main>;
}
