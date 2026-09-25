window.openOfficialWebsite = window.openOfficialWebsite || function() {
    const url = "https://zelo-sport-fc.github.io/zelo-fc-site/";
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
};

window.updateHomeSolPrice = async function() {
    const el = document.getElementById('home-sol-price');
    if (!el) return;
    const PYTH_SOL_FEED_ID = "0xef0e830e793c34158995a15574c73151ea47f1130ed7005e2070d64283563865";
    
    try {
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`);
        const data = await res.json();
        if (data && data.parsed && data.parsed[0] && data.parsed[0].price) {
            const p = data.parsed[0].price;
            const finalPrice = (Number(p.price) * Math.pow(10, Number(p.expo))).toFixed(2);
            
            const newPriceStr = `$${finalPrice}`;
            if (el.innerText !== newPriceStr) {
                el.innerText = newPriceStr;
                el.classList.add('price-updated');
                setTimeout(() => el.classList.remove('price-updated'), 300);
            }
        }
    } catch (err) {
        if (!el.innerText || el.innerText.trim() === '') {
            el.innerText = `$118.12`;
        }
    }
};

window.renderHomePage = function(container) {
    // 1. تحديد حاوية العرض بآمان لتجنب الشاشة السوداء
    const targetContainer = container || document.getElementById('app') || document.getElementById('main-content') || document.body;
    if (!targetContainer) return;

    // إلغاء أي مؤقت سابق لمنع التكرار
    if (window.solPriceInterval) {
        clearInterval(window.solPriceInterval);
    }

    try {
        // فحص المتغيرات الأساسية مع قيم افتراضية آمنة
        const state = (typeof userState !== 'undefined' && userState) ? userState : { lang: 'ar', username: 'Player', userId: '1654537339', selectedClubs: [] };
        const isAr = state.lang === 'ar';

        const getSafeText = (key, fallbackAr, fallbackEn) => {
            try {
                if (typeof i18n !== 'undefined' && i18n && i18n[state.lang] && i18n[state.lang][key]) {
                    return i18n[state.lang][key];
                }
            } catch (e) {}
            return isAr ? fallbackAr : fallbackEn;
        };

        // إعداد بيانات الأندية المحددة
        let selectedClubsData = [];
        if (state.selectedClubs && Array.isArray(state.selectedClubs)) {
            selectedClubsData = state.selectedClubs.map(id => {
                if (typeof allWorldCupCountriesClubs !== 'undefined') {
                    for (const country in allWorldCupCountriesClubs) {
                        const foundClub = allWorldCupCountriesClubs[country].find(c => String(c.id) === String(id));
                        if (foundClub) return foundClub;
                    }
                }
                return null;
            }).filter(Boolean);
        }
     
        if (selectedClubsData.length === 0 && typeof allWorldCupCountriesClubs !== 'undefined') {
            const firstCountry = Object.keys(allWorldCupCountriesClubs)[0];
            if (firstCountry && allWorldCupCountriesClubs[firstCountry] && allWorldCupCountriesClubs[firstCountry].length > 0) {
                 selectedClubsData = [allWorldCupCountriesClubs[firstCountry][0]];
            }
        }

        const primaryClub = selectedClubsData[0] || null;
        const username = state.username || 'Player';
        const userId = state.userId || '---';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1c1c22&color=14F195&size=128&bold=true`;
        const avatarSrc = state.photoUrl ? state.photoUrl : fallbackAvatar;
      
        let clubsCardsHtml = selectedClubsData.map(club => {
            let clubName = club.name || '';
            try {
                if (typeof getClubName === "function") clubName = getClubName(club);
            } catch (e) {}

            return `
                <div class="glass-club-card">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="club-logo-wrapper">
                            <img src="${club.logo || ''}" onerror="this.style.display='none'" style="width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8));">
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #fff; font-size: 0.95rem; font-weight: 900; letter-spacing: 0.5px;">${clubName} ${club.countryFlag || ''}</h3>
                            <p style="margin: 2px 0 0 0; color: #14F195; font-size: 0.75rem; font-weight: bold; text-shadow: 0 0 5px rgba(20, 241, 149, 0.4); display: flex; align-items: center; gap: 4px;">
                                <span class="pulse-green"></span> <span id="club-fans-${club.id}">${club.members ? club.members.toLocaleString() : '3'}</span> ${isAr ? 'مشجع' : 'Fans'}
                            </p>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div class="club-points-badge">
                            <span style="font-size: 0.85rem;">🏆</span> <span id="club-pts-${club.id}">${club.points ? club.points.toLocaleString() : '6,080'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        let titleWeeklyChallenges = getSafeText('weeklyChallenges', 'التحديات الأسبوعية', 'Weekly Challenges');
        let textEuropeCups = getSafeText('europeCups', 'الكؤوس الأوروبية', 'European Cups');
        let textSpainCups = getSafeText('spainCups', 'الكؤوس الإسبانية', 'Spanish Cups');
        let titleRanking = getSafeText('challengesRanking', 'ترتيب التحديات', 'Challenges Ranking');
        let textRankingDesc = getSafeText('rankingDesc', 'اكتشف أفضل اللاعبين وترتيبك', 'Discover top players and your rank');
        let supportedClubsTitle = getSafeText('supportedClubs', 'الأندية المدعومة', 'Supported Clubs');
        let loadingAlert = getSafeText('loading', 'جاري التحميل...', 'Loading...');
        let websiteBtnText = getSafeText('officialSite', 'الموقع الرسمي', 'Official Site');
        
        let solTitle = 'Solana Ecosystem';
        let solSub = '⚡ Instant & Micro-Fee Rewards';

        // 2. رسم عناصر الـ DOM المباشرة فوراً بدون انتظار
        targetContainer.innerHTML = `
            <style>
                @keyframes profileGlow {
                    0% { box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(20, 241, 149, 0.1); }
                    50% { box-shadow: 0 15px 30px rgba(0,0,0,0.9), inset 0 0 25px rgba(153, 69, 255, 0.25); }
                    100% { box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(20, 241, 149, 0.1); }
                }
                @keyframes levitateAvatar {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(20, 241, 149, 0.6); }
                    100% { transform: translateY(0px); }
                }
                @keyframes shimmerEffect {
                    0% { transform: translateX(-150%) skewX(-25deg); }
                    100% { transform: translateX(200%) skewX(-25deg); }
                }
                @keyframes pulseLive {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .home-fixed-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    width: 100%;
                    padding: 10px 16px 80px 16px;
                    box-sizing: border-box;
                    background: transparent;
                    color: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                .royal-profile-card {
                    position: relative;
                    background: linear-gradient(180deg, rgba(22, 22, 30, 0.85) 0%, rgba(13, 13, 18, 0.95) 100%);
                    border-radius: 20px;
                    padding: 30px 15px 15px 15px;
                    margin-top: 25px;
                    margin-bottom: 12px;
                    border: 1px solid rgba(153, 69, 255, 0.25);
                    text-align: center;
                    animation: profileGlow 4s infinite alternate;
                    backdrop-filter: blur(20px);
                    flex-shrink: 0;
                }

                .royal-avatar-wrapper {
                    position: absolute;
                    top: -35px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    padding: 3px;
                    animation: levitateAvatar 3s ease-in-out infinite;
                    z-index: 2;
                }

                .royal-avatar-inner {
                    width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
                    border: 2px solid #121215; background: #111;
                }
                .royal-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }

                .website-glass-btn {
                    position: absolute; top: 12px;
                    ${isAr ? 'left: 12px;' : 'right: 12px;'}
                    background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(10px); padding: 5px 10px; border-radius: 12px;
                    color: #fff; font-size: 0.72rem; font-weight: bold;
                    display: flex; align-items: center; gap: 5px; cursor: pointer; transition: all 0.3s; z-index: 10;
                }

                .solana-action-banner {
                    position: relative;
                    border-radius: 18px;
                    padding: 12px 15px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, rgba(20, 241, 149, 0.08) 0%, rgba(153, 69, 255, 0.12) 100%);
                    border: 1px solid rgba(20, 241, 149, 0.35);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(15px);
                    flex-shrink: 0;
                    overflow: hidden;
                }

                .solana-badge-icon {
                    width: 38px; height: 38px; border-radius: 12px;
                    background: rgba(153, 69, 255, 0.2);
                    border: 1px solid rgba(20, 241, 149, 0.3);
                    display: flex; align-items: center; justify-content: center;
                }

                .pulse-green {
                    display: inline-block; width: 6px; height: 6px;
                    background: #14F195; border-radius: 50%;
                    animation: pulseLive 1.2s infinite ease-in-out;
                    box-shadow: 0 0 8px #14F195;
                }

                .action-banner {
                    position: relative; border-radius: 18px; padding: 12px 15px;
                    margin-bottom: 10px; display: flex; align-items: center; gap: 12px;
                    cursor: pointer; overflow: hidden; backdrop-filter: blur(15px);
                    flex-shrink: 0;
                }

                .banner-challenges { 
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(153, 69, 255, 0.06) 100%); 
                    border: 1px solid rgba(59, 130, 246, 0.35); 
                }

                .banner-ranking { 
                    background: linear-gradient(135deg, rgba(255, 69, 58, 0.08) 0%, rgba(255, 159, 10, 0.06) 100%); 
                    border: 1px solid rgba(255, 69, 58, 0.35); 
                }

                .banner-icon-wrapper {
                    width: 42px; height: 42px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.3rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
                }

                .glass-club-card {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(20, 241, 149, 0.02) 100%);
                    backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); 
                    border-radius: 16px; padding: 10px 14px;
                    display: flex; align-items: center; justify-content: space-between;
                    margin-bottom: 8px;
                }

                .club-logo-wrapper {
                    width: 38px; height: 38px; background: rgba(0,0,0,0.4);
                    border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .club-points-badge {
                    background: linear-gradient(135deg, rgba(153, 69, 255, 0.15), rgba(20, 241, 149, 0.15));
                    color: #FFD700; padding: 5px 12px; border-radius: 10px;
                    font-weight: 900; font-size: 0.85rem; border: 1px solid rgba(153, 69, 255, 0.3);
                }

                .price-updated { color: #ffffff !important; text-shadow: 0 0 10px #14F195; }
            </style>

            <div class="home-fixed-container">
                <div class="royal-profile-card">
                    <div class="royal-avatar-wrapper"><div class="royal-avatar-inner"><img src="${avatarSrc}" alt="Avatar"></div></div>
                    <button class="website-glass-btn" onclick="window.openOfficialWebsite()"><span style="font-size: 0.85rem;">🌍</span> ${websiteBtnText}</button>
                    <h2 style="margin: 20px 0 5px 0; color: #fff; font-size: 1.2rem; font-weight: 900; letter-spacing: 0.5px;">${username}</h2>
                    <div style="display: inline-block; background: rgba(0,0,0,0.4); padding: 3px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #888; font-size: 0.72rem; font-weight: bold;">ID:</span> 
                        <span style="color: #ccc; font-size: 0.78rem; font-family: monospace;">${userId}</span>
                    </div>
                </div>

                <div class="solana-action-banner">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="solana-badge-icon">
                            <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width: 20px; height: 20px;" alt="Solana">
                        </div>
                        <div style="text-align: ${isAr ? 'right' : 'left'};">
                            <div style="color: #fff; font-weight: 800; font-size: 0.88rem;">${solTitle}</div>
                            <div style="color: #94a3b8; font-size: 0.7rem; font-weight: 600; margin-top: 1px;">${solSub}</div>
                        </div>
                    </div>
                    <div style="text-align: ${isAr ? 'left' : 'right'};">
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 5px;">
                            <span class="pulse-green"></span>
                            <span style="color: #c084fc; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">Pyth Live</span>
                        </div>
                        <div id="home-sol-price" style="color: #14F195; font-family: monospace; font-weight: 900; font-size: 1.05rem; margin-top: 2px;">$118.12</div>
                    </div>
                </div>
              
                <div id="challenges-card" class="action-banner banner-challenges" onclick="if(typeof window.openChallengesScreen === 'function') { window.openChallengesScreen(); } else { alert('${loadingAlert}'); }">
                    <div class="banner-icon-wrapper">${primaryClub ? (primaryClub.countryFlag || '⚽') : '⚽'}</div>
                    <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                        <h3 style="color: #fff; margin: 0 0 2px 0; font-size: 1rem; font-weight: 900;">${titleWeeklyChallenges}</h3>
                        <p style="color: #93c5fd; font-size: 0.72rem; margin: 0; font-weight: bold;">🇪🇺 ${textEuropeCups} <span style="color:#555;">•</span> 🇪🇸 ${textSpainCups}</p>
                    </div>
                    <div style="color: #3b82f6; font-size: 1.1rem; font-weight: bold;">${isAr ? '👈' : '👉'}</div>
                </div>

                <div id="ranking-card" class="action-banner banner-ranking" onclick="if(typeof window.openLegendaryRankingScreen === 'function') { window.openLegendaryRankingScreen(); } else { alert('${loadingAlert}'); }">
                    <div class="banner-icon-wrapper">🔥</div>
                    <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                        <h3 style="color: #fff; margin: 0 0 2px 0; font-size: 1rem; font-weight: 900;">${titleRanking}</h3>
                        <p style="color: #fca5a5; font-size: 0.72rem; margin: 0; font-weight: bold;">⭐ ${textRankingDesc}</p>
                    </div>
                    <div style="color: #ff453a; font-size: 1.1rem; font-weight: bold;">${isAr ? '👈' : '👉'}</div>
                </div>

                <div class="clubs-section">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 8px; padding: 0 4px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size: 1rem;">🛡️</span>
                            <h4 style="color: #fff; margin: 0; font-size: 0.9rem; font-weight: 800;">${supportedClubsTitle}</h4>
                        </div>
                        <span style="color: #14F195; font-size: 0.72rem; font-weight: 800;">${selectedClubsData.length} Active</span>
                    </div>
                    ${clubsCardsHtml}
                </div>
            </div>
        `;

        // 3. جلب بيانات السعر وسوبابيز في الخلفية دون تعطيل الواجهة
        window.updateHomeSolPrice();

        // تحديث سعر سولانا الحقيقي كل ثانية
        window.solPriceInterval = setInterval(() => {
            const priceElem = document.getElementById('home-sol-price');
            if (priceElem) {
                window.updateHomeSolPrice();
            } else {
                clearInterval(window.solPriceInterval);
            }
        }, 1000);

        // جلب الإحصائيات من Supabase في الخلفية لتحديث أعداد الجماهير بدون تعطيل الواجهة
        if (typeof supabaseClient !== 'undefined' && supabaseClient && selectedClubsData.length > 0) {
            const clubIds = selectedClubsData.map(c => String(c.id));
            supabaseClient
                .from('club_fans_rankings')
                .select('club_id, total_fan_points')
                .in('club_id', clubIds)
                .then(({ data: fansData, error }) => {
                    if (!error && fansData) {
                        let membersMap = {}, pointsMap = {};
                        fansData.forEach(fan => {
                            membersMap[fan.club_id] = (membersMap[fan.club_id] || 0) + 1;
                            pointsMap[fan.club_id] = (pointsMap[fan.club_id] || 0) + (fan.total_fan_points || 0)
