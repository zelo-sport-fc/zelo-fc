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

                .legendary-card {
                    position: relative;
                    background: rgba(22, 22, 30, 0.8);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 25px;
                    padding: 55px 20px 25px 20px; 
                    margin: 55px 0 15px 0; 
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.6), inset 0 2px 15px rgba(255,255,255,0.05);
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                }
                
                .legendary-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at 50% 0%, rgba(131, 58, 180, 0.2) 0%, transparent 70%);
                    border-radius: 25px;
                    pointer-events: none;
                    z-index: 0;
                }

                .legendary-rank-badge {
                    position: absolute;
                    top: -15px;
                    ${isAr ? 'left: -5px;' : 'right: -5px;'}
                    color: white;
                    font-weight: 900;
                    font-size: 1.4rem;
                    padding: 8px 18px;
                    border-radius: 12px;
                    border: 3px solid rgba(255,255,255,0.9);
                    transform: rotate(${isAr ? '-8deg' : '8deg'});
                    z-index: 10;
                    letter-spacing: 1px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.5);
                    text-shadow: 0 2px 4px rgba(0,0,0,0.4);
                }
                .badge-top { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); box-shadow: 0 8px 25px rgba(253, 160, 133, 0.5); color: #fff; }
                .badge-normal { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); box-shadow: 0 8px 25px rgba(255, 8, 68, 0.5); }

                .legendary-avatar-wrapper {
                    position: absolute;
                    top: -55px; 
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    padding: 5px;
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
                    border: 4px solid #16161e; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2.5rem;
                    font-weight: bold;
                }

                .legendary-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }

                .legendary-name {
                    position: relative;
                    z-index: 1;
                    font-size: 1.6rem;
                    font-weight: 900;
                    color: #fff;
                    margin-bottom: 8px;
                    text-shadow: 0 3px 15px rgba(0,0,0,0.8);
                }

                .legendary-points {
                    position: relative;
                    z-index: 1;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(0, 0, 0, 0.4);
                    padding: 8px 20px;
                    border-radius: 15px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }

                .legendary-stats-grid {
                    position: relative;
                    z-index: 1;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-top: 20px;
                }

                .legendary-stat-box {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 16px;
                    padding: 14px 5px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .stat-correct { border-bottom: 4px solid #10b981; }
                .stat-pending { border-bottom: 4px solid #fcb045; }
                .stat-wrong   { border-bottom: 4px solid #fd1d1d; }

                .btn-my-predictions {
                    position: relative;
                    z-index: 1;
                    margin-top: 25px;
                    background: linear-gradient(90deg, #fd1d1d, #fcb045);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 30px;
                    font-size: 1.1rem;
                    font-weight: 900;
                    cursor: pointer;
                    width: 85%;
                    max-width: 280px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .podium-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; margin-top: 10px; gap: 10px; width: 100%; }
                .podium-card { background: var(--bg-card, #1c1c22); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; text-align: center; padding: 15px 5px; flex: 1; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
                .rank-1 { border-color: var(--accent-gold, #fcb045); background: linear-gradient(180deg, rgba(252, 176, 69, 0.15) 0%, rgba(28, 28, 34, 1) 100%); height: 160px; transform: translateY(-10px); }
                .rank-2 { border-color: #c0c0c0; background: linear-gradient(180deg, rgba(192, 192, 192, 0.1) 0%, rgba(28, 28, 34, 1) 100%); height: 130px; }
                .rank-3 { border-color: #cd7f32; background: linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, rgba(28, 28, 34, 1) 100%); height: 120px; }
                .podium-name { font-size: 0.85rem; font-weight: bold; margin: 10px 0 5px 0; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; }
                .podium-pts { font-size: 1.1rem; font-weight: 900; }
            </style>
        `;

        // ================= القسم العلوي الثابت =================
        let topHtml = `<div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; width: 100%;">`;
        
        if (rankings && rankings.length > 0) {
            const firstPlace = rankings[0], secondPlace = rankings[1], thirdPlace = rankings[2];
            topHtml += `<div class="podium-container">`;
            if (secondPlace) {
                const name2 = secondPlace.username || secondPlace.telegram_id;
                topHtml += `<div class="podium-card rank-2"><div style="font-size: 1.5rem; margin-bottom: 5px;">🥈</div>${generateLegendaryAvatar(name2, secondPlace.photo_url, '40px')}<div class="podium-name">${name2}</div><div class="podium-pts" style="color: #c0c0c0;">${secondPlace.points_earned}</div></div>`;
            } else { topHtml += `<div style="flex: 1;"></div>`; }

            if (firstPlace) {
                const name1 = firstPlace.username || firstPlace.telegram_id;
                topHtml += `<div class="podium-card rank-1"><div style="font-size: 2rem; margin-bottom: 5px;">👑</div>${generateLegendaryAvatar(name1, firstPlace.photo_url, '55px')}<div class="podium-name">${name1}</div><div class="podium-pts" style="color: var(--accent-gold, #fcb045);">${firstPlace.points_earned}</div></div>`;
            }

            if (thirdPlace) {
                const name3 = thirdPlace.username || thirdPlace.telegram_id;
                topHtml += `<div class="podium-card rank-3"><div style="font-size: 1.5rem; margin-bottom: 5px;">🥉</div>${generateLegendaryAvatar(name3, thirdPlace.photo_url, '35px')}<div class="podium-name">${name3}</div><div class="podium-pts" style="color: #cd7f32;">${thirdPlace.points_earned}</div></div>`;
            } else { topHtml += `<div style="flex: 1;"></div>`; }
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
                <div class="legendary-name">${userState.username || 'User'}</div>
                <div class="legendary-points">
                    <span style="font-size: 1.2rem;">🏆</span>
                    <span style="color: var(--accent-gold, #fcb045); font-weight: 900; font-size: 1.3rem;">${myData ? myData.points_earned : 0}</span>
                    <span style="color: rgba(255,255,255,0.7); font-size: 0.85rem; font-weight: bold;">${isAr ? 'نقطة' : 'Pts'}</span>
                </div>
                <div class="legendary-stats-grid">
                    <div class="legendary-stat-box stat-correct">
                        <div style="font-size: 1.6rem; margin-bottom: 5px;">✅</div>
                        <div style="color: #10b981; font-size: 1.5rem; font-weight: 900;">${correctCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.8rem; font-weight: bold; margin-top: 4px;">${isAr ? 'صحيح' : 'Correct'}</div>
                    </div>
                    <div class="legendary-stat-box stat-pending">
                        <div style="font-size: 1.6rem; margin-bottom: 5px;">⏳</div>
                        <div style="color: #fcb045; font-size: 1.5rem; font-weight: 900;">${pendingCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.8rem; font-weight: bold; margin-top: 4px;">${isAr ? 'انتظار' : 'Pending'}</div>
                    </div>
                    <div class="legendary-stat-box stat-wrong">
                        <div style="font-size: 1.6rem; margin-bottom: 5px;">❌</div>
                        <!-- تم التعديل هنا ليكون الرقم مفتوح بدون / 2 -->
                        <div style="color: #fff; font-size: 1.5rem; font-weight: 900;">${wrongCount}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.8rem; font-weight: bold; margin-top: 4px;">${isAr ? 'أخطاء' : 'Wrong'}</div>
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
                    statusColor = '#10b981'; statusBg = 'rgba(16, 185, 129, 0.05)'; statusText = `+3 ${isAr ? 'نقاط' : 'Pts'} ✅`;
                    resultUi = `<div style="color:${statusColor}; font-size:0.85rem; margin-top:8px; font-weight:600;">${isAr ? 'النتيجة النهائية:' : 'Final Score:'} ${match.home_score} - ${match.away_score}</div>`;
                } else if (pred.prediction_status === 'wrong') {
                    statusColor = 'var(--accent-red, #fd1d1d)'; statusBg = 'rgba(253, 29, 29, 0.05)'; statusText = `${isAr ? 'خطأ' : 'Wrong'} ❌`;
                    resultUi = `<div style="color:${statusColor}; font-size:0.85rem; margin-top:8px; font-weight:600;">${isAr ? 'النتيجة النهائية:' : 'Final Score:'} ${match.home_score} - ${match.away_score}</div>`;
                } else {
                    statusColor = 'var(--accent-gold, #fcb045)'; statusBg = 'rgba(252, 176, 69, 0.05)'; statusText = `${isAr ? 'بالانتظار' : 'Pending'} ⏳`;
                }

                return `
                    <div style="background: linear-gradient(to ${isAr ? 'left' : 'right'}, var(--bg-card, #1c1c22), ${statusBg}); padding:18px; border-radius:16px; margin-bottom:15px; border: 1px solid rgba(255,255,255,0.03); border-${isAr ? 'right' : 'left'}: 4px solid ${statusColor}; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        <div>
                            <div style="font-weight:900; font-size:1.1rem; margin-bottom:8px; color:#fff; letter-spacing: 0.5px;">${match.team_a} <span style="color:#555; font-size:0.9rem; margin: 0 4px;">VS</span> ${match.team_b}</div>
                            <div style="color:#ccc; font-size:0.95rem; background: rgba(0,0,0,0.3); display: inline-block; padding: 5px 12px; border-radius: 8px;">
                                ${isAr ? 'توقعك:' : 'Prediction:'} <b style="color:#fff; font-size:1rem;">${pred.predicted_home} - ${pred.predicted_away}</b>
                            </div>
                            ${resultUi}
                        </div>
                        <div style="text-align: center; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 12px;">
                            <span style="color:${statusColor}; font-weight:bold; font-size:1rem; display:block;">${statusText}</span>
                        </div>
                    </div>`;
            }).join('');

            if (predictions.length > 10) {
                historyHtml += `<div style="text-align:center; color:#888; font-size: 0.9rem; margin-top: 20px; padding-bottom: 10px;">${isAr ? 'يتم عرض أحدث 10 توقعات فقط' : 'Showing latest 10 predictions only'}</div>`;
            }
        } else {
            historyHtml = `<div style="text-align:center; color:#888; padding:40px; background:rgba(255,255,255,0.02); border-radius:16px; border: 1px solid rgba(255,255,255,0.03); font-size:1.1rem;">${isAr ? 'لم تقم بأي توقعات بعد.' : 'No predictions yet.'}</div>`;
        }

        bottomHtml += `
            <div id="predictions-history-section" style="margin-top: 10px; margin-bottom: 40px; scroll-margin-top: 25px;">
                <h3 style="margin:0 0 20px 0; color:#fff; font-size: 1.3rem; font-weight: 800;">📜 ${isAr ? 'سجل التوقعات' : 'Prediction History'}</h3>
                ${historyHtml}
            </div>`;

        let leaderboardHtml = '';
        if (rankings && rankings.length > 3) {
            const restOfRankings = rankings.slice(3); 
            leaderboardHtml = restOfRankings.map((rank, index) => {
                let actualRank = index + 4; 
                let isMe = String(rank.telegram_id) === String(currentUserId);
                let cardStyle = isMe ? 'background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(28, 28, 34, 1) 100%); border: 1px solid rgba(255, 215, 0, 0.3);' : 'background: #1c1c22; border: 1px solid rgba(255,255,255,0.03);';
                const alias = rank.username || 'ID: ' + String(rank.telegram_id).slice(-4);

                return `
                    <div style="${cardStyle} border-radius: 14px; padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: center; gap: 18px;">
                            <div style="font-size: 1.2rem; font-weight: 900; color: ${isMe ? '#ffd700' : '#666'}; width: 35px; text-align: center;">#${actualRank}</div>
                            <div style="color: #fff; font-weight: bold; font-size: 1.05rem;">${alias} ${isMe ? `<span style="color:#ffd700; font-size:0.8rem; margin-${isAr ? 'right' : 'left'}:8px; background: rgba(255,215,0,0.15); padding: 2px 8px; border-radius: 6px;">${isAr ? 'أنت' : 'You'}</span>` : ''}</div>
                        </div>
                        <div style="color: #ffd700; font-weight: 900; font-size: 1.2rem;">${rank.points_earned || 0} <span style="font-size:0.8rem; color:#888; font-weight: 600;">${isAr ? 'نقطة' : 'Pts'}</span></div>
                    </div>`;
            }).join('');

            bottomHtml += `
                <div>
                    <h3 style="margin:0 0 20px 0; color:#fff; font-size: 1.3rem; font-weight: 800;">🌍 ${isAr ? 'الترتيب العام' : 'Global Ranking'}</h3>
                    ${leaderboardHtml}
                </div>`;
        }
        bottomHtml += `</div>`; // إغلاق القسم السفلي

        // تركيب الشاشة النهائية
        container.innerHTML = htmlStyles + topHtml + bottomHtml;

    } catch (error) {
        console.error(isAr ? "خطأ في عرض الترتيب:" : "Error displaying ranking:", error);
        container.innerHTML = `<div style="text-align:center; color: var(--accent-red, #fd1d1d); padding: 25px; background: rgba(253, 29, 29, 0.05); border-radius: 16px; border: 1px solid rgba(253, 29, 29, 0.2); font-weight: bold;">
            ${isAr ? 'تعذر تحميل الترتيب. يرجى المحاولة لاحقاً.' : 'Failed to load ranking. Please try again later.'}
        </div>`;
    }
};
