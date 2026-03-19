// ============================
// HOTEL PARTNER - SHARED JS
// ============================

const PARTNER_NAV = [
  { section: '메인' },
  { icon: '📊', label: '대시보드', href: 'partner-dashboard.html', id: 'dashboard' },
  { section: '예약' },
  { icon: '📋', label: '예약 목록', href: 'partner-reservation-manage.html', id: 'manage' },
  { icon: '📅', label: '호실 배정', href: 'partner-reservations-calendar.html', id: 'calendar' },
  { icon: '🛎️', label: '체크인 관리', href: 'partner-checkin.html', id: 'checkin' },
  { icon: '🛏️', label: '투숙 현황', href: 'partner-staying.html', id: 'staying' },
  { icon: '📋', label: '협의 메모', href: 'partner-schedule-memo.html', id: 'schedulememo' },
  { icon: '💬', label: '채팅 문의', href: 'partner-chat.html', id: 'chat', badge: '3' },
  { section: '객실·판매' },
  { icon: '🛏️', label: '객실 관리', href: 'partner-rooms.html', id: 'rooms' },
  { icon: '🔑', label: '호실 관리', href: 'partner-room-units.html', id: 'room-units' },
  { section: '관리' },
  { icon: '⭐', label: '리뷰 관리', href: 'partner-reviews.html', id: 'reviews', badge: '12' },
  { icon: '💰', label: '정산 내역', href: 'partner-settlements.html', id: 'settlements' },
  { section: '기타' },
  { icon: '📢', label: '공지사항', href: 'partner-notices.html', id: 'notices' },
  { icon: '🏢', label: '플랫폼 문의', href: 'partner-platform-inquiry.html', id: 'platform-inquiry' },
  { icon: '⚙️', label: '숙소 설정', href: 'partner-settings.html', id: 'settings' },
];

const ADMIN_NAV = [
  { section: '메인' },
  { icon: '📊', label: '대시보드', href: 'admin-dashboard.html', id: 'dashboard' },
  { section: '파트너 관리' },
  { icon: '🏨', label: '파트너 관리', href: 'admin-partners.html', id: 'partners' },
  { icon: '⏳', label: '승인 대기', href: 'admin-partners-pending.html', id: 'pending', badge: '7' },
  { icon: '💬', label: '파트너 문의', href: 'admin-inquiries.html', id: 'inquiries', badge: '4' },
  { section: '고객' },
  { icon: '👥', label: '고객 관리', href: 'admin-customers.html', id: 'customers' },
  { icon: '🙋', label: '고객 문의', href: 'admin-customer-inquiries.html', id: 'customer-inquiries', badge: '3' },
  { icon: '❓', label: 'FAQ 관리', href: 'admin-faq.html', id: 'faq' },
  { section: '정산 관리' },
  { icon: '💳', label: '파트너 정산', href: 'admin-settlements.html', id: 'settlements' },
  { section: '플랫폼' },
  { icon: '💰', label: '수수료 정책', href: 'admin-fee-policy.html', id: 'feepolicy' },
  { icon: '🖼️', label: '배너 설정', href: 'admin-banner.html', id: 'banner' },
  { icon: '📢', label: '공지사항', href: 'admin-notices.html', id: 'notices' },
  { icon: '📌', label: '상단 공지 설정', href: 'admin-top-notice.html', id: 'topnotice' },
  { section: '시스템' },
  { icon: '⚙️', label: '시스템 설정', href: 'admin-system-settings.html', id: 'syssettings' },
];

function buildSidebar(nav, type, activeId) {
  const isAdmin = type === 'admin';
  const logo = isAdmin ? '🏢 Hotel Admin' : '✦ 파트너센터';
  const logosub = isAdmin ? 'Super Admin Console' : '호텔 운영 파트너';
  const property = isAdmin
    ? `<div class="sidebar-property"><div class="prop-name">운영자 계정</div><div class="prop-id">admin@hotelplatform.kr</div></div>`
    : `<div class="sidebar-property"><div class="prop-name">시그니엘 서울</div><div class="prop-id">숙소 ID: 12345678</div></div>`;

  let navHtml = '';
  for (const item of nav) {
    if (item.section) {
      navHtml += `<div class="nav-section-title">${item.section}</div>`;
      continue;
    }
    const isActive = item.id === activeId;
    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    navHtml += `<a href="${item.href}" class="nav-item${isActive ? ' active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
      ${badge}
    </a>`;
  }

  return `<aside class="sidebar ${isAdmin ? 'admin-sidebar' : ''}">
    <div class="sidebar-logo">
      <div class="logo-text">${logo}</div>
      <div class="logo-sub">${logosub}</div>
    </div>
    ${property}
    <nav class="sidebar-nav">${navHtml}</nav>
    <div class="sidebar-footer">
      <div>© 2026 HotelMiddle Platform</div>
      <div style="margin-top:6px"><a href="index.html" style="color:rgba(255,255,255,0.5);text-decoration:underline;font-size:11px">← 전체 페이지 목록</a></div>
    </div>
  </aside>`;
}

function initPage(type, activeId, title) {
  const nav = type === 'admin' ? ADMIN_NAV : PARTNER_NAV;
  const sidebar = buildSidebar(nav, type, activeId);
  const layout = document.querySelector('.layout');
  if (layout) layout.insertAdjacentHTML('afterbegin', sidebar);

  const headerTitle = document.querySelector('.header-title');
  if (headerTitle && title) headerTitle.textContent = title;

  const dateEl = document.querySelector('.header-date');
  if (dateEl) {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    dateEl.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
  }

  // Modal
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal');
      document.getElementById(id)?.classList.remove('hidden');
    });
  });
  document.querySelectorAll('.modal-close, [data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay')?.classList.add('hidden');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.add('hidden'); });
  });

  // Tabs
  document.querySelectorAll('.tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-target');
        if (target) {
          document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
          document.getElementById(target)?.classList.remove('hidden');
        }
      });
    });
  });

  // Check items
  document.querySelectorAll('.check-item').forEach(item => {
    item.addEventListener('click', () => item.classList.toggle('checked'));
  });
}

// Horizontal bar chart
function drawHorizBars(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const colors = ['#FF4B8B', '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];
  el.innerHTML = items.map((item, i) => `
    <div class="bar-row">
      <div class="bar-label">${item.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${item.pct}%;background:${item.color || colors[i % colors.length]}"></div></div>
      <div class="bar-pct">${item.pct}%</div>
    </div>
  `).join('');
}

// ============================
// SYSTEM MODALS (replaces alert / confirm)
// ============================

function _ensureSystemModals() {
  if (document.getElementById('_sysAlert')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay hidden" id="_sysAlert" style="z-index:9999">
      <div class="modal" style="max-width:380px">
        <div class="modal-body" style="text-align:center;padding:32px 28px 16px">
          <div id="_saIcon" style="font-size:48px;margin-bottom:14px"></div>
          <div id="_saTitle" style="font-size:16px;font-weight:700;margin-bottom:8px;color:var(--gray-900)"></div>
          <div id="_saMsg" style="font-size:14px;color:var(--gray-600);line-height:1.8;white-space:pre-line"></div>
        </div>
        <div class="modal-footer" style="justify-content:center;border-top:1px solid var(--gray-100)">
          <button class="btn" id="_saOk" style="min-width:80px">확인</button>
        </div>
      </div>
    </div>
    <div class="modal-overlay hidden" id="_sysConfirm" style="z-index:9999">
      <div class="modal" style="max-width:380px">
        <div class="modal-body" style="text-align:center;padding:32px 28px 16px">
          <div id="_scIcon" style="font-size:48px;margin-bottom:14px"></div>
          <div id="_scTitle" style="font-size:16px;font-weight:700;margin-bottom:8px;color:var(--gray-900)"></div>
          <div id="_scMsg" style="font-size:14px;color:var(--gray-600);line-height:1.8;white-space:pre-line"></div>
        </div>
        <!-- 28차 UI 개편: 확인/취소 2개 버튼인 경우 중앙 정렬로 변경 -->
        <div class="modal-footer" style="border-top:1px solid var(--gray-100); justify-content: center;">
          <button class="btn btn-ghost" id="_scCancel">취소</button>
          <button class="btn" id="_scOk">확인</button>
        </div>
      </div>
    </div>
  `);
}

function showAlert(message, options) {
  if (typeof options === 'function') options = { onClose: options };
  const { title = '', icon = 'ℹ️', btnText = '확인', btnClass = 'btn-primary', onClose } = options || {};
  _ensureSystemModals();
  document.getElementById('_saIcon').textContent = icon;
  const titleEl = document.getElementById('_saTitle');
  titleEl.textContent = title;
  titleEl.style.display = title ? '' : 'none';
  document.getElementById('_saMsg').textContent = message;
  const ok = document.getElementById('_saOk');
  ok.textContent = btnText;
  ok.className = `btn ${btnClass}`;
  const ov = document.getElementById('_sysAlert');
  ov.classList.remove('hidden');
  ok.onclick = () => { ov.classList.add('hidden'); if (onClose) onClose(); };
}

function showConfirm(message, onConfirm, options) {
  const { title = '', icon = '⚠️', confirmText = '확인', confirmClass = 'btn-danger', onCancel } = options || {};
  _ensureSystemModals();
  document.getElementById('_scIcon').textContent = icon;
  const titleEl = document.getElementById('_scTitle');
  titleEl.textContent = title;
  titleEl.style.display = title ? '' : 'none';
  document.getElementById('_scMsg').textContent = message;
  const ok = document.getElementById('_scOk');
  const cancel = document.getElementById('_scCancel');
  ok.textContent = confirmText;
  ok.className = `btn ${confirmClass}`;
  const ov = document.getElementById('_sysConfirm');
  ov.classList.remove('hidden');
  ok.onclick = () => { ov.classList.add('hidden'); if (onConfirm) onConfirm(); };
  cancel.onclick = () => { ov.classList.add('hidden'); if (onCancel) onCancel(); };
}

// Settlement bar chart (canvas)
function drawSettleBars(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const max = Math.max(...data.map(d => d.v));
  el.innerHTML = data.map((d, i) => {
    const h = max > 0 ? Math.max(8, (d.v / max) * 100) : 8;
    return `<div class="settle-bar ${d.active ? 'active' : ''}" style="height:${h}%" title="${d.label}: ${d.v.toLocaleString()}원">
      <span class="settle-bar-label">${d.label}</span>
    </div>`;
  }).join('');
}
