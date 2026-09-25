import { overlap } from './engine.js';
export const raceLevels = [
  { name: 'Coastal Cruise', target: 800, speed: 220, interval: 1.65, verge: '#244f42', accent: '#8fdfb2' },
  { name: 'Desert Run', target: 1000, speed: 265, interval: 1.4, verge: '#6b4836', accent: '#f6c68b' },
  { name: 'Alpine Pass', target: 1200, speed: 300, interval: 1.2, verge: '#354f64', accent: '#a7d9f5' },
  { name: 'Neon Boulevard', target: 1400, speed: 340, interval: 1.05, verge: '#3d2755', accent: '#d09bf8' },
  { name: 'Midnight Sprint', target: 1600, speed: 380, interval: 0.95, verge: '#202938', accent: '#f59bba' },
];
export function createRace() {
  return { player: { x: 337, y: 414, w: 46, h: 78 }, cars: [], level: 0, distance: 0, totalDistance: 0,
    score: 0, armor: 3, invincible: 0, alive: true, won: false, stageComplete: false,
    spawnTimer: 1.1, roadOffset: 0, speed: raceLevels[0].speed, overtakes: 0 };
}
export function nextRaceLevel(s) {
  if (!s.stageComplete || s.won || !s.alive) return false;
  s.level++; s.distance = 0; s.cars = []; s.stageComplete = false;
  s.spawnTimer = 1.1; s.armor = Math.min(3, s.armor + 1); s.invincible = 1;
  s.player.x = 337; s.player.y = 414; s.speed = raceLevels[s.level].speed;
  return true;
}
export function stepRace(s, dt, input = {}, random = Math.random) {
  if (!s.alive || s.won || s.stageComplete) return;
  // Bounded time step keeps collision checks reliable after delayed frames.
  dt = Math.max(0, Math.min(0.04, dt));
  const level = raceLevels[s.level];
  s.speed = level.speed * (input.brake ? 0.62 : input.accelerate ? 1.2 : 1);
  s.invincible = Math.max(0, s.invincible - dt);
  const steer = input.left === input.right ? 0 : input.left ? -1 : 1;
  s.player.x = Math.max(152, Math.min(568 - s.player.w, s.player.x + steer * 340 * dt));
  const distance = s.speed * dt / 4;
  s.distance += distance; s.totalDistance += distance;
  s.roadOffset = (s.roadOffset + s.speed * dt) % 90;
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0) {
    // One car per row leaves two open lanes; row spacing scales with road speed.
    const lane = Math.floor(random() * 3);
    s.cars.push({ x: 192 + lane * 136, y: -100, w: 46, h: 78, color: ['#f99b8c', '#a5d2ff', '#e9d98a'][Math.floor(random() * 3)] });
    s.spawnTimer = level.interval * level.speed / s.speed;
  }
  for (const car of s.cars) {
    car.y += s.speed * dt;
    if (!car.hit && overlap(s.player, car)) {
      car.hit = true;
      if (s.invincible === 0) { s.armor--; s.invincible = 1.5; if (s.armor <= 0) s.alive = false; }
    }
    if (!car.counted && car.y > 540) { car.counted = true; if (!car.hit) { s.score += 50; s.overtakes++; } }
  }
  s.cars = s.cars.filter(c => c.y < 640);
  if (s.alive && s.distance >= level.target) {
    s.distance = level.target; s.score += 500 + s.armor * 100;
    s.stageComplete = true;
    if (s.level === raceLevels.length - 1) s.won = true;
  }
}
export function drawRace(ctx, s) {
  const level = raceLevels[s.level], offset = s.roadOffset;
  ctx.fillStyle = level.verge; ctx.fillRect(0, 0, 720, 540);
  // Roadside lamps, trees, lane markings and shoulder strips move with the road.
  for (let y = -90 + offset; y < 600; y += 90) {
    ctx.fillStyle = '#ffffff12'; ctx.fillRect(52, y, 42, 35); ctx.fillRect(630, y, 42, 35);
    ctx.fillStyle = level.accent; ctx.fillRect(131, y, 5, 24); ctx.fillRect(584, y, 5, 24);
  }
  ctx.fillStyle = '#202632'; ctx.fillRect(146, 0, 428, 540);
  ctx.fillStyle = '#e1d8cc'; ctx.fillRect(146, 0, 5, 540); ctx.fillRect(569, 0, 5, 540);
  ctx.fillStyle = '#ffffff6b';
  for (const x of [282, 436]) for (let y = -90 + offset; y < 540; y += 90) ctx.fillRect(x, y, 4, 43);
  function car(c, color, player = false) {
    ctx.fillStyle = '#0005'; ctx.fillRect(c.x + 5, c.y + 7, c.w, c.h);
    ctx.fillStyle = '#090b13'; ctx.fillRect(c.x - 4, c.y + 12, c.w + 8, 15); ctx.fillRect(c.x - 4, c.y + 53, c.w + 8, 15);
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 9); ctx.fill();
    ctx.fillStyle = '#162d3e'; ctx.fillRect(c.x + 6, c.y + 18, c.w - 12, 17); ctx.fillRect(c.x + 6, c.y + 49, c.w - 12, 12);
    ctx.fillStyle = '#ffffff48'; ctx.fillRect(c.x + 21, c.y + 2, 4, 74);
    ctx.fillStyle = player ? '#efffd6' : '#ffeac3'; ctx.fillRect(c.x + 5, c.y + 3, 9, 5); ctx.fillRect(c.x + 32, c.y + 3, 9, 5);
    ctx.fillStyle = '#ff758c'; ctx.fillRect(c.x + 5, c.y + 70, 9, 4); ctx.fillRect(c.x + 32, c.y + 70, 9, 4);
  }
  for (const c of s.cars) car(c, c.color);
  if (s.invincible === 0 || Math.floor(s.invincible * 10) % 2 === 0) car(s.player, '#b7a0ff', true);
  ctx.fillStyle = '#10141bdd'; ctx.fillRect(164, 15, 392, 37);
  ctx.fillStyle = '#e9e5f8'; ctx.font = '14px system-ui'; ctx.fillText(level.name.toUpperCase(), 177, 39);
  ctx.fillStyle = '#48515d'; ctx.fillRect(164, 57, 392, 5);
  ctx.fillStyle = level.accent; ctx.fillRect(164, 57, 392 * Math.min(1, s.distance / level.target), 5);
}
