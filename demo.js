/* 체험·점검용 가짜 자료와 가짜 지도. 실제 농가 정보는 들어 있지 않다(이름·지번 모두 지어낸 것).
   index.html?mock=data (진짜 카카오 지도 + 가짜 자료) 또는 ?mock=1 (지도까지 가짜) 로 연다. 암호는 test. */
(function () {
  /* ---------- 가짜 지도(?mock=1 일 때만) ---------- */
  var listeners = [];
  function LatLng(lat, lng) { this.lat = lat; this.lng = lng; }
  LatLng.prototype.getLat = function () { return this.lat; };
  LatLng.prototype.getLng = function () { return this.lng; };
  function Bounds() { this.pts = []; }
  Bounds.prototype.extend = function (p) { this.pts.push(p); };
  function Map(el, opt) {
    this.el = el; this.center = opt.center; this.level = opt.level; this.overlays = []; this.type = 'ROADMAP'; this.over = {};
    var self = this; el.style.overflow = 'hidden';
    el.addEventListener('click', function (e) {
      if (e.target !== el) return;
      var r = el.getBoundingClientRect(), s = self.scale();
      self.fire('click', { latLng: new LatLng(self.center.lat - (e.clientY - r.top - r.height / 2) / s, self.center.lng + (e.clientX - r.left - r.width / 2) / s) });
    });
  }
  Map.prototype.scale = function () { return 40 * Math.pow(2, 12 - this.level); };
  Map.prototype.fire = function (type, arg) { var self = this; listeners.slice().forEach(function (l) { if (l.t === self && l.type === type) l.fn(arg); }); };
  Map.prototype.redraw = function () { var self = this; this.overlays.forEach(function (o) { o.place(self); }); };
  Map.prototype.getLevel = function () { return this.level; };
  Map.prototype.setLevel = function (n) { var ch = n !== this.level; this.level = n; this.redraw(); if (ch) this.fire('zoom_changed'); };
  Map.prototype.setCenter = function (c) { this.center = c; this.redraw(); };
  Map.prototype.setBounds = function (b) {
    var la = b.pts.map(function (p) { return p.lat; }), ln = b.pts.map(function (p) { return p.lng; });
    this.center = new LatLng((Math.min.apply(0, la) + Math.max.apply(0, la)) / 2, (Math.min.apply(0, ln) + Math.max.apply(0, ln)) / 2);
    var span = Math.max(Math.max.apply(0, la) - Math.min.apply(0, la), Math.max.apply(0, ln) - Math.min.apply(0, ln), 0.001);
    var lv = 14; while (lv > 1 && span * 40 * Math.pow(2, 12 - (lv - 1)) < 260) lv--;
    this.setLevel(lv);
  };
  Map.prototype.setMapTypeId = function (t) { this.type = t; };
  Map.prototype.addOverlayMapTypeId = function (t) { this.over[t] = 1; };
  Map.prototype.removeOverlayMapTypeId = function (t) { delete this.over[t]; };
  function CustomOverlay(opt) { this.opt = opt; this.pos = opt.position; this.map = null;
    this.box = document.createElement('div'); this.box.style.position = 'absolute'; this.box.appendChild(opt.content); }
  CustomOverlay.prototype.place = function (m) {
    var r = m.el.getBoundingClientRect(), s = m.scale();
    this.box.style.left = (r.width / 2 + (this.pos.lng - m.center.lng) * s) + 'px';
    this.box.style.top = (r.height / 2 - (this.pos.lat - m.center.lat) * s) + 'px';
    this.box.style.transform = 'translate(' + (-(this.opt.xAnchor || 0) * 100) + '%,' + (-(this.opt.yAnchor || 0) * 100) + '%)';
  };
  CustomOverlay.prototype.setMap = function (m) {
    if (this.map) { this.map.overlays.splice(this.map.overlays.indexOf(this), 1); this.box.remove(); }
    this.map = m; if (m) { m.overlays.push(this); m.el.appendChild(this.box); this.place(m); }
  };
  CustomOverlay.prototype.setPosition = function (p) { this.pos = p; if (this.map) this.place(this.map); };
  function Geocoder() {}
  Geocoder.prototype.addressSearch = function (q, cb) {
    window.MOCK_GEO_LOG.push(q);
    setTimeout(function () {
      if (!/^(충남|경기|전남)/.test(q) || /없는/.test(q) || /,/.test(q)) return cb([], 'ZERO_RESULT');
      var h = 0; for (var i = 0; i < q.length; i++) h = (h * 31 + q.charCodeAt(i)) % 1000;
      var m = /(산\s*)?(\d+)(?:-(\d+))?$/.exec(q) || [];
      cb([{ x: String(126.6 + h / 5000), y: String(36.8 + (h % 37) / 400), address_name: q,
        address: { address_name: q, b_code: '4427034022', mountain_yn: m[1] ? 'Y' : 'N', main_address_no: m[2] || '', sub_address_no: m[3] || '' } }], 'OK');
    }, 5);
  };
  window.MOCK_GEO_LOG = [];
  if (/[?&]mock=1/.test(location.search)) window.kakao = { maps: {
    load: function (cb) { cb(); }, Map: Map, LatLng: LatLng, LatLngBounds: Bounds, CustomOverlay: CustomOverlay,
    MapTypeId: { ROADMAP: 'ROADMAP', HYBRID: 'HYBRID', USE_DISTRICT: 'USE_DISTRICT' },
    event: { addListener: function (t, type, fn) { listeners.push({ t: t, type: type, fn: fn }); } },
    services: { Geocoder: Geocoder, Status: { OK: 'OK' } }
  } };

  /* ---------- 가짜 자료 ---------- */
  // [코드, 이름, 단체, 시군, 읍면, 품종, 계약면적, 우선순위, 중심 위도, 경도, 밭 수, 하우스 수, 2025에도 계약]
  var base = [
    ['T001', '가농가', '가나 농협', '충남 당진시', '신평면', '대서', '3,000', '상', 36.883, 126.774, 2, 1, 1],
    ['T002', '나농가', '가나 농협', '충남 당진시', '순성면', '대서, 진서', '5,000', '중', 36.845, 126.712, 3, 0, 1],
    ['T003', '다농가', '가나 농협', '충남 당진시', '송악읍', '두백', '8,000', '하', 36.905, 126.742, 3, 1, 1],
    ['T004', '라농가', '가나 농협', '충남 당진시', '합덕읍', '두백', '2,000', '상', 36.792, 126.781, 1, 0, 0],
    ['T005', '마농가', '다라 영농조합', '충남 예산군', '고덕면', '대서', '12,000', '중', 36.752, 126.703, 4, 1, 1],
    ['T006', '바농가', '다라 영농조합', '충남 예산군', '삽교읍', '진서', '4,000', '하', 36.688, 126.741, 2, 0, 0],
    ['T007', '사농가', '마바 농협', '충남 서산시', '지곡면', '두백', '6,000', '상', 36.842, 126.441, 2, 1, 0],
    ['T008', '아농가', '마바 농협', '충남 서산시', '고북면', '대서', '3,500', '', 36.672, 126.512, 2, 0, 0],
    ['T009', '자농가', '사아 농협', '전남 보성군', '회천면', '진서', '3,000', '하', 34.672, 127.083, 2, 1, 1],
    ['T010', '차농가', '사아 농협', '전남 보성군', '회천면', '대서', '2,000', '중', 34.681, 127.071, 1, 0, 0],
    ['T011', '카농가', '자차 개별', '경기 여주시', '점동면', '신품종', '1,500', '', 37.202, 127.661, 1, 0, 0],
    ['T012', '타농가', '자차 개별', '강원 횡성군', '안흥면', '두백', '7,000', '중', 37.412, 128.152, 2, 0, 0]
  ];
  var farms = [], spots = [], places = [], seq = 0;
  function place(type, addr, lat, lng, status, extra) {
    var p = { id: 'L' + ('0000' + (++seq)).slice(-5), type: type, addr: addr, addr2: lat == null ? '' : addr, pnu: '',
      lat: lat, lng: lng, area: null, farmmap: '', soil: '', drain: '', depth: '', gravel: '', rock: '', grade: '', status: status };
    if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
    places.push(p); return p.id;
  }
  base.forEach(function (b, i) {
    var code = b[0], home = b[3] + ' ' + b[4] + ' 가상리 ' + (i + 1);
    var mine = [];
    mine.push({ type: '집', no: 0, pid: place('집', home, b[8] + 0.004, b[9] - 0.006, '변환'), variety: '', memo: '' });
    for (var h = 1; h <= b[11]; h++) mine.push({ type: '하우스', no: h, pid: place('하우스', b[3] + ' ' + b[4] + ' 가상리 ' + (i + 1) + '-' + h, b[8] + 0.002, b[9] - 0.003, '변환'), variety: '', memo: '종서 산광' });
    for (var n = 1; n <= b[10]; n++) {
      var v = b[5].split(', ')[(n - 1) % b[5].split(', ').length];
      var extra = (i === 0 && n === 1) ? { area: 1180, farmmap: '밭', soil: '사양토', drain: '양호', gravel: '있음', rock: '화강암' } : null;
      mine.push({ type: '밭', no: n, pid: place('밭', b[3] + ' ' + b[4] + ' 가상리 ' + (i + 1) + '0' + n, b[8] - 0.006 * n + 0.004, b[9] + 0.007 * n - 0.004, '변환', extra), variety: v, memo: n === 1 ? '첫 수확 예정' : '' });
    }
    [2026, 2025].forEach(function (y) {
      if (y === 2025 && !b[12]) return;
      farms.push({ season: y, code: code, name: b[1], group: b[2], variety: b[5], area: b[6], count: '2', addr: home,
        prio: y === 2026 ? b[7] : '', prioBase: y === 2026 && b[7] ? '2026 실적' : '',
        visitDate: y === 2026 && i % 3 === 0 ? '2026-06-22' : '', visitStage: y === 2026 && i % 3 === 0 ? '수확' : '' });
      mine.forEach(function (s) { spots.push({ season: y, code: code, type: s.type, no: s.no, pid: s.pid, variety: s.variety, memo: s.memo }); });
    });
  });
  // 좌표 변환·위치 지정 점검용: 아직 좌표가 없는 곳 4건
  function addRaw(code, type, no, addr, memo) {
    spots.push({ season: 2026, code: code, type: type, no: no, pid: place(type, addr, null, null, '미변환'), variety: '', memo: memo || '' });
  }
  addRaw('T002', '밭', 4, '충남 당진시 순성면 가상리 201, 202, 203', '<b>굵게</b> 표시되면 안 됨');
  addRaw('T002', '밭', 5, '충남 당진시 순성면 가상리 산 21-3');
  addRaw('T005', '밭', 5, '없는길 271');
  addRaw('T004', '하우스', 1, '합덕읍 가상리 산 3');

  window.MOCK_SAVES = [];
  window.AGRO_MOCK = function (api, payload) {
    return new Promise(function (res) {
      setTimeout(function () {
        if (payload.key !== 'test') return res({ ok: false, auth: true, error: '암호가 맞지 않습니다' });
        if (api === 'getData') return res(JSON.parse(JSON.stringify({ ok: true, season: 2026, seasons: [2025, 2026], cardUrl: 'https://example.com/card', farms: farms, spots: spots, places: places })));
        if (api === 'saveCoords') {
          window.MOCK_SAVES.push({ by: payload.by, items: payload.items });
          payload.items.forEach(function (it) { places.forEach(function (p) { if (p.id === it.id) {
            p.lat = it.lat === '' ? null : it.lat; p.lng = it.lng === '' ? null : it.lng; p.addr2 = it.addr2; p.pnu = it.pnu; p.status = it.status; } }); });
          return res({ ok: true, saved: payload.items.length });
        }
        res({ ok: false, error: '알 수 없는 요청' });
      }, 10);
    });
  };
})();
