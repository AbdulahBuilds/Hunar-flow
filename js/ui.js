const UI = {
  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },

  toast: function (msg, type, title) {
    const root = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    const icn = type === 'danger' ? 'alert' : type === 'ok' ? 'checkC' : 'bell';
    el.innerHTML = '<span>' + ic(icn, { s: 18 }) + '</span><div><div class="tt">' + UI.esc(title || '') + '</div><div class="tb">' + UI.esc(msg) + '</div></div>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'all .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(function () { el.remove(); }, 300);
    }, 3800);
  },

  _modalEl: null,
  openModal: function (html, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const wasOpen = this._modalEl;
    if (wasOpen) wasOpen.remove();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal' + (opts.lg ? ' lg' : '') + '">' + html + '</div>';
    ov.addEventListener('mousedown', function (e) {
      if (e.target === ov && opts.backdropClose !== false) ov.remove();
    });
    root.appendChild(ov);
    this._modalEl = ov;
    if (opts.onMount) setTimeout(opts.onMount, 0);
    return {
      close: function () { ov.remove(); },
      el: ov
    };
  },
  closeModal: function () {
    if (this._modalEl) this._modalEl.remove();
    this._modalEl = null;
  },

  confirm: function (opts) {
    const icn = opts.icon || 'alert';
    const icCls = opts.danger ? 'danger' : '';
    UI.openModal(
      '<div class="modal-b" style="text-align:center;padding:30px 26px 22px">' +
      '<div class="confirm-ic" style="' + (opts.danger ? '' : 'background:var(--brand-3);color:var(--brand);') + '">' + ic(icn, { s: 26 }) + '</div>' +
      '<h3 style="font-size:18px;font-weight:800;margin-bottom:8px">' + UI.esc(opts.title) + '</h3>' +
      '<p style="color:var(--muted);font-size:14px;max-width:400px;margin:0 auto">' + UI.esc(opts.body || '') + '</p>' +
      '</div>' +
      '<div class="modal-f">' +
      '<button class="btn btn-ghost" data-close="1">' + UI.esc(opts.cancelText || 'Keep ') + '</button>' +
      '<button class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-confirm="1">' + UI.esc(opts.okText || 'Confirm') + '</button>' +
      '</div>',
      {
        onMount: function () {
          const el = UI._modalEl;
          const okBtn = el.querySelector('[data-confirm]');
          const cancelBtn = el.querySelector('[data-close]');
          cancelBtn.addEventListener('click', function () { el.remove(); opts.onCancel && opts.onCancel(); });
          okBtn.addEventListener('click', function () { el.remove(); opts.onOk && opts.onOk(); });
        }
      }
    );
  },

  loader: function (html) {
    const root = document.getElementById('loading-root');
    root.innerHTML = '<div class="modal-overlay" style="z-index:220;align-items:center"><div style="text-align:center;color:#fff"><div class="spin" style="margin:0 auto 16px;border-color:rgba(255,255,255,.25);border-top-color:#fff"></div><div style="font-weight:700">' + (html || 'Processing…') + '</div></div></div>';
  },
  clearLoader: function () {
    document.getElementById('loading-root').innerHTML = '';
  },

  avatar: function (u, size, opts) {
    opts = opts || {};
    const cls = size === 'lg' ? ' av-lg' : size === 'xl' ? ' av-xl' : '';
    const col = u.color || '#123b5d';
    const inner = u.avatar
      ? '<img src="' + UI.esc(u.avatar) + '" alt="" />'
      : UI.esc(initials(u.name));
    let vb = '';
    if (u.verified) vb = '<span class="vbadge">' + ic('shield', { s: 11 }) + '</span>';
    let on = '';
    if (opts.online) on = '<span class="online"></span>';
    return '<span class="avatar' + cls + '" style="background:' + col + '">' + inner + on + vb + '</span>';
  },

  stars: function (r, s) {
    r = Math.round((r || 0) * 2) / 2;
    let out = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= r) out += starFilled(s);
      else if (i - r === 0.5) out += starFilled(s);
      else out += starEmpty(s);
    }
    return out;
  },

  rating: function (r, cnt) {
    return '<span class="rating">' + this.stars(r, 15) +
      (r ? '<span class="rtxt">' + (Number(r).toFixed(1)) + '</span>' : '<span class="rtxt">New</span>') +
      (cnt ? '<span class="rcnt">(' + cnt + ')</span>' : '') + '</span>';
  },

  money: function (v) { return fmtRs(v); },

  statusBadge: function (st) {
    const m = {
      receiving_offers: ['Receiving Offers', 'b-amber', 'clock'],
      offers_received: ['Offers Received', 'b-amber', 'chat'],
      visit_confirmed: ['Visit Confirmed', 'b-info', 'checkC'],
      on_the_way: ['On The Way', 'b-brand', 'truck'],
      arrived: ['Worker Arrived', 'b-brand', 'pin'],
      inspection: ['Inspection', 'b-amber', 'search'],
      repair_negotiation: ['Repair Negotiation', 'b-brand', 'chat'],
      repair_agreed: ['Repair Agreed', 'b-info', 'checkC'],
      repair_approved: ['Repair Approved', 'b-ok', 'shield'],
      repair_in_progress: ['Repair In Progress', 'b-brand', 'wrench'],
      completed: ['Completed · Payment Due', 'b-amber', 'wallet'],
      paid: ['Paid', 'b-ok', 'checkC'],
      reviewed: ['Reviewed', 'b-muted', 'star'],
      cancelled: ['Cancelled', 'b-danger', 'x']
    }[st] || [st, 'b-muted', 'info'];
    const dot = (st === 'on_the_way' || st === 'arrived') ? '<span class="dot-pulse"></span>' : '';
    return '<span class="badge ' + m[1] + '">' + dot + ic(m[2], { s: 13 }) + ' ' + m[0] + '</span>';
  },

  empty: function (icon, title, text, actionHtml) {
    return '<div class="empty">' +
      '<div class="e-ic">' + ic(icon, { s: 30 }) + '</div>' +
      '<h3>' + UI.esc(title) + '</h3>' +
      '<p>' + UI.esc(text) + '</p>' +
      (actionHtml ? actionHtml : '') + '</div>';
  },

  jobTimeline: function (job) {
    if (job.cancelled) {
      return '<div class="tl"><div class="tl-item done"><span class="tl-dot">' + ic('x', { s: 12 }) + '</span><div class="t-title">Job Cancelled</div><div class="t-time">' + UI.esc(job.cancelled.reason || '') + '</div></div></div>';
    }
    const prog = {
      receiving_offers: 0, offers_received: 0,
      visit_confirmed: 2, on_the_way: 2, arrived: 3,
      inspection: 4, repair_negotiation: 5, repair_agreed: 5, repair_approved: 6,
      repair_in_progress: 7, completed: 8, paid: 9, reviewed: 10
    };
    const cur = prog[job.status] !== undefined ? prog[job.status] : 0;
    const steps = [
      'Job Posted', 'Worker Selected', 'Visit Confirmed', 'Worker Arrived',
      'Inspection Completed', 'Repair Price Agreed', 'Repair Approved',
      'Repair In Progress', 'Job Completed', 'Payment', 'Review'
    ];
    let out = '<div class="tl">';
    steps.forEach(function (s, i) {
      const cls = i < cur ? 'done' : i === cur ? 'current' : 'todo';
      const cap = i === cur && cur === 0 ? '<span class="t-time">' + (job.offers.length ? (job.offers.length + ' workers interested') : 'awaiting offers…') + '</span>' : '';
      out += '<div class="tl-item ' + cls + '"><span class="tl-dot">' + (i < cur ? ic('check', { s: 12 }) : '') + '</span><div class="t-title">' + s + '</div>' + cap + '</div>';
    });
    out += '</div>';
    return out;
  },

  sectionTitle: function (icon, title, sub, action) {
    return '<div class="sec-head"><div><h3 class="section-title" style="font-size:22px">' + (icon ? ic(icon, { s: 22, cls: 'ic', style: 'vertical-align:-3px;margin-right:8px;color:var(--brand)' }) : '') + title + '</h3>' +
      (sub ? '<p class="section-sub" style="font-size:13.5px;margin-bottom:0">' + UI.esc(sub) + '</p>' : '') + '</div>' + (action || '') + '</div>';
  },

  mediaRow: function (job) {
    let out = '';
    if (job.images && job.images.length) {
      out += '<div class="jc-imgs">' + job.images.slice(0, 4).map(function (img, i) {
        return '<img class="thumb" src="' + img + '" alt="photo ' + (i + 1) + '" />';
      }).join('') + '</div>';
    }
    if (job.audio) {
      out += '<div class="voice-chips"><span class="voice-chip">' + ic('mic', { s: 13 }) + ' Voice note · ' + job.audio.duration + 's</span></div>';
    }
    return out;
  },

  jobMetaRow: function (job, opts) {
    opts = opts || {};
    const u = Store.currentUser();
    const w = job.workerId ? Store.userById(job.workerId) : null;
    const labels = [];
    if (opts.location !== false && (job.location && job.location.area)) labels.push('<span>' + ic('pin', { s: 13 }) + ' ' + UI.esc(job.location.area) + '</span>');
    if (job.prefDate) labels.push('<span>' + ic('calendar', { s: 13 }) + ' ' + UI.esc(job.prefDate) + '</span>');
    if (job.prefTime) labels.push('<span>' + ic('clock', { s: 13 }) + ' ' + UI.esc(job.prefTime) + '</span>');
    if (opts.dist) labels.push('<span>' + ic('navigation', { s: 13 }) + ' ' + opts.dist.km + ' km</span>');
    if (w && u && u.role === 'worker') labels.unshift('<span>' + ic('user', { s: 13 }) + ' ' + UI.esc(w.name) + '</span>');
    if ((job.images && job.images.length) || job.audio) labels.push('<span>' + ic('image', { s: 13 }) + ' media</span>');
    return '<div class="job-row">' + labels.join('') + '</div>';
  },

  workerCard: function (u, opts) {
    opts = opts || {};
    const tags = (u.skills || []).slice(0, 2).map(function (s) {
      const svc = SERVICES.find(function (x) { return x.name === s; });
      return '<span class="badge b-white">' + ic(svc ? svc.icon : 'wrench', { s: 12 }) + ' ' + UI.esc(s) + '</span>';
    }).join(' ');
    return '<div class="wk-card" data-open-worker="' + u.id + '">' +
      '<div class="wk-head">' + UI.avatar(u) +
      '<div style="min-width:0"><div class="wk-name">' + UI.esc(u.name) + (u.verified ? ' ' + ic('shield', { s: 14, style: 'color:var(--brand);vertical-align:-2px' }) : '') + '</div>' +
      '<div class="wk-role">' + UI.esc(u.tagline || 'Professional') + '</div></div></div>' +
      '<div class="rating" style="margin-bottom:6px">' + UI.rating(u.rating, u.ratingCount) + '</div>' +
      '<div class="wk-meta"><span>' + ic('briefcase', { s: 13 }) + ' ' + (u.jobsDone || 0) + ' jobs</span><span>' + ic('clock', { s: 13 }) + ' ' + (u.years || 0) + ' yrs</span><span>' + ic('pin', { s: 13 }) + ' ' + UI.esc(u.area || 'Nearby') + '</span></div>' +
      '<div class="split">' + tags + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:14px">' +
      '<button class="btn btn-outline btn-sm growy" data-open-worker="' + u.id + '" style="flex:1">' + ic('eye', { s: 14 }) + ' View Profile</button>' +
      (opts.offer ? '<button class="btn btn-primary btn-sm growy" data-open-worker="' + u.id + '" style="flex:1">View Profile</button>' : '') +
      '</div></div>';
  }
};

function rowList(items, htmlFn) {
  if (!items.length) return '';
  return items.map(function (x) { return htmlFn(x); }).join('');
}

function dropdownMenu(items) { return items; }