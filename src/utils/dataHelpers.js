export function rnd(a, b) { return Math.floor(Math.random() * (b - a) + a); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function fmtTime(d = new Date()) { return d.toTimeString().slice(0, 8); }
export function fmtMs(d = new Date()) { return d.toTimeString().slice(0, 5); }
