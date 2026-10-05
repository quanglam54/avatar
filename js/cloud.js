/* Tài khoản + lưu tiến trình lên Supabase để chơi trên máy nào cũng ra đúng nhân vật.
 * Đăng nhập bằng tên đăng nhập + mật khẩu (đổi thành email nội bộ <tên>@players.avatar-game.vn, không cần email thật).
 * Cần bảng public.saves (xem SQL trong hướng dẫn) và tắt "Confirm email" trong Supabase Auth. */
let SB_PROMISE = null;
window.getSupabase = () => {
  if (SB_PROMISE) return SB_PROMISE;
  const cfg = window.AVATAR_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return (SB_PROMISE = Promise.resolve(null));
  SB_PROMISE = new Promise((resolve) => {
    const make = () => resolve(window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'avatar_auth' },
      realtime: { params: { eventsPerSecond: 12 } },
    }) : null);
    if (window.supabase) return make();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload = make;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return SB_PROMISE;
};

const CLOUD = (() => {
  const DOMAIN = 'players.avatar-game.vn';
  let client = null;
  let user = null;
  let dirty = false;
  let pushing = false;
  let lastPush = 0;
  let available = false;

  const emailOf = (u) => `${u}@${DOMAIN}`;
  const nameOf = (u) => (u && u.email ? u.email.split('@')[0] : '');

  /** Đổi lỗi tiếng Anh của Supabase sang tiếng Việt dễ hiểu */
  function viError(e) {
    const m = String((e && e.message) || e || '');
    if (/Invalid login credentials/i.test(m)) return 'Sai tên đăng nhập hoặc mật khẩu';
    if (/already registered|already been registered|User already/i.test(m)) return 'Tên đăng nhập này đã có người dùng';
    if (/Password should be at least/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự';
    if (/Email not confirmed/i.test(m)) return 'Tài khoản chưa xác nhận email — chủ game cần tắt "Confirm email" trong Supabase';
    if (/relation .*saves.* does not exist|Could not find the table/i.test(m)) return 'Chưa tạo bảng lưu trữ (saves) trên Supabase';
    if (/rate limit|too many/i.test(m)) return 'Thao tác quá nhanh, đợi một chút rồi thử lại';
    if (/function .* does not exist|Could not find the function|farm_helps/i.test(m)) return 'Chủ game chưa cài tính năng thăm nông trại trên Supabase (chạy file supabase/02-tham-nong-trai.sql)';
    if (/duplicate key|unique/i.test(m)) return 'Hôm nay bạn đã tưới giúp bạn này rồi, mai quay lại nhé!';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Không kết nối được máy chủ, kiểm tra mạng';
    return m || 'Có lỗi xảy ra';
  }

  async function init() {
    client = await window.getSupabase();
    available = !!client;
    if (!client) return null;
    try {
      const { data } = await client.auth.getSession();
      user = data && data.session ? data.session.user : null;
    } catch (e) { user = null; }
    return user;
  }

  function checkName(u) {
    const v = String(u || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(v)) throw new Error('Tên đăng nhập 3–20 ký tự, chỉ gồm chữ không dấu, số và dấu _');
    return v;
  }

  async function signUp(username, password) {
    const u = checkName(username);
    if (String(password).length < 6) throw new Error('Mật khẩu cần ít nhất 6 ký tự');
    const { data, error } = await client.auth.signUp({ email: emailOf(u), password, options: { data: { username: u } } });
    if (error) throw new Error(viError(error));
    if (!data.session) throw new Error('Đăng ký cần xác nhận email — chủ game cần tắt "Confirm email" trong Supabase rồi thử lại');
    user = data.user;
    return user;
  }

  async function signIn(username, password) {
    const u = checkName(username);
    const { data, error } = await client.auth.signInWithPassword({ email: emailOf(u), password });
    if (error) throw new Error(viError(error));
    user = data.user;
    return user;
  }

  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args || {});
    if (error) throw new Error(viError(error));
    return data;
  }
  /** Phần nông trại của một người (không có xu, túi đồ) */
  const getFarm = (username) => rpc('get_farm', { p_username: username });
  const recentFarms = () => rpc('recent_farms');

  async function sendHelp(ownerId, helperName) {
    const { error } = await client.from('farm_helps').insert({ owner: ownerId, helper: user.id, helper_name: helperName });
    if (error) throw new Error(viError(error));
  }

  /** Lấy các lời tưới giúp chưa nhận rồi đánh dấu đã nhận */
  async function pullHelps() {
    const { data, error } = await client.from('farm_helps').select('id, helper_name').eq('owner', user.id).eq('done', false);
    if (error) throw new Error(viError(error));
    if (data && data.length) await client.from('farm_helps').update({ done: true }).in('id', data.map((r) => r.id));
    return data || [];
  }

  /** Báo đã hái trộm 1 ô ruộng (chủ nông trại tự xử lý khi online) */
  async function sendSteal(row) {
    const { error } = await client.from('farm_steals').insert({ ...row, thief: user.id });
    if (!error) return;
    const m = String(error.message || '');
    if (/steal_limit/.test(m)) throw new Error('Hôm nay bạn đã hái trộm nông trại này 3 lần rồi, mai quay lại nhé 😅');
    if (/duplicate key|unique/i.test(m)) throw new Error('Ô này hôm nay bạn đã hái trộm rồi');
    if (/farm_steals|does not exist|Could not find the table/i.test(m)) throw new Error('Chủ game chưa cài tính năng hái trộm trên Supabase (chạy file supabase/04-trom-va-thu-giu-nha.sql)');
    throw new Error(viError(error));
  }

  /** Lấy các lần bị hái trộm chưa xử lý rồi đánh dấu đã xử lý */
  async function pullSteals() {
    const { data, error } = await client.from('farm_steals').select('id, thief_name, tile, crop, qty, bitten, coins').eq('owner', user.id).eq('done', false);
    if (error) throw new Error(viError(error));
    if (data && data.length) await client.from('farm_steals').update({ done: true }).in('id', data.map((r) => r.id));
    return data || [];
  }

  /** Các bản lưu cũ trên máy chủ (cần chạy supabase/03-lich-su-ban-luu.sql) */
  async function history() {
    const { data, error } = await client.from('saves_history').select('id, saved_at, data').eq('user_id', user.id).order('saved_at', { ascending: false }).limit(30);
    if (error) throw new Error(/saves_history/.test(error.message) ? 'Chủ game chưa bật lịch sử bản lưu (chạy file supabase/03-lich-su-ban-luu.sql)' : viError(error));
    return data || [];
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    user = null;
  }

  /** Tải bản lưu trên mạng: { data, updated_at } hoặc null nếu chưa có */
  async function pull() {
    const { data, error } = await client.from('saves').select('data, updated_at').eq('user_id', user.id).maybeSingle();
    if (error) throw new Error(viError(error));
    return data;
  }

  async function push(state) {
    if (!user || !client || pushing) return false;
    pushing = true;
    try {
      const { error } = await client.from('saves').upsert({
        user_id: user.id, username: nameOf(user), data: state, updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      dirty = false;
      lastPush = Date.now();
      if (api.onPushed) try { api.onPushed(state); } catch (e) { /* bỏ qua */ }
      return true;
    } catch (e) {
      console.warn('[cloud] lưu thất bại:', viError(e));
      return false;
    } finally {
      pushing = false;
    }
  }

  /** Khi tắt/ẩn trang: gửi bản lưu cuối bằng fetch keepalive (vẫn chạy khi đóng tab) */
  function pushOnExit(state) {
    if (!user || !client || !dirty) return;
    try {
      const cfg = window.AVATAR_CONFIG;
      const raw = localStorage.getItem('avatar_auth');
      const token = raw ? JSON.parse(raw).access_token : null;
      if (!token) return;
      fetch(`${cfg.supabaseUrl}/rest/v1/saves`, {
        method: 'POST', keepalive: true,
        headers: {
          apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({ user_id: user.id, username: nameOf(user), data: state, updated_at: new Date().toISOString() }),
      });
      dirty = false;
    } catch (e) { /* bỏ qua */ }
  }

  const api = {
    init, signUp, signIn, signOut, pull, push, pushOnExit, getFarm, recentFarms, sendHelp, pullHelps, sendSteal, pullSteals, history,
    onPushed: null,
    markDirty: () => { dirty = true; },
    get user() { return user; },
    get username() { return nameOf(user); },
    get available() { return available; },
    get dirty() { return dirty; },
    get lastPush() { return lastPush; },
    get client() { return client; },
  };
  return api;
})();
