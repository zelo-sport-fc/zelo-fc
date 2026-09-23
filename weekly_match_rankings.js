/**
 * ملف: weekly_match_rankings.js
 * الوظيفة: شاشة الترتيب الكاملة (المنصة + البطاقة الأسطورية الشاملة + سجل التوقعات + الترتيب العام)
 */

const generateLegendaryAvatar = (name, photoUrl, size = '50px') => {
    if (photoUrl) {
        return `<img src="${photoUrl}" style="width:${size}; height:${size}; border-radius:50%; object-fit:cover; border:2px solid var(--accent-gold, #fcb045); margin: 0 auto; display: block; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">`;
    } else {
        const initial = name ? String(name).charAt(0).toUpperCase() : '👤';
        return `<div style="width:${size}; height:${size}; border-radius:50%; background: linear-gradient(135deg, #833ab4, #fd1d1d); color:white; display:flex; align-items:center; justify-content:center; font-size:calc(${size} / 2.2); font-weight:bold; margin: 0 auto; border:2px solid var(--accent-gold, #fcb045); box-shadow: 0 4px 15px rgba(0,0,0,0.4);">${initial}</div>`;
    }
};

window.openLegendaryRankingScreen = function() {
    const existingScreen = document.getElementById('ranking-full-screen');
    if (existingScreen) existingScreen.remove();

    const isAr = userState.lang === 'ar';
    const title = isAr ? 'ترتيب التحديات' : 'Challenges Ranking';

    const screen = document.createElement('div');
    screen.id = 'ranking-full-screen';
    
    // تم التعديل هنا: منع التمرير في الشاشة الرئيسية لتقسيمها إلى ثابت ومتحرك
    screen.style.cssText = `
        position: fixed !important; 
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important; 
        height: 100vh !important; 
        background: var(--bg-dark, #0d0d12) !important; 
        z-index: 99999 !important; 
        padding: 20px 20px 0 20px; 
        box-sizing: border-box; 
        display: flex;
        flex-direction: column;
        overflow: hidden; 
        color: white;
        direction: ${isAr ? 'rtl' : 'ltr'}; 
        text-align: ${isAr ? 'right' : 'left'};
    `;

    screen.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px; flex-shrink: 0;">
            <h2 style="margin:0; color:var(--accent-gold, #fcb045); font-weight: 900; letter-spacing: 0.5px;">🏆 ${title}</h2>
            <button onclick="document.getElementById('ranking-full-screen').remove()" style="background:none; border:none; color:white; font-size:1.8rem; cursor:pointer; transition: 0.2s;">✕</button>
        </div>
        <div id="full-ranking-container" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;">
            <div style="text-align:center; color: #888; padding: 50px; font-size: 1.1rem;">
                ${isAr ? '⏳ جاري جلب البيانات...' : '⏳ Fetching data...'}
            </div>
        </div>
    `;

    document.body.appendChild(screen);
    window.renderHomeRankingWidget('full-ranking-container');
};

window.renderHomeRankingWidget = async function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentUserId = userState.userId || userState.telegram_id;
    const isAr = userState.lang === 'ar'; 

    try {
        const { data: rankings, error: topError } = await supabaseClient
            .from('weekly_match_rankings')
            .select('*')
            .eq('is_eliminated', false)
            .eq('category', 'weekly') 
            .order('points_earned', { ascending: false })
            .limit(50);

        if (topError) throw topError;

        const { data: myRank } = await supabaseClient.rpc('get_user_rank', {
            p_telegram_id: currentUserId,
            p_category: 'weekly'
        });

        const { data: myData } = await supabaseClient
            .from('weekly_match_rankings')
            .select('points_earned')
            .eq('telegram_id', currentUserId)
            .eq('category', 'weekly')
            .maybeSingle();

        const { data: predictions } = await supabaseClient
            .from('match_predictions')
            .select('*')
            .eq('telegram_id', currentUserId)
            .order('created_at', { ascending: false });

        let matches = [];
        if (predictions && predictions.length > 0) {
            const matchIds = predictions.map(p => p.match_id);
            const { data: matchesData } = await supabaseClient
                .from('matches')
                .select('*')
                .in('id', matchIds);
            matches = matchesData || [];
        }

        // تم تنظيف الكود هنا بدمج الحلقات بحلقة واحدة أسرع
        let correctCount = 0, wrongCount = 0, pendingCount = 0;
        if (predictions && predictions.length > 0) {
            predictions.forEach(p => {
                if (p.prediction_status === 'correct') correctCount++;
                else if (p.prediction_status === 'wrong') wrongCount++;
                else pendingCount++;
            });
        }

        let htmlStyles = `
            <style>
                @keyframes floatAvatar {
                    0% { transform: translate(-50%, 0px); }
                    50% { transform: translate(-50%, -6px); }
                    100% { transform: translate(-50%, 0px); }
                }
                @keyframes glowPulse {
                    0% { box-shadow: 0 0 15px rgba(252, 176, 69, 0.4), inset 0 0 10px rgba(252, 176, 69, 0.1); }
                    50% { box-shadow: 0 0 30px rgba(253, 29, 29, 0.6), inset 0 0 20px rgba(253, 29, 29, 0.2); }
                    100% { box-shadow: 0 0 15px rgba(252, 176, 69, 0.4), inset 0 0 10px rgba(252, 176, 69, 0.1); }
                }

                /* تم تصغير البطاقة المركزية بنسبة 40% */
                .legendary-card {
                    position: relative;
                    background: rgba(22, 22, 30, 0.8);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 33px 15px 15px 15px; 
                    margin: 33px 0 15px 0; 
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.05);
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                }
                
                .legendary-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(131, 58, 180, 0.2) 0%, transparent 70%);
                    border-radius: 20px;
                    pointer-events: none;
                    z-index: 0;
                }

                /* تصغير شارة الترتيب */
                .legendary-rank-badge {
                    position: absolute;
                    top: -10px;
                    ${isAr ? 'left: -5px;' : 'right: -5px;'}
                    color: white;
                    font-weight: 900;
                    font-size: 1rem;
                    padding: 5px 12px;
                    border-radius: 10px;
                    border: 2px solid rgba(255,255,255,0.9);
                    transform: rotate(${isAr ? '-8deg' : '8deg'});
                    z-index: 10;
                    letter-spacing: 1px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                    text-shadow: 0 2px 4px rgba(0,0,0,0.4);
                }
                .badge-top { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); box-shadow: 0 8px 25px rgba(253, 160, 133, 0.5); color: #fff; }
                .badge-normal { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); box-shadow: 0 8px 25px rgba(255, 8, 68, 0.5); }

                /* تصغير الصورة الشخصية 40% */
                .legendary-avatar-wrapper {
                    position: absolute;
                    top: -35px; 
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    padding: 3px;
                    background: linear-gradient(135deg, #fcb045, #fd1d1d, #833ab4);
                    animation: floatAvatar 4s ease-in-out infinite, glowPulse 3s infinite;
                    z-index: 2;
                }

                .legendary-avatar-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: #111;
                    overflow: hidden;
                    border: 2px solid #16161e; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .legendary-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }

                /* صف أفقي يحتوي على الاسم والنقاط */
                .legendary-info-row {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    direction: ltr; 
                    margin-bottom: 12px;
                    margin-top: 5px;
                }

                .legendary-name {
                    font-size: 1.1rem;
                    font-weight: 900;
                    color: #fff;
                    margin: 0;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
                    text-align: left;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 55%;
                }

                .legendary-points {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 5px 12px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    margin: 0;
                }

                .legendary-stats-grid {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-top: 10px;
                }

                .legendary-stat-box {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    padding: 8px 4px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .stat-correct { border-bottom: 3px solid #10b981; }
                .stat-pending { border-bottom: 3px solid #fcb045; }
                .stat-wrong   { border-bottom: 3px solid #fd1d1d; }

                /* تصغير الزر قليلاً */
                .btn-my-predictions {
                    position: relative;
                    z-index: 1;
                    margin-top: 15px;
                    background: linear-gradient(90deg, #fd1d1d, #fcb045);
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 20px;
                    font-size: 0.95rem;
                    font-weight: 900;
                    cursor: pointer;
                    width: 85%;
                    max-width: 250px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                /* المنصة أصبحت أفقية (مرتبة عمودياً كصفوف) */
                .podium-container { 
                    display: flex; 
                    flex-direction: column; 
                    margin-bottom: 10px; 
                    margin-top: 10px; 
                    gap: 10px; 
                    width: 100%; 
                }
                .podium-card { 
                    background: var(--bg-card, #1c1c22); 
                    border: 1px solid rgba(255,255,255,0.05); 
                    border-radius: 12px; 
                    padding: 10px 15px; 
                    display: flex; 
                    flex-direction: row; 
                    align-items: center; 
                    justify-content: space-between; 
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
                    direction: ltr; /* إجبار الترتيب من اليسار: صورة، اسم، نقاط، تاج */
                }
                .rank-1 { border-color: var(--accent-gold, #fcb045); background: linear-gradient(90deg, rgba(252, 176, 69, 0.15) 0%, rgba(28, 28, 34, 1) 100%); }
                .rank-2 { border-color: #c0c0c0; background: linear-gradient(90deg, rgba(192, 192, 192, 0.1) 0%, rgba(28, 28, 34, 1) 100%); }
                .rank-3 { border-color: #cd7f32; background: linear-gradient(90deg, rgba(205, 127, 50, 0.1) 0%, rgba(28, 28, 34, 1) 100%); }
                .podium-name { font-size: 1rem; font-weight: bold; margin: 0 12px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1; text-align: left; }
                .podium-pts { font-size: 1.1rem; font-weight: 900; margin-right: 12px; }
            </style>
        `;

        // ================= القسم العلوي الثابت =================
        let topHtml = `<div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; width: 100%;">`;
        
        if (rankings && rankings.length > 0) {
            const firstPlace = rankings[0], secondPlace = rankings[1], thirdPlace = rankings[2];
            topHtml += `<div class="podium-container">`;

            // المركز الأول
            if (firstPlace) {
                const name1 = firstPlace.username || firstPlace.telegram_id;
                topHtml += `
                    <div class="podium-card rank-1">
                        ${generateLegendaryAvatar(name1, firstPlace.photo_url, '45px')}
                        <div class="podium-name">${name1}</div>
                        <div class="podium-pts" style="color: var(--accent-gold, #fcb045);">${firstPlace.points_earned}</div>
                        <div style="font-size: 1.6rem;">👑</div>
                    </div>`;
            }

            // المركز الثاني
            if (secondPlace) {
                const name2 = secondPlace.username || secondPlace.telegram_id;
                topHtml += `
                    <div class="podium-card rank-2">
                        ${generateLegendaryAvatar(name2, secondPlace.photo_url, '40px')}
                        <div class="podium-name">${name2}</div>
                        <div class="podium-pts" style="color: #c0c0c0;">${secondPlace.points_earned}</div>
                        <div style="font-size: 1.3rem;">🥈</div>
                    </div>`;
            }

            // المركز الثالث
            if (thirdPlace) {
                const name3 = thirdPlace.username || thirdPlace.telegram_id;
                topHtml += `
                    <div class="podium-card rank-3">
                        ${generateLegendaryAvatar(name3, thirdPlace.photo_url, '40px')}
                        <div class="podium-name">${name3}</div>
                        <div class="podium-pts" style="color: #cd7f32;">${thirdPlace.points_earned}</div>
                        <div style="font-size: 1.3rem;">🥉</div>
                    </div>`;
            }
            
            topHtml += `</div>`;
        } else {
            // رفع نص "لا توجد بيانات ترتيب حالياً" للأعلى عبر تقليل المساحة
            topHtml += `<div style="text-align:center; color:#888; padding: 5px 0; margin-bottom: 10px; font-size: 0.95rem;">${isAr ? 'لا توجد بيانات ترتيب حالياً' : 'No ranking data available'}</div>`;
        }

        const userInitial = userState.username ? String(userState.username).charAt(0).toUpperCase() : '👤';
        const userImageHtml = userState.photoUrl ? `<img src="${userState.photoUrl}" alt="User">` : `${userInitial}`;
        const displayRank = myRank || '-';
        const badgeClass = (myRank && myRank <= 3) ? 'badge-top' : 'badge-normal';

        topHtml += `
            <div class="legendary-card">
                <div class="legendary-rank-badge ${badgeClass}">#${displayRank}</div>
                <div class="legendary-avatar-wrapper"><div class="legendary-avatar-inner">${userImageHtml}</div></div>
                
                <div class="legendary-info-row">
                    <div class="legendary-name">${userState.username || 'User'}</div>
                    <div class="legendary-points">
                        <span style="font-size: 1rem;">🏆</span>
                        <span style="color: var(--accent-gold, #fcb045); font-weight: 900; font-size: 1.1rem;">${myData ? myData.points_earned : 0}</span>
                        <span style="color: rgba(255,255,255,0.7); font-size: 0.75rem; font-weight: bold;">${isAr ? 'نقطة' : 'Pts'}</span>
                    </div>
                </div>

                <div class="legendary-stats-grid">
                    <div class="legendary-stat-box stat-correct">
                        <div style="font-size: 1.1rem; margin-bottom: 3px;">✅</div>
                        <div style="color: #10b981; font-size: 1.1rem; font-weight: 900;">${correctCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.65rem; font-weight: bold; margin-top: 2px;">${isAr ? 'صحيح' : 'Correct'}</div>
                    </div>
                    <div class="legendary-stat-box stat-pending">
                        <div style="font-size: 1.1rem; margin-bottom: 3px;">⏳</div>
                        <div style="color: #fcb045; font-size: 1.1rem; font-weight: 900;">${pendingCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.65rem; font-weight: bold; margin-top: 2px;">${isAr ? 'انتظار' : 'Pending'}</div>
                    </div>
                    <div class="legendary-stat-box stat-wrong">
                        <div style="font-size: 1.1rem; margin-bottom: 3px;">❌</div>
                        <!-- تم التعديل هنا ليكون الرقم مفتوح بدون / 2 -->
                        <div style="color: #fff; font-size: 1.1rem; font-weight: 900;">${wrongCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.65rem; font-weight: bold; margin-top: 2px;">${isAr ? 'أخطاء' : 'Wrong'}</div>
                    </div>
                </div>
                <button class="btn-my-predictions" onclick="document.getElementById('predictions-history-section').scrollIntoView({behavior: 'smooth'})">
                    📝 ${isAr ? 'سجل توقعاتي' : 'My Predictions'}
                </button>
            </div>
        </div>`; // إغلاق القسم العلوي

        // ================= القسم السفلي القابل للتمرير =================
        let bottomHtml = `<div style="flex-grow: 1; overflow-y: auto; width: 100%; padding-bottom: 30px; scroll-behavior: smooth;" id="scrollable-content">`;

        let historyHtml = '';
        if (predictions && predictions.length > 0) {
            const recentPredictions = predictions.slice(0, 10); 
            historyHtml = recentPredictions.map(pred => {
                const match = matches.find(m => m.id === pred.match_id);
                if (!match) return ''; 

                let statusColor = '', statusBg = '', statusText = '', resultUi = '';
                if (pred.prediction_status === 'correct') {
                    statusColor = '#10b981'; statusBg = 'rgba(16, 185, 129, 0.05)'; statusText = `+3 ${isAr ? 'نقاط' : 'Pts'} 
