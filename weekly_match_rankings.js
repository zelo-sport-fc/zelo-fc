/**
 * ملف: weekly_match_rankings.js
 * الوظيفة: شاشة الترتيب الكاملة (المنصة + البطاقة الأسطورية الشاملة + سجل التوقعات + الترتيب العام)
 */

const generateLegendaryAvatar = (name, photoUrl, size = '40px') => {
    if (photoUrl) {
        return `<img src="${photoUrl}" style="width:${size}; height:${size}; border-radius:50%; object-fit:cover; border:2px solid var(--accent-gold, #fcb045); margin: 0 auto; display: block; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">`;
    } else {
        const initial = name ? String(name).charAt(0).toUpperCase() : '👤';
        return `<div style="width:${size}; height:${size}; border-radius:50%; background: linear-gradient(135deg, #833ab4, #fd1d1d); color:white; display:flex; align-items:center; justify-content:center; font-size:calc(${size} / 2.2); font-weight:bold; margin: 0 auto; border:2px solid var(--accent-gold, #fcb045); box-shadow: 0 4px 12px rgba(0,0,0,0.4);">${initial}</div>`;
    }
};

window.openLegendaryRankingScreen = function() {
    const existingScreen = document.getElementById('ranking-full-screen');
    if (existingScreen) existingScreen.remove();

    const isAr = userState.lang === 'ar';
    const title = isAr ? 'ترتيب التحديات' : 'Challenges Ranking';

    const screen = document.createElement('div');
    screen.id = 'ranking-full-screen';
    
    // تم التعديل هنا: تفعيل التمرير الكامل للشاشة
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
        padding: 15px 15px 20px 15px; 
        box-sizing: border-box; 
        display: flex;
        flex-direction: column;
        overflow-y: auto !important; 
        -webkit-overflow-scrolling: touch;
        color: white;
        direction: ${isAr ? 'rtl' : 'ltr'}; 
        text-align: ${isAr ? 'right' : 'left'};
    `;

    screen.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px; flex-shrink: 0;">
            <h2 style="margin:0; color:var(--accent-gold, #fcb045); font-weight: 900; letter-spacing: 0.5px; font-size: 1.4rem;">🏆 ${title}</h2>
            <button onclick="document.getElementById('ranking-full-screen').remove()" style="background:none; border:none; color:white; font-size:1.6rem; cursor:pointer; transition: 0.2s;">✕</button>
        </div>
        <div id="full-ranking-container" style="width: 100%;">
            <div style="text-align:center; color: #888; padding: 40px; font-size: 1rem;">
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
                    50% { transform: translate(-50%, -4px); }
                    100% { transform: translate(-50%, 0px); }
                }
                @keyframes glowPulse {
                    0% { box-shadow: 0 0 10px rgba(252, 176, 69, 0.4), inset 0 0 8px rgba(252, 176, 69, 0.1); }
                    50% { box-shadow: 0 0 20px rgba(253, 29, 29, 0.6), inset 0 0 12px rgba(253, 29, 29, 0.2); }
                    100% { box-shadow: 0 0 10px rgba(252, 176, 69, 0.4), inset 0 0 8px rgba(252, 176, 69, 0.1); }
                }

                /* تم تقليل أبعاد الكرت والمسافات العمودية */
                .legendary-card {
                    position: relative;
                    background: rgba(22, 22, 30, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 38px 15px 18px 15px; 
                    margin: 40px 0 15px 0; 
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5), inset 0 2px 10px rgba(255,255,255,0.05);
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

                .legendary-rank-badge {
                    position: absolute;
                    top: -12px;
                    ${isAr ? 'left: -2px;' : 'right: -2px;'}
                    color: white;
                    font-weight: 900;
                    font-size: 1.1rem;
                    padding: 5px 12px;
                    border-radius: 10px;
                    border: 2px solid rgba(255,255,255,0.9);
                    transform: rotate(${isAr ? '-8deg' : '8deg'});
                    z-index: 10;
                    letter-spacing: 0.5px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                    text-shadow: 0 2px 4px rgba(0,0,0,0.4);
                }
                .badge-top { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); box-shadow: 0 5px 15px rgba(253, 160, 133, 0.5); color: #fff; }
                .badge-normal { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); box-shadow: 0 5px 15px rgba(255, 8, 68, 0.5); }

                /* تم تصغير صورة الأفاتار العائمة */
                .legendary-avatar-wrapper {
                    position: absolute;
                    top: -40px; 
                    left: 50%;
                    transform: translateX(-50%);
                    width: 75px;
                    height: 75px;
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
                    border: 3px solid #16161e; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.8rem;
                    font-weight: bold;
                }

                .legendary-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }

                .legendary-name {
                    position: relative;
                    z-index: 1;
                    font-size: 1.3rem;
                    font-weight: 900;
                    color: #fff;
                    margin-bottom: 5px;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
                }

                .legendary-points {
                    position: relative;
                    z-index: 1;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 5px 14px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }

                .legendary-stats-grid {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin-top: 14px;
                }

                /* تقليل مساحة الصناديق داخل الكرت */
                .legendary-stat-box {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    padding: 8px 4px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .stat-correct { border-bottom: 3px solid #10b981; }
                .stat-pending { border-bottom: 3px solid #fcb045; }
                .stat-wrong   { border-bottom: 3px solid #fd1d1d; }

                .btn-my-predictions {
                    position: relative;
                    z-index: 1;
                    margin-top: 15px;
                    background: linear-gradient(90deg, #fd1d1d, #fcb045);
                    color: white;
                    border: none;
                    padding: 9px 20px;
                    border-radius: 25px;
                    font-size: 0.95rem;
                    font-weight: 900;
                    cursor: pointer;
                    width: 80%;
                    max-width: 240px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                /* تم تقليل ارتفاعات كروت منصة الفائزين (Podium) */
                .podium-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 5px; margin-top: 5px; gap: 8px; width: 100%; }
                .podium-card { background: var(--bg-card, #1c1c22); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; text-align: center; padding: 10px 4px; flex: 1; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .rank-1 { border-color: var(--accent-gold, #fcb045); background: linear-gradient(180deg, rgba(252, 176, 69, 0.15) 0%, rgba(28, 28, 34, 1) 100%); height: 125px; transform: translateY(-5px); }
                .rank-2 { border-color: #c0c0c0; background: linear-gradient(180deg, rgba(192, 192, 192, 0.1) 0%, rgba(28, 28, 34, 1) 100%); height: 105px; }
                .rank-3 { border-color: #cd7f32; background: linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, rgba(28, 28, 34, 1) 100%); height: 98px; }
                .podium-name { font-size: 0.8rem; font-weight: bold; margin: 6px 0 2px 0; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; }
                .podium-pts { font-size: 0.95rem; font-weight: 900; }
            </style>
        `;

        // ================= بناء مكونات الشاشة المتناسقة =================
        let fullContentHtml = `<div style="width: 100%;">`;
        
        if (rankings && rankings.length > 0) {
            const firstPlace = rankings[0], secondPlace = rankings[1], thirdPlace = rankings[2];
            fullContentHtml += `<div class="podium-container">`;
            if (secondPlace) {
                const name2 = secondPlace.username || secondPlace.telegram_id;
                fullContentHtml += `<div class="podium-card rank-2"><div style="font-size: 1.2rem; margin-bottom: 3px;">🥈</div>${generateLegendaryAvatar(name2, secondPlace.photo_url, '34px')}<div class="podium-name">${name2}</div><div class="podium-pts" style="color: #c0c0c0;">${secondPlace.points_earned}</div></div>`;
            } else { fullContentHtml += `<div style="flex: 1;"></div>`; }

            if (firstPlace) {
                const name1 = firstPlace.username || firstPlace.telegram_id;
                fullContentHtml += `<div class="podium-card rank-1"><div style="font-size: 1.5rem; margin-bottom: 3px;">👑</div>${generateLegendaryAvatar(name1, firstPlace.photo_url, '44px')}<div class="podium-name">${name1}</div><div class="podium-pts" style="color: var(--accent-gold, #fcb045);">${firstPlace.points_earned}</div></div>`;
            }

            if (thirdPlace) {
                const name3 = thirdPlace.username || thirdPlace.telegram_id;
                fullContentHtml += `<div class="podium-card rank-3"><div style="font-size: 1.2rem; margin-bottom: 3px;">🥉</div>${generateLegendaryAvatar(name3, thirdPlace.photo_url, '30px')}<div class="podium-name">${name3}</div><div class="podium-pts" style="color: #cd7f32;">${thirdPlace.points_earned}</div></div>`;
            } else { fullContentHtml += `<div style="flex: 1;"></div>`; }
            fullContentHtml += `</div>`;
        } else {
            fullContentHtml += `<div style="text-align:center; color:#888; padding: 5px 0; margin-bottom: 5px; font-size: 0.9rem;">${isAr ? 'لا توجد بيانات ترتيب حالياً' : 'No ranking data available'}</div>`;
        }

        const userInitial = userState.username ? String(userState.username).charAt(0).toUpperCase() : '👤';
        const userImageHtml = userState.photoUrl ? `<img src="${userState.photoUrl}" alt="User">` : `${userInitial}`;
        const displayRank = myRank || '-';
        const badgeClass = (myRank && myRank <= 3) ? 'badge-top' : 'badge-normal';

        fullContentHtml += `
            <div class="legendary-card">
                <div class="legendary-rank-badge ${badgeClass}">#${displayRank}</div>
                <div class="legendary-avatar-wrapper"><div class="legendary-avatar-inner">${userImageHtml}</div></div>
                <div class="legendary-name">${userState.username || 'User'}</div>
                <div class="legendary-points">
                    <span style="font-size: 1rem;">🏆</span>
                    <span style="color: var(--accent-gold, #fcb045); font-weight: 900; font-size: 1.1rem;">${myData ? myData.points_earned : 0}</span>
                    <span style="color: rgba(255,255,255,0.7); font-size: 0.8rem; font-weight: bold;">${isAr ? 'نقطة' : 'Pts'}</span>
                </div>
                <div class="legendary-stats-grid">
                    <div class="legendary-stat-box stat-correct">
                        <div style="font-size: 1.2rem; margin-bottom: 2px;">✅</div>
                        <div style="color: #10b981; font-size: 1.2rem; font-weight: 900;">${correctCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: bold; margin-top: 2px;">${isAr ? 'صحيح' : 'Correct'}</div>
                    </div>
                    <div class="legendary-stat-box stat-pending">
                        <div style="font-size: 1.2rem; margin-bottom: 2px;">⏳</div>
                        <div style="color: #fcb045; font-size: 1.2rem; font-weight: 900;">${pendingCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: bold; margin-top: 2px;">${isAr ? 'انتظار' : 'Pending'}</div>
                    </div>
                    <div class="legendary-stat-box stat-wrong">
                        <div style="font-size: 1.2rem; margin-bottom: 2px;">❌</div>
                        <div style="color: #fff; font-size: 1.2rem; font-weight: 900;">${wrongCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.75rem; font-weight: bold; margin-top: 2px;">${isAr ? 'أخطاء' : 'Wrong'}</div>
                    </div>
                </div>
                <button class="btn-my-predictions" onclick="document.getElementById('predictions-history-section').scrollIntoView({behavior: 'smooth'})">
                    📝 ${isAr ? 'سجل توقعاتي' : 'My Predictions'}
                </button>
            </div>`;

        // ================= سجل التوقعات والتكتلات القابلة للتمرير =================
        let historyHtml = '';
        if (predictions && predictions.length > 0) {
            const recentPredictions = predictions.slice(0, 10); 
            historyHtml = recentPredictions.map(pred => {
                const match = matches.find(m => m.id === pred.match_id);
                if (!match) return ''; 

                let statusColor = '', statusBg = '', statusText = '', resultUi = '';
                if (pred.prediction_status === 'correct') {
                    statusColor = '#10b981'; statusBg = 'rgba(16, 185, 129, 0.05)'; statusText = `+3 ${isAr ? 'نقاط' : 'Pts'} ✅`;
                    resultUi = `<div style="color:${statusColor}; font-size:0.8rem; margin-top:6px; font-weight:600;">${isAr ? 'النتيجة النهائية:' : 'Final Score:'} ${match.home_score} - ${match.away_score}</div>`;
                } else if (pred.prediction_status === 'wrong') {
                    statusColor = 'var(--accent-red, #fd1d1d)'; statusBg = 'rgba(253, 29, 29, 0.05)'; statusText = `${isAr ? 'خطأ' : 'Wrong'} ❌`;
                    resultUi = `<div style="color:${statusColor}; font-size:0.8rem; margin-top:6px; font-weight:600;">${isAr ? 'النتيجة النهائية:' : 'Final Score:'} ${match.home_score} - ${match.away_score}</div>`;
                } else {
                    statusColor = 'var(--accent-gold, #fcb045)'; statusBg = 'rgba(252, 176, 69, 0.05)'; statusText = `${isAr ? 'بالانتظار' : 'Pending'} ⏳`;
                }

                return `
                    <div style="background: linear-gradient(to ${isAr ? 'left' : 'right'}, var(--bg-card, #1c1c22), ${statusBg}); padding:14px; border-radius:14px; margin-bottom:12px; border: 1px solid rgba(255,255,255,0.03); border-${isAr ? 'right' : 'left'}: 4px solid ${statusColor}; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                        <div>
                            <div style="font-weight:900; font-size:1rem; margin-bottom:6px; color:#fff; letter-spacing: 0.5px;">${match.team_a} <span style="color:#555; font-size:0.85rem; margin: 0 4px;">VS</span> ${match.team_b}</div>
                            <div style="color:#ccc; font-size:0.85rem; background: rgba(0,0,0,0.3); display: inline-block; padding: 4px 10px; border-radius: 6px;">
                                ${isAr ? 'توقعك:' : 'Prediction:'} <b style="color
