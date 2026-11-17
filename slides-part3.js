(function () {
  window.App = window.App || {};
  window.App.slides = window.App.slides || {};

  function drawGrid(ctx, w, h, step, strokeStyle) {
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = step; x < w; x += step) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = step; y < h; y += step) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // SLIDE 8: 08 / QUIZ TIME (Interactive Classroom Quiz + Confetti Burst)
  // =========================================================================
  const QUIZ_DATA = [
    {
      id: 0,
      number: 'CÂU 1 / 3',
      question: 'Ai là người đã tìm ra định luật bảo toàn động lượng?',
      type: 'text',
      correctIndex: 1,
      explanation: 'Christiaan Huygens (1629–1695) đã phát biểu và chứng minh định luật bảo toàn động lượng qua nghiên cứu va chạm đàn hồi.',
      options: [
        { key: 'A', label: 'Stefan' },
        { key: 'B', label: 'Huygens' },
        { key: 'C', label: 'Planck' },
        { key: 'D', label: 'Dalton' }
      ]
    },
    {
      id: 1,
      number: 'CÂU 2 / 3',
      question: 'Vào cuối thế kỉ XIX, ai là người đã phát minh ra phương pháp truyền sóng vô tuyến?',
      type: 'text',
      correctIndex: 3,
      explanation: 'Alexander Stepanovich Popov (1859–1906) đã chế tạo máy thu và phát tín hiệu vô tuyến đầu tiên vào năm 1895.',
      options: [
        { key: 'A', label: 'Drake' },
        { key: 'B', label: 'Gagarin' },
        { key: 'C', label: 'Wade' },
        { key: 'D', label: 'Popov' }
      ]
    },
    {
      id: 2,
      number: 'CÂU 3 / 3',
      question: 'Trong các nhà khoa học sau, ai là Michael Faraday?',
      type: 'svg-cards',
      correctIndex: 1,
      explanation: 'Michael Faraday (1791–1867) là cha đẻ hiện tượng cảm ứng điện từ (1831) với phát minh Đĩa đồng Faraday và máy phát điện đầu tiên.',
      options: [
        {
          key: 'A',
          name: 'Isaac Newton',
          sub: 'Quả táo & Lăng kính tán sắc',
          svg: `
            <svg viewBox="0 0 220 190" width="100%" height="175" aria-hidden="true">
              <rect x="6" y="6" width="208" height="178" rx="14" fill="#131722" stroke="rgba(245,245,245,0.14)"/>
              <!-- Portrait silhouette with 17th-century curled hair -->
              <circle cx="72" cy="76" r="24" fill="#F5F5F5"/>
              <path d="M44,86 Q34,110 48,136 L96,136 Q110,110 100,86 Q96,62 72,62 Q48,62 44,86 Z" fill="#D8DCE6" opacity="0.88"/>
              <circle cx="72" cy="75" r="19" fill="#0D0F14"/>
              <path d="M42,144 C42,120 102,120 102,144 L102,164 L42,164 Z" fill="#F5F5F5"/>
              <!-- Falling Apple -->
              <circle cx="164" cy="48" r="13" fill="#FF4D2A"/>
              <path d="M164,35 Q168,25 174,26" stroke="#22C55E" stroke-width="3" fill="none"/>
              <line x1="164" y1="66" x2="164" y2="90" stroke="#FF4D2A" stroke-width="2" stroke-dasharray="4 4"/>
              <!-- Dispersion Prism -->
              <polygon points="154,104 130,152 178,152" fill="none" stroke="#F5F5F5" stroke-width="3"/>
              <line x1="112" y1="126" x2="142" y2="128" stroke="#FFFFFF" stroke-width="2.5"/>
              <line x1="166" y1="126" x2="202" y2="116" stroke="#FF4D2A" stroke-width="2"/>
              <line x1="167" y1="130" x2="202" y2="132" stroke="#FACC15" stroke-width="2"/>
              <line x1="168" y1="134" x2="202" y2="148" stroke="#38BDF8" stroke-width="2"/>
            </svg>
          `
        },
        {
          key: 'B',
          name: 'Michael Faraday',
          sub: 'Đĩa cảm ứng điện từ (1831)',
          svg: `
            <svg viewBox="0 0 220 190" width="100%" height="175" aria-hidden="true">
              <rect x="6" y="6" width="208" height="178" rx="14" fill="#131722" stroke="rgba(245,245,245,0.14)"/>
              <!-- Portrait silhouette with parted 19th-century hair & collar -->
              <path d="M48,74 Q48,46 72,46 Q96,46 96,74 Q96,95 72,98 Q48,95 48,74 Z" fill="#F5F5F5"/>
              <circle cx="72" cy="74" r="18" fill="#0D0F14"/>
              <path d="M54,62 Q72,50 90,62" stroke="#F5F5F5" stroke-width="4" fill="none"/>
              <path d="M40,152 C42,118 102,118 104,152 L104,164 L40,164 Z" fill="#F5F5F5"/>
              <polygon points="62,116 72,134 82,116" fill="#22C55E"/>
              <!-- Rotating Copper Faraday Disk & Magnetic Field -->
              <circle cx="158" cy="92" r="34" fill="#D97B48" stroke="#F5F5F5" stroke-width="3"/>
              <circle cx="158" cy="92" r="6" fill="#F5F5F5"/>
              <line x1="158" y1="58" x2="158" y2="126" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
              <line x1="124" y1="92" x2="192" y2="92" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
              <!-- Magnet & Flux lines -->
              <rect x="136" y="136" width="44" height="18" rx="3" fill="#2B44FF" stroke="#F5F5F5" stroke-width="1.5"/>
              <path d="M138,44 Q158,30 178,44" stroke="#D9F93B" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/>
              <polyline points="172,38 179,44 171,48" fill="none" stroke="#D9F93B" stroke-width="2"/>
            </svg>
          `
        },
        {
          key: 'C',
          name: 'Albert Einstein',
          sub: 'E = mc² • Lưới không-thời gian',
          svg: `
            <svg viewBox="0 0 220 190" width="100%" height="175" aria-hidden="true">
              <rect x="6" y="6" width="208" height="178" rx="14" fill="#131722" stroke="rgba(245,245,245,0.14)"/>
              <!-- Iconic wild hair & mustache silhouette -->
              <path d="M40,74 Q32,46 58,42 Q72,30 88,42 Q112,48 104,74 Q108,90 92,94 L52,94 Q36,90 40,74 Z" fill="#F5F5F5"/>
              <circle cx="72" cy="76" r="18" fill="#0D0F14"/>
              <path d="M62,84 Q72,78 82,84" stroke="#F5F5F5" stroke-width="4" stroke-linecap="round" fill="none"/>
              <path d="M44,154 C44,122 100,122 100,154 L100,164 L44,164 Z" fill="#94A3B8"/>
              <!-- E = mc² & Warped Spacetime Grid -->
              <text x="158" y="54" text-anchor="middle" fill="#00E5FF" font-family="JetBrains Mono, monospace" font-weight="700" font-size="18">E = mc²</text>
              <path d="M118,92 Q158,112 198,92" stroke="#00E5FF" stroke-width="2" fill="none"/>
              <path d="M118,112 Q158,144 198,112" stroke="#00E5FF" stroke-width="2" fill="none"/>
              <path d="M118,132 Q158,158 198,132" stroke="rgba(0,229,255,0.6)" stroke-width="1.5" fill="none"/>
              <line x1="138" y1="84" x2="138" y2="152" stroke="rgba(0,229,255,0.5)" stroke-width="1.5"/>
              <line x1="158" y1="84" x2="158" y2="156" stroke="rgba(0,229,255,0.5)" stroke-width="1.5"/>
              <line x1="178" y1="84" x2="178" y2="152" stroke="rgba(0,229,255,0.5)" stroke-width="1.5"/>
            </svg>
          `
        },
        {
          key: 'D',
          name: 'Alessandro Volta',
          sub: 'Pin Volta Zn–Cu (1800)',
          svg: `
            <svg viewBox="0 0 220 190" width="100%" height="175" aria-hidden="true">
              <rect x="6" y="6" width="208" height="178" rx="14" fill="#131722" stroke="rgba(245,245,245,0.14)"/>
              <!-- Classical portrait silhouette -->
              <circle cx="72" cy="70" r="21" fill="#F5F5F5"/>
              <circle cx="72" cy="72" r="17" fill="#0D0F14"/>
              <path d="M52,58 Q72,44 92,58" stroke="#F5F5F5" stroke-width="6" fill="none"/>
              <path d="M40,152 C42,118 102,118 104,152 L104,164 L40,164 Z" fill="#F5F5F5"/>
              <!-- Zinc-Copper Voltaic Pile (1800) -->
              <rect x="136" y="138" width="46" height="9" fill="#94A3B8"/>
              <rect x="136" y="126" width="46" height="9" fill="#D97B48"/>
              <rect x="136" y="114" width="46" height="9" fill="#94A3B8"/>
              <rect x="136" y="102" width="46" height="9" fill="#D97B48"/>
              <rect x="136" y="90" width="46" height="9" fill="#94A3B8"/>
              <rect x="136" y="78" width="46" height="9" fill="#D97B48"/>
              <line x1="130" y1="70" x2="130" y2="152" stroke="#F5F5F5" stroke-width="2.5"/>
              <line x1="188" y1="70" x2="188" y2="152" stroke="#F5F5F5" stroke-width="2.5"/>
              <!-- Electric spark above pile -->
              <polyline points="148,54 162,44 156,60 172,48" fill="none" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/>
              <text x="159" y="166" text-anchor="middle" fill="#94A3B8" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">Zn / Cu 1800</text>
            </svg>
          `
        }
      ]
    }
  ];

  const quizState = {
    currentQ: 0,
    solved: [false, false, false],
    confetti: []
  };

  function spawnConfettiBurst(x, y) {
    const colors = ['#22C55E', '#FACC15', '#86EFAC', '#F5F5F5', '#4ADE80'];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 680;
      quizState.confetti.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 220,
        size: 6 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 1.35 + Math.random() * 0.75
      });
    }
  }

  window.App.slides[8] = {
    hudLabel: 'QUIZ TIME',
    theme: { bg: '#0D0F14', fg: '#F5F5F5', accent: '#22C55E' },
    transition: 'slam',

    init(uiLayer) {
      quizState.currentQ = 0;
      quizState.solved = [false, false, false];
      quizState.confetti = [];

      function renderQuizUI() {
        const q = QUIZ_DATA[quizState.currentQ];
        const solvedCount = quizState.solved.filter(Boolean).length;
        const isSolved = quizState.solved[quizState.currentQ];

        const tabsHtml = QUIZ_DATA.map((item, idx) => {
          const active = idx === quizState.currentQ;
          const done = quizState.solved[idx];
          return `
            <button
              class="pill-btn quiz-tab"
              data-q="${idx}"
              type="button"
              style="font-family: var(--font-mono); font-size: 14px; padding: 10px 20px; ${
                active
                  ? 'background: #22C55E; color: #0D0F14; border-color: #22C55E;'
                  : done
                    ? 'background: rgba(34,197,94,0.16); color: #86EFAC; border-color: rgba(34,197,94,0.55);'
                    : 'background: rgba(255,255,255,0.05); color: #F5F5F5;'
              }"
            >
              CÂU ${idx + 1} ${done ? '✓' : ''}
            </button>
          `;
        }).join('');

        let optionsHtml = '';
        if (q.type === 'text') {
          optionsHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 8px;">
              ${q.options.map((opt, idx) => {
                const showCorrect = isSolved && idx === q.correctIndex;
                return `
                  <button
                    class="glass-card quiz-opt"
                    data-idx="${idx}"
                    type="button"
                    style="text-align: left; cursor: pointer; padding: 28px 32px; display: flex; align-items: center; gap: 20px; border-width: 2px; ${
                      showCorrect
                        ? 'background: rgba(34, 197, 94, 0.2); border-color: #22C55E;'
                        : ''
                    }"
                  >
                    <span style="width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; font-family: var(--font-mono); font-size: 20px; font-weight: 700; ${
                      showCorrect
                        ? 'background: #22C55E; color: #0D0F14;'
                        : 'background: rgba(255,255,255,0.08); color: #F5F5F5;'
                    }">
                      ${opt.key}
                    </span>
                    <span style="font-size: 28px; font-weight: 800; color: #F5F5F5;">${opt.label}</span>
                  </button>
                `;
              }).join('')}
            </div>
          `;
        } else {
          optionsHtml = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 6px;">
              ${q.options.map((opt, idx) => {
                const showCorrect = isSolved && idx === q.correctIndex;
                return `
                  <button
                    class="glass-card quiz-opt"
                    data-idx="${idx}"
                    type="button"
                    style="text-align: left; cursor: pointer; padding: 18px; display: flex; flex-direction: column; gap: 12px; border-width: 2px; ${
                      showCorrect
                        ? 'background: rgba(34, 197, 94, 0.18); border-color: #22C55E;'
                        : ''
                    }"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-family: var(--font-mono); font-size: 16px; font-weight: 700; padding: 4px 12px; border-radius: 8px; ${
                        showCorrect
                          ? 'background: #22C55E; color: #0D0F14;'
                          : 'background: rgba(255,255,255,0.08); color: #F5F5F5;'
                      }">
                        ${opt.key}
                      </span>
                      <span style="font-family: var(--font-mono); font-size: 12px; color: rgba(245,245,245,0.55);">PORTRAIT</span>
                    </div>
                    ${opt.svg}
                    <div>
                      <div style="font-size: 21px; font-weight: 800; color: #F5F5F5;">${opt.name}</div>
                      <div style="font-size: 14px; color: rgba(245,245,245,0.68); margin-top: 3px;">${opt.sub}</div>
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          `;
        }

        uiLayer.innerHTML = `
          <div class="slide-root" style="padding: 88px 104px 98px; justify-content: space-between;">
            <!-- Header & Switcher -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
              <div>
                <div class="eyebrow" style="color: #22C55E; margin-bottom: 10px;">TƯƠNG TÁC LỚP HỌC • ${q.number}</div>
                <h2 class="slide-title" style="font-size: 52px;">QUIZ TIME</h2>
              </div>

              <div style="display: flex; align-items: center; gap: 12px;">
                <span class="mono-tag" style="color: #FACC15; border-color: rgba(250,204,21,0.45); background: rgba(250,204,21,0.1);">
                  ĐIỂM: ${solvedCount} / ${QUIZ_DATA.length}
                </span>
                ${tabsHtml}
              </div>
            </div>

            <!-- Question & Options -->
            <div style="display: flex; flex-direction: column; gap: 22px; my-auto: 0;">
              <div class="glass-card" style="padding: 26px 34px; border-color: rgba(255,255,255,0.16); background: rgba(255,255,255,0.04);">
                <p style="font-size: 32px; font-weight: 800; line-height: 1.36; color: #F5F5F5;">
                  ${q.question}
                </p>
              </div>

              ${optionsHtml}
            </div>

            <!-- Feedback & Next Question Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; min-height: 76px; gap: 24px;">
              <div id="quiz-feedback" style="flex: 1; font-size: 19px; line-height: 1.45; padding: 14px 22px; border-radius: 14px; border: 1px solid ${
                isSolved ? 'rgba(34, 197, 94, 0.55)' : 'rgba(255,255,255,0.12)'
              }; background: ${
                isSolved ? 'rgba(34, 197, 94, 0.14)' : 'rgba(255,255,255,0.03)'
              }; color: ${isSolved ? '#86EFAC' : 'rgba(245,245,245,0.68)'};">
                ${
                  isSolved
                    ? `<strong>CHÍNH XÁC!</strong> ${q.explanation}`
                    : 'Chọn một đáp án đúng để ghi điểm và kích hoạt pháo giấy chúc mừng.'
                }
              </div>

              <div style="display: flex; gap: 12px;">
                ${
                  quizState.currentQ < QUIZ_DATA.length - 1
                    ? `<button id="quiz-next-btn" type="button" class="pill-btn" style="background: #22C55E; color: #0D0F14; border-color: #22C55E; font-family: var(--font-mono); font-size: 15px;">CÂU TIẾP THEO →</button>`
                    : `<button id="quiz-reset-btn" type="button" class="pill-btn" style="background: rgba(255,255,255,0.08); color: #F5F5F5; font-family: var(--font-mono); font-size: 15px;">↺ LÀM LẠI QUIZ</button>`
                }
              </div>
            </div>
          </div>
        `;

        // Bind question tabs
        uiLayer.querySelectorAll('.quiz-tab').forEach((tab) => {
          tab.addEventListener('click', () => {
            quizState.currentQ = Number(tab.dataset.q);
            renderQuizUI();
          });
        });

        // Bind options
        const feedbackEl = uiLayer.querySelector('#quiz-feedback');
        uiLayer.querySelectorAll('.quiz-opt').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const chosen = Number(btn.dataset.idx);
            const stageEl = window.App._els && window.App._els.stage;
            let clickX = window.App.mouse.x;
            let clickY = window.App.mouse.y;
            if (stageEl) {
              const rect = stageEl.getBoundingClientRect();
              if (rect.width && rect.height && e.clientX) {
                clickX = ((e.clientX - rect.left) / rect.width) * 1920;
                clickY = ((e.clientY - rect.top) / rect.height) * 1080;
              }
            }

            if (chosen === q.correctIndex) {
              quizState.solved[quizState.currentQ] = true;
              spawnConfettiBurst(clickX, clickY);
              renderQuizUI();
            } else {
              btn.style.borderColor = '#EF4444';
              btn.style.background = 'rgba(239, 68, 68, 0.16)';
              feedbackEl.style.borderColor = 'rgba(239, 68, 68, 0.6)';
              feedbackEl.style.background = 'rgba(239, 68, 68, 0.14)';
              feedbackEl.style.color = '#FCA5A5';
              feedbackEl.innerHTML = '<strong>CHƯA CHÍNH XÁC!</strong> Hãy thử chọn lại đáp án khác nhé.';
            }
          });
        });

        const nextBtn = uiLayer.querySelector('#quiz-next-btn');
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            quizState.currentQ = Math.min(QUIZ_DATA.length - 1, quizState.currentQ + 1);
            renderQuizUI();
          });
        }

        const resetBtn = uiLayer.querySelector('#quiz-reset-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            quizState.currentQ = 0;
            quizState.solved = [false, false, false];
            quizState.confetti = [];
            renderQuizUI();
          });
        }
      }

      renderQuizUI();
    },

    render(ctx, dt) {
      const W = 1920;
      const H = 1080;

      // Quiet dark grid background
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.03)');

      // Celebratory green/gold confetti particles ONLY when triggered by correct answer
      if (quizState.confetti.length > 0) {
        const nextParticles = [];
        for (let i = 0; i < quizState.confetti.length; i++) {
          const p = quizState.confetti[i];
          p.life += dt;
          if (p.life >= p.maxLife) continue;

          p.vy += 860 * dt; // gravity
          p.vx *= Math.pow(0.45, dt); // air drag
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vRot * dt;

          const alpha = Math.max(0, 1 - Math.pow(p.life / p.maxLife, 1.8));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56);
          ctx.restore();

          nextParticles.push(p);
        }
        quizState.confetti = nextParticles;
      }
    }
  };

  // =========================================================================
  // SLIDE 9: 09 / OUTRO (Opus 5.5 Capabilities Index & Target Outro Sequence)
  // =========================================================================
  const SUMMARY_ITEMS = [
    { num: '01', text: 'Tư duy triết học cổ đại', sub: 'Aristotle • Pythagoras (585 TCN – TK XVI)' },
    { num: '02', text: 'Thực nghiệm Galilei & Cơ học Newton', sub: 'Phương pháp thực nghiệm • Vạn vật hấp dẫn' },
    { num: '03', text: 'Điện từ học Faraday & Maxwell', sub: 'Cảm ứng điện từ (1831) • Thống nhất điện – từ' },
    { num: '04', text: 'Lượng tử Planck & Tương đối Einstein', sub: 'E = hf (1900) • Thuyết tương đối & E = mc²' },
    { num: '05', text: 'Khám phá vi mô & vũ trụ hiện đại', sub: 'Vật lí hạt • Laser • Bán dẫn • Thiên văn học' }
  ];

  window.App.slides[9] = {
    hudLabel: 'OUTRO',
    theme: { bg: '#0D0D0D', fg: '#F5F5F5', accent: '#FF4D2A' },
    transition: 'diagonal',

    init(uiLayer) {
      const indexHtml = SUMMARY_ITEMS.map((item, idx) => `
        <div
          class="glass-card"
          style="
            padding: 18px 24px;
            display: flex;
            align-items: center;
            gap: 20px;
            animation: ui-rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${0.12 + idx * 0.12}s both;
          "
        >
          <span style="
            min-width: 48px;
            height: 48px;
            border-radius: 10px;
            background: #FF4D2A;
            color: #0D0D0D;
            font-family: var(--font-mono);
            font-size: 18px;
            font-weight: 700;
            display: grid;
            place-items: center;
          ">
            ${item.num}
          </span>
          <div>
            <div style="font-size: 22px; font-weight: 800; color: #F5F5F5;">${item.text}</div>
            <div style="font-family: var(--font-mono); font-size: 13px; color: rgba(245,245,245,0.6); margin-top: 3px;">${item.sub}</div>
          </div>
        </div>
      `).join('');

      uiLayer.innerHTML = `
        <div class="slide-root" style="padding: 88px 96px 86px; justify-content: space-between;">
          <div style="display: grid; grid-template-columns: 0.94fr 1.06fr; gap: 60px; align-items: center; flex: 1;">
            <!-- Left: Opus 5.5 Sequential Capabilities / Journey Index -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div class="anim-in">
                <div class="eyebrow" style="margin-bottom: 10px;">TỔNG KẾT HÀNH TRÌNH</div>
                <h2 class="slide-title" style="font-size: 46px;">5 DẤU MỐC TIẾN HÓA</h2>
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${indexHtml}
              </div>
            </div>

            <!-- Right: Target Orbital Area + Finale Typography -->
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: flex-end; height: 100%; padding-bottom: 36px; gap: 22px;">
              <!-- Open spacer for pulsing vermilion target & concentric radar rings on canvas -->
              <div style="height: 360px; pointer-events: none;"></div>

              <div class="anim-in delay-3" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                <h2 class="hero-title" style="font-size: 54px; line-height: 1.12; color: #F5F5F5; max-width: 780px;">
                  CẢM ƠN CÔ VÀ CÁC BẠN ĐÃ LẮNG NGHE!
                </h2>
                <p class="lead-copy" style="font-size: 25px; color: rgba(245, 245, 245, 0.8); font-weight: 600;">
                  “Nếu có ý kiến đóng góp gì, xin mọi người chia sẻ ạ!”
                </p>
                <button id="btn-replay-showreel" type="button" class="pill-btn" style="margin-top: 6px; font-family: var(--font-mono); font-size: 14px; border-color: rgba(255, 77, 42, 0.6); color: #F5F5F5;">
                  ↺ PHÁT LẠI TỪ SLIDE 01 (APERTURE)
                </button>
              </div>
            </div>
          </div>

          <!-- Clean Footer Citations -->
          <footer class="anim-in delay-4" style="display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid rgba(245, 245, 245, 0.14); font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.1em; color: rgba(245, 245, 245, 0.62);">
            <span>NGUỒN THÔNG TIN: WIKIPEDIA • SÁCH VẬT LÍ 10 • SÁCH VẬT LÍ CHUYÊN ĐỀ 10 (GDPT 2018)</span>
            <span style="color: #FF4D2A; font-weight: 700;">NHÓM 1 • FINALE</span>
          </footer>
        </div>
      `;

      const replayBtn = uiLayer.querySelector('#btn-replay-showreel');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          if (window.App.slides[0]) {
            window.App.slides[0].transition = 'aperture';
          }
          window.App.goTo(0);
        });
      }
    },

    render(ctx, dt, t, mouse) {
      const W = 1920;
      const H = 1080;
      drawGrid(ctx, W, H, 120, 'rgba(245, 245, 245, 0.035)');

      // Center of Right-Side Target Radar Sequence
      const px = ((mouse.x - 1370) / 960) * 14;
      const py = ((mouse.y - 340) / 540) * 14;
      const cx = 1370 + px;
      const cy = 335 + py;

      ctx.save();

      // Concentric orbital radar rings
      const radii = [74, 128, 184, 242];
      for (let i = 0; i < radii.length; i++) {
        const r = radii[i];
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (i % 2 === 0 ? 0.22 : -0.18) + i * 0.8);

        ctx.strokeStyle = i === 0
          ? 'rgba(255, 77, 42, 0.72)'
          : `rgba(245, 245, 245, ${0.32 - i * 0.05})`;
        ctx.lineWidth = i === 0 ? 2.5 : 1.5;
        if (i % 2 === 1) ctx.setLineDash([14, 10]);

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiting tick marker
        ctx.setLineDash([]);
        ctx.fillStyle = i % 2 === 0 ? '#FF4D2A' : '#F5F5F5';
        ctx.beginPath();
        ctx.arc(r, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Expanding pulse wave from target dot
      const pulse = (t * 0.65) % 1;
      const pulseR = 16 + pulse * 230;
      ctx.strokeStyle = `rgba(255, 77, 42, ${(1 - pulse) * 0.75})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair reticles
      ctx.strokeStyle = 'rgba(245, 245, 245, 0.24)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 270, cy);
      ctx.lineTo(cx - 42, cy);
      ctx.moveTo(cx + 42, cy);
      ctx.lineTo(cx + 270, cy);
      ctx.moveTo(cx, cy - 270);
      ctx.lineTo(cx, cy - 42);
      ctx.moveTo(cx, cy + 42);
      ctx.lineTo(cx, cy + 270);
      ctx.stroke();

      // Pulsing Vermilion Target Dot
      const coreScale = 1 + 0.16 * Math.sin(t * 4.2);
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 48 * coreScale);
      glow.addColorStop(0, 'rgba(255, 77, 42, 0.95)');
      glow.addColorStop(0.45, 'rgba(255, 77, 42, 0.35)');
      glow.addColorStop(1, 'rgba(255, 77, 42, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 48 * coreScale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FF4D2A';
      ctx.beginPath();
      ctx.arc(cx, cy, 15 * coreScale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F5F5F5';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };
})();
