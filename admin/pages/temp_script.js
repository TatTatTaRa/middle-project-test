
      initPage('partner', 'calendar', '호실 배정');

      const rooms = [
        { type: 'DELUXE', number: '201호' },
        { type: 'DELUXE', number: '202호' },
        { type: 'SUITE', number: '301호' },
        { type: 'SUITE', number: '302호' },
        { type: 'STANDARD', number: '101호' },
        { type: 'STANDARD', number: '102호' }
      ];
      const days = [];
      const start = new Date(2026, 2, 14);
      // 30차 개편 피드백: 칸 너비 확보를 위해 기본 10일 노출에서 8일로 축소
      for (let i = 0; i < 8; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({ n: d.getDate(), w: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()], isToday: i === 0, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
      }

      const events = [
        { room: 0, start: 0, end: 2, name: '이영만', type: 'using' },
        { room: 0, start: 4, end: 6, name: '최지훈', type: 'confirmed' },
        { room: 1, start: 1, end: 3, name: '한소희', type: 'using' },
        { room: 1, start: 5, end: 7, name: '오동민', type: 'using' }, // 테스트용: 미래 날짜인데 using(오류 상태)인 데이터
        { room: 2, start: 2, end: 4, name: '김정훈', type: 'confirmed' },
        { room: 3, start: 4, end: 7, name: '강하늘', type: 'confirmed' },
        { room: 4, start: 0, end: 1, name: '윤미래', type: 'using' },
        { room: 4, start: 5, end: 8, name: '서강준', type: 'confirmed' },
        { room: 5, start: 7, end: 9, name: '문채원', type: 'confirmed' },
      ];

      // 25차 개편: 색상 체계 변경 (using: 노랑, confirmed: 파랑)
      const evColors = {
        confirmed: '#DBEAFE|#1D4ED8', // 파란색: 이동가능 (배정완료/입실전)
        using: '#FEF3C7|#B45309'      // 노란색: 수정불가 (체크인완료/입실중)
      };

      // Build header
      let headerHtml = '<div class="tl-room-header" style="grid-column: 1 / 2">객실</div><div class="tl-dates" style="grid-column: 2 / 3">';
      days.forEach(d => {
        headerHtml += `<div class="tl-date${d.isToday ? ' today' : ''}${d.isWeekend ? ' weekend' : ''}">${d.n}<br><small>${d.w}</small></div>`;
      });
      headerHtml += '</div>';

      // Build rows
      let rowsHtml = '';

      let isAssignMode = false;
      let assignChanges = {}; // { '이명희': { from: '미배정', to: '201호' }, ... }
      let preAssignSnapshot = null; // 배치 모드 진입 직전 상태 스냅샷

      // [추가] 메모 상태 관리
      let reservationMemos = {}; // { '김철수': '일정 변경 요청 전화하기' }
      let currentModalResName = '';

      function openMemoModal() {
        if (!currentModalResName) return;
        const baseName = currentModalResName.split(' · ')[0];
        document.getElementById('memoModalInput').value = reservationMemos[baseName] || '';
        document.getElementById('modalMemo').classList.remove('hidden');
        document.getElementById('memoModalInput').focus();
      }

      function closeMemoModal() {
        document.getElementById('modalMemo').classList.add('hidden');
      }

      function saveMemo() {
        if (!currentModalResName) return;
        const text = document.getElementById('memoModalInput').value.trim();
        const baseName = currentModalResName.split(' · ')[0];

        if (text === '') {
          delete reservationMemos[baseName];
          showAlert(baseName + ' 님의 메모가 삭제되었습니다.', { icon: '🗑️' });
        } else {
          reservationMemos[baseName] = text;
          showAlert(baseName + ' 님의 메모가 저장되었습니다.', { icon: '📝' });
        }

        closeMemoModal();
        updateModalBookmarkBtn();
        renderBookmarks();
      }

      function updateModalBookmarkBtn() {
        const btn = document.getElementById('btnToggleBookmark');
        const baseName = currentModalResName.split(' · ')[0];
        if (!btn) return;

        if (reservationMemos[baseName]) {
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 협의 내용 확인`;
          btn.style.color = '#D97706';
          btn.style.fontWeight = '700';
        } else {
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 일정 협의/안내 메모`;
          btn.style.color = 'var(--gray-500)';
          btn.style.fontWeight = '500';
        }
      }

      function renderBookmarks() {
        document.querySelectorAll('.unassigned-card').forEach(card => {
          let nameElem = card.querySelector('.uc-name');
          if (!nameElem) return;
          let attrName = card.getAttribute('data-name');
          let baseName = attrName.split(' · ')[0];
          nameElem.innerText = reservationMemos[baseName] ? '📝 ' + attrName : attrName;
        });

        document.querySelectorAll('.tl-event').forEach(ev => {
          if (ev.classList.contains('ghost-event')) return;
          let attrName = ev.getAttribute('data-name');
          if (!attrName) return;

          let baseName = attrName.split(' · ')[0];
          let nights = ev.getAttribute('data-nights');
          let suffix = '';
          if (ev.innerHTML.includes('(가배치)')) suffix = ' (가배치)';
          else if (ev.textContent.includes('퇴실완료')) suffix = ' (퇴실완료)';
          else suffix = ` (${nights}박)`;

          ev.innerHTML = reservationMemos[baseName] ? `📝 ${attrName}${suffix}` : `${attrName}${suffix}`;
        });
      }

      function handleEventClick(e) {
        // 이동 거리가 10픽셀 이상이면 드래그(이사) 동작이므로 클릭 모달은 무시함
        if (isDragHappened) {
          isDragHappened = false;
          return;
        }

        // 모드 ON(배치 모드)일 땐 클릭해도 상세 모달이 뜨지 않음
        // 단, 확정된 예약 블록(파란색)을 클릭하면 해당 블록에 대한 수동 배정 모달을 엶
        if (isAssignMode) {
          if (e) e.preventDefault();
          if (e.currentTarget && e.currentTarget.classList.contains('draggable-event') && !e.currentTarget.classList.contains('unassigned-card')) {
            openManualAssignModal(e.currentTarget, true);
          }
          return;
        }

        const target = e.currentTarget;

        // 이용중(using) 타임라인 블록 → 별도 액션 모달로 라우팅
        if (!target.classList.contains('unassigned-card') && target.getAttribute('data-status') === 'using') {
          openUsingModal(target);
          return;
        }

        // 요소에서 데이터 추출
        const isCard = target.classList.contains('unassigned-card');
        const name = target.getAttribute('data-name');

        currentModalResName = name; // 전역 상태 저장
        const baseName = name.split(' · ')[0];

        // 메모 상태 UI 업데이트
        updateModalBookmarkBtn();

        const nights = target.getAttribute('data-nights');
        const startIdx = parseInt(target.getAttribute('data-start'));
        const typeStr = target.getAttribute('data-type');

        // 호실 이름 구성 (카드면 미지정, 블록이면 해당 row의 호실)
        let roomStr = '방 배정 대기 (호실 미지정)';
        if (!isCard) {
          const rowEl = target.closest('.tl-row');
          if (rowEl) {
            roomStr = `${typeStr} · ${rowEl.getAttribute('data-room')}`;
          }
        } else {
          roomStr = `${typeStr} (호실 미지정)`;
        }

        // 날짜 계산 (더미 캘린더 시작일 3/14 기준)
        const baseDate = new Date(2026, 2, 14);
        const checkInDate = new Date(baseDate.getTime() + (startIdx * 24 * 60 * 60 * 1000));
        const checkOutDate = new Date(checkInDate.getTime() + (nights * 24 * 60 * 60 * 1000));

        const formatTimeStr = (d, h) => {
          const YYYY = d.getFullYear();
          const MM = String(d.getMonth() + 1).padStart(2, '0');
          const DD = String(d.getDate()).padStart(2, '0');
          return `${YYYY}-${MM}-${DD} ${h}`;
        };
        const formatTimeStrT = (d, h) => {
          const YYYY = d.getFullYear();
          const MM = String(d.getMonth() + 1).padStart(2, '0');
          const DD = String(d.getDate()).padStart(2, '0');
          return `${YYYY}-${MM}-${DD}T${h}`;
        };

        const checkInStr = formatTimeStr(checkInDate, '15:00');
        const checkOutStr = formatTimeStr(checkOutDate, '11:00');
        const checkInStrT = formatTimeStrT(checkInDate, '15:00');
        const checkOutStrT = formatTimeStrT(checkOutDate, '11:00');

        // 첫 번째 상세 모달 업데이트
        const modalRes = document.getElementById('modalRes');
        const displayName = name.includes('·') ? name : `${name} · 2인`;
        modalRes.querySelector('.modal-body div:nth-child(2)').innerText = displayName;
        modalRes.querySelector('.modal-body div:nth-child(3)').innerText = roomStr;
        modalRes.querySelector('.modal-body .flex.justify-between:nth-child(1) span:last-child').innerText = checkInStr;
        modalRes.querySelector('.modal-body .flex.justify-between:nth-child(2) span:last-child').innerText = checkOutStr;

        // 두 번째 수정 모달 폼 초기값 미리 업데이트
        const modalEdit = document.getElementById('modalResEdit');
        modalEdit.querySelector('.modal-body div:nth-child(2)').innerText = `${name} · 2인`;
        document.getElementById('editModalRoomDisplay').innerText = roomStr;
        document.getElementById('editItemCheckIn').value = checkInStrT;
        document.getElementById('editItemCheckOut').value = checkOutStrT;

        modalRes.classList.remove('hidden');
      }

      function toggleAssignMode() {
        isAssignMode = !isAssignMode;
        const board = document.querySelector('.assign-board');
        const btnToggle = document.getElementById('btnToggleAssignMode');
        const iconArea = document.getElementById('iconToggleAssign');
        const legendTemp = document.getElementById('legendTempBlock'); // 73차 개편: 범례 토글용

        if (isAssignMode) {
          board.classList.add('mode-assign');
          if (legendTemp) legendTemp.style.display = 'flex';
          // 배치 모드 진입 시점 스냅샷 저장 (초기화에서 이 시점으로 복구)
          preAssignSnapshot = {
            sidebar: document.querySelector('.assign-sidebar').innerHTML,
            timelineGrid: document.getElementById('timelineGrid').innerHTML
          };
        } else {
          board.classList.remove('mode-assign');
          if (legendTemp) legendTemp.style.display = 'none'; // 조회 모드일 땐 숨김
          btnToggle.querySelector('span').innerText = '객실 배치 모드 켜기';
          btnToggle.style.background = 'transparent';
          btnToggle.style.color = 'var(--gray-700)';
          btnToggle.style.borderColor = 'var(--gray-300)';
          // SVG 십자 이동(Move) 아이콘 유지 보장
          iconArea.innerHTML = `<polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line>`;
        }
      }

      rooms.forEach((room, ri) => {
        const rowEvents = events.filter(e => e.room === ri);
        let cellsHtml = '';
        days.forEach(_ => { cellsHtml += '<div class="tl-cell"></div>'; });

        let evHtml = '';
        rowEvents.forEach(ev => {
          // 25차 개편: 오늘(isToday) 타임라인 인덱스 추출
          const todayIndex = days.findIndex(d => d.isToday);
          // 물리적 논리 교정: 오늘/과거 시작이 아닌데 'using(이용중)' 이라면 'confirmed' 상태로 강제 교정하여 렌더링
          let renderType = ev.type;
          if (renderType === 'using' && ev.start > todayIndex) {
            renderType = 'confirmed';
          }

          const [bg, color] = evColors[renderType].split('|');
          const w = ev.end - ev.start;
          const cellW = 100 / days.length;

          // 55차 개편: 기존 예약도 드롭 가능하게 클래스/속성 주입 및 커서 제어 분리
          const isUsing = renderType === 'using';
          const cursorStyle = ''; // using 블록도 클릭 가능 (중도퇴실/룸변경 액션)
          const draggableClass = isUsing ? '' : ' draggable-event';

          evHtml += `<div class="tl-event${draggableClass}" draggable="true" style="left:calc(${cellW * ev.start}% + 2px);width:calc(${cellW * w}% - 4px);background:${bg};color:${color};${cursorStyle}" onclick="handleEventClick(event)" data-name="${ev.name}" data-nights="${w}" data-start="${ev.start}" data-type="${room.type}" data-status="${renderType}">${ev.name} (${w}박)</div>`;
        });

        // 24차 개편을 위해 상위 래퍼 tl-row 에 data-type, 39차 개편을 위해 data-room 주입
        // 87차 개편: 객실 닉네임({room.name}) 제거
        rowsHtml += `<div class="tl-row" data-type="${room.type}" data-room="${room.number}"><div class="tl-label">
    <div style="font-size:10px;font-weight:700;color:var(--primary);margin-bottom:2px">${room.type}</div>
    <div style="font-size:12px;font-weight:600">${room.number}</div>
  </div><div class="tl-cells" data-type="${room.type}">${cellsHtml}${evHtml}</div></div>`;
      });

      document.getElementById('timelineGrid').innerHTML = `${headerHtml}${rowsHtml}`;

      // 21차 개편: 드래그 앤 드롭 Ghost UI 및 오버부킹(충돌) 검증 로직 구현
      const cards = document.querySelectorAll('.unassigned-card');
      const cellsRows = document.querySelectorAll('.tl-cells');

      let dragData = null;
      let ghostEl = null; // 타임라인 위를 떠다니는 가이드 박스

      // Ghost 초기화/제거 함수
      function removeGhost() {
        if (ghostEl) { ghostEl.remove(); ghostEl = null; }
      }

      // (사이드바 카드에 대한 개별 drag 리스너는 이제 문서 단위 delegation 으로 병합됨)

      // 드래그 임계값(Threshold) 처리 로직
      let pointerStartX = 0;
      let pointerStartY = 0;
      let pointerIsDown = false;
      let isDragHappened = false;
      let dragTargetEl = null;

      // 1. 눌렀을 때 초기화
      document.addEventListener('mousedown', (e) => {
        // 오직 이벤트 블록이나 카드에서만 드래그 시작 추적
        dragTargetEl = e.target.closest('.draggable-event, .unassigned-card');
        if (!dragTargetEl || !isAssignMode) return;
        
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        pointerIsDown = true;
        isDragHappened = false;

        // 우선 native 드래그 속성 끄기 (10픽셀 이동 전엔 순수 클릭 대기)
        dragTargetEl.setAttribute('draggable', 'false');
      });

      // 2. 이동 중 거리 계산
      document.addEventListener('mousemove', (e) => {
        if (!pointerIsDown || !dragTargetEl) return;
        
        const dx = Math.abs(e.clientX - pointerStartX);
        const dy = Math.abs(e.clientY - pointerStartY);

        // 이동 거리가 10px을 넘어가면 비로소 드래그로 간주
        if (dx > 10 || dy > 10) {
          isDragHappened = true;
          dragTargetEl.setAttribute('draggable', 'true'); // native drag 허용
        }
      });

      // 3. 마우스 떼기 및 드래그 끝
      document.addEventListener('mouseup', (e) => {
        pointerIsDown = false;
        // isDragHappened 값은 handleEventClick에서 확인 및 초기화되므로 여기서 무조건 false로 만들지 않음
      });

      // 55차 개편: document 에 Event Delegation 하여 동적으로 생성된 블록 드래그 방어 및 실행
      document.addEventListener('dragstart', (e) => {
        const evEl = e.target.closest('.draggable-event, .unassigned-card');
        if (!evEl) return;

        if (!isAssignMode || !isDragHappened) { 
          // 거리가 10px이 안되었는데 드래그가 시작되려고 하면 방어
          e.preventDefault(); 
          return; 
        }

        dragData = {
          nights: parseInt(evEl.getAttribute('data-nights') || 1, 10),
          name: evEl.getAttribute('data-name'),
          startIdx: parseInt(evEl.getAttribute('data-start') || 0, 10),
          type: evEl.getAttribute('data-type'),
          sourceRoom: evEl.closest('.tl-row')?.getAttribute('data-room') || '미배정'
        };

        e.dataTransfer.setData('text/plain', dragData.name);

        // 잔상 투명도 처리를 requestAnimationFrame으로 지연시켜 드래그 고스트가 원래 스타일을 유지하게 함
        requestAnimationFrame(() => {
          evEl.style.opacity = '0.3';
        });

        document.querySelectorAll('.tl-row').forEach(r => {
          if (r.getAttribute('data-type') !== dragData.type) {
             r.classList.add('dim-row');
          }
        });
      });

      document.addEventListener('dragend', (e) => {
        const evEl = e.target.closest('.draggable-event, .unassigned-card');
        if (!evEl) return;

        evEl.style.opacity = '1';
        if (evEl.classList.contains('moved')) {
          evEl.style.opacity = '0.3'; // 다른 곳으로 이사 성공한 오리지널 블록은 계속 잔상으로 놔둠
        }

        removeGhost();
        document.querySelectorAll('.tl-row.dim-row').forEach(row => {
          row.classList.remove('dim-row');
        });
        dragData = null;
        pointerIsDown = false;
        
        // 드래그가 완전히 끝나면, 다음 클릭을 위해 이 상태를 1프레임 뒤 리셋
        requestAnimationFrame(() => {
          isDragHappened = false;
        });
      });

      cellsRows.forEach(row => {
        row.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (!dragData || !isAssignMode) return; // 배치 모드 아니면 차단

          // 22/40차 개편: 마우스 X 좌표값을 따르지 않고, 카드가 갖고 있는 '예약 시작일(startIdx)'로 X축을 강제 고정
          const rowRect = row.getBoundingClientRect();
          const cellWidth = rowRect.width / days.length; // 동적 일수 빙 반영 (기존 하드코딩 10일 -> days.length)

          // 고정된 강제 인덱스 할당
          let fixedStartIndex = dragData.startIdx;

          // 타임라인 내부에 위치, 너비 계산 (좌우로 안 움직임)
          // 39/55차 개편: 타겟 호실 식별 및 트래킹 객체(assignChanges) 레코딩 (연속 가배치 시 원본 출처 유지 보정)
          const targetRoom = row.closest('.tl-row').getAttribute('data-room');
          let sourceRoom = dragData.sourceRoom;

          if (assignChanges[name]) {
            sourceRoom = assignChanges[name].from; // 이미 이사한 적 있는 녀석이라면 태초의 원래 방(from)을 보존
          }

          // 만약 출처방과 타겟방이 다를 경우에만 변경 이력에 등재, 같으면 원복
          if (sourceRoom !== targetRoom) {
            assignChanges[name] = { from: sourceRoom, to: targetRoom };
          } else {
            delete assignChanges[name];
          }

          // 타임라인 내부에 블록 확정 렌더링
          // 25차/29차/55차 개편: 새롭게 떨어진 블록도 그 즉시 다시 잡아 끌 수 있게 draggable-event 기반 속성 부여
          const tempBlock = document.createElement('div');
          tempBlock.className = 'tl-event draggable-event';
          tempBlock.setAttribute('draggable', 'true');
          tempBlock.style.cssText = `left: ${finalLeft}; width: ${finalWidth}; background: #F3E8FF; color: #7E22CE; border: 1px dashed #A855F7; cursor: grab;`;
          tempBlock.innerHTML = `${name} (가배치)`;

          // 41차 개편: 최종 저장 후, 파란색 확정 블록 렌더링 복귀 시점에 쓰일 파라미터 백업
          tempBlock.setAttribute('data-name', name);
          tempBlock.setAttribute('data-nights', dragData.nights);
          tempBlock.setAttribute('data-start', dragData.startIdx);
          tempBlock.setAttribute('data-type', row.getAttribute('data-type'));

          row.appendChild(tempBlock);

          // 21차 개편: 룸 배정 시 다른 예약과의 시간적 겹침(충돌) 및 타입 불일치 검증
          let isCollision = false;
          const evRects = Array.from(row.querySelectorAll('.tl-event:not(.ghost-event, .moved)'));
          evRects.forEach(ev => {
            if (ev === tempBlock) return; // 55차 개편: 가배치 블록(본인)은 충돌 검증에서 제외 (허상 겹침)
            
            // 화면 돔 좌표(BoundingClientRect)를 직접 매칭시켜 체크하는게 가장 정확
            const evRect = ev.getBoundingClientRect();
            const ghostRectLeft = rowRect.left + leftPx;
            const ghostRectRight = ghostRectLeft + widthPx;

            // 겹침 조건: 한쪽의 끝이 다른쪽의 시작보다 크고, 한쪽의 시작이 다른쪽의 끝보다 작음
            if (ghostRectLeft < evRect.right - 2 && ghostRectRight > evRect.left + 2) {
              isCollision = true;
            }
          });

          const rowType = row.getAttribute('data-type');
          const isTypeMismatch = dragData.type !== rowType;

          // 고스트 UI 생성 또는 위치 업데이트
          if (!ghostEl) {
            ghostEl = document.createElement('div');
            ghostEl.className = 'tl-event ghost-event';
            ghostEl.style.pointerEvents = 'none'; // 마우스 이벤트 방해 금지
            ghostEl.style.zIndex = '10';
            row.appendChild(ghostEl);
          } else if (ghostEl.parentElement !== row) {
            row.appendChild(ghostEl);
          }

          ghostEl.style.left = `${leftPx + 2}px`;
          ghostEl.style.width = `${widthPx - 4}px`;

          // 25차/27차/81차 개편: 불가 상태의 붉은색 복구 및 직관적인 상태 문구 텍스트 렌더링 추가
          if (isCollision || isTypeMismatch) {
            ghostEl.style.background = 'rgba(254, 226, 226, 0.95)'; // 매우 연한 빨강 배경
            ghostEl.style.border = '2px dashed #EF4444';
            ghostEl.dataset.valid = 'false';
            ghostEl.style.cursor = 'not-allowed';

            const stateKey = isTypeMismatch ? 'type-error' : 'overlap-error';
            const errorMsg = isTypeMismatch ? '객실타입 다름' : '예약 중복(충돌)';
            if (ghostEl.dataset.state !== stateKey) {
              ghostEl.dataset.state = stateKey;
              ghostEl.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; font-weight:500; color:#DC2626; font-size:12px; letter-spacing:-0.3px; opacity:0.9;">${errorMsg}</div>`;
            }
          } else {
            ghostEl.style.background = 'rgba(219, 234, 254, 0.95)'; // 매우 연한 파랑(Primary) 배경
            ghostEl.style.border = '2px dashed #4F46E5';
            ghostEl.dataset.valid = 'true';

            if (ghostEl.dataset.state !== 'valid') {
              ghostEl.dataset.state = 'valid';
              ghostEl.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; font-weight:500; color:#2563EB; font-size:12px; letter-spacing:-0.3px; opacity:0.9;">배정 가능</div>`;
            }
          }
        });

        row.addEventListener('dragleave', (e) => {
          // 80차 개편: 자식 요소 진입으로 인한 버블링(False Alarm)을 방지하고, 타임라인 영역 전체를 완전히 벗어났을 때만 고스트 제거
          if (!row.contains(e.relatedTarget)) {
            const isAnotherRow = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.tl-cells');
            if (!isAnotherRow) {
              removeGhost();
            }
          }
        });

        row.addEventListener('drop', (e) => {
          e.preventDefault();
          if (!dragData || !ghostEl || !isAssignMode) return; // 배치 모드 아니면 차단

          if (ghostEl.dataset.valid === 'false') {
            const errMsg = (ghostEl.dataset.state === 'type-error')
              ? '예약된 객실 타입이 일치하지 않아 배정할 수 없습니다.'
              : '선택한 일정에 이미 예약이 존재하여 중복 배정이 불가합니다.';
            showAlert(errMsg, { icon: '❌' });
            removeGhost();
            return;
          }

          const name = dragData.name;
          const finalLeft = ghostEl.style.left;
          const finalWidth = ghostEl.style.width;
          removeGhost();

          // 32차 개편: 기존 달력에 떠있는 가배치 블록 중, 자신이 꽂았던 낡은 블록(똑같은 이름)이 있다면 찾아서 삭제(이사 효과)
          document.querySelectorAll('.tl-event').forEach(el => {
            if (el.innerHTML.includes(name) && el.innerHTML.includes('(가배치)')) {
              el.remove();
            }
          });

          // 39/55차 개편: 타겟 호실 식별 및 트래킹 객체(assignChanges) 레코딩 (연속 가배치 시 원본 출처 유지 보정)
          const targetRoom = row.closest('.tl-row').getAttribute('data-room');
          let sourceRoom = dragData.sourceRoom;
          if (assignChanges[name]) {
            sourceRoom = assignChanges[name].from; // 이미 이사한 적 있는 녀석이라면 태초의 원래 방(from)을 보존
          }

          // 만약 출처방과 타겟방이 다를 경우에만 변경 이력에 등재
          if (sourceRoom !== targetRoom) {
            assignChanges[name] = { from: sourceRoom, to: targetRoom };
          } else {
            // 제자리로 완벽히 원복시켰다면 변경 이력에서 제거
            delete assignChanges[name];
          }

          // 타임라인 내부에 임시 블록(가배치) 확정 렌더링
          // 25차/29차/55차 개편: 새롭게 떨어진 가배치 블록도 그 즉시 다시 잡아 끌 수 있게 draggable-event 기반 속성 동시 부여
          const tempBlock = document.createElement('div');
          tempBlock.className = 'tl-event draggable-event';
          tempBlock.setAttribute('draggable', 'true');
          tempBlock.style.cssText = `left: ${finalLeft}; width: ${finalWidth}; background: #F3E8FF; color: #7E22CE; border: 1px dashed #A855F7; cursor: grab;`;
          tempBlock.innerHTML = `${name} (가배치)`;

          // 41차 개편: 최종 저장 후, 파란색 확정 블록 렌더링 복귀 시점에 쓰일 파라미터 백업
          tempBlock.setAttribute('data-name', name);
          tempBlock.setAttribute('data-nights', dragData.nights);
          tempBlock.setAttribute('data-start', dragData.startIdx);
          tempBlock.setAttribute('data-type', row.getAttribute('data-type'));

          row.appendChild(tempBlock);

          // 원본 카드 딤(Dim) 처리 및 31차 개편 [✓ 가배치] 뱃지 강제 덮어쓰기
          cards.forEach(c => {
            if (c.querySelector('.uc-name').innerText === name) {
              c.classList.add('dimmed');
              // 오리지널 뱃지 HTML을 data 속성에 잠시 백업해둠 (초기화시 복구용)
              const badgeEl = c.querySelector('.uc-badge');
              if (!c.hasAttribute('data-origin-badge')) {
                c.setAttribute('data-origin-badge', badgeEl.outerHTML);
              }
              badgeEl.outerHTML = `<span class="uc-badge" style="background:var(--gray-200);color:var(--gray-600)">✓ 가배치 완료</span>`;
            }
          });

          // 34차 개편: 캘린더 내 기존 확정 파란색 블록을 드래그하여 이사시킬 경우, 
          // 원래 위치에 있던 파란색 원본 객체에 'moved(이사 중)' 껍데기 마킹 추가 및 클릭(잡기) 방지
          document.querySelectorAll('.draggable-event').forEach(evEl => {
            // 드래그 중인 원본 객체 찾기 (이름 일치, 가배치 블록 아님)
            if (evEl.getAttribute('data-name') === name && evEl !== tempBlock) {
              evEl.classList.add('moved');
              evEl.style.opacity = '0.3';
              evEl.style.pointerEvents = 'none'; // 원본 잔상은 초기화 되기 전엔 다시 못 잡게 완전 고정
            }
          });

          // 28차 개편: 불필요하게 잦은 가배치 완료 Alert 모달을 제거하여 연속 테트리스 배정 UX 향상
          // showAlert('가배치 마킹 완료! 우측 상단 저장 버튼을 눌러 승인하세요.', {icon:'💡'});
        });
      });

      document.querySelectorAll('.modal-close,[data-modal-close]').forEach(b => {
        b.addEventListener('click', () => b.closest('.modal-overlay')?.classList.add('hidden'));
      });

      // 사이드바 카드에 드래그 속성만 재연결 (이벤트는 document delegation에서 처리됨)
      function reAttachSidebarDragListeners() {
        document.querySelectorAll('.unassigned-card').forEach(card => {
          card.setAttribute('draggable', true);
          card.onclick = handleEventClick;
        });
        updateUnassignedStatus();
      }

      // 초기화: 배치 모드 진입 직전 상태로 전체 복구
      document.getElementById('btnResetTemp').addEventListener('click', () => {
        showConfirm('배치 모드 진입 전 상태로 전체 초기화하시겠습니까?\n배정 추가·이동·해제한 내용이 모두 되돌아갑니다.', () => {
          if (!preAssignSnapshot) return;
          document.querySelector('.assign-sidebar').innerHTML = preAssignSnapshot.sidebar;
          document.getElementById('timelineGrid').innerHTML = preAssignSnapshot.timelineGrid;
          reAttachSidebarDragListeners();
          assignChanges = {};
          removeGhost();
          updateUnassignedStatus();
        }, { title: '초기화 확인', confirmText: '초기화', confirmClass: 'btn-danger' });
      });

      // 확정 배정(파란 블록) 전체를 일괄 미배정으로 전환 (이용중 블록 제외)
      function unassignAllConfirmed() {
        // 가배치(보라) 제외, using 제외 → 실제 confirmed(파란) 블록만 수집
        const targets = Array.from(document.querySelectorAll('.tl-event.draggable-event')).filter(el => {
          return !el.innerHTML.includes('(가배치)') && !el.classList.contains('moved');
        });

        if (targets.length === 0) {
          showAlert('해제할 배정 객실이 없습니다.', { icon: 'ℹ️' });
          return;
        }

        showConfirm(
          `이용 중인 객실을 제외한 확정 배정 ${targets.length}건을 전부 미배정으로 전환하시겠습니까?\n취소 후 다시 개별 배정해야 합니다.`,
          () => {
            targets.forEach(el => {
              const name = el.getAttribute('data-name');
              const nights = parseInt(el.getAttribute('data-nights'), 10);
              const startIdx = parseInt(el.getAttribute('data-start'), 10);
              const type = el.getAttribute('data-type');
              const rowEl = el.closest('.tl-row');
              const roomNum = rowEl ? rowEl.getAttribute('data-room') : '미배정';

              el.remove();
              addUnassignedCard({ name, nights, startIdx, type });
              assignChanges[name] = { from: roomNum, to: '미배정' };
            });
            updateUnassignedStatus();
          },
          { title: '전체 배정 해제', confirmText: '전체 해제', confirmClass: 'btn-danger' }
        );
      }

      // 39/44차 개편: 가배치 저장 시 변경사항 요약 문자열 동적 조립 및 컨펌 렌더링
      function handleSaveTemp() {
        const changeKeys = Object.keys(assignChanges);
        const changeCount = changeKeys.length;
        let confirmMsg = '';
        let confTitle = '변경사항 저장';
        let confBtnText = '확인';

        if (changeCount === 0) {
          // 44차 개편 피드백: "저장"의 개념보다 배치 모드 "종료/취소"의 의미가 강하므로 문맥을 바꿈
          confirmMsg = '변경된 배정 내역이 없습니다.\n객실 배치 모드를 종료하시겠습니까?';
          confTitle = '객실 배치 모드 종료';
          confBtnText = '종료';
        } else {
          // 변경 내역 문자열 만들기 (white-space: pre-line)
          confirmMsg = `총 ${changeCount}건의 배정 변경사항이 있습니다.\n\n`;
          changeKeys.forEach(name => {
            const rec = assignChanges[name];
            confirmMsg += `• ${name}: ${rec.from} ➔ ${rec.to}\n`;
          });
          confirmMsg += `\n달력에 반영된 내용으로 최종 승인 및 확정하시겠습니까?`;
          confTitle = '변경사항 저장 확인';
          confBtnText = '최종 승인/저장';
        }

        showConfirm(confirmMsg, () => {
          // 41차 개편 DOM 승격 및 청소 로직 구동 --------
          // 1. 임시 가배치 블록(보라색 점선) 들을 파란색(confirmed) 기배정 상태로 완전 승격
          document.querySelectorAll('.tl-event').forEach(el => {
            if (el.innerHTML.includes('(가배치)')) {
              const n = el.getAttribute('data-name');
              const nights = el.getAttribute('data-nights');
              // (가배치) 딱지 떼고 원래 텍스트로 환원
              el.innerHTML = `${n} (${nights}박)`;

              // 영구 확정 파란색 테마(#DBEAFE / #1D4ED8) 강제 주입
              el.style.background = '#DBEAFE';
              el.style.color = '#1D4ED8';
              el.style.border = 'none';
              el.style.cursor = 'pointer';

              // 클래스 승격 (이사 가능하게 함) 및 drag 이벤트 재점화
              el.classList.add('draggable-event');
              el.setAttribute('draggable', 'true');
              el.onclick = handleEventClick;
            }
          });

          // 2. 다른 곳으로 떠난 옛날 파란 블록들(투명도 0.3)의 빈 껍데기 잔상 말끔히 삭제
          document.querySelectorAll('.draggable-event.moved').forEach(el => el.remove());

          // 3. 미배정 사이드바에서 성공적으로 배정된 딤 처리 카드 완전 퇴출
          document.querySelectorAll('.unassigned-card.dimmed').forEach(card => card.remove());
          // ----------------------------------------

          // 43차 개편: 변경사항이 없을 때(0건)는 불필요하게 '배정이 확정되었습니다' 라는 모달을 또 띄우지 않음
          if (changeCount > 0) {
            showAlert('모든 배정이 성공적으로 확정(승인)되었습니다.', { icon: '🎉' });
          }

          assignChanges = {}; // 이력 초기화
          if (isAssignMode) toggleAssignMode(); // 모드 자동 원상복구
        }, { title: confTitle, confirmText: confBtnText, confirmClass: 'btn-primary' });
      }

      // 86차 개편: 예약 상세 정보 모달에서 예약 수정 모드로 전환
      let originalEditData = {};
      let currentlyEditingEvent = null; // 수정 중인 타임라인 이벤트 블록 추적용
      let currentlyEditingCard = null; // 사이드바 카드 추적용

      function toggleResEditMode() {
        const roomDisplay = document.getElementById('editModalRoomDisplay');
        const inInput = document.getElementById('editItemCheckIn');
        const outInput = document.getElementById('editItemCheckOut');

        // 현재 열려있는 상세 모달의 정보(이름)를 기반으로 캘린더에서 해당 블록을 찾음
        // (실제 구현에선 예약 ID로 매핑하지만 지금은 이름 추출)
        const nameText = document.querySelector('#modalResEdit .modal-body div:nth-child(2)').innerText.split('·')[0].trim();
        currentlyEditingEvent = Array.from(document.querySelectorAll('.tl-event')).find(el => el.getAttribute('data-name') === nameText);
        currentlyEditingCard = Array.from(document.querySelectorAll('.unassigned-card')).find(el => el.querySelector('.uc-name').innerText === nameText);

        originalEditData = {
          room: roomDisplay.innerText,
          checkIn: inInput.value.replace('T', ' '),
          checkOut: outInput.value.replace('T', ' '),
          name: nameText // 복원/이동용 백업
        };

        document.getElementById('modalRes').classList.add('hidden');
        document.getElementById('modalResEdit').classList.remove('hidden');
      }

      function cancelResEditMode() {
        document.getElementById('modalResEdit').classList.add('hidden');
      }

      function saveResEdit() {
        const currentRoom = document.getElementById('editModalRoomDisplay').innerText;
        const currentCheckIn = document.getElementById('editItemCheckIn').value.replace('T', ' ');
        const currentCheckOut = document.getElementById('editItemCheckOut').value.replace('T', ' ');

        let changes = [];
        if (originalEditData.room !== currentRoom) {
          changes.push(`• 객실: ${originalEditData.room} ➔ ${currentRoom}`);
        }
        if (originalEditData.checkIn !== currentCheckIn) {
          changes.push(`• 입실: ${originalEditData.checkIn} ➔ ${currentCheckIn}`);
        }
        if (originalEditData.checkOut !== currentCheckOut) {
          changes.push(`• 퇴실: ${originalEditData.checkOut} ➔ ${currentCheckOut}`);
        }

        if (changes.length === 0) {
          showAlert('변경된 사항이 없습니다.', { icon: 'ℹ️' });
          return;
        }

        // 호실 미지정 상태인지 확인
        const isUnassigned = currentRoom.includes('호실 미지정');
        if (isUnassigned) {
          changes.push(`\n⚠️ 해당 예약은 달력에서 제거되어 좌측 '방 배정 대기' 목록으로 이동됩니다.`);
        }

        const msg = `다음 항목들이 변경되었습니다. 확정하시겠습니까?\n\n${changes.join('\n')}`;

        showConfirm(msg, () => {
          // 확인(Confirm) 누른 경우

          // 호실 미지정 처리: 달력에서 빼서 왼쪽으로 이동
          if (isUnassigned) {
            if (currentlyEditingEvent) {
              currentlyEditingEvent.remove(); // 캘린더에서 삭제
            }
            if (currentlyEditingCard) {
              currentlyEditingCard.remove(); // 기존 대기 카드 삭제
            }

            // 왼쪽 사이드바에 카드 추가 (공통 함수 재사용)
            const typeStr = currentRoom.split('(')[0].trim();
            const baseDate = new Date(2026, 2, 14);
            const inDate = new Date(currentCheckIn);
            const outDate = new Date(currentCheckOut);
            const startIdx = Math.floor((inDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
            const nights = Math.floor((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
            addUnassignedCard({ name: originalEditData.name, nights, startIdx, type: typeStr });
          } else {
            // 지정된 호실로 변경된 경우 캘린더 화면에 렌더링 업데이트
            if (currentlyEditingCard) {
              currentlyEditingCard.remove(); // 사이드바에서 제거
            }

            if (currentlyEditingEvent || currentlyEditingCard) {
              const baseDate = new Date(2026, 2, 14);
              const inDate = new Date(currentCheckIn);
              const outDate = new Date(currentCheckOut);
              const startIdx = Math.floor((inDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
              const nights = Math.floor((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));

              const parts = currentRoom.split('·');
              const typeStr = parts[0].trim();
              const roomNum = parts[1].trim();

              const targetRow = Array.from(document.querySelectorAll('.tl-row')).find(row => row.getAttribute('data-room') === roomNum);
              if (targetRow) {
                const cellsContainer = targetRow.querySelector('.tl-cells');
                const cellWidth = 100 / 8; // 8일력

                let targetEvent = currentlyEditingEvent;
                if (!targetEvent) {
                  targetEvent = document.createElement('div');
                  targetEvent.className = 'tl-event draggable-event';
                  targetEvent.setAttribute('draggable', 'true');
                  targetEvent.setAttribute('data-name', originalEditData.name);
                  targetEvent.onclick = handleEventClick;
                  targetEvent.style.border = 'none';
                  targetEvent.style.background = '#DBEAFE';
                  targetEvent.style.color = '#1D4ED8';
                }

                targetEvent.style.left = `calc(${cellWidth * startIdx}% + 2px)`;
                targetEvent.style.width = `calc(${cellWidth * nights}% - 4px)`;
                targetEvent.setAttribute('data-start', startIdx);
                targetEvent.setAttribute('data-nights', nights);
                targetEvent.setAttribute('data-type', typeStr);
                targetEvent.innerHTML = `${originalEditData.name} (${nights}박)`;

                cellsContainer.appendChild(targetEvent); // Move element
              }
            }
          }

          document.getElementById('modalResEdit').classList.add('hidden');
          showAlert('예약 수정 사항이 정상적으로 저장되었습니다.', { icon: '✅' });
        }, { title: '예약 수정 확인', confirmText: '저장', confirmClass: 'btn-primary' });
      }

      // 객실 변경 모달 제어 (2-Step Flow)
      let currentlySelectedTypeForEdit = null;

      function openRoomSelectModal() {
        document.getElementById('modalRoomSelect').classList.remove('hidden');
        resetRoomSelectState();
      }

      function closeRoomSelectModal() {
        document.getElementById('modalRoomSelect').classList.add('hidden');
        resetRoomSelectState();
      }

      function resetRoomSelectState() {
        currentlySelectedTypeForEdit = null;
        document.getElementById('roomNumberSection').style.display = 'none';

        // 타입 버튼 하이라이트 초기화
        const typeBtns = document.getElementById('roomTypeContainer').querySelectorAll('button');
        typeBtns.forEach(btn => {
          btn.style.borderColor = 'var(--gray-300)';
          btn.style.background = 'white';
          btn.style.color = 'var(--gray-800)';
        });
      }

      function handleTypeSelect(btnElement, type) {
        currentlySelectedTypeForEdit = type;

        // 1. 모든 타입 버튼 상태 리셋
        const typeBtns = document.getElementById('roomTypeContainer').querySelectorAll('button');
        typeBtns.forEach(btn => {
          btn.style.borderColor = 'var(--gray-300)';
          btn.style.background = 'white';
          btn.style.color = 'var(--gray-800)';
        });

        // 2. 선택한 버튼 하이라이트 (Primary 스킨 적용)
        btnElement.style.borderColor = 'var(--primary)';
        btnElement.style.background = 'var(--primary-light)';
        btnElement.style.color = 'var(--primary)';

        // 3. 2번째 스텝(호실 선택 영역) 노출 및 데이터 바인딩
        const section = document.getElementById('roomNumberSection');
        const container = document.getElementById('roomNumberContainer');
        section.style.display = 'block';

        // 날짜 입력값 가져오기 (문자열 파싱)
        const checkInStr = document.getElementById('editItemCheckIn').value;
        const checkOutStr = document.getElementById('editItemCheckOut').value;

        // 기준 시간 (2026-03-14) 에 대한 인덱스로 변환 계산 (더미 캘린더 로직 연동)
        const baseDate = new Date(2026, 2, 14);
        const inDate = new Date(checkInStr);
        const outDate = new Date(checkOutStr);

        // ms 차이를 일(day) 수로 계산 (startIndex, endIndex 도출)
        const startIdx = Math.floor((inDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
        const endIdx = Math.floor((outDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

        // 더미 데이터 전체 객실 중 해당 type 필터링
        const availableRooms = [];
        rooms.forEach((r, idx) => {
          if (r.type !== type) return; // 타입 다르면 스킵

          // 이 객실에 해당하는 이벤트(예약)를 가져옴
          const roomEvents = events.filter(e => e.room === idx);
          let isConflict = false;

          // 예약 충돌 검사: 예약 기간이 겹치는지 확인
          for (const ev of roomEvents) {
            // 본인 예약(김철수)은 자기 덮어쓰기 허용이므로 충돌 무시
            // 실제 구현에선 예약 ID로 식별. 현재는 더미 이름 하드코딩 (김철수는 더미 events에 없으므로 안전)

            // 겹침 여부: 한쪽의 끝이 다른쪽의 시작보다 늦고 && 한쪽의 시작이 다른쪽의 끝보다 빠름
            if (endIdx > ev.start && startIdx < ev.end) {
              isConflict = true;
              break;
            }
          }

          if (!isConflict) {
            availableRooms.push(r.number);
          }
        });

        container.innerHTML = '';

        if (availableRooms.length === 0) {
          const emptyMsg = document.createElement('div');
          emptyMsg.style.cssText = 'grid-column: span 2; font-size: 11px; color: var(--gray-500); padding: 8px; text-align: center; background: var(--gray-50); border-radius: 4px; border: 1px dashed var(--gray-300);';
          emptyMsg.innerText = '해당 기간에 비어있는 객실이 없습니다.';
          container.appendChild(emptyMsg);
        } else {
          availableRooms.forEach(roomNum => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-outline btn-sm';
            btn.style.justifyContent = 'flex-start';
            btn.innerText = roomNum;
            btn.onclick = () => confirmFinalRoomSelection(type, roomNum);
            container.appendChild(btn);
          });
        }
      }

      // 명시적으로 호실을 픽 건너뛰고 '종류만 미지정 상태'로 넘기는 경우
      function confirmTypeOnlySelection() {
        if (!currentlySelectedTypeForEdit) return;
        document.getElementById('editModalRoomDisplay').innerText = `${currentlySelectedTypeForEdit} (호실 미지정)`;
        closeRoomSelectModal();
      }

      // 특정 호실까지 정확히 찍은 경우
      function confirmFinalRoomSelection(type, number) {
        document.getElementById('editModalRoomDisplay').innerText = `${type} · ${number}`;
        closeRoomSelectModal();
      }

      // ── 공통 함수: 미배정 카드 생성 + 사이드바에 추가 + 드래그 재연결 ──
      function addUnassignedCard({ name, nights, startIdx, type }) {
        const baseDate = new Date(2026, 2, 14);
        const inDate = new Date(baseDate.getTime() + startIdx * 86400000);
        const outDate = new Date(inDate.getTime() + nights * 86400000);
        const fmtShort = d => `${d.getMonth() + 1}/${d.getDate()}`;
        const bgMap = { DELUXE: '#E0E7FF', SUITE: '#D1FAE5', STANDARD: '#F3F4F6' };
        const coMap = { DELUXE: '#3730A3', SUITE: '#065F46', STANDARD: '#4B5563' };

        const newCard = document.createElement('div');
        newCard.className = 'unassigned-card';
        newCard.setAttribute('draggable', true);
        newCard.setAttribute('data-name', name);
        newCard.setAttribute('data-nights', nights);
        newCard.setAttribute('data-start', startIdx);
        newCard.setAttribute('data-type', type);
        newCard.onclick = handleEventClick;
        const baseName = name.split(' · ')[0];
        newCard.innerHTML = `
    <div class="uc-header">
      <span class="uc-name">${reservationMemos[baseName] ? '📝 ' + name : name}</span>
      <span class="uc-badge" style="background:${bgMap[type] || '#eee'};color:${coMap[type] || '#333'}">${type}</span>
    </div>
    <div class="uc-info">📅 ${fmtShort(inDate)} ~ ${fmtShort(outDate)} (${nights}박)</div>
    <div class="uc-info">📞 010-0000-0000</div>
    <div class="uc-info" style="margin-top:8px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:#3b82f6;font-weight:500">배정 가능: 1실</span>
      <button class="btn-assign-room" onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='var(--primary)'" style="padding:5px 12px;background:var(--primary);color:white;border:none;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:3px;transition:0.2s" onclick="event.stopPropagation();">
        방 배정
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
      </button>
    </div>
  `;

        document.querySelector('.assign-sidebar').appendChild(newCard);

        newCard.addEventListener('dragstart', (e) => {
          if (!isAssignMode) { e.preventDefault(); return; }
          dragData = { name, nights, startIdx, type, sourceRoom: '미배정' };
          e.dataTransfer.setData('text/plain', name);
          newCard.style.opacity = '0.5';
          document.querySelectorAll('.tl-row').forEach(row => {
            if (row.getAttribute('data-type') !== type) row.classList.add('dim-row');
          });
        });
        newCard.addEventListener('dragend', () => {
          newCard.style.opacity = '1';
          removeGhost();
          document.querySelectorAll('.tl-row.dim-row').forEach(row => row.classList.remove('dim-row'));
          dragData = null;
        });

        return newCard;
      }

      // ── 사이드바 드롭 타겟: 타임라인 블록 → 드래그하여 미배정으로 복원 ──
      const sidebarEl = document.querySelector('.assign-sidebar');

      sidebarEl.addEventListener('dragover', (e) => {
        if (!isAssignMode || !dragData || dragData.sourceRoom === '미배정') return;
        e.preventDefault();
        sidebarEl.classList.add('drop-active');
      });

      sidebarEl.addEventListener('dragleave', (e) => {
        if (!sidebarEl.contains(e.relatedTarget)) {
          sidebarEl.classList.remove('drop-active');
        }
      });

      sidebarEl.addEventListener('drop', (e) => {
        e.preventDefault();
        sidebarEl.classList.remove('drop-active');
        if (!dragData || dragData.sourceRoom === '미배정') return;

        const { name, nights, startIdx, type, sourceRoom } = dragData;

        // 타임라인에서 해당 이름의 모든 블록 제거 (가배치·moved 포함)
        document.querySelectorAll('.tl-event').forEach(el => {
          if (el.getAttribute('data-name') === name) el.remove();
        });

        // 기존 dimmed 카드가 있다면 복원 (재배정된 경우)
        document.querySelectorAll('.unassigned-card.dimmed').forEach(card => {
          if (card.querySelector('.uc-name')?.innerText === name) {
            card.classList.remove('dimmed');
            const originBadge = card.getAttribute('data-origin-badge');
            if (originBadge) card.querySelector('.uc-badge').outerHTML = originBadge;
          }
        });

        // 미배정 카드 추가
        addUnassignedCard({ name, nights, startIdx, type });

        // 변경 이력 기록
        assignChanges[name] = { from: sourceRoom, to: '미배정' };

        removeGhost();
        dragData = null;
        document.querySelectorAll('.tl-row.dim-row').forEach(row => row.classList.remove('dim-row'));
      });

      // ── 이용중 투숙객 액션 모달 ───────────────────────────────
      let currentUsingEvent = null;

      function toggleSetupActions() {
        const extraActions = document.getElementById('usingExtraActions');
        if (extraActions.style.display === 'none') {
          extraActions.style.display = 'flex';
        } else {
          extraActions.style.display = 'none';
        }
      }

      function openUsingModal(target) {
        document.getElementById('usingExtraActions').style.display = 'none';
        const rowEl = target.closest('.tl-row');
        const name = target.getAttribute('data-name');
        const nights = parseInt(target.getAttribute('data-nights'), 10);
        const startIdx = parseInt(target.getAttribute('data-start'), 10);
        const roomType = target.getAttribute('data-type');
        const roomNum = rowEl ? rowEl.getAttribute('data-room') : '—';

        const baseDate = new Date(2026, 2, 14);
        const checkIn = new Date(baseDate.getTime() + startIdx * 86400000);
        const checkOut = new Date(checkIn.getTime() + nights * 86400000);
        const pad = n => String(n).padStart(2, '0');
        const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const fmtT = (d, h) => `${fmt(d)}T${h}`;

        currentUsingEvent = { target, name, nights, startIdx, roomType, roomNum, checkIn, checkOut, fmtT, pad };

        document.getElementById('uaGuestName').textContent = `${name} · 2인`;
        document.getElementById('uaRoomInfo').textContent = `${roomType} · ${roomNum}`;
        document.getElementById('uaCheckin').textContent = `${fmt(checkIn)} 15:00`;
        document.getElementById('uaCheckout').textContent = `${fmt(checkOut)} 11:00`;

        document.getElementById('modalUsingAction').classList.remove('hidden');
      }

      // ── 중도 퇴실 처리 ───────────────────────────────────────
      function openEarlyCheckout() {
        if (!currentUsingEvent) return;
        const { name, roomType, roomNum, pad } = currentUsingEvent;
        document.getElementById('ecGuestName').textContent = `${name} · 2인`;
        document.getElementById('ecRoomInfo').textContent = `${roomType} · ${roomNum}`;
        const now = new Date();
        document.getElementById('ecCheckoutTime').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        document.getElementById('modalEarlyCheckout').classList.remove('hidden');
      }

      function cancelEarlyCheckout() {
        document.getElementById('modalEarlyCheckout').classList.add('hidden');
      }

      function confirmEarlyCheckout() {
        const { name, roomType, roomNum, target } = currentUsingEvent;
        document.getElementById('modalEarlyCheckout').classList.add('hidden');
        document.getElementById('modalUsingAction').classList.add('hidden');
        // 캘린더 블록 시각적 처리: 취소선 + 회색 처리
        if (target) {
          target.style.background = '#F3F4F6';
          target.style.color = '#9CA3AF';
          target.style.textDecoration = 'line-through';
          target.style.pointerEvents = 'none';
          target.textContent = `${name} (퇴실완료)`;
        }
        showAlert(`${name}님 중도 퇴실 처리 완료.\n${roomType} · ${roomNum} 은 미배정 상태로 전환됩니다.`, { icon: '✅', title: '중도 퇴실 완료' });
        currentUsingEvent = null;
      }

      // ── 투숙 정보 변경 (룸 변경) ────────────────────────────
      function openRoomTransfer() {
        if (!currentUsingEvent) return;
        const { name, roomType, roomNum } = currentUsingEvent;
        document.getElementById('rtGuestName').textContent = `${name} · 2인`;
        document.getElementById('rtCurrentRoom').textContent = `${roomType} · ${roomNum}`;
        document.getElementById('rtRoomSection').style.display = 'none';
        document.querySelectorAll('#rtTypeContainer .btn').forEach(b => {
          b.style.borderColor = 'var(--gray-300)';
          b.style.background = '';
          b.style.color = '';
          b.style.fontWeight = '';
        });
        document.getElementById('modalRoomTransfer').classList.remove('hidden');
      }

      function closeRoomTransfer() {
        document.getElementById('modalRoomTransfer').classList.add('hidden');
      }

      function handleTransferTypeSelect(btn, type) {
        document.querySelectorAll('#rtTypeContainer .btn').forEach(b => {
          b.style.borderColor = 'var(--gray-300)';
          b.style.background = '';
          b.style.color = '';
          b.style.fontWeight = '';
        });
        btn.style.borderColor = 'var(--primary)';
        btn.style.background = 'var(--primary-light)';
        btn.style.color = 'var(--primary)';
        btn.style.fontWeight = '700';

        const roomNums = { DELUXE: ['201호', '202호'], SUITE: ['301호', '302호'], STANDARD: ['101호', '102호'] };
        const nums = roomNums[type] || [];
        const container = document.getElementById('rtRoomContainer');
        container.innerHTML = nums.map(n =>
          `<button class="btn btn-outline" style="border-color:var(--gray-300);font-size:13px" onclick="confirmRoomTransfer('${type}','${n}')">${n}</button>`
        ).join('');
        document.getElementById('btnConfirmTransferTypeOnly').textContent = `${type} 호실 미지정으로 변경`;
        document.getElementById('rtRoomSection').style.display = 'block';
      }

      function confirmRoomTransfer(type, roomNum) {
        if (!currentUsingEvent) return;
        const { name, roomType: origType, roomNum: origRoom } = currentUsingEvent;
        const newType = type || origType;
        const roomStr = roomNum ? `${newType} · ${roomNum}` : `${newType} (호실 미지정)`;
        document.getElementById('modalRoomTransfer').classList.add('hidden');
        document.getElementById('modalUsingAction').classList.add('hidden');
        showAlert(`${name}님의 객실이 ${roomStr}으로 변경되었습니다.\n기존 ${origType} · ${origRoom} 은 미배정 상태로 전환됩니다.`, { icon: '✅', title: '투숙 정보 변경 완료' });
        currentUsingEvent = null;
      }

      // ── 동적 대기 메트릭 계산기 (배정 불가 인원 필터링 로직) ──
      function updateUnassignedStatus() {
        // 1. 순수 사이드바 대기 카드 집계 (가배치 되어서 dimmed 처리된 카드는 제외)
        const unassignedCards = Array.from(document.querySelectorAll('.unassigned-card:not(.dimmed)'));
        const totalUnassignedCount = unassignedCards.length;

        const badgeTotal = document.getElementById('badgeTotalUnassigned');
        if (badgeTotal) {
          badgeTotal.innerText = totalUnassignedCount;
          if (totalUnassignedCount === 0) {
            badgeTotal.style.background = '#F3F4F6';
            badgeTotal.style.color = '#9CA3AF';
          } else {
            badgeTotal.style.background = '#FFF1F2';
            badgeTotal.style.color = '#E11D48';
          }
        }

        if (totalUnassignedCount === 0) {
          const impossibleBox = document.getElementById('impossibleWarningBox');
          if (impossibleBox) {
            impossibleBox.style.display = 'none'; // 대기가 아예 없으면 위젯도 숨김
          }
          return;
        }

        // 2. 현재 캘린더 타임라인(그리드) 상의 모든 이벤트 수집
        // (가배치 포함, moved 잔상 제외)
        const currentGridEvents = Array.from(document.querySelectorAll('.tl-event:not(.moved)')).map(el => {
          const rowEl = el.closest('.tl-row');
          if (!rowEl) return null;
          return {
            type: el.getAttribute('data-type') || rowEl.getAttribute('data-type'),
            room: rowEl.getAttribute('data-room'),
            start: parseInt(el.getAttribute('data-start'), 10),
            end: parseInt(el.getAttribute('data-start'), 10) + parseInt(el.getAttribute('data-nights'), 10)
          };
        }).filter(Boolean);

        let impossibleCount = 0;

        // 3. 미배정 남은 카드마다 각각 물리적 수용 가능 여부(구멍)가 있는지 체크
        unassignedCards.forEach(card => {
          const uType = card.getAttribute('data-type');
          const uStart = parseInt(card.getAttribute('data-start'), 10);
          const uEnd = uStart + parseInt(card.getAttribute('data-nights'), 10);

          let availableRoomCount = 0;

          const targetRooms = rooms.filter(r => r.type === uType);

          for (const roomDef of targetRooms) {
            const roomEvents = currentGridEvents.filter(ev => ev.type === roomDef.type && ev.room === roomDef.number);

            let isConflict = false;
            for (const ev of roomEvents) {
              if (uEnd > ev.start && uStart < ev.end) {
                isConflict = true;
                break;
              }
            }

            if (!isConflict) {
              availableRoomCount++;
            }
          }

          if (availableRoomCount === 0) {
            impossibleCount++;
          }

          // 3-1. 카드 내 텍스트 "배정 가능: N실" 동적 렌더링
          const availSpan = card.querySelector('.avail-status');
          if (availSpan) {
            if (availableRoomCount > 0) {
              availSpan.innerText = `배정 가능: ${availableRoomCount}실`;
              availSpan.style.color = '#3b82f6'; // 기존 파란색
              availSpan.style.fontWeight = '500';
            } else {
              availSpan.innerText = `배정 가능한 호실이 없습니다.`;
              availSpan.style.color = 'var(--primary)'; // 메인 컬러
              availSpan.style.fontWeight = '400';
            }
          }
        });

        // 4. 배정 불가 위젯 UI 반영 (새로운 디자인 위젯)
        const impossibleBox = document.getElementById('impossibleWarningBox');
        const textImp = document.getElementById('textImpossible');
        if (impossibleBox && textImp) {
          if (impossibleCount > 0) {
            impossibleBox.style.display = 'flex';
            textImp.innerText = impossibleCount;
          } else {
            impossibleBox.style.display = 'none';
          }
        }
      }

      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateUnassignedStatus, 100);
      });

      // 공통 모달 열기/닫기 함수
      function openModal(modalId) {
        document.getElementById(modalId)?.classList.remove('hidden');
        document.getElementById(modalId).style.display = 'flex';
      }

      function closeModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
        document.getElementById(modalId).style.display = 'none';
      }

      // --- 수동 호실 배정 모달 로직 ---
      let targetCardForAssign = null;

      // isGridEvent가 true면 캘린더 내부의 블록을 클릭한 것
      function openManualAssignModal(element, isGridEvent = false) {
        // 이동 거리 10px 이상이면 무시 (드래그로 간주)
        if (isDragHappened) {
          isDragHappened = false;
          return;
        }

        if (!isAssignMode) {
          alert('수동 배치 모드를 먼저 켜주세요. (우측 하단 버튼)');
          return;
        }

        const card = isGridEvent ? element : element.closest('.unassigned-card');
        if (!card) return;

        targetCardForAssign = card;

        const uName = card.getAttribute('data-name');
        const uType = card.getAttribute('data-type');
        const uStart = parseInt(card.getAttribute('data-start'), 10);
        const nights = parseInt(card.getAttribute('data-nights'), 10);
        const uEnd = uStart + nights;

        // 모달 상단 예약 요약 정보 업데이트
        document.getElementById('maName').innerText = uName;
        document.getElementById('maType').innerText = uType;

        const dateMap = { 1: '3/15', 2: '3/16', 3: '3/17', 4: '3/18', 5: '3/19', 6: '3/20', 7: '3/21' };
        const startDateStr = dateMap[uStart] || `Day ${uStart}`;
        const endDateStr = dateMap[uEnd] || `Day ${uEnd}`;
        document.getElementById('maDates').innerText = `📅 ${startDateStr} ~ ${endDateStr} (${nights}박)`;

        // 배정 가능한 방 필터링 로직 (updateUnassignedStatus와 동일)
        const currentGridEvents = Array.from(document.querySelectorAll('.tl-event:not(.moved)')).map(el => {
          const rowEl = el.closest('.tl-row');
          if (!rowEl) return null;
          return {
            type: el.getAttribute('data-type') || rowEl.getAttribute('data-type'),
            room: rowEl.getAttribute('data-room'),
            start: parseInt(el.getAttribute('data-start'), 10),
            end: parseInt(el.getAttribute('data-start'), 10) + parseInt(el.getAttribute('data-nights'), 10)
          };
        }).filter(Boolean);

        const targetRooms = rooms.filter(r => r.type === uType);
        const availableRooms = [];

        for (const roomDef of targetRooms) {
          const roomEvents = currentGridEvents.filter(ev => ev.type === roomDef.type && ev.room === roomDef.number);
          let isConflict = false;
          for (const ev of roomEvents) {
            if (uEnd > ev.start && uStart < ev.end) {
              isConflict = true;
              break;
            }
          }
          if (!isConflict) {
            availableRooms.push(roomDef.number);
          }
        }

        // 모달 리스트 렌더링
        const listContainer = document.getElementById('manualAssignRoomList');
        listContainer.innerHTML = '';

        let hasAvailable = false;

        targetRooms.forEach(roomDef => {
          const roomNum = roomDef.number;
          const roomEvents = currentGridEvents.filter(ev => ev.type === roomDef.type && ev.room === roomNum);
          let isConflict = false;
          for (const ev of roomEvents) {
            if (uEnd > ev.start && uStart < ev.end) {
              isConflict = true;
              break;
            }
          }

          if (isConflict) {
            // 예약이 있어 배정 불가한 객실
            const itemHTML = `
              <div class="room-option-item" style="opacity: 0.5; cursor: not-allowed; background: var(--gray-50); border-color: var(--gray-200);">
                <div style="display:flex; align-items:center;">
                  <span class="room-number" style="color: var(--gray-500);">${roomNum}</span>
                  <span class="room-type" style="background: var(--gray-200); color: var(--gray-500);">${uType}</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: var(--danger);">불가</span>
              </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHTML);
          } else {
            // 배정 가능한 공실
            hasAvailable = true;
            const itemHTML = `
              <div class="room-option-item" onclick="confirmManualAssign('${roomNum}')">
                <div style="display:flex; align-items:center;">
                  <span class="room-number">${roomNum}</span>
                  <span class="room-type">${uType}</span>
                </div>
              </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHTML);
          }
        });

        if (!hasAvailable) {
          // 모든 방이 불가일 경우를 위한 안내 메시지 추가
          listContainer.insertAdjacentHTML('afterbegin', `
            <div style="padding:10px 0; text-align:center; color:var(--danger); font-size:12px; font-weight:bold; background:#FEF2F2; border-radius:6px; margin-bottom:10px;">
              선택하신 기간(${nights}박)에 배정 가능한 ${uType} 객실이 없습니다.
            </div>
          `);
        }

        openModal('modalManualAssign');
      }

      function confirmManualAssign(selectedRoomNumber) {
        if (!targetCardForAssign) return;

        const targetRow = document.querySelector(`.tl-row[data-room="${selectedRoomNumber}"]`);
        if (!targetRow) return;

        const uStart = parseInt(targetCardForAssign.getAttribute('data-start'), 10);
        const nights = parseInt(targetCardForAssign.getAttribute('data-nights'), 10);
        const uType = targetCardForAssign.getAttribute('data-type');
        const uName = targetCardForAssign.getAttribute('data-name');
        
        // 22/40차 개편 동일: cellWidth 기반 X 좌표 계산
        const cellWidth = 100 / days.length; // 8일력 비율
        const leftPx = uStart * cellWidth;
        const widthPx = nights * cellWidth;

        // 변경 이력 추적
        let sourceRoom = targetCardForAssign.classList.contains('unassigned-card') ? '미배정' : (targetCardForAssign.getAttribute('data-room') || targetCardForAssign.closest('.tl-row').getAttribute('data-room'));
        
        if (assignChanges[uName]) {
          sourceRoom = assignChanges[uName].from; // 이미 이사한 적 있다면 최초 출처 보존
        }

        if (sourceRoom !== selectedRoomNumber) {
          assignChanges[uName] = { from: sourceRoom, to: selectedRoomNumber };
        } else {
          delete assignChanges[uName];
        }

        // 타임라인 내부에 블록 확정 렌더링 (가배치 스타일로)
        const newEvent = document.createElement('div');
        newEvent.className = 'tl-event draggable-event';
        newEvent.setAttribute('draggable', 'true');
        newEvent.setAttribute('data-name', uName);
        newEvent.setAttribute('data-nights', nights);
        newEvent.setAttribute('data-start', uStart);
        newEvent.setAttribute('data-type', targetRow.getAttribute('data-type'));
        
        newEvent.style.left = `calc(${leftPx}% + 2px)`;
        newEvent.style.width = `calc(${widthPx}% - 4px)`;
        newEvent.style.background = '#F3E8FF';
        newEvent.style.color = '#7E22CE';
        newEvent.style.border = '1px dashed #A855F7';
        newEvent.style.cursor = 'grab';
        newEvent.innerHTML = `${uName} (가배치)`;

        targetRow.querySelector('.tl-cells').appendChild(newEvent);

        // 새 이벤트에 드래그 리스너 연결 (전역 dragstart 이벤트로 위임되므로 개별 dragstart 안붙여도 되나, 기존 호환 유지를 위해 남김)
        newEvent.addEventListener('dragstart', (e) => {
          dragData = {
            id: newEvent.getAttribute('data-id'),
            nights: nights,
            type: uType,
            startIdx: uStart,
            name: uName,
            sourceRoom: selectedRoomNumber
          };
          newEvent.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => { newEvent.style.opacity = '0.5'; }, 0);
        });
        newEvent.addEventListener('dragend', () => {
          dragData = null;
          newEvent.classList.remove('dragging');
          newEvent.style.opacity = '1';
          removeGhost();
        });
        
        // 클릭 리스너 연결 (가배치 상태든 원복 상태든 클릭 시 다시 모달 뜨게)
        newEvent.addEventListener('click', (e) => handleEventClick(e));

        if (targetCardForAssign.classList.contains('unassigned-card')) {
          // 사이드바의 첫 배정인 경우: 기존 카드 딤(Dim) 처리 및 뱃지 변경
          targetCardForAssign.classList.add('dimmed');
          const badgeEl = targetCardForAssign.querySelector('.uc-badge');
          if (!targetCardForAssign.hasAttribute('data-origin-badge')) {
            targetCardForAssign.setAttribute('data-origin-badge', badgeEl.outerHTML);
          }
          badgeEl.outerHTML = `<span class="uc-badge" style="background:var(--gray-200);color:var(--gray-600)">✓ 가배치 완료</span>`;
        } else {
          // 캘린더 내부의 파란색 확정 블록을 수동 배정 모달로 이사시킨 경우: 기존 블록에 moved(이사 중) 껍데기 마킹
          targetCardForAssign.classList.add('moved');
          targetCardForAssign.style.opacity = '0.3';
          targetCardForAssign.style.pointerEvents = 'none'; // 원본 잔상은 회수불가
          
          // 기존 붙어있던 동일 이름의 다른 가배치 블록이나 자신과 겹치는 엘리먼트가 있다면 제거
          document.querySelectorAll('.tl-event').forEach(el => {
             if (el !== targetCardForAssign && el !== newEvent && el.innerHTML.includes(uName) && el.innerHTML.includes('(가배치)')) {
               el.remove();
             }
          });
        }

        updateUnassignedStatus();
        closeModal('modalManualAssign');
      // showAlert(`모달 수동 배정: ${uName} 님이 ${selectedRoomNumber} 객실에 가배치되었습니다.`, { icon: '💡' });
      }
    