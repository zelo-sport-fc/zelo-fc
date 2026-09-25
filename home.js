window.openOfficialWebsite = window.openOfficialWebsite || function() {
    const url = "https://zelo-sport-fc.github.io/zelo-fc-site/";
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
};

window.handleSolanaWallet = function() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    alert(typeof userState !== 'undefined' && userState.lang === 'ar' ? '⚡ جاري ربط محفظة Solana (Phantom / Solflare)...' : '⚡ Connecting Solana Wallet...');
};

window.updateHomeSolPrice = async function() {
    const el = document.getElementById('home-sol-price');
    const PYTH_SOL_FEED_ID = "0xef0e830e793c34158995a15574c73151ea47f1130ed7005e2070d64283563865";
    
    try {
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`);
        const data = await res.json();
        if (data && data.parsed && data.parsed[0] && data.parsed[0].price) {
            const p = data.parsed[0].price;
            const finalPrice = (Number(p.price) * Math.pow(10, Number(p.expo))).toFixed(2);
            if (el) {
                el.innerText = `$${finalPrice}`;
                el.classList.add('price-updated');
                setTimeout(() => el.classList.remove('price-updated'), 800);
            }
        }
    } catch (err) {
        if (el) el.innerText = `$118.12`;
    }
};

window.renderHomePage = async function(container) {
    if (!container) return;

    try {
        const isAr = typeof userState !== 'undefined' && userState.lang === 'ar';

        const getSafeText = (key, fallbackAr, fallbackEn) => {
            if (typeof i18n !== 'undefined' && typeof userState !== 'undefined' && i18n[userState.lang] && i18n[userState.lang][key]) {
                return i18n[userState.lang][key];
            }
            return isAr ? fallbackAr : fallbackEn;
        };

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 40px 20px;">
                <div class="app-loader"></div>
                <div style="margin-top:15px; color:#14F195; font-weight:800; font-size:0.85rem; letter-spacing:1px;">
                    ${isAr ? '⚡ جاري تحميل البيانات...' : '⚡ LOADING WEB3 PITCH...'}
                </div>
            </div>
        `;

        let selectedClubsData = [];
        if (typeof userState !== 'undefined' && userState.selectedClubs) {
            selectedClubsData = userState.selectedClubs.map(id => {
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
            if (firstCountry && allWorldCupCountriesClubs[firstCountry].length > 0) {
                 selectedClubsData = [allWorldCupCountriesClubs[firstCountry][0]];
            }
        }

        if (typeof supabaseClient !== 'undefined' && selectedClubsData.length > 0) {
            const clubIds = selectedClubsData.map(c => String(c.id));
            try {
                const { data: fansData, error } = await supabaseClient
                    .from('club_fans_rankings')
                    .select('club_id, total_fan_points')
                    .in('club_id', clubIds);

                if (!error && fansData) {
                    let membersMap = {};
                    let pointsMap = {};
                    
                    fansData.forEach(fan => {
                        membersMap[fan.club_id] = (membersMap[fan.club_id] || 0) + 1; 
                        pointsMap[fan.club_id] = (pointsMap[fan.club_id] || 0) + (fan.total_fan_points || 0); 
                    });

                    selectedClubsData.forEach(club => {
                        club.members = membersMap[String(club.id)] || 0;
                        club.points = pointsMap[String(club.id)] || 0;
                    });
                }
            } catch (err) {
                console.error("Error fetching club stats:", err);
            }
        }

        const primaryClub = selectedClubsData[0];
        const username = (typeof userState !== 'undefined' && userState.username) ? userState.username : 'Player';
        const userId = (typeof userState !== 'undefined' && userState.userId) ? userState.userId : '---';
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0e0e12&color=14F195&size=128&bold=true`;
        const avatarSrc = (typeof userState !== 'undefined' && userState.photoUrl) ? userState.photoUrl : fallbackAvatar;
      
        let clubsCardsHtml = selectedClubsData.map(club => `
            <div class="futuristic-club-card">
                <div class="club-left-info">
                    <div class="club-logo-frame">
                        <img src="${club.logo || ''}" onerror="this.style.display='none'">
                    </div>
                    <div>
                        <div class="club-title">${typeof getClubName === "function" ? getClubName(club) : (club.name || '')} ${club.countryFlag || ''}</div>
                        <div class="club-fans-count">
                            <span class="online-indicator"></span>
                            ${club.members ? club.members.toLocaleString() : '0'} ${isAr ? 'مشجع' : 'Fans'}
                        </div>
                    </div>
                </div>
                <div class="club-right-badge">
                    <span style="font-size:0.8rem;">🏆</span>
                    <span class="points-val">${club.points ? club.points.toLocaleString() : '0'}</span>
                </div>
            </div>
        `).join('');

        let titleWeeklyChallenges = getSafeText('weeklyChallenges', 'التحديات الأسبوعية', 'Weekly Challenges');
        let textEuropeCups = getSafeText('europeCups', 'الكؤوس الأوروبية', 'European Cups');
        let textSpainCups = getSafeText('spainCups', 'الكؤوس الإسبانية', 'Spanish Cups');
        let titleRanking = getSafeText('challengesRanking', 'ترتيب التحديات', 'Challenges Ranking');
        let textRankingDesc = getSafeText('rankingDesc', 'اكتشف أفضل اللاعبين وترتيبك', 'Discover top players and your rank');
        let supportedClubsTitle = getSafeText('supportedClubs', 'الأندية المدعومة', 'Supported Clubs');
        let loadingAlert = getSafeText('loading', 'جاري التحميل...', 'Loading...');
        let websiteBtnText = getSafeText('officialSite', 'الموقع الرسمي', 'Official Site');

        container.innerHTML = `
            <style>
                .app-wrapper {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: #08090C;
                    padding: 10px 14px;
                    box-sizing: border-box;
                    color: #fff;
                    width: 100%;
                }

                .app-header-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(18, 20, 28, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 8px 12px;
                    margin-bottom: 10px;
                }

                .user-pill {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .avatar-hex {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    padding: 2px;
                    box-sizing: border-box;
                }

                .avatar-hex img {
                    width: 100%;
                    height: 100%;
                    border-radius: 10px;
                    object-fit: cover;
                    background: #000;
                    display: block;
                }

                .web3-wallet-btn {
                    background: rgba(20, 241, 149, 0.12);
                    border: 1px solid rgba(20, 241, 149, 0.4);
                    color: #14F195;
                    font-size: 0.72rem;
                    font-weight: 800;
                    padding: 6px 10px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                }

                .web3-wallet-btn:active {
                    transform: scale(0.95);
                }

                .solana-live-card {
                    background: linear-gradient(135deg, rgba(153, 69, 255, 0.15) 0%, rgba(20, 241, 149, 0.1) 100%);
                    border: 1px solid rgba(20, 241, 149, 0.3);
                    border-radius: 16px;
                    padding: 10px 14px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .live-pulse-dot {
                    display: inline-block;
                    width: 7px;
                    height: 7px;
                    background: #14F195;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #14F195;
                }

                .price-updated {
                    color: #fff !important;
                }

                .action-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .app-action-card {
                    background: rgba(18, 22, 32, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 12px 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                }

                .app-action-card:active {
                    transform: scale(0.98);
                }

                .card-icon-box {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.3rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .challenges-theme { border-${isAr ? 'right' : 'left'}: 4px solid #3B82F6; }
                .ranking-theme { border-${isAr ? 'right' : 'left'}: 4px solid #FF453A; }

                .futuristic-club-card {
                    background: rgba(15, 18, 26, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 14px;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .club-left-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .club-logo-frame {
                    width: 34px;
                    height: 34px;
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 10px;
                    padding: 3px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .club-logo-frame img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .club-title {
                    font-weight: 800;
                    font-size: 0.88rem;
                    color: #f1f5f9;
                }

                .club-fans-count {
                    font-size: 0.7rem;
                    color: #14F195;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .online-indicator {
                    width: 5px;
                    height: 5px;
                    background: #14F195;
                    border-radius: 50%;
                }

                .club-right-badge {
                    background: rgba(153, 69, 255, 0.15);
                    border: 1px solid rgba(153, 69, 255, 0.3);
                    padding: 4px 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .points-val {
                    font-weight: 800;
                    font-size: 0.8rem;
                    color: #FFD700;
                }

                .app-loader {
                    width: 30px;
                    height: 30px;
                    border: 3px solid rgba(20, 241, 149, 0.2);
                    border-top: 3px solid #14F195;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>

            <div class="app-wrapper">
                <!-- Header -->
                <div class="app-header-bar">
                    <div class="user-pill">
                        <div class="avatar-hex">
                            <img src="${avatarSrc}" alt="Avatar">
                        </div>
                        <div>
                            <div style="font-weight: 900; font-size: 0.9rem; color: #fff;">${username}</div>
                            <div style="font-size: 0.65rem; color: #64748b; font-weight: 700;">ID: ${userId}</div>
                        </div>
                    </div>

                    <button class="web3-wallet-btn" onclick="window.handleSolanaWallet()">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width: 12px; height: 12px;" alt="SOL">
                        <span>SOL Web3</span>
                    </button>
                </div>

                <!-- Solana Price Card -->
                <div class="solana-live-card">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="background: rgba(153, 69, 255, 0.2); padding: 6px; border-radius: 10px;">
                            <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width: 20px; height: 20px; display: block;" alt="Solana">
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <span class="live-pulse-dot"></span>
                                <span style="font-size: 0.62rem; color: #14F195; font-weight: 800;">PYTH ORACLE LIVE</span>
                            </div>
                            <div style="font-size: 0.82rem; font-weight: 800; color: #fff;">Solana Ecosystem</div>
                        </div>
                    </div>

                    <div style="text-align: ${isAr ? 'left' : 'right'};">
                        <div id="home-sol-price" style="color: #14F195; font-family: monospace; font-weight: 900; font-size: 1.1rem;">$118.12</div>
                        <div style="font-size: 0.62rem; color: #94a3b8;">⚡ Real-Time</div>
                    </div>
                </div>

                <!-- Official Website Button -->
                <div style="margin-bottom: 10px;">
                    <button onclick="window.openOfficialWebsite()" style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 12px; color: #e2e8f0; font-size: 0.78rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;">
                        <span>🌍</span> ${websiteBtnText}
                    </button>
                </div>

                <!-- Action Cards -->
                <div class="action-grid">
                    <div id="challenges-card" class="app-action-card challenges-theme" onclick="if(typeof window.openChallengesScreen === 'function') { window.openChallengesScreen(); } else { alert('${loadingAlert}'); }">
                        <div class="card-icon-box">
                            ${primaryClub ? (primaryClub.countryFlag || '⚽') : '⚽'}
                        </div>
                        <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                            <div style="color: #fff; font-weight: 800; font-size: 0.92rem; margin-bottom: 2px;">${titleWeeklyChallenges}</div>
                            <div style="color: #94a3b8; font-size: 0.7rem; font-weight: 700;">🇪🇺 ${textEuropeCups} • 🇪🇸 ${textSpainCups}</div>
                        </div>
                        <div style="color: #3B82F6; font-size: 1rem; font-weight: bold;">${isAr ? '❮' : '❯'}</div>
                    </div>

                    <div id="ranking-card" class="app-action-card ranking-theme" onclick="if(typeof window.openLegendaryRankingScreen === 'function') { window.openLegendaryRankingScreen(); } else { alert('${loadingAlert}'); }">
                        <div class="card-icon-box">🔥</div>
                        <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                            <div style="color: #fff; font-weight: 800; font-size: 0.92rem; margin-bottom: 2px;">${titleRanking}</div>
                            <div style="color: #fca5a5; font-size: 0.7rem; font-weight: 700;">⭐ ${textRankingDesc}</div>
                        </div>
                        <div style="color: #FF453A; font-size: 1rem; font-weight: bold;">${isAr ? '❮' : '❯'}</div>
                    </div>
                </div>

                <!-- Supported Clubs -->
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 0 2px;">
                        <span style="color: #fff; font-size: 0.85rem; font-weight: 800;">🛡️ ${supportedClubsTitle}</span>
                        <span style="color: #64748b; font-size: 0.7rem; font-weight: 700;">${selectedClubsData.length} Active</span>
                    </div>
                    ${clubsCardsHtml}
                </div>
            </div>
        `;

        if (window.solPriceInterval) {
            clearInterval(window.solPriceInterval);
        }

        setTimeout(() => {
            if (typeof window.updateHomeSolPrice === 'function') {
                window.updateHomeSolPrice();
            }
        }, 100);

        window.solPriceInterval = setInterval(() => {
            const priceElem = document.getElementById('home-sol-price');
            if (priceElem) {
                if (typeof wi
