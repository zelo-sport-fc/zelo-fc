window.openOfficialWebsite = window.openOfficialWebsite || function() {
    const url = "https://zelo-sport-fc.github.io/zelo-fc-site/";
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
};

// محاكاة أو ربط محفظة Solana Web3
window.handleSolanaWallet = function() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    alert(userState.lang === 'ar' ? '⚡ جاري ربط محفظة Solana (Phantom / Solflare)...' : '⚡ Connecting Solana Wallet...');
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
                // تأثير فلاش سريع عند تحديث السعر
                el.classList.add('price-updated');
                setTimeout(() => el.classList.remove('price-updated'), 800);
            }
        }
    } catch (err) {
        if (el) el.innerText = `$118.12`;
    }
};

window.renderHomePage = async function(container) {
    const isAr = userState.lang === 'ar';

    const getSafeText = (key, fallbackAr, fallbackEn) => {
        if (typeof i18n !== 'undefined' && i18n[userState.lang] && i18n[userState.lang][key]) {
            return i18n[userState.lang][key];
        }
        return isAr ? fallbackAr : fallbackEn;
    };

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh;">
            <div class="app-loader"></div>
            <div style="margin-top:15px; color:#14F195; font-weight:800; font-size:0.9rem; letter-spacing:1px; font-family:sans-serif;">
                ${isAr ? '⚡ جاري تحضير الواجهة...' : '⚡ INITIALIZING WEB3 PITCH...'}
            </div>
        </div>
    `;

    let selectedClubsData = userState.selectedClubs.map(id => {
        if (typeof allWorldCupCountriesClubs !== 'undefined') {
            for (const country in allWorldCupCountriesClubs) {
                const foundClub = allWorldCupCountriesClubs[country].find(c => String(c.id) === String(id));
                if (foundClub) return foundClub;
            }
        }
        return null;
    }).filter(Boolean);
 
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
    let fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userState.username)}&background=0e0e12&color=14F195&size=128&bold=true`;
    let avatarSrc = userState.photoUrl ? userState.photoUrl : fallbackAvatar;
  
    let clubsCardsHtml = selectedClubsData.map(club => `
        <div class="futuristic-club-card">
            <div class="club-left-info">
                <div class="club-logo-frame">
                    <img src="${club.logo}" onerror="this.style.display='none'">
                </div>
                <div>
                    <div class="club-title">${typeof getClubName === "function" ? getClubName(club) : club.name} ${club.countryFlag}</div>
                    <div class="club-fans-count">
                        <span class="online-indicator"></span>
                        ${club.members ? club.members.toLocaleString() : '0'} ${isAr ? 'مشجع' : 'Fans'}
                    </div>
                </div>
            </div>
            <div class="club-right-badge">
                <span class="trophy-icon">🏆</span>
                <span class="points-val">${club.points ? club.points.toLocaleString() : '0'}</span>
            </div>
        </div>
    `).join('');

    let titleWeeklyChallenges = getSafeText('weeklyChallenges', 'Weekly Challenges', 'Weekly Challenges');
    let textEuropeCups = getSafeText('europeCups', 'European Cups', 'European Cups');
    let textSpainCups = getSafeText('spainCups', 'Spanish Cups', 'Spanish Cups');
    let titleRanking = getSafeText('challengesRanking', 'Challenges Ranking', 'Challenges Ranking');
    let textRankingDesc = getSafeText('rankingDesc', 'Discover top players and your rank', 'Discover top players and your rank');
    let supportedClubsTitle = getSafeText('supportedClubs', 'Supported Clubs', 'Supported Clubs');
    let loadingAlert = getSafeText('loading', 'Loading...', 'Loading...');
    let websiteBtnText = getSafeText('officialSite', 'Official Site', 'Official Site');

    container.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800;900&display=swap');

            .app-wrapper {
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                background: #08090C;
                background-image: 
                    radial-gradient(circle at 10% 0%, rgba(153, 69, 255, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 90% 90%, rgba(20, 241, 149, 0.12) 0%, transparent 40%);
                min-height: 100vh;
                padding: 12px 16px;
                box-sizing: border-box;
                color: #fff;
                overflow-x: hidden;
            }

            /* شريط التطبيق العالي (App Header Bar) */
            .app-header-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(18, 20, 28, 0.6);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                padding: 8px 12px;
                margin-bottom: 12px;
            }

            .user-pill {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .avatar-hex {
                position: relative;
                width: 42px;
                height: 42px;
                border-radius: 14px;
                background: linear-gradient(135deg, #9945FF, #14F195);
                padding: 2px;
                box-shadow: 0 0 12px rgba(20, 241, 149, 0.3);
            }

            .avatar-hex img {
                width: 100%;
                height: 100%;
                border-radius: 12px;
                object-fit: cover;
                background: #000;
            }

            .web3-wallet-btn {
                background: linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(20, 241, 149, 0.2));
                border: 1px solid rgba(20, 241, 149, 0.4);
                color: #14F195;
                font-size: 0.72rem;
                font-weight: 800;
                padding: 6px 12px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .web3-wallet-btn:active {
                transform: scale(0.94);
            }

            /* بطاقة البروفايل الرئيسية */
            .hero-profile-card {
                position: relative;
                background: linear-gradient(180deg, rgba(22, 26, 38, 0.7) 0%, rgba(12, 14, 20, 0.9) 100%);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 16px;
                margin-bottom: 12px;
                backdrop-filter: blur(25px);
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }

            .hero-profile-card::after {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(153, 69, 255, 0.15) 0%, transparent 70%);
                pointer-events: none;
            }

            /* بنر سولدانا الفضائي المباشر (Solana Live Banner) */
            .solana-live-card {
                position: relative;
                background: linear-gradient(135deg, rgba(153, 69, 255, 0.12) 0%, rgba(20, 241, 149, 0.08) 100%);
                border: 1px solid rgba(20, 241, 149, 0.3);
                border-radius: 20px;
                padding: 12px 16px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                backdrop-filter: blur(15px);
                box-shadow: 0 8px 25px rgba(20, 241, 149, 0.1);
            }

            .live-pulse-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #14F195;
                border-radius: 50%;
                box-shadow: 0 0 10px #14F195;
                animation: radarPulse 1.5s infinite ease-in-out;
            }

            @keyframes radarPulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 241, 149, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(20, 241, 149, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(20, 241, 149, 0); }
            }

            .price-updated {
                animation: priceGlow 0.8s ease-out;
            }

            @keyframes priceGlow {
                0% { color: #fff; text-shadow: 0 0 15px #14F195; transform: scale(1.1); }
                100% { color: #14F195; text-shadow: none; transform: scale(1); }
            }

            /* كروت الإجراءات السريعة (App Action Cards) */
            .action-grid {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 14px;
            }

            .app-action-card {
                position: relative;
                background: rgba(18, 22, 32, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-radius: 20px;
                padding: 14px 16px;
                display: flex;
                align-items: center;
                gap: 14px;
                cursor: pointer;
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), border 0.2s;
                backdrop-filter: blur(15px);
            }

            .app-action-card:active {
                transform: scale(0.97);
            }

            .card-icon-box {
                width: 46px;
                height: 46px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.4rem;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .challenges-theme { border-right: 4px solid #3B82F6; }
            .ranking-theme { border-right: 4px solid #FF453A; }

            /* قسم الأندية المقترحة (Clubs Section) */
            .futuristic-club-card {
                background: rgba(15, 18, 26, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 10px 14px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                backdrop-filter: blur(10px);
            }

            .club-left-info {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .club-logo-frame {
                width: 38px;
                height: 38px;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 12px;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .club-logo-frame img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .club-title {
                font-weight: 800;
                font-size: 0.92rem;
                color: #f1f5f9;
            }

            .club-fans-count {
                font-size: 0.72rem;
                color: #14F195;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 2px;
            }

            .online-indicator {
                width: 5px;
                height: 5px;
                background: #14F195;
                border-radius: 50%;
            }

            .club-right-badge {
                background: linear-gradient(135deg, rgba(153, 69, 255, 0.15), rgba(20, 241, 149, 0.15));
                border: 1px solid rgba(153, 69, 255, 0.3);
                padding: 4px 10px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .points-val {
                font-weight: 900;
                font-size: 0.82rem;
                color: #FFD700;
            }

            /* Loader */
            .app-loader {
                width: 35px;
                height: 35px;
                border: 3px solid rgba(20, 241, 149, 0.1);
                border-top: 3px solid #14F195;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>

        <div class="app-wrapper">
            <!-- App Navigation Header -->
            <div class="app-header-bar">
                <div class="user-pill">
                    <div class="avatar-hex">
                        <img src="${avatarSrc}" alt="User Avatar">
                    </div>
                    <div>
                        <div style="font-weight: 900; font-size: 0.95rem; color: #fff;">${userState.username}</div>
                        <div style="font-size: 0.68rem; color: #64748b; font-weight: 700;">ID: ${userState.userId}</div>
                    </div>
                </div>

                <button class="web3-wallet-btn" onclick="window.handleSolanaWallet()">
                    <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width: 14px; height: 14px;" alt="SOL">
                    <span>SOL Web3</span>
                </button>
            </div>

            <!-- Solana Oracle Live Banner -->
            <div class="solana-live-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="background: rgba(153, 69, 255, 0.2); padding: 8px; border-radius: 14px; border: 1px solid rgba(153, 69, 255, 0.3);">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width: 22px; height: 22px; display: block;" alt="Solana">
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="live-pulse-dot"></span>
                            <span style="font-size: 0.65rem; color: #14F195; font-weight: 800; letter-spacing: 0.5px;">PYTH ORACLE LIVE</span>
                        </div>
                        <div style="font-size: 0.88rem; font-weight: 800; color: #fff; margin-top: 1px;">Solana Ecosystem</div>
                    </div>
                </div>

                <div style="text-align: ${isAr ? 'left' : 'right'};">
                    <div id="home-sol-price" style="color: #14F195; font-family: monospace; font-weight: 900; font-size: 1.15rem; transition: all 0.3s;">$118.12</div>
                    <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700;">⚡ Instant Feed</div>
                </div>
            </div>

            <!-- Official Website Banner Button -->
            <div style="margin-bottom: 12px;">
                <button onclick="window.openOfficialWebsite()" style="width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 16px; color: #e2e8f0; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                    <span>🌐</span> ${websiteBtnText}
                </button>
            </div>

            <!-- Action Cards -->
            <div class="action-grid">
                <div id="challenges-card" class="app-action-card challenges-theme" onclick="if(typeof window.openChallengesScreen === 'function') { window.openChallengesScreen(); } else { alert('${loadingAlert}'); }">
                    <div class="card-icon-box" style="box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);">
                        ${primaryClub ? primaryClub.countryFlag : '⚽'}
                    </div>
                    <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                        <div style="color: #fff; font-weight: 900; font-size: 0.98rem; margin-bottom: 2px;">${titleWeeklyChallenges}</div>
                        <div style="color: #94a3b8; font-size: 0.72rem; font-weight: 700;">🇪🇺 ${textEuropeCups} • 🇪🇸 ${textSpainCups}</div>
                    </div>
                    <div style="color: #3B82F6; font-size: 1.1rem; font-weight: bold;">${isAr ? '❮' : '❯'}</div>
                </div>

                <div id="ranking-card" class="app-action-card ranking-theme" onclick="if(typeof window.openLegendaryRankingScreen === 'function') { window.openLegendaryRankingScreen(); } else { alert('${loadingAlert}'); }">
                    <div class="card-icon-box" style="box-shadow: 0 0 15px rgba(255, 69, 58, 0.2);">🔥</div>
                    <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                        <div style="color: #fff; font-weight: 900; font
