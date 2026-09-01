let currentMount = null;
let recState = null;
let compDraft = null;

function go(route) {
  if (!route) return;
  if (route === location.hash.replace(/^#/, '')) { render(); return; }
  location.hash = route;
}
function R() { render(); }
function goBack() { if (history.length > 1) history.back(); else go('/'); }

function parseHash() {
  let h = location.hash.replace(/^#/, '') || '/';
  const q = h.indexOf('?');
  let qs = {};
  if (q !== -1) {
    const raw = h.slice(q + 1).split('&');
    raw.forEach(function (kv) { const p = kv.split('='); qs[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    h = h.slice(0, q);
  }
  return { segs: h.split('/').filter(Boolean), qs: qs };
}

const NAV_ITEMS = {
  customer: [
    { icon: 'home', label: 'Dashboard', r: '/customer' },
    { icon: 'plus', label: 'Post a Job', r: '/customer/post' },
    { icon: 'list', label: 'My Jobs', r: '/customer/jobs' },
    { icon: 'chat', label: 'Offers', r: '/customer/offers', count: function () { const u = Store.currentUser(); return u ? Store.pendingOffersCount() : 0; } },
    { icon: 'calendar', label: 'Upcoming Visits', r: '/customer/visits' },
    { icon: 'wallet', label: 'Payments', r: '/customer/payments' },
    { icon: 'star', label: 'Reviews', r: '/customer/reviews' },
    { icon: 'bell', label: 'Notifications', r: '/customer/notifications', count: function () { const u = Store.currentUser(); return u ? Store.unreadFor(u.id) : 0; } },
    { icon: 'user', label: 'Profile', r: '/customer/profile' },
    { icon: 'settings', label: 'Settings', r: '/customer/settings' }
  ],
  worker: [
    { icon: 'home', label: 'Dashboard', r: '/worker' },
    { icon: 'map', label: 'Nearby Jobs', r: '/worker/jobs' },
    { icon: 'send', label: 'My Offers', r: '/worker/offers' },
    { icon: 'briefcase', label: 'Active Jobs', r: '/worker/active' },
    { icon: 'calendar', label: 'Upcoming Visits', r: '/worker/visits' },
    { icon: 'checkC', label: 'Completed Jobs', r: '/worker/completed' },
    { icon: 'wallet', label: 'Earnings', r: '/worker/earnings' },
    { icon: 'star', label: 'Reviews', r: '/worker/reviews' },
    { icon: 'bell', label: 'Notifications', r: '/worker/notifications', count: function () { const u = Store.currentUser(); return u ? Store.unreadFor(u.id) : 0; } },
    { icon: 'user', label: 'Profile', r: '/worker/profile' },
    { icon: 'settings', label: 'Settings', r: '/worker/settings' }
  ]
};

function svc(id) { return SERVICES.find(function (x) { return x.id === id; }); }
function svcByName(n) { return SERVICES.find(function (x) { return x.name === n; }); }

function isActiveRoute(route, hash) {
  if (route === '/customer' || route === '/worker') return hash === route;
  return hash.indexOf(route) === 0;
}

/* ============================= SHELLS ============================= */

function publicShell(body) {
  const segs = parseHash().segs;
  const path = '/' + segs.join('/');
  const active = function (r) { return path.indexOf(r) === 0 ? ' active' : ''; };
  return '<div class="app pub">' +
    '<nav class="pub-nav"><div class="content">' +
    '<a class="brand" href="#/" ><span class="brand-mark">' + ic('wrench') + '</span><span>HU<b>NAR</b></span></a>' +
    '<div class="pub-links">' +
    '<a class="btn-ghost' + active('/services') + '" href="#/services">Services</a>' +
    '<a class="btn-ghost' + active('/workers') + '" href="#/workers">Workers</a>' +
    '<a class="btn-ghost link-only" href="#/login">Login</a>' +
    '<a class="btn-ghost link-only" href="#/worker/onboarding" style="display:none"></a>' +
    '</div>' +
    '<span style="margin-left:auto"></span>' +
    '<a class="btn btn-outline link-only" href="#/login">Login</a>' +
    '<a class="btn btn-primary" href="#/register">Create Account</a>' +
    '</div></nav>' +
    body +
    footerHtml() +
    '</div>';
}

function footerHtml() {
  return '<footer class="foot"><div class="content">' +
    '<div><a class="brand" href="#/"><span class="brand-mark">' + ic('wrench') + '</span><span>HU<b>NAR</b></span></a>' +
    '<p class="fb">HUNAR connects customers with nearby skilled workers. Post a problem, get offers, negotiate the price, and get it fixed — on your terms.</p></div>' +
    '<div><h5>Services</h5>' + SERVICES.slice(0, 5).map(function (s) { return '<a href="#/workers?skill=' + encodeURIComponent(s.name) + '">' + s.name + '</a>'; }).join('') + '</div>' +
    '<div><h5>Company</h5><a href="#/">About HUNAR</a><a href="#/workers">Find a Professional</a><a href="#/register">Join as a Worker</a><a href="#/login">Login</a></div>' +
    '<div><h5>Support</h5><a href="#/">Help Center</a><a href="#/">Safety</a><a href="#/">Contact Us</a><a href="#/">Terms & Privacy</a></div>' +
    '</div></footer>';
}

function appShell(body, title, sub) {
  const u = Store.currentUser();
  const me = u.role === 'worker' ? 'worker' : 'customer';
  const items = NAV_ITEMS[me];
  const hash = parseHash().segs.join('/');
  const active = function (r) { return isActiveRoute(r, '/' + hash); };
  const unread = Store.unreadFor(u.id);
  const side = '<div class="scrim" onclick="A.closeSidebar()"></div>' +
    '<aside class="sidebar" id="sidebar">' +
    '<a class="brand" href="#/" onclick="A.closeSidebar()"><span class="brand-mark">' + ic('wrench') + '</span><span>HU<b>NAR</b></span></a>' +
    '<div class="side-sec">' + (me === 'customer' ? 'Customer' : 'Worker') + ' Portal</div>' +
    items.map(function (it) {
      const c = it.count ? it.count() : 0;
      return '<div class="side-row' + (active(it.r) ? ' on' : '') + '" onclick="A.menuGo(\'' + it.r + '\')">' + ic(it.icon, { s: 18 }) + '<span>' + it.label + '</span>' + (c ? '<span class="cnt">' + c + '</span>' : '') + '</div>';
    }).join('') +
    '<div class="side-sec">Account</div>' +
    '<div class="side-bottom">' +
    '<div class="side-user" onclick="A.toggleAccountMenu()">' + UI.avatar(u) +
    '<div style="min-width:0;flex:1"><div class="un" style="font-weight:800">' + UI.esc(u.name) + '</div><div class="ur">' + (u.role === 'worker' ? 'Worker' : 'Customer') + ' · ' + (u.area || 'No area') + '</div></div>' +
    ic('chevD', { s: 16, style: 'color:#7fa1ae' }) + '</div></div></aside>';

  const top = '<div class="topbar">' +
    '<button class="icon-btn menu-btn" onclick="A.toggleSidebar()">' + ic('menu') + '</button>' +
    '<div><div class="ttl">' + title + '</div>' + (sub ? '<div class="ttl-sub">' + sub + '</div>' : '') + '</div>' +
    '<div class="top-right">' +
    '<div class="role-switch">' +
    '<button class="' + (me === 'customer' ? 'on' : '') + '" onclick="A.switchAccToCustomer()">Customer</button>' +
    '<button class="' + (me === 'worker' ? 'on' : '') + '" onclick="A.switchAccToWorker()">Worker</button></div>' +
    '<button class="icon-btn" onclick="A.notifMenu()">' + ic('bell') + (unread ? '<span class="ping">' + unread + '</span>' : '') + '</button>' +
    '<button class="icon-btn" onclick="A.accountMenu()">' + UI.avatar(u, '', {}) + '</button>' +
    '</div></div><div id="float-menu"></div>';

  return '<div class="shell">' + side + '<div class="main">' + top + '<div class="page">' + body + '</div></div></div>';
}

/* ============================= ROUTER ============================= */

function render() {
  const { segs } = parseHash();
  const path = segs.join('/');
  const u = Store.currentUser();
  let view = null;
  let params = {};

  if (segs.length === 0 || path === 'home') {
    view = u ? (u.role === 'worker' ? 'workerDashboard' : 'customerDashboard') : 'landing';
  } else if (segs[0] === 'services') view = 'services';
  else if (segs[0] === 'workers') {
    if (segs.length === 1) view = 'workers';
    else if (segs.length === 2) { view = 'workerPublic'; params.id = segs[1]; }
  } else if (segs[0] === 'login') view = 'login';
  else if (segs[0] === 'register') view = 'register';

  else if (segs[0] === 'customer') {
    if (!u) { go('/login'); return; }
    if (u.role !== 'customer') { view = 'wrongRole'; params.want = 'customer'; }
    else if (segs.length === 1) view = 'customerDashboard';
    else if (segs[1] === 'post') view = 'wizard';
    else if (segs[1] === 'jobs' && segs[2] && segs[3] === 'payment') { view = 'payment'; params.id = segs[2]; }
    else if (segs[1] === 'jobs' && segs[2] && segs[3] === 'review') { view = 'review'; params.id = segs[2]; }
    else if (segs[1] === 'jobs' && segs[2]) { view = 'customerJob'; params.id = segs[2]; params.section = segs[3]; }
    else if (segs[1] === 'jobs') view = 'customerMyJobs';
    else if (segs[1] === 'offers') view = 'customerOffers';
    else if (segs[1] === 'visits') view = 'customerVisits';
    else if (segs[1] === 'payments') view = 'customerPayments';
    else if (segs[1] === 'reviews') view = 'customerReviews';
    else if (segs[1] === 'notifications') view = 'notifications';
    else if (segs[1] === 'profile') view = 'customerProfile';
    else if (segs[1] === 'settings') view = 'customerSettings';
    else { go('/customer'); return; }
  }

  else if (segs[0] === 'worker') {
    if (!u) { go('/login'); return; }
    if (u.role !== 'worker') { view = 'wrongRole'; params.want = 'worker'; }
    else if (segs.length === 1) view = 'workerDashboard';
    else if (segs[1] === 'onboarding') view = 'workerOnboarding';
    else if (segs[1] === 'jobs' && segs[2]) { view = 'workerJob'; params.id = segs[2]; }
    else if (segs[1] === 'jobs') view = 'workerJobs';
    else if (segs[1] === 'offers') { view = segs.length === 2 ? 'workerOffers' : 'workerOfferDetail'; params.id = segs[2]; }
    else if (segs[1] === 'visits') view = 'workerVisits';
    else if (segs[1] === 'active') { view = segs.length === 2 ? 'workerActive' : 'workerActiveJob'; params.id = segs[2]; }
    else if (segs[1] === 'completed') view = 'workerCompleted';
    else if (segs[1] === 'earnings') view = 'workerEarnings';
    else if (segs[1] === 'reviews') view = 'workerReviews';
    else if (segs[1] === 'notifications') view = 'notifications';
    else if (segs[1] === 'profile') view = 'workerProfile';
    else if (segs[1] === 'settings') view = 'workerSettings';
    else { go('/worker'); return; }
  }

  else { go('/'); return; }

  const app = document.getElementById('app');
  currentMount = null;
  app.innerHTML = '';

  const builder = Views[view];
  if (!builder) { go('/'); return; }

  const res = builder(params);

  if (u && view !== 'login' && view !== 'register' && view !== 'landing' && view !== 'wrongRole') {
    const isCust = u.role === 'customer';
    const isCustView = ['customerDashboard', 'wizard', 'customerJob', 'customerOffers', 'customerVisits', 'customerPayments', 'customerReviews', 'notifications', 'customerProfile', 'customerSettings'].indexOf(view) !== -1;
    const mapTitle = {
      customerDashboard: ['Dashboard', 'Your jobs and visits at a glance'], wizard: ['Post a Job', 'Tell us what needs fixing'],
      customerMyJobs: ['My Jobs', 'Everything you have posted'],
      customerJob: ['Job Details', ''], customerOffers: ['Worker Offers', 'Professionals interested in your jobs'],
      customerVisits: ['Upcoming Visits', 'Confirmed appointments'], customerPayments: ['Payments', 'Your transaction history'],
      customerReviews: ['My Reviews', 'Reviews you have left'], notifications: ['Notifications', ''],
      customerProfile: ['My Profile', 'Your HUNAR account'], customerSettings: ['Settings', 'Preferences & account'],
      payment: ['Payment', 'Complete your payment securely'], review: ['Review', 'Rate your experience'],
      workerDashboard: ['Worker Dashboard', 'Nearby jobs & your day'], workerOnboarding: ['Welcome, Worker', 'Set up your professional profile'],
      workerJob: ['Job Details', 'Customer request'], workerJobs: ['Nearby Jobs', 'New requests near you'],
      workerOffers: ['My Offers', 'Track your visit offers'],
      workerOfferDetail: ['Offer Status', ''], workerVisits: ['Upcoming Visits', 'Confirmed appointments'],
      workerActive: ['Active Jobs', ''], workerActiveJob: ['Active Job', ''],
      workerCompleted: ['Completed Jobs', ''], workerEarnings: ['Earnings', 'Your income at a glance'],
      workerReviews: ['My Reviews', 'What customers say'], workerProfile: ['My Profile', 'Your professional profile'],
      workerSettings: ['Settings', 'Preferences & account']
    };
    const mt = mapTitle[view] || [''];
    const sub = params.id && (view === 'customerJob' || view === 'workerJob' || view === 'workerOfferDetail' || view === 'workerActiveJob') ? 'Ref: ' + params.id : mt[1];
    app.innerHTML = appShell(res.html, mt[0], sub || '');
    const page = app.querySelector('.page');
    page.innerHTML = res.html;
  } else if (view === 'landing') {
    app.innerHTML = publicShell(res.html);
  } else {
    app.innerHTML = publicShell(res.html);
  }

  if (res.mount) currentMount = res.mount;
  if (currentMount) { try { currentMount(); } catch (e) { /* */ } }
  if (view === 'workerOnboarding' && u) { }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', function () {
  Store.boot();
  let signedRole = Store.currentUser() ? Store.currentUser().role : null;
  Store.onChange(function () {
    const u = Store.currentUser();
    if (!u) {
      signedRole = null;
      if (parseHash().segs[0] === 'customer' || parseHash().segs[0] === 'worker') { render(); }
      return;
    }
    if (u.role !== signedRole) {
      signedRole = u.role;
      go('/' + u.role);
      return;
    }
    render();
  });
  render();
});

/* ============================= ACTIONS ============================= */

const A = {
  toggleSidebar: function () {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar').parentElement.querySelector('.scrim').classList.toggle('show');
  },
  closeSidebar: function () {
    const el = document.getElementById('sidebar');
    if (!el) return;
    el.classList.remove('open');
    const scr = el.parentElement.querySelector('.scrim');
    if (scr) scr.classList.remove('show');
  },
  accountMenu: function () {
    const root = document.getElementById('float-menu');
    const u = Store.currentUser();
    if (!u) return;
    const list = Store.state().users.filter(function (x) { return x.id !== u.id && x.name !== 'Your Profile'; });
    let html = '<div class="menu">';
    html += '<div class="m-label">Switch demo account</div>';
    list.forEach(function (x) {
      html += '<div class="switch-acc" onclick="A.switchTo(\'' + x.id + '\')">' + UI.avatar(x) +
        '<div style="min-width:0"><div class="na">' + UI.esc(x.name) + '</div><div class="nr">' + (x.role === 'customer' ? 'Customer' : 'Worker') + ' · ' + (x.email || '') + '</div></div></div>';
    });
    html += '<div class="mmi"><div class="mi" onclick="A.menuGo(\'' + (u.role === 'worker' ? '/worker/profile' : '/customer/profile') + '\')">' + ic('user', { s: 16 }) + ' My Profile</div>';
    html += '<div class="mi" onclick="A.menuGo(\'/customer|worker/settings\'.replace(\'customer|worker\',\'' + u.role + '\'))">' + ic('settings', { s: 16 }) + ' Settings</div>';
    html += '<div class="mi" style="color:var(--danger)" onclick="A.logout()">' + ic('logout', { s: 16 }) + ' Logout</div></div>';
    html += '</div>';
    root.innerHTML = html;
    setTimeout(function () {
      document.addEventListener('mousedown', function h(ev) {
        const m = document.getElementById('float-menu');
        if (m && !m.contains(ev.target) && !ev.target.closest('.icon-btn')) { m.innerHTML = ''; document.removeEventListener('mousedown', h); }
      });
    }, 0);
  },
  menuGo: function (r) { go(r); A.closeMenu(); A.toggleSidebarClose(); },
  toggleSidebarClose: function () { A.closeSidebar(); },
  closeMenu: function () { document.getElementById('float-menu').innerHTML = ''; },
  notifMenu: function () {
    const u = Store.currentUser();
    go('/' + u.role + '/notifications');
  },
  toggleAccountMenu: function () {
    const root = document.getElementById('float-menu');
    if (root.innerHTML) { root.innerHTML = ''; return; }
    A.accountMenu();
  },
  switchTo: function (id) {
    Store.switchUser(id);
    A.closeMenu();
    const u = Store.currentUser();
    UI.toast('Now viewing the app as ' + u.name + ' (' + (u.role === 'worker' ? 'Worker' : 'Customer') + ').', 'ok', 'Demo account switched');
    document.getElementById('float-menu').innerHTML = '';
    A.closeSidebar();
  },
  switchAccToCustomer: function () {
    const u = Store.currentUser();
    if (u && u.role === 'customer') { A.accountMenu(); return; }
    const c = Store.state().users.find(function (x) { return x.role === 'customer'; });
    if (c) A.switchTo(c.id); else A.accountMenu();
  },
  switchAccToWorker: function () {
    const u = Store.currentUser();
    if (u && u.role === 'worker') { A.accountMenu(); return; }
    const w = Store.state().users.find(function (x) { return x.role === 'worker' && !x.onboarding; });
    if (w) A.switchTo(w.id); else A.accountMenu();
  },
  logout: function () {
    Store.logout();
    A.closeMenu();
    UI.toast('You have been logged out.', 'ok', 'Signed out');
    go('/');
  },

  /* auth */
  login: function () {
    const em = document.getElementById('lg-email').value.trim();
    const pw = document.getElementById('lg-pass').value;
    const errEl = document.getElementById('lg-err');
    if (!em || !pw) { errEl.innerHTML = UI.errBanner('alert', 'Please enter both email and password.'); return; }
    const res = Store.login(em, pw);
    if (res.error) {
      errEl.innerHTML = UI.errBanner('alert', res.error);
      const inp = document.getElementById('lg-pass');
      inp.classList.add('err');
      setTimeout(function () { inp.classList.remove('err'); }, 2200);
      return;
    }
    UI.toast('Welcome back, ' + res.user.name + '!', 'ok', 'Login successful');
    go(res.user.role === 'worker' ? '/worker' : '/customer');
  },
  fillDemo: function (kind) {
    if (kind === 'cust') {
      document.getElementById('lg-email').value = 'sara@hunar.pk';
      document.getElementById('lg-pass').value = 'demo123';
    } else {
      document.getElementById('lg-email').value = 'ali@hunar.pk';
      document.getElementById('lg-pass').value = 'demo123';
    }
  },
  register: function () {
    const name = document.getElementById('rg-name').value.trim();
    const email = document.getElementById('rg-email').value.trim();
    const phone = document.getElementById('rg-phone').value.trim();
    const pw = document.getElementById('rg-pass').value;
    const role = document.querySelector('input[name="rg-role"]:checked');
    const errEl = document.getElementById('rg-err');
    if (!name) { errEl.innerHTML = UI.errBanner('alert', 'Please enter your full name.'); return; }
    if (!email || !email.includes('@')) { errEl.innerHTML = UI.errBanner('alert', 'Please enter a valid email address.'); return; }
    if (pw.length < 6) { errEl.innerHTML = UI.errBanner('alert', 'Password must be at least 6 characters.'); return; }
    if (!role) { errEl.innerHTML = UI.errBanner('alert', 'Please choose an account type — Customer or Worker.'); return; }
    const res = Store.register({ name: name, email: email, phone: phone, password: pw, role: role.value });
    if (res.error) { errEl.innerHTML = UI.errBanner('alert', res.error); return; }
    UI.toast('Account created. Welcome to HUNAR!', 'ok', 'Success');
    go(res.user.role === 'worker' ? '/worker/onboarding' : '/customer');
  },

  /* wizard */
  wiz: {
    start: function () {
      Store.setDraft({ step: 1, customerId: Store.currentUser().id, category: '', title: '', description: '', images: [], audio: null, location: null, coords: { x: 52, y: 58 }, area: '', prefDate: null, prefTime: null, flexible: false });
    },
    step: function (n) { const d = Store.draft(); if (!d) { this.start(); return; } d.step = n; R(); },
    next: function () {
      const d = Store.draft();
      const st = d.step;
      const err = function (msg) { UI.toast(msg, 'danger', 'Almost there'); };
      if (st === 1 && !d.category) { err('Please select a service category.'); return; }
      if (st === 2) {
        if (!d.title.trim()) { err('Please enter a problem title.'); return; }
      }
      if (st === 3) {
        if (!d.area) { err('Please select your location area.'); return; }
      }
      if (st === 4) {
        if (!d.prefDate) { err('Please pick a preferred visit date.'); return; }
        if (!d.prefTime && !d.flexible) { err('Please pick a preferred time or enable flexible timing.'); return; }
      }
      d.step = st + 1;
      R();
    },
    prev: function () { const d = Store.draft(); if (!d) return; d.step = Math.max(1, d.step - 1); R(); },
    pick: function (k, v) { const d = Store.draft(); if (!d) return; d[k] = v; R(); },
    set: function (k, v) { const d = Store.draft(); if (!d) return; d[k] = v; },
    pickService: function (name) { const d = Store.draft(); if (!d) return; d.category = name; d.step = 2; R(); },
    addImages: function (files) {
      const d = Store.draft();
      Array.from(files).slice(0, 6 - d.images.length).forEach(function (f) {
        const rd = new FileReader();
        rd.onload = function () { d.images.push(rd.result); R(); };
        rd.readAsDataURL(f);
      });
    },
    delImage: function (i) { const d = Store.draft(); d.images.splice(i, 1); R(); },
    rec: function () {
      if (recState && recState.active) { this.stopRec(); return; }
      const d = Store.draft();
      recState = { active: true, sec: 0, dataUrl: null };
      const timer = setInterval(function () { if (recState) { recState.sec++; const el = document.getElementById('recTimer'); if (el) el.textContent = '0:' + String(Math.min(99, recState.sec)).padStart(2, '0'); } }, 1000);
      recState.timer = timer;
      R();
      if (navigator.mediaDevices && window.MediaRecorder) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          if (!recState || !recState.active) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
          const mr = new MediaRecorder(stream);
          const chunks = [];
          mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          mr.onstop = function () {
            stream.getTracks().forEach(function (t) { t.stop(); });
            if (!recState) return;
            const bl = new Blob(chunks, { type: 'audio/webm' });
            if (bl.size > 0) { recState.dataUrl = URL.createObjectURL(bl); recState.real = true; } else { recState.dataUrl = wavUri(recState.sec || 1); }
          };
          mr.start();
          recState.mr = mr;
        }).catch(function () {
          UI.toast('Microphone unavailable — using simulated recording.', 'danger', 'Notice');
        });
      } else {
        UI.toast('Recording simulated — captured ' + 'voice description' + '.', 'ok', 'Recording');
      }
    },
    stopRec: function () {
      if (!recState) return;
      recState.active = false;
      clearInterval(recState.timer);
      const secs = Math.max(1, recState.sec);
      const d = Store.draft();
      if (recState.mr) {
        try { recState.mr.stop(); } catch (e) { }
        setTimeout(function () {
          const uri = recState && recState.dataUrl ? recState.dataUrl : wavUri(secs);
          d.audio = { uri: uri, duration: secs, label: 'Voice description' };
          recState = null;
          R();
        }, 350);
        return;
      }
      if (!recState.dataUrl) recState.dataUrl = wavUri(secs);
      d.audio = { uri: recState.dataUrl, duration: secs, label: 'Voice description' };
      recState = null;
      R();
    },
    delAudio: function () { const d = Store.draft(); d.audio = null; R(); },
    mapClick: function (e) {
      const d = Store.draft();
      if (!d) return;
      const rect = e.currentTarget.getBoundingClientRect();
      d.coords = { x: Math.round(((e.clientX - rect.left) / rect.width) * 100), y: Math.round(((e.clientY - rect.top) / rect.height) * 100) };
      R();
    },
    useLocation: function () {
      const d = Store.draft();
      UI.loader('Detecting your location…');
      setTimeout(function () {
        UI.clearLoader();
        if (Math.random() < 0.82) {
          const area = AREAS[Math.floor(Math.random() * (AREAS.length - 2))];
          d.area = area;
          d.coords = { x: 30 + Math.random() * 40, y: 40 + Math.random() * 30 };
          UI.toast('Location detected: ' + area + ', Karachi', 'ok', 'Location found');
          R();
        } else {
          UI.toast('Unable to access location. Please allow location permission or pick your area manually.', 'danger', 'Location error');
        }
      }, 1400);
    },
    submit: function () {
      const d = Store.draft();
      if (!d) return;
      const job = Store.postJob({
        customerId: d.customerId,
        category: d.category,
        title: d.title.trim(),
        description: d.description.trim(),
        images: d.images,
        audio: d.audio,
        location: { area: d.area, label: d.area },
        coords: d.coords,
        prefDate: d.prefDate,
        prefTime: d.flexible ? 'Flexible' : d.prefTime,
        flexible: d.flexible
      });
      Store.clearDraft();
      UI.toast('Your job was posted. Professionals are being notified.', 'ok', 'Job posted ' + job.id);
      UI.toast('Tip: switch to a worker account to see their side of the flow.', '', 'Demo tip');
      go('/customer/jobs/' + job.id);
    }
  },

  pickDate: function (iso) { A.wiz.pick('prefDate', iso); },
  pickTime: function (t) { A.wiz.pick('prefTime', t); A.wiz.set('flexible', false); },
  toggleFlex: function () { const d = Store.draft(); d.flexible = !d.flexible; R(); },

  audioPlay: function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.paused) { el.play(); } else { el.pause(); }
  },

  /* offers / negotiation */
  selectWorker: function (jobId, offerId) {
    const j = Store.jobById(jobId);
    const of = j ? j.offers.find(function (o) { return o.id === offerId; }) : null;
    const w = of ? Store.userById(of.workerId) : null;
    if (!w) return;
    UI.confirm({
      icon: 'users', title: 'Select ' + w.name + ' for this job?',
      body: 'You are selecting ' + w.name + ' to handle this job. Estimated offer: ' + fmtRs((of.amount || 0) + (of.estimate || 0)) + ' total — ' + fmtRs(of.amount) + ' visit & diagnosis + ' + fmtRs(of.estimate || 0) + ' estimated repair. The final price is only set after the on-site inspection.',
      okText: 'Confirm Selection', cancelText: 'Cancel',
      onOk: function () {
        const res = Store.selectWorker(jobId, offerId);
        if (res.error) { UI.toast(res.error, 'danger', 'Cannot select'); return; }
        UI.toast('Visit charge of ' + fmtRs(of.amount) + ' locked with ' + w.name + '.', 'ok', 'Worker selected');
        go('/customer/jobs/' + jobId);
      }
    });
  },
  cancelVisit: function (jobId, who) {
    UI.confirm({
      icon: 'x', danger: true, title: 'Cancel this visit?',
      body: 'Are you sure you want to cancel this visit? The appointment will be cancelled and the job history will be updated.',
      okText: 'Cancel Visit', cancelText: 'Keep Visit',
      onOk: function () {
        Store.cancelVisit(jobId, (who === 'worker' ? 'Worker cancelled the visit.' : 'Customer cancelled the visit.'));
        UI.toast('The visit has been cancelled.', 'ok', 'Visit cancelled');
        R();
      }
    });
  },

  approveRepairAmount: function (jobId) {
    const res = Store.customerApproveRepair(jobId);
    if (res.error) UI.toast(res.error, 'danger', 'Error');
    R();
  },
  approveRepairFinal: function (jobId) {
    const res = Store.customerApproveRepair(jobId);
    if (res.error) UI.toast(res.error, 'danger', 'Error');
    R();
  },
  rejectFinalQuote: function (jobId) {
    const j = Store.jobById(jobId);
    if (!j) return;
    UI.confirm({
      icon: 'alert', title: 'Reject final quote · end this job?',
      body: 'If you reject this final quote, no repair will be done and this job will be closed. You can always post a new job or choose another professional later.',
      okText: 'Yes, reject & end', cancelText: 'Keep job open', danger: true,
      onOk: function () {
        const res = Store.customerRejectRepair(jobId);
        if (res.error) { UI.toast(res.error, 'danger', 'Cannot reject'); return; }
        UI.toast('Final quote rejected. The job has been closed.', 'ok', 'Job ended');
        go('/customer/jobs/' + jobId);
      }
    });
  },
  openExtraModal: function (jobId) {
    UI.openModal(
      '<div class="modal-h"><h3>' + ic('toolbox', { s: 16 }) + ' Request Additional Work</h3><button data-close="1" class="icon-btn">' + ic('x', { s: 16 }) + '</button></div>' +
      '<div class="modal-b">' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:16px">Found something else to fix? Each extra work gets its own quote and your approval, so it never mixes with the original repair price.</p>' +
      '<div class="field"><label>What needs to be done? (e.g. Fix leaking bathroom tap)</label><input class="input" id="ext-title" placeholder="e.g. Fix leaking bathroom tap" /></div>' +
      '<div class="field"><label>Details (optional)</label><textarea class="textarea" id="ext-note" placeholder="Mention any extra info the professional should know."></textarea></div>' +
      '<button class="btn btn-primary btn-lg btn-block" onclick="A.requestExtra(\'' + jobId + '\')">' + ic('send', { s: 15 }) + ' Send Request</button>' +
      '</div>',
      { onMount: function () {
          const el = UI._modalEl;
          const close = el.querySelector('[data-close]');
          if (close) close.addEventListener('click', function () { UI.closeModal(); });
        }
      }
    );
  },
  requestExtra: function (jobId) {
    const title = document.getElementById('ext-title') ? document.getElementById('ext-title').value : '';
    const note = document.getElementById('ext-note') ? document.getElementById('ext-note').value : '';
    if (!title.trim()) { UI.toast('Tell us what work you want done.', 'danger', 'Missing title'); return; }
    const res = Store.requestExtra(jobId, title, note);
    if (res.error) { UI.toast(res.error, 'danger', 'Cannot request'); return; }
    UI.closeModal();
    UI.toast('Additional work requested. The professional will quote it separately.', 'ok', 'Request sent');
    R();
  },
  decideExtra: function (jobId, extraId, act) {
    const res = Store.decideExtra(jobId, extraId, act);
    if (res.error) { UI.toast(res.error, 'danger', 'Cannot respond'); return; }
    UI.toast(act === 'approve' ? 'Approved — added to your booking.' : 'Declined.', 'ok', act === 'approve' ? 'Approved' : 'Declined');
    R();
  },
  sendExtraQuote: function (jobId, extraId) {
    const inp = document.getElementById('exq-' + extraId);
    if (!inp) return;
    const val = parseInt(inp.value, 10);
    if (!val || val < 50) { UI.toast('Enter a valid quote (min Rs. 50).', 'danger', 'Invalid quote'); inp.classList.add('err'); setTimeout(function () { inp.classList.remove('err'); }, 2000); return; }
    const res = Store.quoteExtra(jobId, extraId, val);
    if (res.error) { UI.toast(res.error, 'danger', 'Cannot quote'); return; }
    UI.toast('Quote of ' + fmtRs(val) + ' sent for approval.', 'ok', 'Quote sent');
    R();
  },

  wTransition: function (jobId, to) {
    Store.workerTransition(jobId, to);
    UI.toast('Status updated.', 'ok', 'Update');
    R();
  },
  submitInspection: function (jobId) {
    const result = document.getElementById('ins-result').value.trim();
    const required = document.getElementById('ins-required').value.trim();
    const est = document.getElementById('ins-est').value;
    const res = Store.submitInspection(jobId, { result: result, required: required, estimate: est });
    if (res.error) { UI.toast(res.error, 'danger', 'Inspection incomplete'); return; }
    UI.toast('Final quote submitted. Your customer can now review, negotiate, or reject it.', 'ok', 'Quote sent');
    R();
  },
  startRepair: function (jobId) {
    Store.workerStartRepair(jobId);
    R();
  },
  completeRepair: function (jobId) {
    A.comp.open(jobId);
  },
  comp: {
    open: function (jobId) {
      compDraft = { jobId: jobId, note: '', images: [], audio: null };
      this.render();
    },
    render: function () {
      if (!compDraft) return;
      const d = compDraft;
      const imgGrid = d.images.length ? '<div class="grid-3" style="margin-top:12px">' + d.images.map(function (im, i) {
        return '<div class="img-thumb"><img src="' + im + '" /><button class="img-del" onclick="A.comp.delImage(' + i + ')">' + ic('trash', { s: 13 }) + '</button></div>';
      }).join('') + '</div>' : '';
      const recRow = recState && recState.active
        ? '<div style="display:flex;align-items:center;gap:10px;margin-top:10px;background:var(--danger-bg);border:1px solid rgba(220,38,38,.25);border-radius:12px;padding:10px 12px"><span style="width:9px;height:9px;border-radius:50%;background:var(--danger);animation:pulse 1.2s infinite;flex:none"></span><b style="font-size:13px">Recording voice note…</b><span id="recTimer" style="font-weight:800;font-family:monospace">0:00</span><button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="A.comp.stopRec()">' + ic('stop', { s: 13 }) + ' Stop</button></div>'
        : '';
      UI.openModal(
        '<div class="modal-h"><h3>' + ic('camera', { s: 16 }) + ' Complete Job · Proof &amp; Summary</h3><button data-close="1" class="icon-btn">' + ic('x', { s: 16 }) + '</button></div>' +
        '<div class="modal-b">' +
        '<p style="color:var(--muted);font-size:13.5px;margin-bottom:16px">Marking the job complete requires proof of the finished work. Add photos of the repair and, if you like, a short voice note the customer can hear.</p>' +
        '<div class="field"><label>What was done?</label><input class="input" id="comp-note" placeholder="e.g. Fixed the compressor — AC is cooling normally now" value="' + UI.esc(d.note) + '" oninput="A.comp.note(this.value)" /></div>' +
        '<div class="field"><label>Proof photos</label>' +
        '<label class="upload-zone" style="display:block"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">' + ic('camera', { s: 26 }) + '<b>Add photos</b><span style="font-size:12.5px">Capture or upload photos of the completed repair (JPG, PNG)</span></div>' +
        '<input type="file" accept="image/*" multiple style="display:none" onchange="A.comp.addImages(this.files)" /></label>' + imgGrid + '</div>' +
        '<div class="field"><label>Voice note (optional)</label>' +
        (d.audio ? compPreviewHtml(d.audio) : '<div class="drop-pill" onclick="A.comp.rec()">' + ic('mic', { s: 15 }) + ' Record Voice Summary</div>') + recRow + '</div>' +
        '<button class="btn btn-primary btn-lg btn-block" style="margin-top:6px" onclick="A.comp.submit()">' + ic('checkC', { s: 16 }) + ' Mark Complete &amp; Send Proof</button>' +
        '</div>',
        { onMount: function () {
            const el = UI._modalEl;
            const close = el.querySelector('[data-close]');
            if (close) close.addEventListener('click', function () { A.comp.cancel(); });
          }
        }
      );
    },
    note: function (v) { if (compDraft) compDraft.note = v; },
    addImages: function (files) {
      if (!compDraft) return;
      Array.from(files).slice(0, 6 - compDraft.images.length).forEach(function (f) {
        const rd = new FileReader();
        rd.onload = function () { if (compDraft) { compDraft.images.push(rd.result); A.comp.render(); } };
        rd.readAsDataURL(f);
      });
    },
    delImage: function (i) { if (compDraft) { compDraft.images.splice(i, 1); this.render(); } },
    rec: function () {
      if (!compDraft) return;
      if (recState && recState.active) { this.stopRec(); return; }
      recState = { active: true, sec: 0, dataUrl: null };
      const timer = setInterval(function () { if (recState) { recState.sec++; const el = document.getElementById('recTimer'); if (el) el.textContent = '0:' + String(Math.min(99, recState.sec)).padStart(2, '0'); } }, 1000);
      recState.timer = timer;
      this.render();
      if (navigator.mediaDevices && window.MediaRecorder) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          if (!recState || !recState.active) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
          const mr = new MediaRecorder(stream);
          const chunks = [];
          mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          mr.onstop = function () {
            stream.getTracks().forEach(function (t) { t.stop(); });
            if (!recState) return;
            const bl = new Blob(chunks, { type: 'audio/webm' });
            recState.dataUrl = bl.size > 0 ? URL.createObjectURL(bl) : wavUri(recState.sec || 1);
          };
          mr.start();
          recState.mr = mr;
        }).catch(function () {
          UI.toast('Microphone unavailable — using simulated recording.', 'danger', 'Notice');
        });
      } else {
        UI.toast('Recording simulated — voice summary will be generated.', 'ok', 'Recording');
      }
    },
    stopRec: function () {
      if (!recState) return;
      if (recState.active) {
        recState.active = false;
        clearInterval(recState.timer);
        const secs = Math.max(1, recState.sec);
        if (recState.mr) {
          try { recState.mr.stop(); } catch (e) { }
          setTimeout(function () {
            const uri = recState && recState.dataUrl ? recState.dataUrl : wavUri(secs);
            if (compDraft) compDraft.audio = { uri: uri, duration: secs, label: 'Voice summary' };
            recState = null;
            A.comp.render();
          }, 350);
          return;
        }
        if (!recState.dataUrl) recState.dataUrl = wavUri(secs);
        if (compDraft) compDraft.audio = { uri: recState.dataUrl, duration: secs, label: 'Voice summary' };
        recState = null;
        this.render();
      }
    },
    delAudio: function () { if (compDraft) { compDraft.audio = null; this.render(); } },
    submit: function () {
      if (!compDraft) return;
      if (!compDraft.note.trim() && !compDraft.images.length && !compDraft.audio) {
        UI.toast('Add a short summary or photo proof so the customer can see the work is done.', 'danger', 'Proof required');
        return;
      }
      const res = Store.workerCompleteRepair(compDraft.jobId, { note: compDraft.note, images: compDraft.images, audio: compDraft.audio });
      if (res.error) { UI.toast(res.error, 'danger', 'Cannot complete'); return; }
      compDraft = null;
      UI.closeModal();
      UI.toast('Job completed with proof. The customer has been notified.', 'ok', 'Job completed');
      go('/worker/active/' + res.job.id);
    },
    cancel: function () {
      if (recState) {
        if (recState.active) { recState.active = false; clearInterval(recState.timer); }
        if (recState.mr) { try { recState.mr.stop(); } catch (e) { } }
        recState = null;
      }
      compDraft = null;
      UI.closeModal();
    }
  },
  workerSendOffer: function (jobId) {
    const inp = document.getElementById('of-amount');
    const estInp = document.getElementById('of-estimate');
    const val = parseInt(inp.value, 10);
    const est = parseInt(estInp.value, 10);
    const j = Store.jobById(jobId);
    const u = Store.currentUser();
    if (!j) return;
    if (!val || val < 50) { UI.toast('Please enter a valid visit charge (min Rs. 50).', 'danger', 'Invalid amount'); inp.classList.add('err'); setTimeout(function () { inp.classList.remove('err'); }, 2000); return; }
    if (!est || est < 50) { UI.toast('Please enter your estimated repair price (min Rs. 50).', 'danger', 'Invalid estimate'); estInp.classList.add('err'); setTimeout(function () { estInp.classList.remove('err'); }, 2000); return; }
    if (j.selectedOffer && j.selectedOffer.workerId !== u.id) { UI.toast('Another worker was already selected for this job.', 'danger', 'Job taken'); go('/worker/jobs'); return; }
    if (j.offers.some(function (o) { return o.workerId === u.id; })) { UI.toast('You already sent an offer for this job.', 'danger', 'Duplicate offer'); go('/worker/offers/' + jobId); return; }
    if (['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress', 'completed', 'paid', 'reviewed', 'cancelled'].indexOf(j.status) !== -1) { UI.toast('This job is no longer accepting offers.', 'danger', 'Closed'); go('/worker/jobs'); return; }
    j.offers.push({ id: uid('of'), workerId: u.id, amount: val, estimate: est, at: Date.now(), status: 'sent' });
    j.status = 'offers_received';
    Store.notify(j.customerId, 'chat', u.name + ' sent you an offer', 'Visit charge ' + fmtRs(val) + ' · repair estimate ' + fmtRs(est) + ' for your ' + j.category + ' job.', '/customer/jobs/' + j.id);
    Store.emit();
    UI.toast('Offer sent. The customer has been notified.', 'ok', 'Offer sent');
    go('/worker/offers/' + jobId);
  },

  /* payment & review */
  payMethod: function (m) {
    const el = document.getElementById('pay-method');
    if (el) el.value = m;
    document.querySelectorAll('.pay-opt').forEach(function (x) { x.classList.toggle('on', x.dataset.m === m); });
  },
  pay: function (jobId) {
    const method = (document.getElementById('pay-method') || {}).value || 'wallet';
    const amount = Store.jobTotal(jobId);
    UI.loader('Processing payment of ' + fmtRs(amount) + '…');
    setTimeout(function () {
      UI.clearLoader();
      const res = Store.customerPay(jobId, method);
      UI.toast('Payment of ' + fmtRs(amount) + ' completed successfully.', 'ok', 'Payment successful');
      R();
    }, 2100);
  },
  setStars: function (n) {
    document.querySelectorAll('.stars-input .st').forEach(function (x) {
      const v = parseInt(x.dataset.v, 10);
      x.classList.toggle('on', v <= n);
      x.innerHTML = v <= n ? starFilled(34) : starEmpty(34);
    });
  },
  submitReview: function (jobId) {
    const ons = document.querySelectorAll('.stars-input .st.on');
    const rating = ons.length ? parseInt(ons[ons.length - 1].dataset.v, 10) : 0;
    const comment = document.getElementById('rv-text') ? document.getElementById('rv-text').value.trim() : '';
    if (!rating) { UI.toast('Please select a star rating.', 'danger', 'Review needed'); return; }
    const res = Store.submitReview(jobId, rating, comment);
    if (res.error) { UI.toast(res.error, 'danger', 'Error'); return; }
    UI.toast('Thank you! Your review has been posted to the worker profile.', 'ok', 'Review submitted');
    go('/customer/jobs/' + jobId + '/review');
  },

  notifGo: function (id) {
    const u = Store.currentUser();
    const arr = Store.state().notifications[u.id] || [];
    const n = arr.find(function (x) { return x.id === id; });
    Store.markRead(u.id, id);
    if (n && n.route) go(n.route);
  },
  markAllNotifs: function () {
    const u = Store.currentUser();
    Store.markAllRead(u.id);
    R();
  },

  showWorker: function (id) {
    workerProfileModal(id);
  }
};

function openWorker(ev) {
  const t = ev.target.closest('[data-open-worker]');
  if (t) { ev.preventDefault(); workerProfileModal(t.getAttribute('data-open-worker')); }
}

document.addEventListener('click', function (ev) {
  const t = ev.target.closest('[data-open-worker]');
  if (t) { ev.preventDefault(); ev.stopPropagation(); workerProfileModal(t.getAttribute('data-open-worker')); }
});

function workerProfileModal(wid) {
  const wid2 = wid;
  const w = Store.userById(wid2);
  if (!w) return;
  const can = Store.currentUser();
  const rv = Store.reviewsFor(w.id);
  const skills = (w.skills || []).map(function (s) {
    const sv = svcByName(s);
    return '<span class="tag-inline">' + ic(sv ? sv.icon : 'wrench', { s: 13 }) + ' ' + UI.esc(s) + '</span>';
  }).join(' ');
  const port = (w.portfolio || []).slice(0, 3).map(function (p) {
    return '<div class="portfolio-chip" style="background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:600">' + ic('image', { s: 15, style: 'vertical-align:-3px;margin-right:6px;color:var(--brand)' }) + UI.esc(p) + '</div>';
  }).join(' ');
  const revHtml = rv.slice(0, 5).map(function (r) {
    return '<div style="border-bottom:1px solid var(--line);padding:12px 0">' +
      '<div style="display:flex;align-items:center;gap:8px">' + UI.avatar({ name: r.customerName, color: avatarColor(r.customerName), verified: false }) +
      '<div><div style="font-size:13px;font-weight:700">' + UI.esc(r.customerName || 'Customer') + '</div><div class="rating">' + UI.stars(r.rating, 13) + ' <span class="rcnt">· ' + timeAgo(r.at) + '</span></div></div></div>' +
      '<p style="font-size:13px;color:var(--ink-2);margin-top:6px">' + UI.esc(r.text || '') + '</p></div>';
  }).join('') || '<p style="color:var(--faint);font-size:13px">Reviews will appear after completing jobs.</p>';

  const offersRow = can && can.role === 'customer'
    ? '<button class="btn btn-primary btn-block" onclick="go(\'/customer/post\')">' + ic('plus', { s: 15 }) + ' Hire ' + UI.esc(w.name.split(' ')[0]) + '</button>'
    : (can && can.role === 'worker' && can.id === w.id ? '<a class="btn btn-outline btn-block" href="#/worker/profile">Edit my profile</a>' : '');

  UI.openModal(
    '<div class="modal-h"><h3>Worker Profile</h3><button data-close="1" class="icon-btn">' + ic('x') + '</button></div>' +
    '<div class="modal-b">' +
    '<div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">' + UI.avatar(w, 'xl') +
    '<div style="min-width:0"><div style="font-size:19px;font-weight:800">' + UI.esc(w.name) + (w.verified ? ' ' + ic('shield', { s: 16, style: 'color:var(--brand);vertical-align:-2px' }) : '') + '</div>' +
    '<div style="color:var(--muted);font-size:13.5px">' + UI.esc(w.tagline || 'Professional') + '</div>' +
    '<div style="margin-top:6px">' + UI.rating(w.rating, w.ratingCount) + '</div></div>' +
    (w.available !== false ? '<span class="badge b-ok">' + ic('check', { s: 12 }) + ' Available now' + '</span>' : '<span class="badge b-muted">Busy</span>') + '</div>' +
    '<div class="kv"><span class="k">Experience</span><span class="v">' + (w.years || 0) + ' years</span></div>' +
    '<div class="kv"><span class="k">Completed jobs</span><span class="v">' + (w.jobsDone || 0) + '</span></div>' +
    '<div class="kv"><span class="k">Avg response</span><span class="v">' + UI.esc(w.responses || '~20 min') + '</span></div>' +
    '<div class="kv"><span class="k">Service area</span><span class="v">' + UI.esc((w.area || '') + ' · within ' + (w.radius || 10) + ' km') + '</span></div>' +
    '<div class="kv"><span class="k">Visit charge</span><span class="v" style="color:var(--brand)">' + fmtRs(w.visitCharge) + '</span></div>' +
    '<div style="margin:16px 0"><div style="font-weight:750;font-size:14px;margin-bottom:8px">Skills</div><div class="split">' + (skills || '<span class="badge b-muted">No skills added yet</span>') + '</div></div>' +
    (w.bio ? '<div style="margin:14px 0"><div style="font-weight:750;font-size:14px;margin-bottom:6px">About</div><p style="color:var(--ink-2);font-size:13.5px">' + UI.esc(w.bio) + '</p></div>' : '') +
    (port ? '<div style="margin:14px 0"><div style="font-weight:750;font-size:14px;margin-bottom:8px">Portfolio</div><div style="display:grid;gap:8px">' + port + '</div></div>' : '') +
    '<div style="margin-top:14px"><div style="font-weight:750;font-size:14px;margin-bottom:6px">Reviews (' + rv.length + ')</div>' + revHtml + '</div>' +
    (offersRow ? '<div style="margin-top:16px">' + offersRow + '</div>' : '') +
    '</div>',
    { lg: true, onMount: function () {
        const el = UI._modalEl;
        const close = el.querySelector('[data-close]');
        close.addEventListener('click', function () { el.remove(); });
      } }
  );
}

/* ============================= PUBLIC VIEWS ============================= */

const Views = {};

Views.landing = function () {
  const svcCards = SERVICES.map(function (s) {
    return '<button class="svc-card" onclick="go(\'/workers?skill=' + encodeURIComponent(s.name) + '\')"><span class="svc-icon" style="background:' + s.bg + ';color:' + s.css + '">' + ic(s.icon, { s: 22 }) + '</span><span><h4>' + s.name + '</h4><p>' + s.desc + '</p><div class="svc-count">' + s.count + ' professionals nearby</div></span></button>';
  }).join('');

  const steps = [
    ['Post your problem', 'Tell us what needs fixing with photos, voice and your location.'], ['Receive offers', 'Nearby professionals send you visit charges. Compare profiles & reviews.'],
    ['Pick your worker', 'Choose the best offer — the visit charge is locked the moment you select.'], ['Get it fixed & pay', 'Track the visit, approve the repair, pay securely and review.']
  ].map(function (s, i) {
    return '<div class="step"><div class="step-num">' + (i + 1) + '</div><h4>' + s[0] + '</h4><p>' + s[1] + '</p></div>';
  }).join('');

  const demoW = Store.state().users.filter(function (u) { return u.role === 'worker' && !u.onboarding; }).slice(0, 3);

  const html =
    '<section class="hero"><div class="content">' +
    '<div><span class="hero-eyebrow">' + ic('shield', { s: 15 }) + ' Verified & rated professionals in your area</span>' +
    '<h1>Fix your home with <span class="hl">hunar</span> — not guesswork.</h1>' +
    '<p class="lead">Post a problem, get offers from nearby skilled workers, negotiate the price, and approve every rupee before work starts.</p>' +
    '<div class="search-bar">' + ic('search') + '<select id="hero-cat"><option value="">Choose a service…</option>' + SERVICES.map(function (s) { return '<option value="' + UI.esc(s.name) + '">' + s.name + '</option>'; }).join('') + '</select>' +
    '<button class="btn btn-primary" onclick="A.heroSearch()">' + ic('arrowR', { s: 16 }) + ' Find a Professional</button></div>' +
    '<div class="hero-cta">' +
    '<a class="btn btn-primary btn-lg" href="#/register">Get Started Free</a>' +
    '<a class="btn btn-outline btn-lg" href="#/register">Become a Worker</a></div>' +
    '<div class="hero-stats"><div><div class="num">1,200+</div><div class="lbl">Verified workers</div></div><div><div class="num">48,000+</div><div class="lbl">Jobs completed</div></div><div><div class="num">4.8</div><div class="lbl">Avg rating</div></div></div>' +
    '</div>' +
    '<div class="hero-media"><div class="hero-phones">' +
    '<div class="phone-card"><div class="pc-top">' + UI.avatar({ name: 'Sara', color: '#7c3aed', verified: false }) + '<div><div style="font-weight:700">Your AC repair</div><div style="color:var(--muted)">Receiving offers</div></div>' + '<span class="badge b-amber" style="margin-left:auto">' + ic('clock', { s: 12 }) + ' 3 offers</span></div>' +
    '<div class="pc-job">' + ic('snow', { s: 18, style: 'color:#0e7a6e' }) + '<div style="font-size:12.5px"><b>AC running but not cooling</b><br><span style="color:var(--muted)">Gulshan-e-Iqbal · Today 4:00 PM</span></div></div>' +
    '<div style="display:flex;gap:8px"><div class="prog" style="flex:1"><i style="width:64%"></i></div><span style="font-size:11px;color:var(--muted)">Inspection</span></div></div>' +
    '<div class="phone-card"><div class="pc-top">' + UI.avatar({ name: 'Ali', color: '#0e7a6e', verified: true }) + '<div><div style="font-weight:700">Ali Khan</div><div style="color:var(--muted)">AC Technician</div></div><div class="rating" style="margin-left:auto">' + UI.stars(4.9, 13) + '</div></div>' +
    '<div style="display:flex;gap:10px;align-items:center"><div class="voice-chip" style="margin:0">' + ic('mic', { s: 12 }) + ' Voice note</div><span class="badge b-ok">' + ic('check', { s: 11 }) + ' Approved</span></div><div class="kv" style="border-bottom:none;padding:6px 0 0"><span class="k">Visit charge</span><span class="v">Rs. 300</span></div></div>' +
    '</div>' +
    '<div class="float-chip fc-1"><span class="dot"></span> Ali accepted<br>your job · Rs. 300</div>' +
    '<div class="float-chip fc-2">' + ic('wallet', { s: 16, style: 'color:var(--ok)' }) + ' Payment received Rs. 935</div>' +
    '</div></div></section>';

  const mid =
    '<section class="section"><div class="content">' +
    '<div class="sec-head"><div><div class="section-title">Popular services</div><div class="section-sub">Whatever is broken — there is a verified professional nearby.</div></div><a class="btn btn-outline btn-sm" href="#/services">View all services</a></div>' +
    '<div class="svc-grid">' + svcCards + '</div></div></section>' +
    '<section class="section" style="background:var(--bg)"><div class="content">' +
    '<div class="sec-head"><div><div class="section-title">How HUNAR works</div><div class="section-sub">A transparent fix, from problem to payment.</div></div></div>' +
    '<div class="steps">' + steps + '</div></div></section>' +
    '<section class="section"><div class="content">' +
    '<div class="sec-head"><div><div class="section-title">Meet top-rated workers</div><div class="section-sub">Verified skills, real reviews, upfront visit charges.</div></div><a class="btn btn-outline btn-sm" href="#/workers">Browse all</a></div>' +
    '<div class="dir-grid">' + demoW.map(function (w) { return UI.workerCard(w); }).join('') + '</div></div></section>' +
    '<section class="section" style="background:linear-gradient(135deg,#0f1f26,#16333d);color:#fff"><div class="content" style="display:flex;gap:30px;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
    '<div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">Need it fixed today?</div><p style="color:#a7bdc7;margin-top:6px">Post a job in 2 minutes and nearby workers will send you offers.</p></div>' +
    '<a class="btn btn-primary btn-lg" href="#/register" style="background:#fff;color:#0f1f26">Post Your Problem</a></div></section>';

  return { html: html + mid, mount: function () {
      document.getElementById('hero-cat').addEventListener('change', function () { });
    } };
};

A.heroSearch = function () {
  const sel = document.getElementById('hero-cat');
  const v = sel ? sel.value : '';
  go('/workers' + (v ? '?skill=' + encodeURIComponent(v) : ''));
};

Views.services = function () {
  const grid = SERVICES.map(function (s) {
    const skill = s.name;
    const count = Store.state().users.filter(function (u) { return u.role === 'worker' && (u.skills || []).indexOf(skill) !== -1; }).length;
    return '<div class="svc-card" onclick="go(\'/workers?skill=' + encodeURIComponent(s.name) + '\')" style="flex-direction:column;align-items:flex-start"><span class="svc-icon" style="background:' + s.bg + ';color:' + s.css + '">' + ic(s.icon, { s: 24 }) + '</span><h4>' + s.name + '</h4><p>' + s.desc + '</p><div class="svc-count">' + (count || s.count) + ' workers available</div></div>';
  }).join('');
  const html = '<section class="section"><div class="content">' +
    '<div class="section-title">All services</div><div class="section-sub">Three-step transparency: an upfront visit charge, a negotiated repair price, and approval before work begins.</div>' +
    '<div class="svc-grid">' + grid + '</div>' +
    '<div class="notice brand" style="margin-top:26px">' + ic('info') + '<span>Can’t find your service? <a href="#/register" style="text-decoration:underline">Post it anyway</a> and professionals will still respond to you.</span></div>' +
    '</div></section>';
  return { html: html };
};

Views.workers = function (params) {
  const qs = parseHash().qs;
  const kw = qs.skill || '';
  const workers = Store.state().users.filter(function (u) { return u.role === 'worker' && !u.onboarding && u.name !== 'Your Profile'; });
  const cats = SKILL_ALL;
  const html =
    '<div class="card card-pad" style="margin-bottom:18px">' +
    '<div class="split" style="align-items:end;gap:14px">' +
    '<div class="field" style="margin:0;min-width:220px"><label>Skill / Service</label><select id="flt-skill" class="select"><option value="">All skills</option>' + cats.map(function (c) { return '<option value="' + UI.esc(c) + '"' + (kw === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" style="margin:0;min-width:160px"><label>Min. rating</label><select id="flt-rate" class="select"><option value="">Any</option><option value="4.5">4.5+</option><option value="4.7">4.7+</option><option value="4.9">4.9+</option></select></div>' +
    '<div class="field" style="margin:0;flex:1"><label>Search</label><input id="flt-q" class="input" placeholder="Search workers…" value="' + UI.esc(kw) + '" /></div>' +
    '<button class="btn btn-primary" onclick="A.fltWorkers()">' + ic('search', { s: 15 }) + ' Apply filters</button>' +
    '</div></div>' +
    '<div class="section-sub" style="margin-bottom:16px" id="wrk-count"></div>' +
    '<div class="dir-grid" id="wrk-grid">' + workers.map(function (w) { return UI.workerCard(w); }).join('') + '</div>';
  return { html: html, mount: function () { applyWorkerFilter(workers); } };
};

function applyWorkerFilter(all) {
  const skill = document.getElementById('flt-skill').value;
  const rate = parseFloat(document.getElementById('flt-rate').value || '0');
  const q = (document.getElementById('flt-q').value || '').toLowerCase().trim();
  const list = all.filter(function (w) {
    if (skill && (w.skills || []).indexOf(skill) === -1) return false;
    if (rate && (w.rating || 0) < rate) return false;
    if (q && (w.name + ' ' + (w.tagline || '') + ' ' + (w.bio || '')).toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  document.getElementById('wrk-count').textContent = list.length + ' worker' + (list.length === 1 ? '' : 's') + ' found';
  const grid = document.getElementById('wrk-grid');
  grid.innerHTML = list.length ? list.map(function (w) { return UI.workerCard(w); }).join('') : UI.empty('search', 'No workers found', 'Try changing your filters or search term.');
}
A.fltWorkers = function () {
  applyWorkerFilter(Store.state().users.filter(function (u) { return u.role === 'worker' && !u.onboarding && u.name !== 'Your Profile'; }));
};

Views.workerPublic = function (params) {
  const w = Store.userById(params.id);
  if (!w || w.role !== 'worker') {
    return { html: UI.empty('alert', 'Worker not found', 'This profile may no longer be available.') + '<a class="btn btn-primary btn-block" style="max-width:220px;margin:0 auto" href="#/workers">Browse workers</a>' };
  }
  return { html: '' , mount: function () {
      workerProfileModal(params.id);
      setTimeout(function () {
        if (!document.querySelector('.modal')) go('/workers');
      }, 250);
    }};
};

Views.login = function () {
  const html = '<section class="section"><div class="content">' +
    '<div class="card" style="max-width:440px;margin:0 auto">' +
    '<div class="card-pad">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><span class="brand-mark" style="width:46px;height:46px;border-radius:13px">' + ic('wrench', { s: 22 }) + '</span><div><div style="font-size:20px;font-weight:800">Welcome back</div><div style="color:var(--muted);font-size:13px">Log in to your HUNAR account</div></div></div>' +
    '<div id="lg-err"></div>' +
    '<div class="field"><label>Email</label><input id="lg-email" class="input" type="email" placeholder="you@example.com" /></div>' +
    '<div class="field"><label>Password</label><input id="lg-pass" class="input" type="password" placeholder="••••••••" /></div>' +
    '<button class="btn btn-primary btn-block btn-lg" onclick="A.login()">Login</button>' +
    '<div class="divide"></div>' +
    '<div style="font-size:12.5px;color:var(--muted);font-weight:600;margin-bottom:8px">Demo accounts (click to fill)</div>' +
    '<div class="split">' +
    '<button class="btn btn-outline btn-sm" onclick="A.fillDemo(\'cust\')">' + ic('user', { s: 14 }) + ' Demo Customer</button>' +
    '<button class="btn btn-outline btn-sm" onclick="A.fillDemo(\'worker\')">' + ic('users', { s: 14 }) + ' Demo Worker</button></div>' +
    '<p style="font-size:13px;color:var(--muted);margin-top:16px;text-align:center">New to HUNAR? <a href="#/register">Create an account</a></p>' +
    '</div></div></div></section>';
  return { html: html, mount: function () {
      const pw = document.getElementById('lg-pass');
      pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') A.login(); });
    } };
};

function roleCard(r, icon, title, desc, on) {
  return '<label class="' + (on ? 'on' : '') + '" style="display:flex;gap:14px;align-items:center;border:2px solid ' + (on ? 'var(--brand)' : 'var(--line-2)') + ';border-radius:16px;padding:16px;cursor:pointer;background:' + (on ? 'var(--brand-3)' : '#fff') + ';transition:.14s">' +
    '<input type="radio" name="rg-role" value="' + r + '" ' + (on ? 'checked' : '') + ' style="display:none">' +
    '<span style="width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:' + (on ? 'var(--brand)' : '#eef1f4') + ';color:' + (on ? '#fff' : 'var(--muted)') + '">' + ic(icon, { s: 22 }) + '</span>' +
    '<span><b style="font-size:15px">' + title + '</b><br><span style="font-size:12.5px;color:var(--muted)">' + desc + '</span></span></label>';
}

Views.register = function () {
  const html = '<section class="section"><div class="content">' +
    '<div class="card" style="max-width:520px;margin:0 auto">' +
    '<div class="card-pad">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><span class="brand-mark" style="width:46px;height:46px;border-radius:13px">' + ic('wrench', { s: 22 }) + '</span><div><div style="font-size:20px;font-weight:800">Create your account</div><div style="color:var(--muted);font-size:13px">Join 1,200+ professionals and thousands of customers</div></div></div>' +
    '<div id="rg-err"></div>' +
    '<div style="font-size:13px;font-weight:650;color:var(--ink-2);margin-bottom:8px">I want to join as</div>' +
    '<div class="role-grid">' +
    roleCard('customer', 'user', 'Customer', 'I need a service done', false) +
    roleCard('worker', 'briefcase', 'Worker', 'I provide services', true) + '</div>' +
    '<div class="f-row">' +
    '<div class="field"><label>Full name</label><input id="rg-name" class="input" placeholder="Your name" /></div>' +
    '<div class="field"><label>Phone</label><input id="rg-phone" class="input" placeholder="+92 300 0000000" /></div></div>' +
    '<div class="field"><label>Email</label><input id="rg-email" class="input" type="email" placeholder="you@example.com" /></div>' +
    '<div class="field"><label>Password <span class="smallnote">(min 6 characters)</span></label><input id="rg-pass" class="input" type="password" placeholder="••••••••" /></div>' +
    '<button class="btn btn-primary btn-block btn-lg" onclick="A.register()">Create Account</button>' +
    '<p style="font-size:13px;color:var(--muted);margin-top:16px;text-align:center">Already have an account? <a href="#/login">Login</a></p>' +
    '</div></div></div></section>';
  return { html: html };
};

Views.wrongRole = function (params) {
  const want = params.want;
  const u = Store.currentUser();
  const other = Store.state().users.find(function (x) { return (want === 'customer' ? x.role === 'customer' : x.role === 'worker') && x.id !== u.id; });
  const title = want === 'customer' ? 'This is the customer area' : 'This is the worker area';
  const html = '<div class="card" style="max-width:480px;margin:40px auto;padding:34px;text-align:center">' +
    '<div class="e-ic" style="margin:0 auto 18px">' + ic('users', { s: 30 }) + '</div>' +
    '<h3 style="font-size:18px;font-weight:800;margin-bottom:8px">' + title + '</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:20px">You are logged in as <b>' + UI.esc(u.name) + '</b> (' + (u.role === 'customer' ? 'Customer' : 'Worker') + '). The ' + (want === 'customer' ? 'customer' : 'worker') + ' experience is behind a different account — switch below to keep the demo connected.</p>' +
    (other ? '<button class="btn btn-primary btn-block" onclick="A.switchTo(\'' + other.id + '\')">Switch to ' + UI.esc(other.name.split(' ')[0]) + ' (' + (other.role === 'customer' ? 'Customer' : 'Worker') + ')</button>' : '') +
    '<a class="btn btn-ghost btn-block" style="margin-top:8px" href="#/register">Or create a new account</a></div>';
  return { html: html };
};

/* ============================= CUSTOMER VIEWS ============================= */

Views.customerDashboard = function () {
  const u = Store.currentUser();
  const active = Store.activeJobs('customer');
  const visits = Store.upcomingVisits('customer');
  const pend = Store.pendingOffersCount();
  const spent = Store.totalSpent();
  const recent = Store.historyJobs('customer').slice(0, 3);

  const statRow =
    '<div class="stats">' +
    '<div class="stat"><span class="si si-t">' + ic('briefcase', { s: 22 }) + '</span><div><div class="sv">' + active.length + '</div><div class="sl">Active jobs</div></div></div>' +
    '<div class="stat"><span class="si si-a">' + ic('chat', { s: 22 }) + '</span><div><div class="sv">' + pend + '</div><div class="sl">Pending offers</div></div></div>' +
    '<div class="stat"><span class="si si-o">' + ic('calendar', { s: 22 }) + '</span><div><div class="sv">' + visits.length + '</div><div class="sl">Upcoming visits</div></div></div>' +
    '<div class="stat"><span class="si si-g">' + ic('wallet', { s: 22 }) + '</span><div><div class="sv">Rs. ' + spent.toLocaleString('en-PK') + '</div><div class="sl">Total spent</div></div></div></div>';

  const activeHtml = active.length ? active.map(function (j) {
    const w = j.workerId ? Store.userById(j.workerId) : null;
    return '<div class="job-card" onclick="go(\'/customer/jobs/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top">' + ic(svcByName(j.category).icon, { s: 18, style: 'color:' + svcByName(j.category).css }) + '<b style="font-size:15px;flex:1">' + UI.esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      '<div class="jc-desc" style="margin-top:8px">' + UI.esc(j.description || '') + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center"><span class="smallnote">' + j.id + ' · ' + timeAgo(j.createdAt) + '</span>' +
      (w ? '<span style="margin-left:auto;display:inline-flex;gap:6px;align-items:center"><span class="smallnote">Worker:</span>' + UI.avatar(w, '', {}) + '<span style="font-weight:700;font-size:13px">' + UI.esc(w.name) + '</span></span>' : '') + '</div></div></div>';
  }).join('') : UI.empty('briefcase', 'No active jobs yet', 'Post your first job and nearby professionals will send you offers within minutes.', '<a class="btn btn-primary" href="#/customer/post">' + ic('plus', { s: 16 }) + ' Post Your First Job</a>');

  const visitsHtml = visits.length ? visits.map(function (v) {
    const w = Store.userById(v.workerId);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/customer/jobs/' + v.id + '\')"><div class="jc-body">' +
      '<div style="display:flex;gap:12px;align-items:center">' + (w ? UI.avatar(w) : UI.avatar({ name: '?', color: '#64748b', verified: false })) +
      '<div style="min-width:0;flex:1"><b style="font-size:14.5px">' + UI.esc(v.title) + '</b><div class="smallnote">' + (w ? w.name : '') + ' · ' + (v.prefDate || '') + ' · ' + (v.prefTime || '') + '</div></div>' +
      UI.statusBadge(v.status) + '</div>' +
      (v.visitCharge ? '<div class="total-bar" style="margin-top:12px"><span>Visit charge</span><span class="v">' + fmtRs(v.visitCharge) + '</span></div>' : '') +
      '</div></div>';
  }).join('') : UI.empty('calendar', 'No upcoming visits', 'Your confirmed appointments will appear here.', '');

  const recentHtml = recent.length ? recent.map(function (j) {
    const total = j.payment ? j.payment.amount : Store.jobTotal(j.id);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/customer/jobs/' + j.id + '\')"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1;font-size:14.5px">' + UI.esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      '<div style="display:flex;gap:10px;align-items:center"><span class="smallnote">' + timeAgo(j.createdAt) + '</span>' +
      (j.review ? '<span class="badge b-brand">' + ic('star', { s: 12 }) + ' ' + j.review.rating + '.0 rated</span>' : '') +
      (total ? '<span class="smallnote" style="margin-left:auto">Paid ' + fmtRs(total) + '</span>' : '') + '</div></div></div>';
  }).join('') : '<p class="smallnote" style="padding:8px 4px">Completed services will show up here.</p>';

  const html =
    '<button class="btn btn-primary btn-lg" style="width:100%;margin-bottom:20px" onclick="go(\'/customer/post\')">' + ic('plus', { s: 18 }) + ' Post a Job</button>' +
    statRow +
    '<div class="grid-2col" style="margin-top:20px">' +
    '<div class="stack"><div class="card card-h"><div><h3>Active Jobs</h3><p>Track every stage of your repairs</p></div><a class="btn btn-outline btn-sm" href="#/customer/jobs">View all</a></div>' + activeHtml + '</div>' +
    '<div class="stack"><div class="card card-h"><h3>Upcoming Visits</h3></div>' + visitsHtml +
    '<div class="card card-h"><h3>Recent Jobs</h3></div>' + recentHtml + '</div></div>';

  return { html: html };
};

Views.customerMyJobs = function () {
  const u = Store.currentUser();
  const all = Store.state().jobs.filter(function (j) { return j.customerId === u.id; });
  const grouped = [];
  const ordered = ['receiving_offers', 'offers_received', 'visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress', 'completed', 'paid', 'reviewed', 'cancelled'];
  ordered.forEach(function (st) {
    all.filter(function (j) { return j.status === st; }).forEach(function (j) { grouped.push(j); });
  });
  const html = grouped.length ? '<div class="stack">' + grouped.map(function (j) {
    const w = j.workerId ? Store.userById(j.workerId) : null;
    return '<div class="job-card" onclick="go(\'/customer/jobs/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><span class="smallnote">' + j.id + ' · ' + timeAgo(j.createdAt) + '</span>' +
      (w ? '<span style="margin-left:auto;display:inline-flex;gap:6px;align-items:center"><span class="smallnote">Worker:</span>' + UI.avatar(w, '', {}) + '<span style="font-weight:700;font-size:13px">' + UI.esc(w.name) + '</span></span>' : '') +
      (j.payment ? '<span class="badge b-ok" style="margin-left:auto">' + ic('wallet', { s: 12 }) + ' ' + fmtRs(j.payment.amount) + '</span>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('list', 'No jobs yet', 'Post your first job and nearby professionals will send offers.', '<a class="btn btn-primary" href="#/customer/post">' + ic('plus', { s: 16 }) + ' Post Your First Job</a>');
  return { html: html };
};

Views.customerOffers = function () {
  const u = Store.currentUser();
  const jobs = Store.state().jobs.filter(function (j) { return j.customerId === u.id && !j.cancelled && !j.selectedOffer; });
  const withOffers = jobs.filter(function (j) { return j.offers.length; });
  const html = withOffers.length ? withOffers.map(function (j) {
    return '<div class="card" style="margin-bottom:18px"><div class="card-h"><div><h3>' + UI.esc(j.title) + '</h3><p>' + j.id + ' · ' + j.offers.length + ' professionals interested</p></div>' + UI.statusBadge(j.status) + '</div>' +
      '<div class="offer-workers" style="padding:16px">' + j.offers.map(function (o) {
        const w = Store.userById(o.workerId);
        return '<div class="ow-card"><div class="wk-head" style="margin-bottom:8px">' + UI.avatar(w) +
          '<div style="min-width:0"><div class="wk-name">' + UI.esc(w.name) + (w.verified ? ' ' + ic('shield', { s: 13, style: 'color:var(--brand)' }) : '') + '</div><div class="wk-role">' + UI.esc(w.tagline || w.name) + '</div></div></div>' +
          '<div style="display:flex;gap:6px;align-items:center">' + UI.rating(w.rating, w.ratingCount) + '</div>' +
          offerBreakdownHtml(o) +
          '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-outline btn-sm" style="flex:1" data-open-worker="' + w.id + '">' + ic('eye', { s: 14 }) + ' View Profile</button>' +
          '<button class="btn btn-soft btn-sm" style="flex:1" onclick="go(\'/customer/jobs/' + j.id + '\')">' + ic('eye', { s: 14 }) + ' View Offer</button></div></div>';
      }).join('') + '</div></div>';
  }).join('') : UI.empty('chat', 'No offers yet', "We're waiting for professionals to respond to your jobs.", '<a class="btn btn-primary" href="#/customer/post">Post a Job</a>');
  return { html: html };
};

Views.customerVisits = function () {
  const visits = Store.upcomingVisits('customer');
  const html = visits.length ? '<div class="stack">' + visits.map(function (v) {
    const w = v.workerId ? Store.userById(v.workerId) : null;
    return '<div class="card job-card" onclick="go(\'/customer/jobs/' + v.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(v.title) + '</b>' + UI.statusBadge(v.status) + '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px">' +
      (w ? '<div style="display:flex;gap:10px;align-items:center">' + UI.avatar(w) + '<div><b style="font-size:14px">' + UI.esc(w.name) + '</b><div class="smallnote">' + UI.rating(w.rating, w.ratingCount) + '</div></div></div>' : '') +
      '<div class="smallnote" style="font-size:13px;line-height:1.9">' + ic('calendar', { s: 13 }) + ' ' + UI.esc(v.prefDate || '') + ' · ' + ic('clock', { s: 13 }) + ' ' + UI.esc(v.prefTime || 'Flexible') + '<br>' + ic('pin', { s: 13 }) + ' ' + UI.esc((v.location && v.location.area) || '') + '</div>' +
      (v.visitCharge ? '<div class="total-bar" style="margin-left:auto;align-self:center"><span>Visit charge</span><span class="v">' + fmtRs(v.visitCharge) + '</span></div>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('calendar', 'No upcoming visits', 'Confirmed appointments will show here.', '<a class="btn btn-primary" href="#/customer/post">Post a Job</a>');
  return { html: html };
};

Views.customerPayments = function () {
  const u = Store.currentUser();
  const pays = Store.state().payments.filter(function (p) { return p.customerId === u.id; });
  const html = '<div class="card">' +
    '<div class="card-h"><h3>Payment History</h3><span class="badge b-brand">Total: ' + fmtRs(Store.totalSpent()) + '</span></div>' +
    (pays.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Job</th><th>Method</th><th>Date</th><th class="right">Amount</th></tr></thead><tbody>' +
    pays.map(function (p) {
      const j = Store.jobById(p.jobId);
      return '<tr><td><b>' + UI.esc(j ? j.title : p.jobId) + '</b><div class="smallnote">' + p.jobId + '</div></td><td><span class="badge b-white">' + ic(p.method === 'wallet' ? 'wallet' : p.method === 'cash' ? 'cash' : 'card', { s: 13 }) + ' ' + (p.method === 'wallet' ? 'Demo Wallet' : p.method === 'cash' ? 'Cash' : 'Card') + '</span></td><td>' + timeAgo(p.at) + '</td><td class="right"><b>' + fmtRs(p.amount) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>' : UI.empty('wallet', 'No payments yet', 'Your payments will appear here after jobs are completed and paid.')) + '</div>';
  return { html: html };
};

Views.customerReviews = function () {
  const u = Store.currentUser();
  const rvs = Store.state().reviews.filter(function (r) { return Store.userById(r.jobId ? String(r.workerId) : r.workerId); }).filter(function (r) { return Store.jobById(r.jobId) && Store.jobById(r.jobId).customerId === u.id; });
  const html = '<div class="card">' + (rvs.length ? rvs.map(function (r) {
    const j = Store.jobById(r.jobId);
    const w = Store.userById(r.workerId);
    return '<div class="notif-item"><div class="n-ic" style="background:var(--amber-bg);color:#b45309">' + ic('star', { s: 18 }) + '</div><div style="flex:1"><h4>' + UI.esc(j ? j.title : '') + (w ? ' · ' + UI.esc(w.name) : '') + '</h4><div class="rating" style="margin:4px 0">' + UI.stars(r.rating, 14) + '</div><p>' + UI.esc(r.text || 'No comment') + '</p><div class="n-t">' + timeAgo(r.at) + '</div></div></div>';
  }).join('') : UI.empty('star', 'No reviews yet', 'Reviews will appear after completing jobs.', '')) + '</div>';
  return { html: html };
};

Views.customerProfile = function () {
  const u = Store.currentUser();
  const html = '<div class="grid-2col"><div class="card card-pad">' +
    '<h3 style="margin-bottom:14px">Personal Information</h3>' +
    '<div style="display:flex;gap:14px;align-items:center;margin-bottom:18px">' + UI.avatar(u, 'lg') +
    '<div><div style="font-weight:800;font-size:17px">' + UI.esc(u.name) + '</div><div class="smallnote">Customer since ' + u.joined + ' · ' + UI.esc(u.email) + '</div></div></div>' +
    '<div class="f-row"><div class="field"><label>Full name</label><input class="input" id="pf-name" value="' + UI.esc(u.name) + '" /></div>' +
    '<div class="field"><label>Phone</label><input class="input" id="pf-phone" value="' + UI.esc(u.phone || '') + '" /></div></div>' +
    '<div class="f-row"><div class="field"><label>Area</label><select class="select" id="pf-area">' + AREAS.map(function (a) { return '<option' + (u.area === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Email</label><input class="input" disabled value="' + UI.esc(u.email) + '" /></div></div>' +
    '<button class="btn btn-primary" onclick="A.saveProfile()">Save changes</button></div>' +
    '<div class="stack"><div class="card card-pad"><h3 style="margin-bottom:10px">Avatar</h3><div class="avatar-opts">' + AVATAR_COLORS.slice(0, 6).map(function (c, i) {
      return '<div class="avatar-opt' + (u.color === c ? ' on' : '') + '" style="background:' + c + '" onclick="A.pickColor(\'' + c + '\',this)">' + initials(u.name) + '</div>';
    }).join('') + '</div><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="A.pickAvUpload()">' + ic('camera', { s: 14 }) + ' Upload photo</button><input type="file" id="av-up" accept="image/*" style="display:none" /></div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:8px">Quick actions</h3>' +
    '<button class="btn btn-outline btn-block" style="margin-bottom:8px" onclick="go(\'/customer/payments\')">' + ic('wallet', { s: 16 }) + ' Payment history</button>' +
    '<button class="btn btn-outline btn-block" onclick="go(\'/customer/reviews\')">' + ic('star', { s: 16 }) + ' My reviews</button></div></div></div>';
  return { html: html };
};

A.pickColor = function (c, el) {
  document.querySelectorAll('.avatar-opt').forEach(function (x) { x.classList.remove('on'); });
  el.classList.add('on');
  Store.updateUser(Store.currentUser().id, { color: c });
  R();
};
A.pickAvUpload = function () {
  const inp = document.getElementById('av-up');
  inp.onchange = function () {
    const f = inp.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = function () { Store.updateUser(Store.currentUser().id, { avatar: rd.result }); R(); };
    rd.readAsDataURL(f);
  };
  inp.click();
};
A.saveProfile = function () {
  const u = Store.currentUser();
  Store.updateUser(u.id, {
    name: document.getElementById('pf-name').value.trim() || u.name,
    phone: document.getElementById('pf-phone').value.trim(),
    area: document.getElementById('pf-area').value
  });
  UI.toast('Profile updated.', 'ok', 'Saved');
  R();
};

Views.customerSettings = function () {
  const u = Store.currentUser();
  const html = '<div class="grid-2col"><div class="stack"><div class="card"><div class="card-h"><h3>Notifications</h3></div>' +
    '<div class="card-pad">' +
    settingRow('chat', 'Offer alerts', 'When workers send you offers', true) +
    settingRow('truck', 'Visit updates', 'When a worker is on the way or arrives', true) +
    settingRow('file', 'Inspection reports', 'When an inspection report is ready', true) +
    settingRow('wallet', 'Payments & receipts', 'When a payment goes through', true) +
    settingRow('star', 'Review reminders', 'After a job is completed', false) + '</div></div>' +

    '<div class="card"><div class="card-h"><h3>Demo data</h3></div><div class="card-pad">' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">This resets the entire demo to a clean state — all jobs, offers and reviews are removed.</p>' +
    '<button class="btn btn-outline" style="color:var(--danger);border-color:#f3c7c8" onclick="A.resetDemo()">' + ic('refresh', { s: 15 }) + ' Reset demo data</button></div></div></div>' +
    '<div class="stack"><div class="card card-pad"><h3 style="margin-bottom:10px">Account</h3>' +
    '<div class="kv"><span class="k">Account type</span><span class="v">Customer</span></div>' +
    '<div class="kv"><span class="k">Email</span><span class="v">' + UI.esc(u.email) + '</span></div>' +
    '<div class="kv"><span class="k">Member since</span><span class="v">' + u.joined + '</span></div>' +
    '<div style="margin-top:14px"></div>' +
    '<button class="btn btn-danger-solid" onclick="A.logout()">' + ic('logout', { s: 15 }) + ' Log out</button></div>' +
    '<div class="card card-pad" style="background:var(--brand-3);border-color:#cde7e1"><b style="color:var(--brand-ink)">Pro tip</b>' +
    '<p style="font-size:13px;color:var(--brand-ink);margin-top:4px">Use the account menu (top-right) to switch to a worker account and watch the worker side react to your actions live.</p></div></div></div>';
  return { html: html };
};

function settingRow(icv, t, d, v) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--line)"><div style="display:flex;gap:11px;align-items:center">' + ic(icv, { s: 18, style: 'color:var(--brand)' }) + '<div><div style="font-weight:650;font-size:13.8px">' + t + '</div><div style="font-size:12px;color:var(--muted)">' + d + '</div></div></div><button class="icon-btn" style="width:44px;height:24px;border-radius:999px;background:' + (v ? 'var(--brand)' : '#cbd5e1') + ';padding:0" onclick="A.toggleSetting(this)"><span style="display:block;width:18px;height:18px;border-radius:50%;background:#fff;margin-left:' + (v ? '22px' : '2px') + '"></span></button></div>';
}
A.toggleSetting = function (el) {
  el.style.background = el.style.background === 'rgb(14, 122, 110)' ? '#cbd5e1' : 'var(--brand)';
  const span = el.querySelector('span');
  span.style.marginLeft = span.style.marginLeft === '22px' ? '2px' : '22px';
  UI.toast('Preference saved.', 'ok', 'Updated');
};
A.resetDemo = function () {
  UI.confirm({
    icon: 'refresh', title: 'Reset demo data?',
    body: 'All jobs, offers, payments and reviews will be cleared. Demo accounts will be restored.',
    okText: 'Reset', cancelText: 'Cancel', danger: true,
    onOk: function () { Store.reset(); UI.toast('Demo data has been reset.', 'ok', 'Done'); go('/'); }
  });
};

/* ---------- Post a Job wizard ---------- */

Views.wizard = function () {
  let d = Store.draft();
  if (!d) {
    Store.setDraft({ step: 1, customerId: Store.currentUser().id, category: '', title: '', description: '', images: [], audio: null, location: null, coords: { x: 52, y: 58 }, area: '', prefDate: null, prefTime: null, flexible: false });
    d = Store.draft();
  }
  const st = d.step;
  const steps = ['Service', 'Problem & Media', 'Location', 'Visit', 'Review'];
  const stepper = '<div class="stepper">' + steps.map(function (s, i) {
    const n = i + 1;
    const cls = n < st ? 'done' : n === st ? 'active' : '';
    return '<div class="stp ' + cls + '"><span class="tick">' + (n < st ? ic('check', { s: 15 }) : n) + '</span><span class="sl">' + s + '</span></div>';
  }).join('') + '</div>';

  const svcStep = '<div class="wiz-svc-step">' + SERVICES.map(function (s) {
    return '<button class="svc-card" style="' + (d.category === s.name ? 'border-color:var(--brand);background:var(--brand-3);box-shadow:0 0 0 3px rgba(14,122,110,.15)' : '') + '" onclick="A.wiz.pickService(\'' + s.name + '\')"><span class="svc-icon" style="background:' + s.bg + ';color:' + s.css + '">' + ic(s.icon, { s: 22 }) + '</span><span><h4>' + s.name + '</h4><p>' + s.desc + '</p></span></button>';
  }).join('') + '</div>';

  const problemStep = '<div class="field"><label>Problem title <span class="req">*</span></label>' +
    '<input class="input" placeholder="e.g. AC is running but not cooling" value="' + UI.esc(d.title) + '" oninput="A.wiz.set(\'title\', this.value)" />' +
    '<div class="fhint">Short & specific — professionals scan titles first.</div></div>' +
    '<div class="field"><label>Detailed description</label>' +
    '<textarea class="textarea" placeholder="Add details: when it started, sounds, what you have already tried…" oninput="A.wiz.set(\'description\', this.value)">' + UI.esc(d.description) + '</textarea></div>' +
    '<div class="divide"></div>' +
    '<div style="display:flex;gap:14px;align-items:stretch;flex-wrap:wrap">' +
    '<label class="upload-zone" style="display:block;flex:1;min-width:200px;padding:18px"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">' + ic('camera', { s: 22 }) + '<b>Add photos</b><span style="font-size:12px">Capture or upload images (JPG, PNG)</span></div>' +
    '<input type="file" accept="image/*" multiple style="display:none" onchange="A.wiz.addImages(this.files)" /></label>' +
    '<div style="flex:1;min-width:200px;display:flex;flex-direction:column;justify-content:center"><label style="font-weight:650;font-size:13px;color:var(--ink-2)">Voice description</label>' +
    (d.audio
      ? voicePreviewHtml(d.audio)
      : '<div class="drop-pill" style="margin-top:8px" onclick="A.wiz.rec()">' + ic('mic', { s: 15 }) + ' Record Voice</div>') + '</div>' +
    '</div>' +
    (d.images.length ? '<div class="grid-3" style="margin-top:12px">' + d.images.map(function (im, i) {
      return '<div class="img-thumb"><img src="' + im + '" /><button class="img-del" onclick="A.wiz.delImage(' + i + ')">' + ic('trash', { s: 13 }) + '</button></div>';
    }).join('') + (d.images.length < 6 ? '<label class="img-add"><input type="file" accept="image/*" style="display:none" onchange="A.wiz.addImages(this.files)" />' + ic('plus') + '<span>Add more</span></label>' : '') + '</div>' : '') +
    (d.images.length ? '<div class="fhint" style="margin-top:8px">' + d.images.length + ' photo' + (d.images.length > 1 ? 's' : '') + ' added' + '</div>' : '');

  function voicePreviewHtml(a) {
    return '<div class="rec-box"><div class="wave-box">' +
      '<button class="btn btn-soft btn-sm" onclick="A.audioPlay(\'rec-prev\')">' + ic('play', { s: 13 }) + '</button>' +
      '<div style="flex:1"><audio id="rec-prev" src="' + a.uri + '" preload="metadata"></audio><div class="smallnote">Voice description · ' + a.duration + 's</div></div></div>' +
      '<button class="btn btn-outline btn-sm" onclick="A.wiz.rec()">' + ic('refresh', { s: 13 }) + ' Re-record</button>' +
      '<button class="btn btn-danger btn-sm" onclick="A.wiz.delAudio()">' + ic('trash', { s: 13 }) + '</button></div>';
  }

  const mapStep = '<div class="field"><label>Select your area <span class="req">*</span></label>' +
    '<select class="select" id="wiz-area" onchange="A.wiz.set(\'area\', this.value)">' +
    '<option value="">Choose area…</option>' + AREAS.map(function (a) { return '<option' + (d.area === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Pin your exact location</label>' +
    '<div class="map-wrap" onclick="A.wiz.mapClick(event)">' +
    '<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 60" preserveAspectRatio="none">' +
    '<path d="M0 18 C 20 10, 40 26, 60 16 S 95 8, 100 14" stroke="#d7e0e6" stroke-width="1" fill="none"/><path d="M0 42 C 25 50, 50 34, 80 46 S 95 44, 100 46" stroke="#d7e0e6" stroke-width="1" fill="none"/><path d="M22 0 C 18 20, 30 40, 24 60" stroke="#d7e0e6" stroke-width="1" fill="none"/><path d="M70 0 C 74 16, 62 30, 72 60" stroke="#d7e0e6" stroke-width="1" fill="none"/></svg>' +
    '<div class="map-ring" style="left:' + (d.coords.x || 50) + '%;top:' + (d.coords.y || 55) + '%"><div class="mpt"></div></div>' +
    '<div class="map-loc">' + ic('pin', { s: 14 }) + (d.area || 'Tap the map to drop a pin') + '</div></div></div>' +
    '<div class="split"><button class="btn btn-outline" onclick="A.wiz.useLocation()">' + ic('navigation', { s: 15 }) + ' Detect my location</button>' +
    '<span class="smallnote" style="align-self:center">We only show your area, never your full address.</span></div>';

  const visitStep =
    '<div class="field"><label>Preferred date <span class="req">*</span></label><div class="date-row">' + nextDaysHtml(d.prefDate) + '</div></div>' +
    '<div class="field"><label>Preferred time</label><div class="time-row" id="time-row">' + TIME_SLOTS.map(function (t, tix) {
      const off = tix === 1 || tix === 5 ? ' off' : '';
      const on = d.prefTime === t ? ' on' : '';
      return '<button class="time-pill' + off + on + '"' + (off ? ' disabled' : '') + ' onclick="A.pickTime(\'' + t + '\')">' + t + '</button>';
    }).join('') + '</div></div>' +
    '<label style="display:flex;gap:10px;align-items:center;font-weight:600;font-size:14px;cursor:pointer;margin-top:6px">' +
    '<input type="checkbox" style="width:17px;height:17px;accent-color:var(--brand)" ' + (d.flexible ? 'checked' : '') + ' onchange="A.toggleFlex()" /> I’m flexible with timing</label>' +
    (d.flexible ? '<div class="fhint">The worker can pick a time that suits both of you.</div>' : '');

  function nextDaysHtml(sel) {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(Date.now() + i * 86400000);
      const iso = dt.toISOString().slice(0, 10);
      const lbl = i === 0 ? 'Today' : i === 1 ? 'Tomrw' : dt.toLocaleDateString('en-GB', { weekday: 'short' });
      const on = sel === iso ? ' on' : '';
      out.push('<button class="date-pill' + on + '" onclick="A.pickDate(\'' + iso + '\')"><div class="d">' + lbl + '</div><div class="n">' + dt.getDate() + '</div><div class="m">' + dt.toLocaleDateString('en-GB', { month: 'short' }) + '</div></button>');
    }
    return out.join('');
  }

  const reviewRows = [
    ['Category', d.category ? '<span class="badge b-brand">' + ic((svcByName(d.category) || {}).icon || 'wrench', { s: 13 }) + ' ' + d.category + '</span>' : '—'],
    ['Problem', d.title || '—'],
    ['Description', d.description || '—'],
    ['Photos', d.images.length ? d.images.length + ' image(s)' : 'None'],
    ['Voice', d.audio ? 'Voice note (' + d.audio.duration + 's)' : 'None'],
    ['Location', d.area || '—'],
    ['Visit window', (d.flexible ? 'Flexible' : (d.prefDate || '') + ' · ' + (d.prefTime || ''))]
  ].map(function (r, i) {
    return '<div class="rv-item"><span class="rk">' + ic(['target', 'chat', 'pen', 'camera', 'mic', 'pin', 'clock'][i], { s: 16 }) + '</span><div><div class="rv-l">' + r[0] + '</div><div class="rv-v">' + r[1] + '</div></div></div>';
  }).join('');

  const reviewStep = '<div class="review-grid">' + reviewRows + '</div>' +
    (d.images.length ? '<div class="jc-imgs" style="margin-top:12px">' + d.images.slice(0, 4).map(function (x) { return '<img class="thumb" src="' + x + '" />'; }).join('') + '</div>' : '') +
    (d.audio ? '<div style="margin-top:12px">' + voicePreviewHtml(d.audio) + '</div>' : '');

  const contentHtml = st === 1 ? svcStep : st === 2 ? problemStep : st === 3 ? mapStep : st === 4 ? visitStep : reviewStep;

  const navHtml = '<div class="wiz-nav">' +
    (st > 1 ? '<button class="btn btn-outline" onclick="A.wiz.prev()">' + ic('arrowL', { s: 15 }) + ' Back</button>' : '<span></span>') +
    (st < 5 ? '<button class="btn btn-primary" onclick="A.wiz.next()">Continue ' + ic('arrowR', { s: 15 }) + '</button>' :
      '<button class="btn btn-primary btn-lg" onclick="A.wiz.submit()">' + ic('send', { s: 16 }) + ' Post Job</button>') + '</div>';

  const html = '<div class="card wiz-card"><div class="card-pad"><div class="wiz-wrap">' + stepper + '<div class="wiz-main"><div id="wiz-body">' + contentHtml + '</div>' + navHtml + '</div></div></div></div>';

  return { html: html, mount: function () {
      const area = document.getElementById('wiz-area');
      if (area) area.value = Store.draft() && Store.draft().area || '';
    } };
};

/* ---------- Customer job hub ---------- */

Views.customerJob = function (params) {
  const j = Store.jobById(params.id);
  if (!j || j.customerId !== Store.currentUser().id) {
    return { html: UI.empty('alert', 'Job not found', 'This job may have been removed.') + '<a class="btn btn-primary" href="#/customer">Back to dashboard</a>' };
  }
  const sec = params.section || '';
  const w = j.workerId ? Store.userById(j.workerId) : null;
  const svcI = svcByName(j.category);

  let panel = '';
  if (j.status === 'receiving_offers' || j.status === 'offers_received') {
    if (j.offers.length) {
      panel = '<div class="card"><div class="card-h"><div><h3>Worker Offers</h3><p>' + j.offers.length + ' professionals are interested · tap View Profile to compare</p></div>' + UI.statusBadge(j.status) + '</div>' +
        '<div class="offer-workers" style="padding:16px">' + j.offers.map(function (o) {
          const ow = Store.userById(o.workerId);
          return '<div class="ow-card"><div class="wk-head">' + UI.avatar(ow) + '<div style="min-width:0"><div class="wk-name">' + UI.esc(ow.name) + (ow.verified ? ' ' + ic('shield', { s: 13, style: 'color:var(--brand)' }) : '') + '</div><div class="wk-role">' + UI.esc(ow.tagline || '') + '</div></div></div>' +
            '<div>' + UI.rating(ow.rating, ow.ratingCount) + '</div>' +
            '<div class="wk-meta"><span>' + ic('briefcase', { s: 13 }) + ' ' + ow.jobsDone + ' jobs</span><span>' + ic('pin', { s: 13 }) + ' ' + UI.esc(ow.area) + '</span></div>' +
            offerBreakdownHtml(o) +
            '<div style="display:flex;gap:8px;margin-top:14px">' +
            '<button class="btn btn-outline btn-sm" style="flex:1" data-open-worker="' + ow.id + '">' + ic('eye', { s: 14 }) + ' View Profile</button>' +
            '<button class="btn btn-primary btn-sm" style="flex:1" onclick="A.selectWorker(\'' + j.id + '\',\'' + o.id + '\')">Select Worker</button></div></div>';
        }).join('') + '</div></div>';
    } else {
      panel = '<div class="card card-pad"><div style="display:flex;gap:14px;align-items:center">' + ic('clock', { s: 28, style: 'color:var(--amber)' }) + '<div><b style="font-size:15.5px">Receiving offers…</b><p style="color:var(--muted);font-size:13px;margin-top:4px">Professionals have been notified. When a worker sends a visit offer it appears here instantly. Try a worker demo account to send one.</p></div><div class="spin" style="margin-left:auto;width:22px;height:22px"></div></div></div>';
    }
  }

  else if (j.status === 'visit_confirmed' || j.status === 'on_the_way' || j.status === 'arrived' || j.status === 'inspection') {
    panel = visitConfirmedCard(j);
  }
  else if (j.status === 'repair_negotiation' || j.status === 'repair_agreed') {
    panel = inspectionCard(j);
  }
  else if (j.status === 'repair_approved' || j.status === 'repair_in_progress') {
    panel = approvedCard(j);
  }
  else if (j.status === 'completed') {
    panel = jobCompleteCard(j);
  }
  else if (j.status === 'paid') {
    panel = paidCard(j);
  }
  else if (j.status === 'reviewed') {
    panel = reviewedCard(j);
  }
  else if (j.status === 'cancelled') {
    panel = cancelledCard(j);
  }

  const detailCard = '<div class="card"><div class="card-h"><h3>Job Details</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
    '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><span class="svc-icon" style="background:' + svcI.bg + ';color:' + svcI.css + '">' + ic(svcI.icon, { s: 20 }) + '</span><div><div style="font-weight:750;font-size:16px">' + UI.esc(j.title) + '</div><div class="smallnote">' + svcI.name + ' · Posted ' + timeAgo(j.createdAt) + '</div></div></div>' +
    '<p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">' + UI.esc(j.description || 'No additional description.') + '</p>' +
    UI.mediaRow(j) +
    '<div class="kv"><span class="k">Location</span><span class="v">' + UI.esc((j.location && j.location.area) || '—') + '</span></div>' +
    '<div class="kv"><span class="k">Preferred visit</span><span class="v">' + UI.esc(j.prefDate || 'Flexible') + (j.prefTime !== 'Flexible' ? ' · ' + UI.esc(j.prefTime) : '') + '</span></div>' +
    '<div class="kv"><span class="k">Job ID</span><span class="v">' + j.id + '</span></div>' +
    (w ? '<div class="kv" style="border-bottom:none"><span class="k">Selected worker</span><span class="v" style="display:inline-flex;gap:6px;align-items:center">' + UI.avatar(w, '', {}) + ' ' + UI.esc(w.name) + '</span></div>' : '') + '</div></div>';

  const costCard = j.visitCharge || j.repair.approvedEstimate ? '<div class="card"><div class="card-h"><h3>Cost Summary</h3></div><div class="card-pad">' +
    (j.visitCharge ? '<div class="kv"><span class="k">Visit &amp; Diagnosis</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
    (j.repair.approvedEstimate ? '<div class="kv"><span class="k">Final Repair</span><span class="v">' + fmtRs(j.repair.approvedEstimate) + '</span></div>' : '') +
    extraBillingRows(j) +
    ((j.visitCharge || j.repair.approvedEstimate) ? '<div class="kv" style="border-bottom:none"><span class="k" style="font-weight:800">Total</span><span class="v" style="font-size:18px;color:var(--brand);font-weight:800">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' : '') + '</div></div>' : '';

  const timelineCard = '<div class="card"><div class="card-h"><h3>Job Timeline</h3></div><div class="card-pad">' + UI.jobTimeline(j) + '</div></div>';

  const html = '<div class="grid-2col"><div class="main-col stack">' +
    (j.cancelled ? '<div class="err-banner">' + ic('alert') + '<span>This job was cancelled — ' + UI.esc(j.cancelled.reason || '') + '</span></div>' : '') +
    (sec === 'repair' ? '<div class="notice brand">' + ic('wrench') + '<span>Repair price negotiation — agree before approving any work.</span></div>' : '') +
    (sec === 'payment' ? '' : '') +
    panel +
    extraWorkCard(j, 'customer') +
    detailCard + '</div>' +
    '<div class="stack">' + timelineCard + bookingItemsCard(j) + costCard + '</div></div>';

  return { html: html, mount: function () {
      if (sec === 'offers') { Store.markOffersViewed(j.id); }
    } };
};

function offerBreakdownHtml(o) {
  if (!o) return '';
  const visit = o.amount || 0;
  const est = o.estimate || 0;
  return '<div class="est-box" style="border:1px solid #cde7e1;background:var(--brand-3);border-radius:13px;padding:14px;margin-top:12px">' +
    '<div class="smallnote" style="font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">' + ic('file', { s: 13 }) + ' Estimated Offer</div>' +
    '<div class="kv"><span class="k">Visit &amp; Diagnosis</span><span class="v">' + fmtRs(visit) + '</span></div>' +
    (est ? '<div class="kv"><span class="k">Estimated Repair</span><span class="v">' + fmtRs(est) + '</span></div>' : '') +
    '<div class="kv" style="border-bottom:none"><span class="k" style="font-weight:800">Estimated Total</span><span class="v" style="color:var(--brand);font-weight:800">' + fmtRs(visit + est) + '</span></div>' +
    '</div>';
}

function extraBadge(st) {
  const m = {
    requested: ['Awaiting Quote', 'b-amber', 'clock'],
    quote_sent: ['Quote Sent', 'b-brand', 'chat'],
    approved: ['Approved', 'b-ok', 'check'],
    declined: ['Declined', 'b-danger', 'x']
  }[st] || [st, 'b-muted', 'info'];
  return '<span class="badge ' + m[1] + '">' + ic(m[2], { s: 12 }) + ' ' + m[0] + '</span>';
}

function extraRow(ex, side, jobId) {
  const isCust = side === 'customer';
  let action = '';
  if (isCust) {
    if (ex.state === 'quote_sent') {
      action = '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="btn btn-primary btn-sm" style="flex:1" onclick="A.decideExtra(\'' + jobId + '\',\'' + ex.id + '\',\'approve\')">' + ic('check', { s: 14 }) + ' Approve ' + fmtRs(ex.quote) + '</button>' +
        '<button class="btn btn-outline btn-sm" onclick="A.decideExtra(\'' + jobId + '\',\'' + ex.id + '\',\'decline\')">Decline</button></div>';
    } else if (ex.state === 'approved') {
      action = '<div class="smallnote" style="margin-top:8px;color:var(--ok);font-weight:700">' + ic('check', { s: 13 }) + ' Added to your booking at ' + fmtRs(ex.quote) + '</div>';
    }
  } else if (ex.state === 'requested') {
    action = '<div class="field" style="margin-top:10px;margin-bottom:0"><label>Quote for this extra work (Rs.)</label>' +
      '<div style="display:flex;gap:8px;margin-top:8px"><input type="number" id="exq-' + ex.id + '" class="input" placeholder="e.g. 800" min="50" />' +
      '<button class="btn btn-soft" onclick="A.sendExtraQuote(\'' + jobId + '\',\'' + ex.id + '\')">Send Quote</button></div></div>';
  } else if (ex.state === 'quote_sent') {
    action = '<div class="smallnote" style="margin-top:8px">Quote of ' + fmtRs(ex.quote) + ' sent — waiting for customer approval.</div>';
  }
  return '<div class="ext-row" style="border:1px solid var(--line-2);border-radius:14px;padding:14px;display:flex;gap:12px">' +
    '<span class="svc-icon" style="flex:none;width:38px;height:38px;border-radius:11px;background:#eef1f4;color:var(--muted)">' + ic('toolbox', { s: 17 }) + '</span>' +
    '<div style="flex:1;min-width:0">' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:14px">' + UI.esc(ex.title) + '</b>' + extraBadge(ex.state) + '</div>' +
    (ex.note ? '<p style="font-size:13px;color:var(--muted);margin-top:6px">' + UI.esc(ex.note) + '</p>' : '') +
    '<div class="smallnote" style="margin-top:4px">' + timeAgo(ex.requestedAt) + ' · extra work gets its own separate quote &amp; approval</div>' +
    action + '</div></div>';
}

function extraWorkCard(j, side) {
  const extras = j.extras || [];
  const isCust = side === 'customer';
  const active = ['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress'].indexOf(j.status) !== -1;
  if (side === 'worker' && !extras.length) return '';
  if (isCust && !extras.length && !(active && j.workerId)) return '';
  const rows = extras.map(function (ex) { return extraRow(ex, side, j.id); }).join('');
  const addBtn = (isCust && active && j.workerId)
    ? '<button class="btn btn-outline" style="width:100%" onclick="A.openExtraModal(\'' + j.id + '\')">' + ic('plus', { s: 15 }) + ' Request Additional Work</button>'
    : '';
  const intro = (!extras.length && isCust)
    ? '<p class="smallnote" style="padding:6px 2px">Found something else while the professional is there — like fixing a tap too? Request it here. Each extra work gets its own quote and approval, so it never mixes with the original repair price.</p>'
    : '';
  const el = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="font-size:16.5px;font-weight:750">Additional Work</h3>' + (extras.length ? '<span class="badge b-white">' + extras.length + '</span>' : '') + '</div>';
  return '<div class="card"><div class="card-h"><div>' + el + '<p>Each request is priced &amp; approved separately</p></div></div>' +
    '<div class="card-pad"><div class="stack" style="gap:12px">' + intro + rows + addBtn + '</div></div></div>';
}

function extraBillingRows(j) {
  return (j.extras || []).filter(function (x) { return x.state === 'approved'; }).map(function (x) {
    return '<div class="kv"><span class="k">' + UI.esc(x.title) + '</span><span class="v">' + fmtRs(x.quote) + '</span></div>';
  }).join('');
}

function bookingItemsCard(j) {
  const extras = j.extras || [];
  const mainTotal = (j.visitCharge || 0) + (j.repair.approvedEstimate || 0);
  const mainApproved = j.visitCharge && j.repair.status === 'approved';
  let rows = '';
  if (mainTotal) {
    rows += bookingItemRow(svcByName(j.category).icon, !!mainApproved, UI.esc(j.title), mainTotal, 'repair');
  }
  extras.forEach(function (x) {
    if (x.state === 'declined') rows += bookingItemRow('toolbox', false, UI.esc(x.title), 0, 'declined');
    else rows += bookingItemRow('toolbox', x.state === 'approved', UI.esc(x.title), x.quote || 0, x.state);
  });
  if (!rows) return '';
  return '<div class="card"><div class="card-h"><div><h3>Booking Items</h3><p>' + j.id + ' · one quote &amp; approval per item</p></div></div>' +
    '<div class="card-pad"><div class="stack" style="gap:8px">' + rows +
    '<div class="total-bar" style="margin-top:4px"><span>Booking total</span><span class="v">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
    '</div></div></div>';
}

function bookingItemRow(icon, done, lbl, amt, st) {
  const badge = st === 'declined'
    ? '<span class="badge b-danger">' + ic('x', { s: 11 }) + ' Declined</span>'
    : done
      ? '<span class="badge b-ok">' + ic('checkC', { s: 11 }) + ' Approved</span>'
      : (amt ? '<span class="badge b-amber">' + ic('clock', { s: 11 }) + ' Pending</span>' : '<span class="badge b-white">Pending quote</span>');
  return '<div style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px 12px">' +
    '<span class="svc-icon" style="flex:none;width:32px;height:32px;border-radius:9px;background:var(--brand-3);color:var(--brand)">' + ic(icon, { s: 15 }) + '</span>' +
    '<div style="flex:1;min-width:0;font-weight:650;font-size:13.5px">' + lbl + '</div>' +
    (amt ? '<b style="font-size:13.5px">' + fmtRs(amt) + '</b>' : '<span class="smallnote">—</span>') +
    badge + '</div>';
}

function compPreviewHtml(a) {
  return '<div class="rec-box"><div class="wave-box">' +
    '<button class="btn btn-soft btn-sm" onclick="A.audioPlay(\'comp-prev\')">' + ic('play', { s: 13 }) + '</button>' +
    '<div style="flex:1"><audio id="comp-prev" src="' + a.uri + '" preload="metadata"></audio><div class="smallnote">Voice summary · ' + a.duration + 's</div></div></div>' +
    '<button class="btn btn-outline btn-sm" onclick="A.comp.rec()">' + ic('refresh', { s: 13 }) + ' Re-record</button>' +
    '<button class="btn btn-danger btn-sm" onclick="A.comp.delAudio()">' + ic('trash', { s: 13 }) + '</button></div>';
}

function proofSectionHtml(j) {
  const c = j.completion;
  if (!c) return '';
  let out = '<div style="text-align:left;background:#f8fafc;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:18px">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' + ic('camera', { s: 15 }) + '<b style="font-size:14px">Work proof &amp; summary</b><span class="badge b-ok" style="margin-left:auto">' + ic('check', { s: 11 }) + ' Verified by worker</span></div>';
  if (c.note) out += '<p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">' + UI.esc(c.note) + '</p><div class="divide" style="margin-bottom:12px"></div>';
  if (c.images && c.images.length) out += '<div class="jc-imgs">' + c.images.slice(0, 6).map(function (img, i) {
    return '<img class="thumb" style="width:64px;height:52px" src="' + img + '" alt="Work proof photo ' + (i + 1) + '" />';
  }).join('') + '</div>';
  if (c.audio) out += '<div class="voice-chips" style="margin-bottom:0"><span class="voice-chip" onclick="A.audioPlay(\'proof-audio\')">' + ic('mic', { s: 13 }) + ' Voice summary · ' + c.audio.duration + 's · tap to play</span></div>' +
    '<audio id="proof-audio" src="' + c.audio.uri + '" preload="metadata"></audio>';
  if (c.at) out += '<div class="smallnote" style="margin-top:10px;color:var(--muted)">' + ic('clock', { s: 12 }) + ' Submitted ' + timeAgo(c.at) + '</div>';
  return out + '</div>';
}

function visitConfirmedCard(j) {
  const w = Store.userById(j.workerId);
  let statusLive = '';
  if (j.status === 'on_the_way') {
    statusLive = '<div class="notice amber" style="margin-bottom:12px">' + ic('truck') + '<span><b>' + UI.esc(w ? w.name : 'Your worker') + ' is on the way.</b> You will be notified when they arrive.</span></div>';
  } else if (j.status === 'arrived') {
    statusLive = '<div class="notice brand" style="margin-bottom:12px">' + ic('pin') + '<span><b>' + UI.esc(w ? w.name : 'Your worker') + ' has arrived.</b> They are about to start the inspection.</span></div>';
  } else if (j.status === 'inspection') {
    statusLive = '<div class="notice brand" style="margin-bottom:12px">' + ic('search') + '<span><b>Inspection in progress.</b> The report will appear here shortly.</span></div>';
  }
  return '<div class="card"><div class="card-h"><h3>Visit Confirmed</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' + statusLive +
    '<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">' + UI.avatar(w) +
    '<div><div style="font-weight:750">' + UI.esc(w.name) + (w.verified ? ' ' + ic('shield', { s: 14, style: 'color:var(--brand)' }) : '') + '</div><div class="smallnote">' + UI.esc(w.tagline || '') + '</div>' + UI.rating(w.rating, w.ratingCount) + '</div></div>' +
    '<div class="kv"><span class="k">Visit charge (locked)</span><span class="v" style="color:var(--brand)">' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="kv"><span class="k">Date</span><span class="v">' + UI.esc(j.prefDate || 'Flexible') + '</span></div>' +
    '<div class="kv"><span class="k">Time</span><span class="v">' + UI.esc(j.prefTime) + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Location</span><span class="v">' + UI.esc((j.location && j.location.area) || '—') + '</span></div>' +
    '<div style="display:flex;gap:10px;margin-top:16px"><a class="btn btn-outline" href="#/customer/jobs/' + j.id + '">' + ic('eye', { s: 15 }) + ' View Details</a>' +
    '<button class="btn btn-danger" onclick="A.cancelVisit(\'' + j.id + '\',\'customer\')">Cancel Visit</button></div></div></div>';
}

function inspectionCard(j) {
  const w = Store.userById(j.workerId);
  const r = j.repair;
  const offerEst = j.selectedOffer && j.selectedOffer.estimate ? j.selectedOffer.estimate : 0;
  const agreed = j.status === 'repair_agreed';

  let actionHtml = '';
  if (!agreed) {
    actionHtml = '<div class="card card-pad" style="margin-top:14px">' +
      '<div class="kv"><span class="k">Inspection result</span><span class="v" style="text-align:left">' + UI.esc(r.result) + '</span></div>' +
      '<div class="kv"><span class="k">Required repair</span><span class="v" style="text-align:left">' + UI.esc(r.required) + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Final Repair Quote</span><span class="v" style="color:var(--brand);font-size:17px;font-weight:800">' + fmtRs(r.estimate) + '</span></div>' +
      (offerEst ? '<div class="notice brand" style="margin-top:12px">' + ic('info') + '<span>This is the <b>final</b> quote after inspecting your ' + UI.esc(j.category.toLowerCase()) + ' — it may differ from the offer estimate of ' + fmtRs(offerEst) + '. Approve to start the repair, or reject and the job ends.</span></div>' : '') +
      '<div class="divide"></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      extraBillingRows(j) +
      '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
      '<div class="btn-pair" style="margin-top:14px">' +
      '<button class="btn btn-primary" onclick="A.approveRepairAmount(\'' + j.id + '\')">' + ic('check', { s: 15 }) + ' Approve ' + fmtRs(r.estimate) + '</button>' +
      '<button class="btn btn-danger-solid" onclick="A.rejectFinalQuote(\'' + j.id + '\')">' + ic('x', { s: 15 }) + ' Reject</button></div>' +
      '<div class="fhint" style="margin-top:8px">Your total will be visit charge + approved final quote.</div></div>';
  } else {
    actionHtml = '<div class="card card-pad" style="margin-top:14px;border-color:#bfe6cd">' +
      '<div class="kv"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(r.approvedEstimate) + '</span></div>' +
      extraBillingRows(j) +
      '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="A.approveRepairFinal(\'' + j.id + '\')">' + ic('shield', { s: 16 }) + ' Approve Repair</button>' +
      '<div class="fhint" style="text-align:center;margin-top:8px">Approve to lock this price and start the repair.</div></div>';
  }
  return '<div class="card"><div class="card-h"><h3>Inspection Complete</h3>' + UI.statusBadge(j.status) + '</div>' +
    '<div class="card-pad">' + actionHtml + '</div></div>';
}

function approvedCard(j) {
  const w = Store.userById(j.workerId);
  const inProg = j.status === 'repair_in_progress';
  return '<div class="card"><div class="card-h"><h3>Repair Agreement</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
    '<div class="kv"><span class="k">Visit</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair.approvedEstimate) + '</span></div>' +
    extraBillingRows(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:18px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
    (inProg ? '<div class="notice amber" style="margin-top:14px">' + ic('wrench') + '<span>' + UI.esc(w.name) + ' is currently repairing your ' + j.category.toLowerCase() + '. Updates will appear here.</span></div>' :
      '<div class="notice brand" style="margin-top:14px">' + ic('shield') + '<span>Repair approved. ' + UI.esc(w.name) + ' can now start the work.</span></div>') +
    '</div></div>';
}

function jobCompleteCard(j) {
  const w = Store.userById(j.workerId);
  return '<div class="card"><div class="card-h"><h3>Job Completed</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
    '<div class="success-ring" style="margin:6px auto 16px;width:68px;height:68px">' + ic('check', { s: 32 }) + '</div>' +
    '<h3 style="font-size:18px;font-weight:800;margin-bottom:6px">Great — your repair is done!</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">' + UI.esc(w.name) + ' completed the ' + UI.esc(j.category) + ' job. Please complete the payment to close this job.</p>' +
    '<div class="card-pad" style="background:#f8fafc;border:1px solid var(--line);border-radius:14px;text-align:left;margin-bottom:18px">' +
    '<div class="kv"><span class="k">Service</span><span class="v">' + UI.esc(j.category) + '</span></div>' +
    '<div class="kv"><span class="k">Visit</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair.approvedEstimate) + '</span></div>' +
    extraBillingRows(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:18px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div></div>' +
    proofSectionHtml(j) +
    '<a class="btn btn-primary btn-lg btn-block" href="#/customer/jobs/' + j.id + '/payment">' + ic('wallet', { s: 17 }) + ' Proceed to Payment</a></div></div>';
}

function paidCard(j) {
  return '<div class="card"><div class="card-h"><h3>Payment Complete</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
    '<div class="success-ring">' + ic('checkC', { s: 36 }) + '</div>' +
    '<h3 style="font-size:18px;font-weight:800;margin-bottom:6px">Paid ' + fmtRs(j.payment.amount) + '</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">Paid via ' + (j.payment.method === 'wallet' ? 'Demo Wallet' : j.payment.method === 'cash' ? 'Cash' : 'Card') + ' · ' + new Date(j.payment.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</p>' +
    (j.review ? '<p style="color:var(--ok);font-weight:700;font-size:14px">Reviewed · ' + j.review.rating + ' stars</p>' :
      '<a class="btn btn-primary btn-lg" href="#/customer/jobs/' + j.id + '/review">' + ic('star', { s: 17 }) + ' Leave a Review</a>') +
    '</div></div>';
}

function reviewedCard(j) {
  return '<div class="card"><div class="card-h"><h3>Reviewed</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
    '<div style="display:flex;gap:4px;justify-content:center;margin:6px 0 12px">' + UI.stars(j.review.rating, 22) + '</div>' +
    '<p style="color:var(--ink-2);font-size:14px;max-width:440px;margin:0 auto 6px">' + UI.esc(j.review.comment || '') + '</p>' +
    '<p class="smallnote">Your review is now visible on the worker’s profile.</p>' +
    '</div></div>';
}

function cancelledCard(j) {
  if (j.cancelled && j.cancelled.kind === 'quote_rejected') {
    return '<div class="card"><div class="card-h"><h3>Job Ended</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
      '<div class="e-ic" style="margin:8px auto 16px">' + ic('x', { s: 30 }) + '</div>' +
      '<h3 style="font-size:18px;font-weight:800;margin-bottom:6px">Final quote rejected</h3>' +
      '<p style="color:var(--muted);font-size:13.5px;max-width:420px;margin:0 auto 18px">No repair was started and the job has been closed. You can post a new job or browse other professionals whenever you are ready.</p>' +
      '<div class="split" style="max-width:420px;margin:0 auto">' +
      '<a class="btn btn-primary btn-block" href="#/customer/post">' + ic('plus', { s: 15 }) + ' Post a new job</a>' +
      '<a class="btn btn-outline btn-block" href="#/workers">' + ic('users', { s: 15 }) + ' Browse workers</a></div>' +
      '</div></div>';
  }
  return '<div class="card"><div class="card-h"><h3>Cancelled</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
    '<div class="err-banner">' + ic('alert') + '<span>' + UI.esc(j.cancelled.reason || 'Cancelled.') + '</span></div>' +
    '<a class="btn btn-primary" href="#/customer/post">' + ic('plus', { s: 15 }) + ' Post a new job</a></div></div>';
}

UI.errBanner = function (icon, msg) {
  return '<div class="err-banner" style="margin-bottom:14px">' + ic(icon, { s: 17 }) + '<span>' + UI.esc(msg) + '</span></div>';
};

/* ---------- Customer payments & review ---------- */

Views.payment = function (params) {
  const j = Store.jobById(params.id);
  if (!j) { go('/customer'); return { html: '' }; }
  const total = Store.jobTotal(j.id);
  const html = '<div class="grid-2col"><div class="stack">' +
    (j.payment ? paidCard(j) :
      '<div class="card"><div class="card-h"><h3>Choose Payment Method</h3></div><div class="card-pad">' +
      '<div class="pay-options">' +
      '<div class="pay-opt on" data-m="wallet" onclick="A.payMethod(\'wallet\')"><span class="p-ic" style="background:var(--brand-3);color:var(--brand)">' + ic('wallet', { s: 22 }) + '</span><h4>Demo Wallet</h4><p>Instant · balance Rs. ' + (25000).toLocaleString('en-PK') + '</p></div>' +
      '<div class="pay-opt" data-m="cash" onclick="A.payMethod(\'cash\')"><span class="p-ic" style="background:var(--amber-bg);color:#b45309">' + ic('cash', { s: 22 }) + '</span><h4>Cash</h4><p>Pay on completion</p></div>' +
      '<div class="pay-opt" data-m="card" onclick="A.payMethod(\'card\')"><span class="p-ic" style="background:var(--info-bg);color:var(--info)">' + ic('card', { s: 22 }) + '</span><h4>Card</h4><p>Visa · Mastercard</p></div></div>' +
      '<input type="hidden" id="pay-method" value="wallet" />' +
      '</div></div>') +
    (j.status === 'completed' ? '<a class="btn btn-ghost" href="#/customer/jobs/' + j.id + '">' + ic('arrowL', { s: 15 }) + ' Back to job</a>' : '') +
    '</div><div class="stack">' +
    '<div class="pay-summary"><div class="row"><span>Service</span><span>' + UI.esc(j.category) + '</span></div>' +
    '<div class="row"><span>Visit charge</span><span>' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="row"><span>Repair</span><span>' + fmtRs(j.repair.approvedEstimate) + '</span></div>' +
    (j.extras || []).filter(function (x) { return x.state === 'approved'; }).map(function (x) {
      return '<div class="row"><span>' + UI.esc(x.title) + '</span><span>' + fmtRs(x.quote) + '</span></div>';
    }).join('') +
    '<div class="row strong"><span>Total Payable</span><span>' + fmtRs(total) + '</span></div>' +
    '<div style="margin-top:18px;display:flex;gap:10px">' +
    (j.payment ? '<a class="btn btn-outline btn-block" href="#/customer/jobs/' + j.id + '/review">' + ic('star', { s: 15 }) + ' Leave a Review</a>'
      : '<button class="btn btn-block" style="background:#fff;color:#0f1f26;font-weight:800" onclick="A.pay(\'' + j.id + '\')">' + ic('wallet', { s: 16 }) + ' Pay ' + fmtRs(total) + '</button>') + '</div></div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:6px">About this payment</h3><p style="color:var(--muted);font-size:13px">This is a demo payment — no real money moves. The full journey, from negotiation to receipt, works exactly like the real thing.</p></div>' +
    '</div></div>';
  return { html: html };
};

Views.review = function (params) {
  const j = Store.jobById(params.id);
  if (!j) { go('/customer'); return { html: '' }; }
  if (j.review) {
    return { html: '<div class="card" style="max-width:520px;margin:0 auto">' + reviewedCard(j) + '</div>' };
  }
  const w = Store.userById(j.workerId);
  const html = '<div class="card" style="max-width:520px;margin:0 auto"><div class="card-pad" style="text-align:center">' +
    '<h3 style="font-size:20px;font-weight:800;margin-bottom:6px">How was your experience?</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">Your honest feedback helps other customers — and rewards good work.</p>' +
    (w ? '<div style="display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:8px">' + UI.avatar(w) + '<div style="text-align:left"><b>' + UI.esc(w.name) + '</b><div class="smallnote">' + UI.esc(j.category) + ' · ' + j.id + '</div></div></div>' : '') +
    '<div class="stars-input" style="margin:8px 0 18px">' + [1, 2, 3, 4, 5].map(function (n) {
      return '<span class="st" data-v="' + n + '" onclick="A.setStars(' + n + ')">' + starEmpty(34) + '</span>';
    }).join('') + '</div>' +
    '<textarea id="rv-text" class="textarea" placeholder="Write a short review… (optional)"></textarea>' +
    '<button class="btn btn-primary btn-lg btn-block" style="margin-top:12px" onclick="A.submitReview(\'' + j.id + '\')">' + ic('send', { s: 16 }) + ' Submit Review</button>' +
    '</div></div>';
  return { html: html };
};

Views.notifications = function () {
  const u = Store.currentUser();
  const arr = (Store.state().notifications[u.id] || []).slice(0, 30);
  const unread = Store.unreadFor(u.id);
  const html = '<div class="card">' +
    '<div class="card-h"><h3>Notifications</h3><button class="btn btn-outline btn-sm" onclick="A.markAllNotifs()">' + ic('check', { s: 13 }) + ' Mark all read</button></div>' +
    (arr.length ? arr.map(function (n) {
      return '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="A.notifGo(\'' + n.id + '\')">' +
        '<div class="n-ic" style="background:var(--brand-3);color:var(--brand)">' + ic(n.icon || 'bell', { s: 18 }) + '</div>' +
        '<div style="flex:1;min-width:0"><h4>' + UI.esc(n.title) + '</h4><p>' + UI.esc(n.body) + '</p>' +
        '<div class="n-t">' + ic('clock', { s: 12 }) + ' ' + timeAgo(n.at) + (n.read ? '' : ' · new') + '</div></div>' +
        (n.read ? '' : '<span class="ndot"></span>') + '</div>';
    }).join('') : UI.empty('bell', "You're all caught up", 'New updates about offers, visits and repairs will appear here.')) + '</div>';
  return { html: html };
};

/* ============================= WORKER VIEWS ============================= */

Views.workerOnboarding = function () {
  const u = Store.currentUser();
  if (!u.onboarding) { go('/worker'); return { html: '' }; }
  let onb = Store.draft();
  if (!onb || !onb.onb) {
    onb = { onb: true, step: 1, tagline: '', bio: '', phone: u.phone || '', skills: u.skills || [], areas: u.serviceAreas || [], years: u.years || 0, hi: '', avatar: '', avatarColor: u.color || '#0e7a6e', cnic: null, selfie: null, cnicDone: false };
    Store.setDraft(onb);
  }
  const d = onb;
  const steps = ['Basics', 'Skills', 'Areas', 'Experience', 'Photo', 'Verification'];
  const stepper = '<div class="stepper">' + steps.map(function (s, i) {
    const n = i + 1;
    const cls = n < d.step ? 'done' : n === d.step ? 'active' : '';
    return '<div class="stp ' + cls + '"><span class="tick">' + (n === 6 && d.cnicDone ? ic('check', { s: 15 }) : n < d.step ? ic('check', { s: 15 }) : n) + '</span><span class="sl">' + s + '</span></div>';
  }).join('') + '</div>';

  let body = '';
  if (d.step === 1) {
    body = '<div class="field"><label>Professional title / tagline</label><input class="input" value="' + UI.esc(d.tagline) + '" placeholder="e.g. Certified AC technician" oninput="A.onb.set(\'tagline\',this.value)" /></div>' +
      '<div class="field"><label>Short bio</label><textarea class="textarea" placeholder="Tell customers about your experience and approach…" oninput="A.onb.set(\'bio\',this.value)">' + UI.esc(d.bio) + '</textarea></div>' +
      '<div class="field"><label>Phone (for customers)</label><input class="input" value="' + UI.esc(d.phone) + '" placeholder="+92 300 0000000" oninput="A.onb.set(\'phone\',this.value)" /></div>';
  }
  if (d.step === 2) {
    body = '<div class="field"><label>Select your skills <span class="req">*</span></label><div class="chips">' + SKILL_ALL.map(function (s) {
      const on = d.skills.indexOf(s) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.onb.toggleSkill(\'' + s + '\')">' + ic(svcByName(s).icon, { s: 14 }) + ' ' + s + '</button>';
    }).join('') + '</div><div class="fhint">Highlight your expertise — nearby job alerts follow your skills, but you can browse and apply to any job.</div></div>';
  }
  if (d.step === 3) {
    body = '<div class="field"><label>Service areas <span class="req">*</span></label><div class="chips">' + AREAS.map(function (a) {
      const on = d.areas.indexOf(a) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.onb.toggleArea(\'' + a + '\')">' + (on ? ic('check', { s: 13 }) : ic('pin', { s: 13 })) + ' ' + a + '</button>';
    }).join('') + '</div></div>';
  }
  if (d.step === 4) {
    body = '<div class="field"><label>Years of experience</label><select class="select" onchange="A.onb.set(\'years\',parseInt(this.value,10))">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(function (y) {
      return '<option value="' + y + '"' + (d.years === y ? ' selected' : '') + '>' + y + ' years</option>';
    }).join('') + '</select></div>' +
      '<div class="field"><label>Work history <span class="smallnote">(optional)</span></label><textarea class="textarea" placeholder="e.g. Worked with 3 appliance brands, handled 200+ AC repairs in Karachi…" oninput="A.onb.set(\'hi\',this.value)">' + UI.esc(d.hi) + '</textarea></div>';
  }
  if (d.step === 5) {
    body = '<div class="field"><label>Profile picture</label><div class="avatar-opts">' + AVATAR_COLORS.map(function (c) {
      return '<div class="avatar-opt' + (d.avatarColor === c ? ' on' : '') + '" style="background:' + c + '" onclick="A.onb.pickColor(\'' + c + '\')">' + initials(u.name) + '</div>';
    }).join('') + '</div>' +
      '<button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="A.onb.upload()">' + ic('camera', { s: 14 }) + ' Upload a photo</button>' +
      '<input type="file" id="onb-up" accept="image/*" style="display:none" /></div>' +
      (d.avatar ? '<div class="img-thumb" style="width:110px;height:110px;margin-top:10px"><img src="' + d.avatar + '" /></div>' : '');
  }
  if (d.step === 6) {
    body = '<div class="field"><label>CNIC (front) — for verification</label>' +
      uploadMock(d.cnic, 'cnic') + '</div>' +
      '<div class="field"><label>Selfie with your CNIC</label>' + uploadMock(d.selfie, 'selfie') + '</div>' +
      '<div class="notice brand">' + ic('shield') + '<span>Verification is instant in this demo. A verified badge appears on your profile and boosts customer trust.</span></div>';
  }

  function uploadMock(val, key) {
    if (val) {
      return '<div class="img-thumb" style="height:90px"><img src="' + val + '" /><button class="img-del" onclick="A.onb.delDoc(\'' + key + '\')">' + ic('trash', { s: 13 }) + '</button></div>';
    }
    return '<label class="upload-zone" style="padding:18px;display:block"><div style="display:flex;flex-direction:column;align-items:center;gap:5px">' + ic('file', { s: 22 }) + '<b style="font-size:13px">Upload document</b><span style="font-size:12px">JPG or PNG</span></div>' +
      '<input type="file" accept="image/*" style="display:none" onchange="A.onb.docs(\'' + key + '\',this.files[0])" /></label>';
  }

  const nav = '<div class="wiz-nav">' + (d.step > 1 ? '<button class="btn btn-outline" onclick="A.onb.prev()">' + ic('arrowL', { s: 15 }) + ' Back</button>' : '<span></span>') +
    (d.step < 6 ? '<button class="btn btn-primary" onclick="A.onb.next()">Continue ' + ic('arrowR', { s: 15 }) + '</button>' : '<button class="btn btn-primary btn-lg" onclick="A.onb.finish()">' + ic('shield', { s: 16 }) + ' Finish & Start Working</button>') + '</div>';

  const html = '<div class="card wiz-card"><div class="card-pad"><div class="wiz-wrap">' + stepper + '<div class="wiz-main"><div style="font-size:17px;font-weight:800;margin-bottom:14px">' + steps[d.step - 1] + '</div>' + body + nav + '</div></div></div></div>';
  return { html: html };
};

A.onb = {
  set: function (k, v) { const d = Store.draft(); if (d) { d[k] = v; Store.emit(); } },
  toggleSkill: function (s) { const d = Store.draft(); const i = d.skills.indexOf(s); if (i === -1) d.skills.push(s); else d.skills.splice(i, 1); R(); },
  toggleArea: function (a) { const d = Store.draft(); const i = d.areas.indexOf(a); if (i === -1) d.areas.push(a); else d.areas.splice(i, 1); R(); },
  pickColor: function (c) { const d = Store.draft(); d.avatarColor = c; R(); },
  upload: function () { const inp = document.getElementById('onb-up'); inp.onchange = function () { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = function () { const d = Store.draft(); d.avatar = rd.result; R(); }; rd.readAsDataURL(f); }; inp.click(); },
  docs: function (key, f) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = function () { const d = Store.draft(); d[key] = rd.result; if (key === 'selfie') d.cnicDone = true; R(); };
    rd.readAsDataURL(f);
  },
  delDoc: function (key) { const d = Store.draft(); d[key] = null; R(); },
  prev: function () { const d = Store.draft(); if (d) d.step = Math.max(1, d.step - 1); R(); },
  next: function () {
    const d = Store.draft();
    const err = function (m) { UI.toast(m, 'danger', 'Almost there'); };
    if (d.step === 2 && !d.skills.length) { err('Please select at least one skill.'); return; }
    if (d.step === 3 && !d.areas.length) { err('Please select your service areas.'); return; }
    if (d.step === 6 && !d.cnicDone) { err('Please upload your CNIC and selfie to finish verification.'); return; }
    d.step = d.step + 1;
    R();
  },
  finish: function () {
    const d = Store.draft();
    const u = Store.currentUser();
    Store.updateUser(u.id, {
      tagline: d.tagline || 'Professional at HUNAR',
      bio: d.bio, phone: d.phone, skills: d.skills, serviceAreas: d.areas, years: d.years,
      area: d.areas[0] || u.area, avatar: d.avatar, color: d.avatarColor, verified: true
    });
    Store.finishOnboarding(u.id);
    Store.clearDraft();
    UI.toast('Profile complete + verified. Start browsing nearby jobs!', 'ok', 'You’re live');
    go('/worker');
  }
};

Views.workerDashboard = function () {
  const u = Store.currentUser();
  if (u.onboarding) { go('/worker/onboarding'); return { html: '' }; }
  const nearby = Store.nearbyJobs();
  const active = Store.activeJobs('worker');
  const visits = Store.upcomingVisits('worker');
  const earn = Store.earnings();
  const doneJobs = Store.historyJobs('worker').filter(function (j) { return j.status !== 'cancelled'; });

  const stats = '<div class="stats">' +
    '<div class="stat"><span class="si si-t">' + ic('map', { s: 22 }) + '</span><div><div class="sv">' + nearby.length + '</div><div class="sl">Nearby jobs</div></div></div>' +
    '<div class="stat"><span class="si si-o">' + ic('briefcase', { s: 22 }) + '</span><div><div class="sv">' + active.length + '</div><div class="sl">Active jobs</div></div></div>' +
    '<div class="stat"><span class="si si-a">' + ic('calendar', { s: 22 }) + '</span><div><div class="sv">' + visits.length + '</div><div class="sl">Upcoming visits</div></div></div>' +
    '<div class="stat"><span class="si si-g">' + ic('wallet', { s: 22 }) + '</span><div><div class="sv">Rs. ' + earn.total.toLocaleString('en-PK') + '</div><div class="sl">Total earnings</div></div></div></div>';

  const nearbyHtml = nearby.length ? nearby.slice(0, 3).map(jobCardWorker).join('') : UI.empty('map', 'No jobs found near you', 'Open jobs near you will appear here. Try browsing all nearby jobs or widening your distance.', '');

  const activeHtml = active.length ? active.map(function (j) {
    const w = Store.userById(j.customerId);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/worker/active/' + j.id + '\')"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      (j.visitCharge ? '<div class="total-bar" style="margin-top:8px"><span>Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
      '<div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="go(\'/worker/active/' + j.id + '\')">Open Active Job</button></div></div></div>';
  }).join('') : '<p class="smallnote" style="padding:8px 4px">When a customer selects you, the job moves here to be driven through inspection & repair.</p>';

  const html = stats +
    '<div class="grid-2col" style="margin-top:20px">' +
    '<div class="stack"><div class="card card-h"><div><h3>Nearby Jobs</h3><p>New requests from customers near you</p></div><a class="btn btn-outline btn-sm" href="#/worker/jobs">Browse all</a></div>' + nearbyHtml + '</div>' +
    '<div class="stack"><div class="card card-h"><h3>Active Jobs</h3></div>' + activeHtml +
    '<div class="card card-h"><h3>Quick stats</h3></div>' +
    '<div class="card card-pad"><div class="kv"><span class="k">Completed jobs</span><span class="v">' + (u.jobsDone || 0) + '</span></div>' +
    '<div class="kv"><span class="k">Rating</span><span class="v">' + UI.rating(u.rating, u.ratingCount) + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Avg response</span><span class="v">~20 min</span></div></div></div></div>';

  return { html: html };
};

function jobCardWorker(j) {
  const cust = Store.userById(j.customerId);
  const dist = (j.distance && j.distance[Store.currentUser().id]) ? j.distance[Store.currentUser().id] : null;
  return '<div class="job-card" style="cursor:pointer" onclick="go(\'/worker/jobs/' + j.id + '\')"><div class="jc-body">' +
    '<div class="jc-top">' + ic(svcByName(j.category).icon, { s: 17, style: 'color:' + svcByName(j.category).css }) + '<b style="flex:1;font-size:15px">' + UI.esc(j.title) + '</b>' + (dist ? '<span class="badge b-white">' + ic('navigation', { s: 12 }) + ' ' + dist.toFixed(1) + ' km</span>' : '') + '</div>' +
    '<div class="jc-desc">' + UI.esc(j.description || '') + '</div>' +
    UI.mediaRow(j) +
    UI.jobMetaRow(j, { dist: dist ? { km: dist.toFixed(1) } : null }) +
    '<div style="display:flex;gap:8px;margin-top:10px"><span class="smallnote" style="flex:1;align-self:center">' + UI.esc(cust ? cust.name.slice(0, 1) + '…' : 'Customer') + ' · ' + timeAgo(j.createdAt) + '</span>' +
    (j.offers.some(function (o) { return o.workerId === Store.currentUser().id; })
      ? '<button class="btn btn-soft btn-sm" onclick="go(\'/worker/offers/' + j.id + '\')">' + ic('eye', { s: 14 }) + ' View My Offer</button>'
      : '<button class="btn btn-primary btn-sm" onclick="go(\'/worker/jobs/' + j.id + '\')">' + ic('send', { s: 14 }) + ' Send Offer</button>') +
    '</div></div></div>';
}

Views.workerJobs = function () {
  const u = Store.currentUser();
  if (u.onboarding) { go('/worker/onboarding'); return { html: '' }; }
  const all = Store.nearbyJobs();
  const html =
    '<div class="card card-pad" style="margin-bottom:18px">' +
    '<div class="split" style="align-items:end;gap:12px">' +
    '<div class="field" style="margin:0;min-width:170px"><label>Category</label><select id="wflt-cat" class="select"><option value="">All</option>' + SKILL_ALL.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" style="margin:0;min-width:150px;flex:1"><label>Max distance: <span id="wflt-dl">15 km</span></label><input type="range" id="wflt-d" min="1" max="20" value="15" step="1" style="width:100%;accent-color:var(--brand)" /></div>' +
    '<button class="btn btn-primary" onclick="A.wfilter()">' + ic('search', { s: 15 }) + ' Apply</button></div></div>' +
    '<div class="section-sub" id="nf-count" style="margin-bottom:16px"></div>' +
    '<div id="nf-grid" class="stack" style="gap:14px">' + all.map(jobCardWorker).join('') + '</div>';
  return { html: html, mount: function () {
      const d = document.getElementById('wflt-d');
      if (d) d.addEventListener('input', function () { document.getElementById('wflt-dl').textContent = this.value + ' km'; });
      applyWorkerJobsFilter(all);
    } };
};

function applyWorkerJobsFilter(all) {
  const cat = document.getElementById('wflt-cat').value;
  const md = parseFloat(document.getElementById('wflt-d').value || '15');
  const u = Store.currentUser();
  const list = all.filter(function (j) {
    if (cat && j.category !== cat) return false;
    const dist = (j.distance && j.distance[u.id]) || randDist(j.id + u.id, u.radius || 10);
    return dist <= md;
  });
  document.getElementById('nf-count').textContent = list.length + ' job' + (list.length === 1 ? '' : 's') + ' found nearby';
  document.getElementById('nf-grid').innerHTML = list.length ? list.map(jobCardWorker).join('') : UI.empty('map', 'No jobs found in your service area', 'Try a different category or widen your distance.', '<a class="btn btn-outline btn-sm" href="#/worker/profile">Edit profile</a>');
}
A.wfilter = function () {
  applyWorkerJobsFilter(Store.nearbyJobs());
};

Views.workerJob = function (params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j) return { html: UI.empty('alert', 'Job not found', '') + '<a class="btn btn-primary" href="#/worker">Back</a>' };
  const myOffer = j.offers.find(function (o) { return o.workerId === u.id; });
  if (myOffer && j.selectedOffer && j.selectedOffer.workerId === u.id) {
    if (['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress', 'completed'].indexOf(j.status) !== -1) { go('/worker/active/' + j.id); return { html: '' }; }
  }
  const cust = Store.userById(j.customerId);
  const dist = (j.distance && j.distance[u.id]) || randDist(j.id + u.id, u.radius || 10);

  const requestCard = '<div class="card"><div class="card-h"><h3>Customer Request</h3>' + (j.offers.some(function (o) { return o.workerId === u.id; }) ? '<span class="badge b-ok">' + ic('check', { s: 12 }) + ' Offer sent</span>' : '') + '</div><div class="card-pad">' +
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><span class="svc-icon" style="background:' + svcByName(j.category).bg + ';color:' + svcByName(j.category).css + '">' + ic(svcByName(j.category).icon, { s: 18 }) + '</span><div><b style="font-size:15.5px">' + UI.esc(j.title) + '</b><div class="smallnote">' + j.category + ' · Posted ' + timeAgo(j.createdAt) + ' · ' + j.id + '</div></div></div>' +
    '<p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">' + UI.esc(j.description || 'No additional description provided.') + '</p>' +
    UI.mediaRow(j) + '</div></div>';

  const infoCard = '<div class="card"><div class="card-h"><h3>Job Details</h3></div><div class="card-pad">' +
    '<div class="kv"><span class="k">Customer</span><span class="v">' + UI.esc(cust ? cust.name : 'Customer') + '</span></div>' +
    '<div class="kv"><span class="k">Location</span><span class="v">' + UI.esc((j.location && j.location.area) || '—') + '</span></div>' +
    '<div class="kv"><span class="k">Distance from you</span><span class="v">' + dist.toFixed(1) + ' km</span></div>' +
    '<div class="kv"><span class="k">Preferred visit</span><span class="v">' + UI.esc(j.prefDate || 'Flexible') + (j.prefTime && j.prefTime !== 'Flexible' ? ' · ' + UI.esc(j.prefTime) : '') + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Posted</span><span class="v">' + timeAgo(j.createdAt) + '</span></div></div></div>';

  let offerPanel = '';
  if (myOffer) {
    const st = offerStatus(j, myOffer);
    offerPanel = '<div class="card"><div class="card-h"><div><h3>My Estimated Offer</h3><p>The customer has been notified</p></div>' + st.badge + '</div><div class="card-pad">' +
      offerBreakdownHtml(myOffer) +
      '<div class="kv" style="border-bottom:none"><span class="k">Status</span><span class="v">' + st.label + '</span></div>' +
      '<a class="btn btn-outline btn-sm" style="margin-top:12px" href="#/worker/offers/' + j.id + '">' + ic('eye', { s: 14 }) + ' Track my offer status</a></div></div>';
  } else if (j.selectedOffer && j.selectedOffer.workerId !== u.id) {
    offerPanel = '<div class="notice amber">' + ic('info') + '<span>A worker has already been selected for this job. It may be removed from nearby jobs at any time.</span></div>';
  } else {
    offerPanel = '<div class="card"><div class="card-h"><h3>Send Estimated Offer</h3></div><div class="card-pad">' +
      '<label style="font-weight:650;font-size:13px;color:var(--ink-2)">Visit &amp; Diagnosis (Rs.)</label>' +
      '<input type="number" id="of-amount" class="input" placeholder="e.g. 300" min="50" value="' + (u.visitCharge || 300) + '" style="margin-top:8px" />' +
      '<label style="font-weight:650;font-size:13px;color:var(--ink-2);display:block;margin-top:10px">Estimated Repair (Rs.)</label>' +
      '<input type="number" id="of-estimate" class="input" placeholder="e.g. 1200" min="50" style="margin-top:8px" />' +
      '<div class="total-bar" style="margin-top:12px"><span>Estimated Total</span><span class="v" id="of-total">Rs. 0</span></div>' +
      '<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="A.workerSendOffer(\'' + j.id + '\')">' + ic('send', { s: 15 }) + ' Submit Offer</button>' +
      '<div class="fhint">The visit &amp; diagnosis charge covers travel and the on-site inspection. The estimated repair is your best guess — the final quote is given after you inspect the problem.</div></div></div>';
  }

  return { html: '<div class="grid-2col"><div class="main-col stack">' + requestCard + offerPanel + '</div><div class="stack">' + infoCard + '<div class="card card-pad"><b>Tip</b><p style="font-size:13px;color:var(--muted);margin-top:4px">Send a competitive visit charge to win the job — customers compare all offers before choosing.</p></div></div></div>',
    mount: function () {
      const amt = document.getElementById('of-amount');
      const est = document.getElementById('of-estimate');
      const tot = document.getElementById('of-total');
      if (!amt || !est || !tot) return;
      var upd = function () { tot.textContent = 'Rs. ' + ((parseInt(amt.value, 10) || 0) + (parseInt(est.value, 10) || 0)); };
      amt.addEventListener('input', upd);
      est.addEventListener('input', upd);
      upd();
    }
  };
};

Views.workerOffers = function () {
  const u = Store.currentUser();
  const mine = Store.jobsFor('worker').filter(function (j) { return !j.cancelled && j.offers.some(function (o) { return o.workerId === u.id; }); });
  const html = mine.length ? '<div class="stack">' + mine.map(function (j) {
    const of = j.offers.find(function (o) { return o.workerId === u.id; });
    const st = offerStatus(j, of);
    return '<div class="job-card" onclick="go(\'/worker/offers/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(j.title) + '</b>' + st.badge + '</div>' +
      UI.jobMetaRow(j) +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><span class="smallnote">My offer: </span><b>' + fmtRs(of.amount) + '</b>' +
      (of.estimate ? '<span class="smallnote">' + ic('tag', { s: 12 }) + ' est. ' + fmtRs(of.estimate) + '</span>' : '') +
      '<span style="margin-left:auto">' + st.label + '</span></div></div></div>';
  }).join('') + '</div>' : UI.empty('send', 'No offers sent yet', 'Browse nearby jobs and send a visit offer to get started.', '<a class="btn btn-primary" href="#/worker/jobs">Browse Nearby Jobs</a>');
  return { html: html };
};

function offerStatus(j, of) {
  if (!of) return { badge: UI.statusBadge(j.status), label: '' };
  if (j.selectedOffer && j.selectedOffer.id === of.id) {
    if (j.status === 'visit_confirmed' || j.status === 'on_the_way' || j.status === 'arrived' || j.status === 'inspection' || j.status === 'repair_negotiation' || j.status === 'repair_agreed' || j.status === 'repair_approved' || j.status === 'repair_in_progress' || j.status === 'completed') return { badge: '<span class="badge b-ok">' + ic('checkC', { s: 12 }) + ' Accepted</span>', label: 'Visit confirmed' };
  }
  if (j.selectedOffer && j.selectedOffer.id !== of.id) return { badge: '<span class="badge b-danger">' + ic('x', { s: 12 }) + ' Rejected</span>', label: 'Customer selected another worker' };
  if (of.status === 'rejected') return { badge: '<span class="badge b-danger">' + ic('x', { s: 12 }) + ' Rejected</span>', label: '' };
  if (of.status === 'viewed') return { badge: '<span class="badge b-info">' + ic('eye', { s: 12 }) + ' Customer viewing</span>', label: 'Customer opened your offer' };
  return { badge: '<span class="badge b-white">' + ic('send', { s: 12 }) + ' Offer Sent</span>', label: 'Waiting for customer response' };
}
function u2id() { return Store.currentUser().id; }

Views.workerOfferDetail = function (params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j || !j.offers.some(function (o) { return o.workerId === u.id; })) {
    return { html: UI.empty('alert', 'Offer not found', '') + '<a class="btn btn-primary" href="#/worker/offers">Back to offers</a>' };
  }
  const of = j.offers.find(function (o) { return o.workerId === u.id; });
  const st = offerStatus(j, of);
  return { html: '<div class="card"><div class="card-h"><h3>' + UI.esc(j.title) + '</h3>' + st.badge + '</div><div class="card-pad">' +
    UI.jobMetaRow(j) +
    offerBreakdownHtml(of) +
    '<p style="color:var(--muted);font-size:13px;margin-top:10px">' + st.label + '</p>' +
    (j.status === 'visit_confirmed' ? '<a class="btn btn-primary" style="margin-top:14px" href="#/worker/active/' + j.id + '">Open Active Job</a>' : '') +
    '</div></div>' };
};

Views.workerVisits = function () {
  const visits = Store.upcomingVisits('worker');
  const html = visits.length ? '<div class="stack">' + visits.map(function (v) {
    const cust = Store.userById(v.customerId);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/worker/active/' + v.id + '\')"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(v.title) + '</b>' + UI.statusBadge(v.status) + '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">' +
      (cust ? '<div style="display:flex;gap:10px;align-items:center">' + UI.avatar(cust) + '<div><b style="font-size:14px">' + UI.esc(cust.name) + '</b><div class="smallnote">' + UI.esc((v.location && v.location.area) || '') + '</div></div></div>' : '') +
      '<div class="smallnote" style="font-size:13px">' + ic('calendar', { s: 13 }) + ' ' + UI.esc(v.prefDate || 'Flexible') + ' · ' + ic('clock', { s: 13 }) + ' ' + UI.esc(v.prefTime) + '</div>' +
      (v.visitCharge ? '<div class="total-bar" style="margin-left:auto"><span>Visit charge</span><span class="v">' + fmtRs(v.visitCharge) + '</span></div>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('calendar', 'No upcoming visits', 'Confirmed visits will appear here, along with Start Visit actions.', '<a class="btn btn-primary" href="#/worker/jobs">Find jobs</a>');
  return { html: html };
};

Views.workerActive = function () {
  const active = Store.activeJobs('worker');
  const html = active.length ? '<div class="stack">' + active.map(function (j) {
    return '<div class="job-card" onclick="go(\'/worker/active/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      (j.visitCharge ? '<div class="total-bar" style="margin-top:8px"><span>Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
      '<div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="go(\'/worker/active/' + j.id + '\')">' + ic('eye', { s: 14 }) + ' Open Job</button></div></div></div>';
  }).join('') + '</div>' : UI.empty('briefcase', 'No active jobs', 'Once a customer selects you, the job appears here and you drive it through inspection, repair and payment.', '<a class="btn btn-primary" href="#/worker/jobs">Browse Nearby Jobs</a>');
  return { html: html };
};

Views.workerActiveJob = function (params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j || j.workerId !== u.id) {
    return { html: UI.empty('alert', 'Job not found', 'You are not assigned to this job.') + '<a class="btn btn-primary" href="#/worker">Back</a>' };
  }
  const cust = Store.userById(j.customerId);
  const isRepairMode = parseHash().qs.repair === '1';

  let panel = '';
  if (j.status === 'visit_confirmed' || j.status === 'on_the_way') {
    panel = '<div class="card"><div class="card-h"><h3>Visit Appointment</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="kv"><span class="k">Customer</span><span class="v">' + UI.esc(cust.name) + '</span></div>' +
      '<div class="kv"><span class="k">Date / Time</span><span class="v">' + UI.esc(j.prefDate || 'Flexible') + ' · ' + UI.esc(j.prefTime) + '</span></div>' +
      '<div class="kv"><span class="k">Location</span><span class="v">' + UI.esc((j.location && j.location.area) || '—') + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Visit charge</span><span class="v" style="color:var(--brand)">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
      (j.status === 'visit_confirmed' ? '<button class="btn btn-primary" onclick="A.wTransition(\'' + j.id + '\',\'on_the_way\')">' + ic('truck', { s: 16 }) + ' Start Visit</button>' : '<button class="btn btn-primary" onclick="A.wTransition(\'' + j.id + '\',\'arrived\')">' + ic('pin', { s: 16 }) + ' I&rsquo;ve Arrived</button>') +
      '<button class="btn btn-danger" onclick="A.cancelVisit(\'' + j.id + '\',\'worker\')">Cancel</button></div>' +
      '<div class="fhint" style="margin-top:10px">Clicking ' + (j.status === 'visit_confirmed' ? 'Start Visit' : 'I&rsquo;ve Arrived') + ' updates the customer in real time.</div>' +
      '</div></div>';
  }
  else if (j.status === 'arrived' || j.status === 'inspection') {
    const formOk = j.status === 'inspection';
    panel = '<div class="card"><div class="card-h"><div><h3>Inspection</h3><p>Diagnose the problem and quote a repair price</p></div>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="notice brand">' + ic('search') + '<span><b>Problem:</b> ' + UI.esc(j.title) + '</span></div>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">' + UI.esc(j.description || '') + '</p>' +
      '<div class="field"><label>Inspection result</label><input class="input" id="ins-result" placeholder="e.g. AC capacitor is damaged" /></div>' +
      '<div class="field"><label>Required repair</label><input class="input" id="ins-required" placeholder="e.g. Replace capacitor" /></div>' +
      '<div class="field"><label>Final Repair Quote (Rs.)</label><input type="number" id="ins-est" class="input" placeholder="e.g. 700" min="50" /></div>' +
      '<div class="fhint">After inspecting, give the customer the final quote — it can differ from your offer estimate.</div>' +
      '<button class="btn btn-primary btn-lg btn-block" style="margin-top:12px" onclick="A.submitInspection(\'' + j.id + '\')">' + ic('send', { s: 16 }) + ' Submit Final Quote</button>' +
      '</div></div>';
  }
  else if (j.status === 'repair_negotiation' || j.status === 'repair_agreed') {
    const r = j.repair;
    panel = '<div class="card"><div class="card-h"><h3>' + (j.status === 'repair_agreed' ? 'Repair Agreed' : 'Quote Sent') + '</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="notice brand">' + ic('search') + '<span><b>Inspection result:</b> ' + UI.esc(r.result) + '</span></div>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">' + UI.esc(r.required) + '</p>' +
      '<div class="kv"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Final Repair Quote</span><span class="v" style="color:var(--brand);font-size:17px;font-weight:800">' + fmtRs(r.estimate) + '</span></div>' +
      (j.status === 'repair_agreed'
        ? '<div class="notice amber" style="margin-top:14px">' + ic('clock') + '<span>Waiting for the customer to approve the final quote. You’ll be able to start instantly after approval.</span></div>'
        : '<div class="notice amber" style="margin-top:14px">' + ic('clock') + '<span>Quote sent to the customer. They can approve to start the repair, or reject and the job ends.</span></div>') +
      '</div></div>';
  }
  else if (j.status === 'repair_approved') {
    panel = '<div class="card"><div class="card-h"><h3>Approved — Ready to Repair</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="kv"><span class="k">Visit</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair.approvedEstimate) + '</span></div>' +
      extraBillingRows(j) +
      '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
      '<button class="btn btn-primary btn-lg btn-block" style="margin-top:14px" onclick="A.startRepair(\'' + j.id + '\')">' + ic('wrench', { s: 16 }) + ' Start Repair</button>' +
      '</div></div>';
  }
  else if (j.status === 'repair_in_progress') {
    panel = '<div class="card"><div class="card-h"><div><h3>Repair In Progress</h3><p>The customer is tracking this live</p></div>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="notice brand">' + ic('wrench') + '<span>' + UI.esc(j.repair.required) + '</span></div>' +
      '<button class="btn btn-primary btn-lg btn-block" style="margin-top:14px" onclick="A.completeRepair(\'' + j.id + '\')">' + ic('checkC', { s: 17 }) + ' Mark Repair Complete</button>' +
      '</div></div>';
  }
  else if (j.status === 'completed' || j.status === 'paid' || j.status === 'reviewed') {
    panel = '<div class="card"><div class="card-h"><h3>' + (j.status === 'paid' ? 'Paid' : 'Completed') + '</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      (j.status === 'completed'
        ? '<div class="notice amber">' + ic('wallet') + '<span>Repair is complete — awaiting customer payment. You’ll be notified instantly when it arrives.</span></div>'
        : '<div class="notice ok" style="background:var(--ok-bg)">' + ic('checkC') + (j.status === 'paid' ? '<span>The customer has paid ' + fmtRs(j.payment.amount) + '. Money is on its way to your wallet.</span>' : '<span>Job complete and reviewed.</span>') + '</div>') +
      (j.payment ? '<div class="kv" style="margin-top:12px"><span class="k">Payment received</span><span class="v" style="color:var(--ok)">' + fmtRs(j.payment.amount) + '</span></div>' : '') +
      proofSectionHtml(j) +
      '</div></div>';
  }

  const timelineCard = '<div class="card"><div class="card-h"><h3>Job Stage</h3></div><div class="card-pad">' + UI.jobTimeline(j) + '</div></div>';

  const infoCard = '<div class="card"><div class="card-h"><h3>Customer & Job</h3></div><div class="card-pad">' +
    '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' + UI.avatar(cust) + '<div><b>' + UI.esc(cust.name) + '</b><div class="smallnote">' + UI.esc((j.location && j.location.area) || '') + '</div></div></div>' +
    '<p style="font-size:14px;color:var(--ink-2);margin-bottom:10px">' + UI.esc(j.title) + '</p>' +
    UI.mediaRow(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Preferred time</span><span class="v">' + UI.esc(j.prefDate || 'Flexible') + ' · ' + UI.esc(j.prefTime) + '</span></div></div></div>';

  const costCard = (j.visitCharge || j.repair.approvedEstimate) ? '<div class="card"><div class="card-h"><h3>Money</h3></div><div class="card-pad">' +
    (j.visitCharge ? '<div class="kv"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
    (j.repair.approvedEstimate ? '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair.approvedEstimate) + '</span></div>' : '') +
    extraBillingRows(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div></div></div>' : '';

  const html = '<div class="grid-2col"><div class="main-col stack">' + panel + extraWorkCard(j, 'worker') + infoCard + '</div><div class="stack">' + timelineCard + costCard + '</div></div>';
  return { html: html };
};

Views.workerCompleted = function () {
  const done = Store.historyJobs('worker');
  const html = done.length ? '<div class="stack">' + done.map(function (j) {
    return '<div class="job-card" onclick="go(\'/worker/active/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + UI.esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      (j.cancelled ? '<div class="smallnote" style="margin-top:4px">' + UI.esc(j.cancelled.reason || 'Cancelled') + '</div>' : '') +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:8px"><span class="smallnote">' + timeAgo(j.createdAt) + '</span>' +
      (j.completion ? '<span class="badge b-ok" style="margin-left:auto">' + ic('camera', { s: 12 }) + ' Proof sent</span>' : '') +
      (j.payment ? '<span class="badge b-ok">' + ic('wallet', { s: 12 }) + ' +' + fmtRs(j.payment.amount) + '</span>' : '') +
      (j.review ? '<span class="badge b-brand">' + ic('star', { s: 12 }) + ' ' + j.review.rating + '.0</span>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('checkC', 'No completed jobs yet', 'Completed and paid jobs will appear here.', '<a class="btn btn-primary" href="#/worker/jobs">Find Jobs</a>');
  return { html: html };
};

Views.workerEarnings = function () {
  const earn = Store.earnings();
  const pays = Store.state().payments.filter(function (p) { return p.workerId === Store.currentUser().id; });
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = (d.getMonth() + 1) + '-' + d.getFullYear();
    months.push({ key: key, label: d.toLocaleDateString('en-GB', { month: 'short' }) });
  }
  const maxV = Math.max.apply(null, months.map(function (m) { return earn.monthly[m.key] || 0; }).concat([100]));
  const chart = '<div style="display:flex;gap:10px;align-items:flex-end;height:140px;padding:10px 4px 0">' + months.map(function (m) {
    const v = earn.monthly[m.key] || 0;
    const h = Math.max(6, Math.round(v / maxV * 110));
    return '<div style="flex:1;text-align:center"><div style="height:110px;display:flex;align-items:flex-end;justify-content:center"><div style="width:60%;background:var(--brand-grad);border-radius:6px 6px 0 0;height:' + h + 'px;min-width:18px" title="' + fmtRs(v) + '"></div></div><div style="font-size:11px;color:var(--muted);font-weight:700;margin-top:6px">' + m.label + '</div></div>';
  }).join('') + '</div>';

  const html = '<div class="stats cols-3" style="margin-bottom:18px">' +
    '<div class="stat"><span class="si si-g">' + ic('wallet', { s: 22 }) + '</span><div><div class="sv">' + fmtRs(earn.total) + '</div><div class="sl">Total earnings</div></div></div>' +
    '<div class="stat"><span class="si si-t">' + ic('checkC', { s: 22 }) + '</span><div><div class="sv">' + (Store.statsForWorker().completed) + '</div><div class="sl">Jobs completed</div></div></div>' +
    '<div class="stat"><span class="si si-a">' + ic('star', { s: 22 }) + '</span><div><div class="sv">' + (Store.currentUser().rating || 'New') + '</div><div class="sl">Rating</div></div></div></div>' +
    '<div class="card" style="margin-bottom:18px"><div class="card-h"><h3>Last 6 months</h3></div><div class="card-pad">' + chart + '</div></div>' +
    '<div class="card"><div class="card-h"><h3>Payment History</h3></div>' +
    (pays.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Job</th><th>Method</th><th>Date</th><th class="right">Amount</th></tr></thead><tbody>' +
    pays.map(function (p) {
      const j = Store.jobById(p.jobId);
      return '<tr><td><b>' + UI.esc(j ? j.title : p.jobId) + '</b><div class="smallnote">' + p.jobId + '</div></td><td><span class="badge b-white">' + ic(p.method === 'cash' ? 'cash' : p.method === 'card' ? 'card' : 'wallet', { s: 13 }) + ' ' + p.method + '</span></td><td>' + timeAgo(p.at) + '</td><td class="right"><b style="color:var(--ok)">+' + fmtRs(p.amount) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>' : UI.empty('wallet', 'No earnings yet', 'Payments from completed jobs will appear here.', '')) + '</div>';
  return { html: html };
};

Views.workerReviews = function () {
  const rvs = Store.reviewsFor(Store.currentUser().id).filter(function (r) { return r.text || r.rating; });
  const html = '<div class="card">' + (rvs.length ? rvs.map(function (r) {
    return '<div class="notif-item"><div class="n-ic" style="background:var(--amber-bg);color:#b45309">' + ic('star', { s: 18 }) + '</div><div style="flex:1"><h4>' + UI.esc(r.customerName || 'Customer') + '</h4><div class="rating" style="margin:4px 0">' + UI.stars(r.rating, 14) + '</div><p>' + UI.esc(r.text || '') + '</p><div class="n-t">' + timeAgo(r.at) + '</div></div></div>';
  }).join('') : UI.empty('star', 'No reviews yet', 'Reviews will appear after completing jobs.', '')) + '</div>';
  return { html: html };
};

Views.workerProfile = function () {
  const u = Store.currentUser();
  const html = '<div class="grid-2col"><div class="card card-pad">' +
    '<div style="display:flex;gap:16px;align-items:center;margin-bottom:20px">' + UI.avatar(u, 'xl') +
    '<div style="min-width:0"><div style="font-size:19px;font-weight:800">' + UI.esc(u.name) + (u.verified ? ' ' + ic('shield', { s: 16, style: 'color:var(--brand)' }) : '<span class="badge b-muted" style="margin-left:6px">Unverified</span>') + '</div>' +
    '<div style="color:var(--muted);font-size:13px">' + UI.esc(u.tagline || 'Professional at HUNAR') + '</div>' +
    (u.rating ? '<div style="margin-top:6px">' + UI.rating(u.rating, u.ratingCount) + '</div>' : '<div class="smallnote" style="margin-top:6px">No ratings yet — new workers appear as “New”.</div>') + '</div></div>' +
    '<div class="field"><label>Professional title</label><input class="input" id="wk-tag" value="' + UI.esc(u.tagline || '') + '" /></div>' +
    '<div class="field"><label>Bio</label><textarea class="textarea" id="wk-bio">' + UI.esc(u.bio || '') + '</textarea></div>' +
    '<div class="field"><label>Skills</label><div class="chips">' + SKILL_ALL.map(function (s) {
      const on = (u.skills || []).indexOf(s) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.wskill(\'' + s + '\',this)">' + ic(svcByName(s).icon, { s: 13 }) + ' ' + s + '</button>';
    }).join('') + '</div></div>' +
    '<div class="field"><label>Service areas</label><div class="chips">' + AREAS.map(function (a) {
      const on = (u.serviceAreas || []).indexOf(a) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.warea(\'' + a + '\',this)">' + a + '</button>';
    }).join('') + '</div></div>' +
    '<div class="f-row"><div class="field"><label>Visit charge (Rs.)</label><input type="number" class="input" id="wk-vc" value="' + (u.visitCharge || '') + '" /></div>' +
    '<div class="field"><label>Phone</label><input class="input" id="wk-ph" value="' + UI.esc(u.phone || '') + '" /></div></div>' +
    '<button class="btn btn-primary" onclick="A.wsave()">' + ic('check', { s: 15 }) + ' Save Profile</button></div>' +
    '<div class="stack"><div class="card card-pad"><h3 style="margin-bottom:10px">My Portfolio</h3>' +
    (u.portfolio && u.portfolio.length ? u.portfolio.map(function (p) { return '<div class="kv"><span class="k">' + UI.esc(p) + '</span><span class="v">' + ic('check', { s: 13, style: 'color:var(--ok)' }) + '</span></div>'; }).join('') : '<p class="smallnote">Add portfolio entries after completing work.</p>') +
    '<button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="A.wport()">' + ic('plus', { s: 13 }) + ' Add portfolio item</button></div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:10px">Stats</h3>' +
    '<div class="kv"><span class="k">Jobs completed</span><span class="v">' + (u.jobsDone || 0) + '</span></div>' +
    '<div class="kv"><span class="k">Response time</span><span class="v">' + UI.esc(u.responses || '~20 min') + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Member since</span><span class="v">' + u.joined + '</span></div></div></div></div>';
  return { html: html };
};

A.wskill = function (s, el) {
  const u = Store.currentUser();
  const skills = (u.skills || []).slice();
  const i = skills.indexOf(s);
  if (i === -1) skills.push(s); else skills.splice(i, 1);
  Store.updateUser(u.id, { skills: skills });
  el.classList.toggle('on');
  UI.toast('Skills updated.', 'ok', 'Saved');
};
A.warea = function (a, el) {
  const u = Store.currentUser();
  const areas = (u.serviceAreas || []).slice();
  const i = areas.indexOf(a);
  if (i === -1) areas.push(a); else areas.splice(i, 1);
  Store.updateUser(u.id, { serviceAreas: areas });
  el.classList.toggle('on');
};
A.wsave = function () {
  const u = Store.currentUser();
  Store.updateUser(u.id, {
    tagline: document.getElementById('wk-tag').value.trim(),
    bio: document.getElementById('wk-bio').value.trim(),
    visitCharge: parseInt(document.getElementById('wk-vc').value, 10) || u.visitCharge,
    phone: document.getElementById('wk-ph').value.trim()
  });
  UI.toast('Professional profile saved.', 'ok', 'Saved');
};
A.wport = function () {
  UI.openModal('<div class="modal-h"><h3>Add Portfolio Item</h3><button class="icon-btn" onclick="A.closeModalX()">' + ic('x') + '</button></div>' +
    '<div class="modal-b"><div class="field"><label>Description</label><input class="input" id="port-in" placeholder="e.g. Fixed central AC at British Council" /></div>' +
    '<button class="btn btn-primary btn-block" onclick="A.wportAdd()">Add</button></div>');
};
A.wportAdd = function () {
  const v = document.getElementById('port-in').value.trim();
  if (!v) return;
  const u = Store.currentUser();
  const port = (u.portfolio || []).slice();
  port.push(v);
  Store.updateUser(u.id, { portfolio: port });
  UI.closeModal(); R();
};
A.closeModalX = function () { UI.closeModal(); R(); };

Views.workerSettings = function () {
  const html = '<div class="grid-2col"><div class="card"><div class="card-h"><h3>Availability & Notifications</h3></div><div class="card-pad">' +
    settingRow('clock3', 'Accept new jobs', 'Show my profile for new nearby jobs', true) +
    settingRow('bell', 'Nearby job alerts', 'Notify me when a new job is posted near me', true) +
    settingRow('chat', 'Offer & negotiation alerts', 'When customers counters or accepts', true) +
    settingRow('wallet', 'Payment notifications', 'When a customer pays', true) + '</div></div>' +
    '<div class="stack"><div class="card"><div class="card-h"><h3>Demo data</h3></div><div class="card-pad">' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">Reset the entire demo — jobs, offers, payments and reviews.</p>' +
    '<button class="btn btn-outline" style="color:var(--danger);border-color:#f3c7c8" onclick="A.resetDemo()">' + ic('refresh', { s: 15 }) + ' Reset demo data</button></div></div>' +
    '<div class="card card-pad"><b>Account</b>' +
    '<div class="kv" style="margin-top:8px"><span class="k">Account type</span><span class="v">Worker</span></div>' +
    '<div class="kv"><span class="k">Email</span><span class="v">' + UI.esc(Store.currentUser().email) + '</span></div>' +
    '<div style="margin-top:12px"><button class="btn btn-danger-solid" onclick="A.logout()">' + ic('logout', { s: 15 }) + ' Log out</button></div></div></div></div>';
  return { html: html };
};

Store.boot();
render();