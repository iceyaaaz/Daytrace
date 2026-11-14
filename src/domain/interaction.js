export const motionKey = 'riji.motionPref';
export const motionLabels = { system: '跟随系统', on: '开启', off: '关闭' };

export function effectiveMotion(preference, systemReduced) {
  return preference === 'on' || (preference !== 'off' && !systemReduced);
}

export function greetingByHour(hour) {
  if (hour < 5 || hour >= 23) return '夜深了，早点休息';
  if (hour < 11) return '早上好，今天想记点什么？';
  if (hour < 14) return '中午好，吃饭了吗？';
  if (hour < 18) return '下午好，来记一笔吧';
  return '晚上好，今天过得怎么样？';
}

export function mascotState(time, minutes, count) {
  const hour = time.getHours();
  if (hour >= 22 || hour < 5) return 'sleep';
  if (minutes >= 120) return 'happy';
  return count > 0 ? 'active' : 'idle';
}

export function timeBand(time) {
  const hour = time.getHours();
  if (hour < 5 || hour >= 19) return 'night';
  if (hour < 9) return 'morning';
  return hour < 16 ? 'day' : 'dusk';
}

export function pupilOffset(dx, dy) {
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const offset = Math.min(4.5, distance / 30);
  return [dx / distance * offset, dy / distance * offset];
}
