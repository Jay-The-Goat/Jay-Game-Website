let toastTimeout;
function showToast(msg) {
  const t = document.getElementById('toastBox');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.style.display = 'none', 2600);
}

function filterPortal() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  document.querySelectorAll('#portalGrid .game-card').forEach(c => {
    c.style.display = c.dataset.title.includes(q) ? 'flex' : 'none';
  });
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function switchSocialRoom(room) {
  document.getElementById('socialRoomTitle').textContent = room;
  document.getElementById('socialFeed').innerHTML = `<div><strong style="color:#38bdf8;">[System]:</strong> Switched to <strong>${room}</strong>.</div>`;
}

function postSocialMsg() {
  const user = document.getElementById('socialUser').value.trim() || (state.isOwner ? '👑 Jay (Owner)' : 'Guest');
  const msgInput = document.getElementById('socialMsg');
  const txt = msgInput.value.trim();
  if (!txt) return;
  msgInput.value = '';
  const feed = document.getElementById('socialFeed');
  const row = document.createElement('div');
  row.innerHTML = `<strong style="color:#c8f53b;">${user}:</strong> `;
  row.appendChild(document.createTextNode(txt));
  feed.appendChild(row);
  feed.scrollTop = feed.scrollHeight;
}

const WEAPONS = [
  { id: 'Fists', icon: '👊', cost: 0, dmg: 20, range: 55, color: '#38bdf8' },
  { id: 'Axe', icon: '🪓', cost: 150, dmg: 35, range: 70, color: '#22c55e' },
  { id: 'Axe Smash', icon: '💥', cost: 400, dmg: 60, range: 115, color: '#a3e635' },
  { id: 'Staff', icon: '🪄', cost: 800, dmg: 55, range: 260, color: '#a855f7' },
  { id: 'Energy Sword', icon: '🗡️', cost: 1500, dmg: 85, range: 90, color: '#06b6d4' },
  { id: 'Web Hook', icon: '🕸️', cost: 2500, dmg: 30, range: 300, color: '#e2e8f0' },
  { id: 'Spike Hook', icon: '⛓️', cost: 4000, dmg: 65, range: 280, color: '#f43f5e' },
  { id: 'Legendary', icon: '👑', cost: 10000, dmg: 9999, range: 380, color: '#facc15' }
];

const state = {
  running: false,
  isOwner: false,
  publicExecEnabled: true,
  userId: localStorage.getItem('jay_uid') || ('user_' + Math.random().toString(36).slice(2, 9)),
  username: 'Player',
  cash: 100,
  rebirths: 0,
  dropperLevel: 1,
  upgraderLevel: 0,
  hasWalls: false,
  ownedWeapons: ['Fists'],
  equipped: 'Fists',
  player: { x: 240, y: 380, speed: 4.5, hp: 100, facingX: 1, facingY: 0 },
  cubes: [],
  effects: [],
  bots: [
    { name: 'ArenaBot_1', x: 520, y: 240, hp: 120, maxHp: 120, kicked: false },
    { name: 'ArenaBot_2', x: 640, y: 360, hp: 150, maxHp: 150, kicked: false }
  ],
  bannedUsers: [],
  mutedUsers: [],
  vcOn: false
};
localStorage.setItem('jay_uid', state.userId);

const PADS = [
  { id: 'dropper', label: 'Buy Dropper', x: 90, y: 290, w: 90, h: 48, getCost: () => state.dropperLevel * 100, color: '#22c55e' },
  { id: 'upgrader', label: 'Laser Upgrader', x: 90, y: 360, w: 90, h: 48, getCost: () => (state.upgraderLevel + 1) * 250, color: '#38bdf8' },
  { id: 'walls', label: 'Forcefield Walls', x: 90, y: 430, w: 90, h: 48, getCost: () => state.hasWalls ? 0 : 300, color: '#8b5cf6' },
  { id: 'rebirth', label: 'REBIRTH ($5K)', x: 210, y: 430, w: 100, h: 48, getCost: () => 5000, color: '#f59e0b' },
  { id: 'Axe', label: 'Unlock Axe', x: 210, y: 260, w: 85, h: 42, getCost: () => 150, color: '#c8f53b' },
  { id: 'Axe Smash', label: 'Axe Smash', x: 305, y: 260, w: 85, h: 42, getCost: () => 400, color: '#c8f53b' },
  { id: 'Staff', label: 'Unlock Staff', x: 210, y: 312, w: 85, h: 42, getCost: () => 800, color: '#c8f53b' },
  { id: 'Energy Sword', label: 'Energy Sword', x: 305, y: 312, w: 85, h: 42, getCost: () => 1500, color: '#c8f53b' },
  { id: 'Web Hook', label: 'Web Hook', x: 210, y: 364, w: 85, h: 42, getCost: () => 2500, color: '#c8f53b' },
  { id: 'Spike Hook', label: 'Spike Hook', x: 305, y: 364, w: 85, h: 42, getCost: () => 4000, color: '#c8f53b' },
  { id: 'Legendary', label: 'LEGENDARY', x: 400, y: 312, w: 92, h: 52, getCost: () => 10000, color: '#facc15' }
];

function updateHud() {
  document.getElementById('cashHud').textContent = '$' + Math.floor(state.cash).toLocaleString();
  document.getElementById('rebirthHud').textContent = 'Rebirths: ' + state.rebirths;
  renderHotbar();
}

function renderHotbar() {
  const hb = document.getElementById('hotbar');
  hb.innerHTML = '';
  WEAPONS.forEach((w, idx) => {
    const owned = state.ownedWeapons.includes(w.id);
    const div = document.createElement('div');
    div.className = 'slot' + (owned ? ' owned' : '') + (state.equipped === w.id ? ' active' : '');
    div.innerHTML = `<span class="slot-num">${idx + 1}</span><span class="slot-icon">${w.icon}</span><span class="slot-name">${w.id}</span>`;
    div.onclick = () => {
      if (owned) { state.equipped = w.id; renderHotbar(); }
      else showToast(`Step on the ${w.id} pad ($${w.cost}) to unlock!`);
    };
    hb.appendChild(div);
  });
}

function unlockAllWeapons() {
  state.ownedWeapons = WEAPONS.map(w => w.id);
  renderHotbar();
  showToast('👑 All 8 Weapons & Abilities Unlocked!');
}

function appendChat(sender, text, color = '#f8fafc') {
  const feed = document.getElementById('chatFeed');
  const line = document.createElement('div');
  line.className = 'chat-msg';
  line.style.color = color;
  line.innerHTML = `<strong>[${sender}]:</strong> `;
  line.appendChild(document.createTextNode(text));
  feed.appendChild(line);
  feed.scrollTop = feed.scrollHeight;
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const raw = input.value.trim();
  input.value = '';
  if (!raw) return;

  if (raw === '/Jay Admin Panel v2') {
    if (state.isOwner) {
      openOwnerPanel();
    } else {
      openModal('passModal');
      setTimeout(() => document.getElementById('ownerPassInput').focus(), 100);
    }
    return;
  }

  if (state.mutedUsers.includes(state.username)) {
    showToast('🔇 You are muted by the Owner.');
    return;
  }

  const tag = state.isOwner ? 'Jay (Owner)' : state.username;
  const col = state.isOwner ? '#c8f53b' : '#ffffff';
  appendChat(tag, raw, col);
}

function verifyOwner() {
  const val = document.getElementById('ownerPassInput').value;
  document.getElementById('ownerPassInput').value = '';
  if (val === 'Kamron98') {
    state.isOwner = true;
    state.username = 'Jay';
    closeModal('passModal');
    document.getElementById('ownerOpenBtn').classList.add('unlocked');
    openOwnerPanel();
    showToast('👑 Owner Panel v2 Unlocked!');
  } else {
    showToast('❌ Invalid Passcode.');
  }
}

function openOwnerPanel() {
  if (!state.isOwner) return;
  openModal('ownerModal');
}

function adminAction(type) {
  if (!state.isOwner) return;
  const target = document.getElementById('targetPlayerInput').value.trim();
  if (!target) return showToast('Enter a username first.');

  const bot = state.bots.find(b => b.name.toLowerCase() === target.toLowerCase());
  if (type === 'kick') {
    if (bot) bot.kicked = true;
    appendChat('System', `${target} was kicked by Owner Jay.`, '#f87171');
  } else if (type === 'ban') {
    if (bot) bot.kicked = true;
    if (!state.bannedUsers.includes(target)) state.bannedUsers.push(target);
    appendChat('System', `${target} was permanently banned by Owner Jay.`, '#ef4444');
  } else if (type === 'unban') {
    state.bannedUsers = state.bannedUsers.filter(u => u.toLowerCase() !== target.toLowerCase());
    if (bot) { bot.kicked = false; bot.hp = bot.maxHp; }
    appendChat('System', `${target} was unbanned by Owner Jay.`, '#34d399');
  } else if (type === 'mute') {
    if (state.mutedUsers.includes(target)) {
      state.mutedUsers = state.mutedUsers.filter(u => u !== target);
      appendChat('System', `${target} was unmuted.`, '#38bdf8');
    } else {
      state.mutedUsers.push(target);
      appendChat('System', `${target} was muted by Owner Jay.`, '#fbbf24');
    }
  }
  document.getElementById('banListDisplay').textContent =
    `Banned: ${state.bannedUsers.length ? state.bannedUsers.join(', ') : 'None'} | Muted: ${state.mutedUsers.length ? state.mutedUsers.join(', ') : 'None'}`;
}

function togglePublicExecutor() {
  state.publicExecEnabled = !state.publicExecEnabled;
  document.getElementById('togglePublicExecBtn').textContent = 'Public Executor: ' + (state.publicExecEnabled ? 'ON' : 'OFF');
  showToast('Public Lua Executor is now ' + (state.publicExecEnabled ? 'ENABLED' : 'DISABLED'));
}

function toggleVC() {
  state.vcOn = !state.vcOn;
  const btn = document.getElementById('vcBtn');
  btn.textContent = state.vcOn ? '🎙️ VC ON' : '🎙️ VC OFF';
  btn.classList.toggle('active', state.vcOn);
  showToast(state.vcOn ? '🎙️ Voice Chat Mic Active' : '🎙️ Voice Chat Muted');
}

let currentExecTab = 'mine';

function openExecutor() {
  if (!state.isOwner && !state.publicExecEnabled) {
    return showToast('🔒 Script Executor is currently restricted by Owner Jay.');
  }
  openModal('execModal');
  renderSavedScripts();
}

function switchExecTab(tab) {
  currentExecTab = tab;
  document.getElementById('tabMyScripts').className = tab === 'mine' ? 'cmd-btn blue' : 'cmd-btn';
  document.getElementById('tabPublicScripts').className = tab === 'public' ? 'cmd-btn blue' : 'cmd-btn';
  renderSavedScripts();
}

function getStoredScripts() {
  try { return JSON.parse(localStorage.getItem('jay_lua_scripts_v1') || '[]'); }
  catch { return []; }
}

function setStoredScripts(list) {
  localStorage.setItem('jay_lua_scripts_v1', JSON.stringify(list));
}

function saveLuaScript() {
  const title = document.getElementById('scriptTitleInput').value.trim() || 'Untitled Lua Script';
  const code = document.getElementById('luaCodeInput').value.trim();
  const isPublic = document.getElementById('isPublicCheck').checked;
if (!code) return showToast('Write or paste a Lua script first!');
const list = getStoredScripts();
list.unshift({
id: Date.now(),
ownerId: state.userId,
author: state.isOwner ? 'Jay (Owner)' : state.username,
title,
code,
isPublic
});
setStoredScripts(list);
document.getElementById('scriptTitleInput').value = '';
renderSavedScripts();
showToast(💾 Saved "${title}" (${isPublic ? 'Public' : 'Private'})!);
}
function toggleScriptVisibility(id) {
const list = getStoredScripts();
const item = list.find(s => s.id === id && s.ownerId === state.userId);
if (!item) return;
item.isPublic = !item.isPublic;
setStoredScripts(list);
renderSavedScripts();
showToast(Script is now ${item.isPublic ? 'PUBLIC' : 'PRIVATE'});
}
function deleteScript(id) {
const list = getStoredScripts().filter(s => !(s.id === id && s.ownerId === state.userId));
setStoredScripts(list);
renderSavedScripts();
showToast('🗑️ Script deleted');
}
function renderSavedScripts() {
const container = document.getElementById('scriptsListContainer');
const all = getStoredScripts();
const visible = currentExecTab === 'mine'
? all.filter(s => s.ownerId === state.userId)
: all.filter(s => s.isPublic === true);
if (!visible.length) {
container.innerHTML = <p style="font-size:12px; color:#64748b;">No ${currentExecTab === 'mine' ? 'saved private/personal' : 'public'} scripts yet.</p>;
return;
}
container.innerHTML = '';
visible.forEach(s => {
const isMine = s.ownerId === state.userId;
const div = document.createElement('div');
div.className = 'script-item';
div.innerHTML = <div class="script-top"> <strong style="font-size:13px; color:#f8fafc;">${s.title} <span style="color:#64748b; font-weight:500;">by ${s.author}</span></strong> <span class="vis-tag ${s.isPublic ? 'public' : ''}">${s.isPublic ? '🌐 PUBLIC' : '🔒 PRIVATE'}</span> </div> <div class="btn-row" style="margin-bottom:0;"> <button class="cmd-btn lime" onclick="executeLuaById(${s.id})">▶ Execute</button> <button class="cmd-btn" onclick="loadScriptToEditor(${s.id})">Load</button> ${isMine ?${s.isPublic ? 'Make Private' : 'Make Public'}: ''} ${isMine ?Delete: ''} </div>;
container.appendChild(div);
});
}
function executeLuaById(id) {
const s = getStoredScripts().find(item => item.id === id);
if (s && (s.isPublic || s.ownerId === state.userId)) executeLua(s.code);
}
function loadScriptToEditor(id) {
const s = getStoredScripts().find(item => item.id === id);
if (s && (s.isPublic || s.ownerId === state.userId)) {
document.getElementById('scriptTitleInput').value = s.title;
document.getElementById('luaCodeInput').value = s.code;
document.getElementById('isPublicCheck').checked = s.isPublic;
}
}
function executeLua(userCode) {
if (!userCode || !userCode.trim()) return;
const lines = userCode.split('\n');
let ran = false;
lines.forEach(rawLine => {
const line = rawLine.trim();
if (!line || line.startsWith('--')) return;
if (line.includes('UnlockAllWeapons')) { unlockAllWeapons(); ran = true; }
const wsMatch = line.match(/WalkSpeed\s*=\s*([0-9.]+)/i);
if (wsMatch) { state.player.speed = parseFloat(wsMatch[1]) || 4.5; ran = true; }
const cashMatch = line.match(/Cash.Value\s*=\s*([0-9.]+)/i);
if (cashMatch) { state.cash = parseFloat(cashMatch[1]) || 0; updateHud(); ran = true; }
const rebMatch = line.match(/Rebirths.Value\s*=\s*([0-9.]+)/i);
if (rebMatch) { state.rebirths = parseInt(rebMatch[1], 10) || 0; updateHud(); ran = true; }
const printMatch = line.match(/print\s*\s*["'](.+?)["']\s*/i);
if (printMatch) { showToast(printMatch[1]); ran = true; }
});
if (ran) showToast('⚡ Lua / Luau Script Executed!');
else showToast('⚡ Script Processed (Try WalkSpeed, Cash.Value, or UnlockAllWeapons())');
}
const canvas = document.getElementById('tycoonCanvas');
const ctx = canvas.getContext('2d');
const keys = {};
let joyVec = { x: 0, y: 0 };
let padCooldown = 0;
let spawnTimer = 0;
window.addEventListener('keydown', e => {
if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
keys[e.key.toLowerCase()] = true;
if (e.key >= '1' && e.key <= '8') {
const w = WEAPONS[Number(e.key) - 1];
if (w && state.ownedWeapons.includes(w.id)) { state.equipped = w.id; renderHotbar(); }
}
if (e.code === 'Space') useWeapon();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
const stick = document.getElementById('touchStick');
const knob = document.getElementById('stickKnob');
stick.addEventListener('touchmove', e => {
e.preventDefault();
const rect = stick.getBoundingClientRect();
const touch = e.touches[0];
const dx = touch.clientX - (rect.left + rect.width / 2);
const dy = touch.clientY - (rect.top + rect.height / 2);
const dist = Math.min(34, Math.hypot(dx, dy));
const ang = Math.atan2(dy, dx);
knob.style.left = (31 + Math.cos(ang) * dist) + 'px';
knob.style.top = (31 + Math.sin(ang) * dist) + 'px';
joyVec.x = Math.cos(ang) * (dist / 34);
joyVec.y = Math.sin(ang) * (dist / 34);
});
stick.addEventListener('touchend', () => {
knob.style.left = '29px'; knob.style.top = '29px';
joyVec = { x: 0, y: 0 };
});
canvas.addEventListener('mousedown', (e) => {
const rect = canvas.getBoundingClientRect();
const mx = e.clientX - rect.left;
const my = e.clientY - rect.top;
const ang = Math.atan2(my - state.player.y, mx - state.player.x);
state.player.facingX = Math.cos(ang);
state.player.facingY = Math.sin(ang);
useWeapon();
});
function useWeapon() {
const w = WEAPONS.find(item => item.id === state.equipped) || WEAPONS[0];
const p = state.player;
state.effects.push({
type: w.id, x: p.x, y: p.y, fx: p.facingX, fy: p.facingY,
range: w.range, color: w.color, life: 14
});
state.bots.forEach(bot => {
if (bot.kicked || bot.hp <= 0) return;
const dist = Math.hypot(bot.x - p.x, bot.y - p.y);
if (dist <= w.range) {
bot.hp -= w.dmg;
if (w.id === 'Web Hook' || w.id === 'Spike Hook') {
bot.x = p.x + p.facingX * 42;
bot.y = p.y + p.facingY * 42;
}
if (bot.hp <= 0) {
const reward = 250 * (state.rebirths + 1);
state.cash += reward;
updateHud();
showToast(💥 Defeated ${bot.name}! +$${reward});
setTimeout(() => { bot.hp = bot.maxHp; }, 3500);
}
}
});
}
function launchTycoon() {
document.getElementById('portalView').style.display = 'none';
document.getElementById('gameView').classList.add('active');
resizeCanvas();
updateHud();
if (!state.running) {
state.running = true;
requestAnimationFrame(loop);
}
}
function exitGame() {
document.getElementById('gameView').classList.remove('active');
document.getElementById('portalView').style.display = 'block';
}
function resizeCanvas() {
const wrap = document.getElementById('arenaWrap');
canvas.width = wrap.clientWidth;
canvas.height = wrap.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
function loop() {
if (!state.running) return;
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
ctx.lineWidth = 1;
for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
ctx.fillRect(50, 210, 460, 290);
ctx.strokeStyle = state.hasWalls ? '#c8f53b' : '#38bdf8';
ctx.lineWidth = state.hasWalls ? 4 : 2;
ctx.strokeRect(50, 210, 460, 290);
ctx.fillStyle = '#38bdf8';
ctx.font = 'bold 14px sans-serif';
ctx.fillText("JAY'S BASE (CONVEYOR + ARMORY)", 62, 232);
ctx.fillStyle = '#1e293b';
ctx.fillRect(65, 245, 115, 25);
if (state.upgraderLevel > 0) {
ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
ctx.fillRect(110, 242, 16, 31);
}
spawnTimer++;
if (spawnTimer >= Math.max(25, 75 - state.dropperLevel * 8) && state.cubes.length < 18) {
spawnTimer = 0;
state.cubes.push({ x: 70, y: 252, val: 15 * state.dropperLevel });
}
for (let i = state.cubes.length - 1; i >= 0; i--) {
const c = state.cubes[i];
c.x += 1.6;
ctx.fillStyle = state.upgraderLevel > 0 ? '#c8f53b' : '#38bdf8';
ctx.fillRect(c.x, c.y, 12, 12);
if (c.x >= 175) {
const mult = (1 + state.upgraderLevel * 0.5) * (1 + state.rebirths);
state.cash += c.val * mult;
state.cubes.splice(i, 1);
updateHud();
}
}
if (padCooldown > 0) padCooldown--;
PADS.forEach(pad => {
const isWeapon = WEAPONS.some(w => w.id === pad.id);
const alreadyOwned = (isWeapon && state.ownedWeapons.includes(pad.id)) || (pad.id === 'walls' && state.hasWalls);
const cost = pad.getCost();
ctx.fillStyle = alreadyOwned ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.95)';
ctx.fillRect(pad.x, pad.y, pad.w, pad.h);
ctx.strokeStyle = alreadyOwned ? '#475569' : pad.color;
ctx.lineWidth = 2;
ctx.strokeRect(pad.x, pad.y, pad.w, pad.h);
ctx.fillStyle = alreadyOwned ? '#64748b' : '#ffffff';
ctx.font = 'bold 10px sans-serif';
ctx.fillText(pad.label, pad.x + 6, pad.y + 18);
ctx.fillStyle = alreadyOwned ? '#64748b' : pad.color;
ctx.fillText(alreadyOwned ? 'OWNED' : '$' + cost.toLocaleString(), pad.x + 6, pad.y + 34);
const p = state.player;
if (!alreadyOwned && padCooldown === 0 && p.x > pad.x && p.x < pad.x + pad.w && p.y > pad.y && p.y < pad.y + pad.h) {
if (state.cash >= cost) {
state.cash -= cost;
padCooldown = 25;
if (pad.id === 'dropper') state.dropperLevel++;
else if (pad.id === 'upgrader') state.upgraderLevel++;
else if (pad.id === 'walls') state.hasWalls = true;
else if (pad.id === 'rebirth') {
state.rebirths++;
state.cash = 100;
state.dropperLevel = 1;
state.upgraderLevel = 0;
state.hasWalls = false;
state.ownedWeapons = ['Fists'];
state.equipped = 'Fists';
showToast('🔥 REBIRTH COMPLETE! Cash Multiplier Increased!');
} else if (isWeapon) {
state.ownedWeapons.push(pad.id);
state.equipped = pad.id;
showToast(⚡ Unlocked ${pad.id}!);
}
updateHud();
}
}
});
let vx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0) + joyVec.x;
let vy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0) + joyVec.y;
const mag = Math.hypot(vx, vy);
if (mag > 0.05) {
vx /= Math.max(1, mag);
vy /= Math.max(1, mag);
state.player.x = Math.max(20, Math.min(canvas.width - 20, state.player.x + vx * state.player.speed));
state.player.y = Math.max(20, Math.min(canvas.height - 20, state.player.y + vy * state.player.speed));
state.player.facingX = vx;
state.player.facingY = vy;
}
state.bots.forEach(bot => {
if (bot.kicked || bot.hp <= 0) return;
ctx.fillStyle = '#f43f5e';
ctx.beginPath(); ctx.arc(bot.x, bot.y, 16, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 11px sans-serif';
ctx.fillText(${bot.name} (${bot.hp} HP), bot.x - 42, bot.y - 24);
});
const p = state.player;
ctx.fillStyle = state.isOwner ? '#c8f53b' : '#38bdf8';
ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill();
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 12px sans-serif';
const label = (state.isOwner ? '👑 Jay (Owner)' : state.username) + (state.vcOn ? ' 🎙️' : '');
ctx.fillText(label, p.x - 36, p.y - 24);
for (let i = state.effects.length - 1; i >= 0; i--) {
const ef = state.effects[i];
ef.life--;
ctx.strokeStyle = ef.color;
ctx.lineWidth = ef.type === 'Legendary' ? 8 : 4;
if (ef.type === 'Axe Smash' || ef.type === 'Fists') {
ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.range * (1 - ef.life / 16), 0, Math.PI * 2); ctx.stroke();
} else {
ctx.beginPath(); ctx.moveTo(ef.x, ef.y);
ctx.lineTo(ef.x + ef.fx * ef.range, ef.y + ef.fy * ef.range); ctx.stroke();
}
if (ef.life <= 0) state.effects.splice(i, 1);
}
requestAnimationFrame(loop);
}