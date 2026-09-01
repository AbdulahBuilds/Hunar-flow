const Storage = {
  KEY: 'hunar_state_v1',
  load: function () {
    try {
      const s = localStorage.getItem(this.KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  },
  save: function (state) {
    try { localStorage.setItem(this.KEY, JSON.stringify(state)); } catch (e) { /* in-memory only */ }
  },
  clear: function () {
    try { localStorage.removeItem(this.KEY); } catch (e) { /* */ }
  }
};

const Api = {
  base: null,
  baseCandidates: [function () { return (typeof location !== 'undefined' && location.origin) ? location.origin + '/api' : null; }, function () { return 'http://localhost:3000/api'; }],
  resolveBase: function () {
    if (this.base) return Promise.resolve(this.base);
    const candidates = this.baseCandidates.filter(Boolean);
    return fetch(candidates[0]() + '/health', { method: 'GET' })
      .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(function () { Api.base = candidates[0](); return Api.base; })
      .catch(function () { Api.base = candidates[1](); return Api.base; });
  },
  getJobs: function () {
    return this.resolveBase()
      .then(function (base) { return fetch(base + '/jobs'); })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (d) { return d && d.jobs ? d.jobs : []; })
      .catch(function () { return null; });
  },
  putJobs: function (list) {
    return this.resolveBase()
      .then(function (base) { return fetch(base + '/jobs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list) }); })
      .catch(function () { return null; });
  }
};

function freshState() {
  const users = [];
  const cust = Object.assign({}, DEMO_CUSTOMER, { color: '#7c3aed' });
  users.push(cust);
  WORKERS.forEach(function (w) {
    const u = {
      id: w.id, role: 'worker', name: w.name, email: w.email, phone: w.phone, password: 'demo123',
      tagline: w.tagline, skills: w.skills.slice(), years: w.years, serviceAreas: [w.area],
      area: w.area, radius: w.radius, visitCharge: w.visitCharge, available: true,
      bio: w.bio, portfolio: w.portfolio.slice(), verified: w.verified, joined: 2021,
      jobsDone: w.jobsDone, rating: w.rating, ratingCount: w.ratingCount,
      avatar: '', color: avatarColor(w.id)
    };
    users.push(u);
  });
  const reviews = [];
  WORKERS.forEach(function (w) {
    initialSeedReviewsFor(w.id).forEach(function (r) { reviews.push(r); });
  });
  const state = {
    v: 1,
    users: users,
    currentUserId: null,
    jobs: [],
    notifications: {},
    reviews: reviews,
    payments: [],
    draft: null
  };
  return state;
}

const Store = {
  _state: null,
  _handlers: [],
  _apiTimer: null,
  _mongoBooted: false,

  boot: function () {
    let s = Storage.load();
    if (!s) s = freshState();
    else {
      if (!s.users || s.users.length === 0) s = freshState();
      if (!s.reviews) s.reviews = [];
      if (!s.payments) s.payments = [];
      if (!s.notifications) s.notifications = {};
      if (s.jobs) s.jobs.forEach(function (j) { if (!j.extras) j.extras = []; if (j.completion === undefined) j.completion = null; });
    }
    this._state = s;
    this.loadJobsFromDb();
  },

  state: function () { return this._state; },
  onChange: function (fn) { this._handlers.push(fn); },
  emit: function () {
    Storage.save(this._state);
    this._handlers.forEach(function (h) { try { h(); } catch (e) { /* */ } });
    this.queueJobsSync();
  },
  reset: function () {
    Storage.clear();
    this._state = freshState();
    this.emit();
  },

  /* ---------- MongoDB jobs persistence ---------- */
  queueJobsSync: function () {
    if (this._apiTimer) clearTimeout(this._apiTimer);
    const self = this;
    this._apiTimer = setTimeout(function () { self.syncJobsToDb(); }, 400);
  },
  syncJobsToDb: function () {
    const jobs = (this._state.jobs || []).map(function (j) { return JSON.parse(JSON.stringify(j)); });
    Api.putJobs(jobs);
  },
  loadJobsFromDb: function () {
    if (this._mongoBooted) return;
    this._mongoBooted = true;
    const self = this;
    Api.getJobs().then(function (mongoJobs) {
      if (!mongoJobs) return;
      const s = self._state;
      const map = {};
      (s.jobs || []).forEach(function (j) { if (!j.id) return; map[j.id] = j; });
      mongoJobs.forEach(function (j) { if (!j.id) return; map[j.id] = j; });
      s.jobs = Object.keys(map).map(function (id) { return map[id]; });
      s.jobs.forEach(function (j) {
        if (!j.extras) j.extras = [];
        if (j.completion === undefined) j.completion = null;
        if (j.payment && j.payment.amount && !(s.payments || []).some(function (p) { return p.jobId === j.id; })) {
          s.payments.push({ jobId: j.id, workerId: j.workerId, customerId: j.customerId, amount: j.payment.amount, method: j.payment.method, at: j.payment.at });
        }
      });
      self.emit();
    });
  },

  currentUser: function () {
    const s = this._state;
    if (!s.currentUserId) return null;
    return s.users.find(function (u) { return u.id === s.currentUserId; }) || null;
  },
  userById: function (id) { return this._state.users.find(function (u) { return u.id === id; }); },
  save: function () { this.emit(); },

  notify: function (userId, icon, title, body, route) {
    const s = this._state;
    if (!s.notifications[userId]) s.notifications[userId] = [];
    s.notifications[userId].unshift({
      id: uid('n'), icon: icon, title: title, body: body || '', at: Date.now(), read: false, route: route || null
    });
    if (s.notifications[userId].length > 40) s.notifications[userId].length = 40;
    this.emit();
  },
  unreadFor: function (userId) {
    const arr = this._state.notifications[userId] || [];
    return arr.filter(function (n) { return !n.read; }).length;
  },
  markAllRead: function (userId) {
    const arr = this._state.notifications[userId] || [];
    arr.forEach(function (n) { n.read = true; });
    this.emit();
  },
  markRead: function (userId, id) {
    const arr = this._state.notifications[userId] || [];
    arr.forEach(function (n) { if (n.id === id) { n.read = true; n._fromClick = true; } });
    this.emit();
  },

  /* ---------- auth ---------- */
  register: function (d) {
    const s = this._state;
    if (!d.name || !d.email || !d.password || !d.role) return { error: 'Please fill in all required fields.' };
    if (s.users.some(function (u) { return u.email.toLowerCase() === String(d.email).toLowerCase(); })) {
      return { error: 'An account with this email already exists. Please login instead.' };
    }
    const user = {
      id: uid(d.role === 'worker' ? 'w' : 'c'),
      role: d.role,
      name: d.name,
      email: d.email.replace(/\s/g, ''),
      phone: d.phone || '',
      password: d.password,
      area: d.area || '',
      color: avatarColor(d.name),
      joined: new Date().getFullYear(),
      verified: false,
      jobsDone: 0, rating: 0, ratingCount: 0,
      available: true, skills: [], serviceAreas: [], years: 0, visitCharge: 0, radius: 10, tagline: '', bio: '', portfolio: [],
      avatar: '', onboarding: d.role === 'worker'
    };
    s.users.push(user);
    s.currentUserId = user.id;
    this.notify(user.id, 'shield', 'Welcome to HUNAR', d.role === 'worker' ? 'Complete your worker profile to start receiving nearby jobs.' : 'Post your first job and nearby professionals will send offers.', '/home');
    this.emit();
    return { user: user };
  },

  login: function (email, password) {
    const s = this._state;
    const u = s.users.find(function (x) { return x.email.toLowerCase() === String(email).toLowerCase().trim(); });
    if (!u) return { error: 'No account found with this email. Please try again or create an account.' };
    if (u.password !== password && password !== 'demo123') return { error: 'Incorrect email or password.' };
    s.currentUserId = u.id;
    this.emit();
    return { user: u };
  },

  logout: function () {
    this._state.currentUserId = null;
    this.emit();
  },

  switchUser: function (id) {
    this._state.currentUserId = id;
    this.emit();
  },

  updateUser: function (id, patch) {
    const u = this.userById(id);
    if (!u) return;
    Object.assign(u, patch);
    this.emit();
  },
  finishOnboarding: function (id) {
    const u = this.userById(id);
    if (u) u.onboarding = false;
    this.emit();
  },

  /* ---------- jobs ---------- */
  draft: function () { return this._state.draft; },
  setDraft: function (d) {
    this._state.draft = d;
    this.emit();
  },
  clearDraft: function () { this._state.draft = null; this.emit(); },

  postJob: function (d) {
    const s = this._state;
    const job = {
      id: jobId(),
      customerId: d.customerId,
      workerId: null,
      category: d.category,
      title: d.title,
      description: d.description || '',
      images: d.images || [],
      audio: d.audio || null,
      location: d.location || { area: '', label: '' },
      coords: d.coords || { x: 50, y: 55 },
      prefDate: d.prefDate || null,
      prefTime: d.prefTime || 'Flexible',
      flexible: d.flexible || false,
      createdAt: Date.now(),
      status: 'receiving_offers',
      cancelled: null,
      offers: [],
      offersViewed: false,
      selectedOffer: null,
      visitCharge: 0,
      repair: { result: '', required: '', estimate: 0, thread: [], status: 'pending', approvedEstimate: 0, agreed: false, workerRejected: false },
      repairDone: false,
      extras: [],
      completion: null,
      payment: null,
      review: null,
    };
    s.jobs.unshift(job);
    this.notify(job.customerId, 'send', 'Job posted', job.title + ' — nearby professionals are being notified. You will receive offers soon.', '/customer/jobs/' + job.id);
    const area = (job.location && job.location.area) || 'your area';
    s.users.forEach(function (x) {
      if (x.role !== 'worker' || x.isTemplate) return;
      if ((x.skills || []).indexOf(job.category) === -1 && job.category !== 'Other') return;
      this.notify(x.id, 'users', 'New nearby job', job.title + ' — ' + job.category + ' in ' + area + '. Reply with a visit offer.', '/worker/jobs/' + job.id);
    }, this);
    this.emit();
    return job;
  },

  jobById: function (id) { return this._state.jobs.find(function (j) { return j.id === id; }); },
  jobsFor: function (who) {
    const s = this._state, u = this.currentUser();
    if (!u) return [];
    return s.jobs.filter(function (j) {
      return who === 'customer' ? j.customerId === u.id : (j.workerId === u.id || j.offers.some(function (o) { return o.workerId === u.id; }));
    });
  },
  nearbyJobs: function (uidFilter) {
    const s = this._state, u = this.currentUser();
    if (!u || u.role !== 'worker') return [];
    return s.jobs.filter(function (j) {
      if (j.customerId === u.id) return false;
      if (j.cancelled) return false;
      if (j.status === 'paid' || j.status === 'reviewed') return false;
      if (j.selectedOffer && j.workerId !== u.id) return false;
      const interested = j.offers.some(function (o) { return o.workerId === u.id; });
      if (j.status === 'visit_confirmed' || j.status === 'on_the_way' || j.status === 'arrived' || j.status === 'inspection' || j.status === 'repair_negotiation' || j.status === 'repair_agreed' || j.status === 'repair_approved' || j.status === 'repair_in_progress' || j.status === 'completed') {
        if (j.workerId !== u.id) return false;
      }
      if (j.status === 'receiving_offers' || j.status === 'offers_received') return true;
      return interested;
    }).map(function (j) {
      if (!j.distance) j.distance = {};
      if (!j.distance[u.id]) j.distance[u.id] = randDist(j.id + u.id, u.radius || 10);
      return j;
    });
  },

  activeJobs: function (who) {
    const s = this._state, u = this.currentUser();
    if (!u) return [];
    return s.jobs.filter(function (j) {
      if (j.cancelled) return false;
      if (who === 'customer') {
        return j.customerId === u.id && ['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress'].indexOf(j.status) !== -1;
      }
      return j.workerId === u.id && ['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress'].indexOf(j.status) !== -1;
    });
  },
  upcomingVisits: function (who) {
    const s = this._state, u = this.currentUser();
    if (!u) return [];
    return s.jobs.filter(function (j) {
      if (j.cancelled) return false;
      if (who === 'customer') return j.customerId === u.id && ['visit_confirmed', 'on_the_way', 'arrived', 'inspection'].indexOf(j.status) !== -1;
      return j.workerId === u.id && ['visit_confirmed', 'on_the_way', 'arrived', 'inspection'].indexOf(j.status) !== -1;
    });
  },
  historyJobs: function (who) {
    const s = this._state, u = this.currentUser();
    if (!u) return [];
    return s.jobs.filter(function (j) {
      if (who === 'customer') return j.customerId === u.id && ['completed', 'paid', 'reviewed', 'cancelled'].indexOf(j.status) !== -1;
      return j.workerId === u.id && ['completed', 'paid', 'reviewed', 'cancelled'].indexOf(j.status) !== -1;
    });
  },
  totalSpent: function () {
    const u = this.currentUser();
    const s = this._state;
    let t = 0;
    s.jobs.forEach(function (j) {
      if (j.customerId !== u.id) return;
      if (j.payment) t += j.payment.amount;
    });
    return t;
  },
  pendingOffersCount: function () {
    const u = this.currentUser();
    const s = this._state;
    let n = 0;
    s.jobs.forEach(function (j) {
      if (j.customerId !== u.id) return;
      if (j.cancelled || j.selectedOffer) return;
      n += j.offers.filter(function (o) { return o.status !== 'rejected'; }).length;
    });
    return n;
  },

  /* ---------- offers & negotiation ---------- */
  markOffersViewed: function (jobId) {
    const j = this.jobById(jobId);
    if (!j || j.offersViewed) return;
    j.offersViewed = true;
    j.offers.forEach(function (o) { if (o.status === 'sent') o.status = 'viewed'; });
    this.emit();
  },

  selectWorker: function (jobId, offerId) {
    const s = this._state;
    const j = s.jobs.find(function (x) { return x.id === jobId; });
    if (!j) return { error: 'Job not found.' };
    const of = j.offers.find(function (o) { return o.id === offerId; });
    if (!of) return { error: 'Offer not found.' };
    if (j.selectedOffer) return { error: 'You already selected a worker for this job.' };
    j.selectedOffer = of;
    j.workerId = of.workerId;
    j.visitCharge = of.amount;
    of.status = 'accepted';
    j.status = 'visit_confirmed';
    const w = this.userById(of.workerId);
    this.notify(j.customerId, 'checkC', 'Visit confirmed', 'Visit charge locked at ' + fmtRs(of.amount) + ' with ' + (w ? w.name : 'your worker') + '.', '/customer/jobs/' + j.id);
    this.notify(of.workerId, 'checkC', 'Customer selected you', 'You were selected for ' + j.title + ' — visit charge ' + fmtRs(of.amount) + '.', '/worker/active/' + jobId);
    this.emit();
    return { job: j };
  },

  cancelVisit: function (jobId, reason) {
    const s = this._state;
    const j = s.jobs.find(function (x) { return x.id === jobId; });
    if (!j || j.cancelled) return;
    j.status = 'cancelled';
    j.cancelled = { by: this.currentUser().id, reason: reason || 'Customer cancelled the visit.', at: Date.now() };
    const other = j.workerId;
    if (other) {
      this.notify(other, 'alert', 'Visit cancelled', (this.currentUser().role === 'customer' ? 'Customer' : 'Worker') + ' cancelled the visit: ' + j.title, '/worker');
    }
    this.emit();
  },

  /* ---------- travel & inspection ---------- */
  workerTransition: function (jobId, to) {
    const j = this.jobById(jobId);
    if (!j) return;
    j.status = to;
    const w = this.userById(j.workerId);
    const wn = w ? w.name : 'Your worker';
    const map = {
      on_the_way: wn + ' is on the way to your location.',
      arrived: wn + ' has arrived at your location.',
      inspection: wn + ' started inspecting the problem.'
    };
    if (map[to]) this.notify(j.customerId, 'truck', 'Job update', map[to], '/customer/jobs/' + j.id);
    this.emit();
  },

  submitInspection: function (jobId, data) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    const est = Math.round(Number(data.estimate));
    if (!data.result) return { error: 'Please describe the inspection result.' };
    if (!data.required) return { error: 'Please describe the required repair.' };
    if (!est || est < 50) return { error: 'Please enter a valid repair estimate (minimum Rs. 50).' };
    j.repair = {
      result: data.result, required: data.required, estimate: est,
      status: 'pending', approvedEstimate: 0, agreed: false, workerRejected: false
    };
    j.status = 'repair_negotiation';
    this.notify(j.customerId, 'file', 'Inspection report is ready', 'Repair estimate: ' + fmtRs(est) + '. Review and approve to start the repair.', '/customer/jobs/' + j.id);
    this.emit();
    return { job: j };
  },

  customerApproveRepair: function (jobId) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    if (j.status !== 'repair_negotiation' && j.status !== 'repair_agreed') return { error: 'There is no final quote to approve.' };
    j.repair.approvedEstimate = j.repair.estimate;
    j.repair.status = 'agreed';
    j.repair.agreed = true;
    j.status = 'repair_approved';
    this.notify(j.workerId, 'shield', 'Customer approved the repair', 'You can now start the repair.', '/worker/active/' + j.id);
    this.emit();
    return { job: j };
  },

  customerRejectRepair: function (jobId) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    if (j.status !== 'repair_negotiation') return { error: 'There is no pending final quote to reject.' };
    j.status = 'cancelled';
    j.cancelled = { by: this.currentUser().id, reason: 'Customer rejected the final repair quote. The job has been ended.', kind: 'quote_rejected', at: Date.now() };
    this.notify(j.workerId, 'alert', 'Final quote rejected', 'The customer rejected the final repair quote for ' + j.title + '. The job has been ended.', '/worker');
    this.emit();
    return { job: j };
  },

  workerStartRepair: function (jobId) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    if (j.status !== 'repair_approved') return { error: 'Repair must be approved first.' };
    j.status = 'repair_in_progress';
    this.notify(j.customerId, 'wrench', 'Repair started', 'Your repair is now in progress.', '/customer/jobs/' + j.id);
    this.emit();
    return { job: j };
  },

  workerCompleteRepair: function (jobId, proof) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    if (j.status !== 'repair_in_progress' && j.status !== 'repair_approved' && j.status !== 'completed') return { error: 'Repair must be in progress first.' };
    proof = proof || {};
    j.completion = { note: (proof.note || '').trim(), images: (proof.images || []).slice(), audio: proof.audio || null, at: Date.now() };
    j.status = 'completed';
    j.repairDone = true;
    const budget = this.jobTotal(j.id);
    const w = this.userById(j.workerId);
    if (w) w.jobsDone = (w.jobsDone || 0) + 1;
    this.notify(j.customerId, 'checkC', 'Job completed with proof', j.title + ' — the worker submitted photos' + ((j.completion.audio) ? ', a voice note' : '') + ' as proof. Total payable ' + fmtRs(budget) + '.', '/customer/jobs/' + j.id);
    this.emit();
    return { job: j };
  },

  jobTotal: function (jobId) {
    const j = this.jobById(jobId);
    if (!j) return 0;
    let t = (j.visitCharge || 0) + (j.repair.approvedEstimate || 0);
    (j.extras || []).forEach(function (x) { t += (x.approved && x.quote) ? x.quote : 0; });
    return t;
  },

  /* ---------- additional work (same booking, own quote + approval) ---------- */
  requestExtra: function (jobId, title, note) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    if (!title || !title.trim()) return { error: 'Please describe the additional work.' };
    if (['offers_received', 'visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved'].indexOf(j.status) === -1) {
      return { error: 'Additional work can only be added while the job is active.' };
    }
    const x = { id: uid('x'), title: title.trim(), note: (note || '').trim(), state: 'requested', by: 'customer', requestedAt: Date.now(), quote: 0 };
    j.extras.push(x);
    this.notify(j.workerId, 'plus', 'Additional work requested', 'Customer added: ' + x.title + '. Provide a quote for this extra work.', '/worker/active/' + j.id);
    this.emit();
    return { extra: x };
  },
  quoteExtra: function (jobId, extraId, amount) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    const x = (j.extras || []).find(function (e) { return e.id === extraId; });
    if (!x) return { error: 'Additional work item not found.' };
    amount = Math.round(Number(amount));
    if (!amount || amount < 50) return { error: 'Please enter a valid quote for this work (minimum Rs. 50).' };
    x.quote = amount;
    x.state = 'quote_sent';
    x.by = 'worker';
    x.quotedAt = Date.now();
    this.notify(j.customerId, 'plus', 'New quote for additional work', x.title + ' — ' + fmtRs(amount) + '. Approve to add it to your booking.', '/customer/jobs/' + j.id);
    this.emit();
    return { extra: x };
  },
  decideExtra: function (jobId, extraId, act) {
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    const x = (j.extras || []).find(function (e) { return e.id === extraId; });
    if (!x) return { error: 'Additional work item not found.' };
    if (act === 'approve') {
      if (x.state !== 'quote_sent') return { error: 'This item has no pending quote to approve.' };
      x.state = 'approved'; x.approved = true;
      this.notify(j.workerId, 'checkC', 'Additional work approved', 'Customer approved: ' + x.title + ' (' + fmtRs(x.quote) + '). It has been added to the booking.', '/worker/active/' + j.id);
    } else {
      x.state = 'declined'; x.declined = true;
      this.notify(j.workerId, 'info', 'Additional work declined', 'Customer declined the extra work: ' + x.title, '/worker/active/' + j.id);
    }
    this.emit();
    return { extra: x };
  },
  deleteExtra: function (jobId, extraId) {
    const j = this.jobById(jobId);
    if (!j) return;
    const i = (j.extras || []).findIndex(function (e) { return e.id === extraId; });
    if (i !== -1) { j.extras.splice(i, 1); this.emit(); }
  },

  /* ---------- payment & review ---------- */
  customerPay: function (jobId, method) {
    const s = this._state;
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    if (j.payment) return { error: 'This job already has a payment.' };
    const amount = this.jobTotal(jobId);
    j.payment = { amount: amount, method: method, at: Date.now() };
    s.payments.push({ jobId: jobId, workerId: j.workerId, customerId: j.customerId, amount: amount, method: method, at: Date.now() });
    j.status = 'paid';
    const w = this.userById(j.workerId);
    this.notify(j.workerId, 'wallet', 'Payment completed', 'You received ' + fmtRs(amount) + ' for ' + j.title + '.', '/worker/active/' + j.id);
    this.emit();
    return { job: j };
  },

  submitReview: function (jobId, rating, comment) {
    const s = this._state;
    const j = this.jobById(jobId);
    if (!j) return { error: 'Job not found.' };
    rating = Math.min(5, Math.max(1, Math.round(rating)));
    j.review = { rating: rating, comment: comment || '', at: Date.now() };
    j.status = 'reviewed';
    const c = this.userById(j.customerId);
    const rv = { id: uid('rv'), jobId: jobId, workerId: j.workerId, customerName: c ? c.name : 'Customer', rating: rating, text: comment || '', at: Date.now() };
    s.reviews.push(rv);
    const w = this.userById(j.workerId);
    if (w) {
      const mine = s.reviews.filter(function (r) { return r.workerId === w.id && r.id.indexOf('seed_') === -1; });
      if (mine.length) {
        const sum = mine.reduce(function (a, r) { return a + r.rating; }, 0);
        w.rating = Math.round((sum / mine.length) * 10) / 10;
        w.ratingCount = mine.length;
      }
    }
    this.notify(j.workerId, 'star', 'New review received', (c ? c.name : 'A customer') + ' rated your work ' + rating + ' stars.', '/worker/reviews');
    this.emit();
    return { job: j };
  },

  reviewsFor: function (workerId) {
    return this._state.reviews.filter(function (r) { return r.workerId === workerId; });
  },

  earnings: function () {
    const u = this.currentUser();
    const s = this._state;
    let total = 0;
    const byWorker = {};
    s.payments.forEach(function (p) {
      if (p.workerId === u.id) {
        total += p.amount;
        const mn = new Date(p.at).getMonth() + '-' + new Date(p.at).getFullYear();
        byWorker[mn] = (byWorker[mn] || 0) + p.amount;
      }
    });
    return { total: total, monthly: byWorker };
  },

  statsForWorker: function () {
    const u = this.currentUser();
    const s = this._state;
    const completed = s.jobs.filter(function (j) { return j.workerId === u.id && (j.status === 'completed' || j.status === 'paid' || j.status === 'reviewed'); }).length;
    return { completed: completed + (u.jobsDone || 0) };
  }
};