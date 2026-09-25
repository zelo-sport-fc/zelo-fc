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
            el.innerText = `$${finalPrice}`;
        }
    } catch (err) {
        el.innerText = `$118.12`;
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

    container.innerHTML = `<div style="text-align:center; padding:50px; color:#888; font-weight:bold;">${isAr ? '⏳ Preparing the pitch...' : '⏳ Preparing the pitch...'}</div>`;

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
    let fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userState.username)}&background=1c1c22&color=fcb045&size=128&bold=true`;
    let avatarSrc = userState.photoUrl ? userState.photoUrl : fallbackAvatar;
  
    let clubsCardsHtml = selectedClubsData.map(club => `
        <div class="glass-club-card">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="club-logo-wrapper">
                    <img src="${club.logo}" onerror="this.style.display='none'" style="width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8));">
                </div>
                <div>
                    <h3 style="margin: 0; color: #fff; font-size: 1.05rem; font-weight: 900; letter-spacing: 0.5px;">${typeof getClubName === "function" ? getClubName(club) : club.name} ${club.countryFlag}</h3>
                    <p style="margin: 2px 0 0 0; color: #10b981; font-size: 0.75rem; font-weight: bold; text-shadow: 0 0 5px rgba(16, 185, 129, 0.4);">
                        👥 ${club.members ? club.members.toLocaleString() : '0'} Fans
                    </p>
                </div>
            </div>
            <div style="text-align: center;">
                <div class="club-points-badge">
                    <span style="font-size: 0.9rem;">🏆</span> ${club.points ? club.points.toLocaleString() : '0'}
                </div>
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
    
    let solTitle = 'Solana Ecosystem';
    let solSub = '⚡ Instant & Micro-Fee Rewards';

    container.innerHTML = `
        <style>
            @keyframes profileGlow {
                0% { box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(252, 176, 69, 0.1); }
                50% { box-shadow: 0 15px 30px rgba(0,0,0,0.9), inset 0 0 25px rgba(252, 176, 69, 0.3); }
                100% { box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(252, 176, 69, 0.1); }
            }
            @keyframes levitateAvatar {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(252, 176, 69, 0.6); }
                100% { transform: translateY(0px); }
            }
            @keyframes shimmerEffect {
                0% { transform: translateX(-150%) skewX(-25deg); }
                100% { transform: translateX(200%) skewX(-25deg); }
            }

            .home-fixed-container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                height: 100vh;
                max-height: 100%;
                overflow: hidden;
                padding: 10px 20px;
                box-sizing: border-box;
            }

            .royal-profile-card {
                position: relative;
                background: linear-gradient(180deg, rgba(22, 22, 30, 0.9) 0%, rgba(13, 13, 18, 0.95) 100%);
                border-radius: 20px;
                padding: 30px 15px 15px 15px;
                margin-top: 25px;
                margin-bottom: 12px;
                border: 1px solid rgba(255, 215, 0, 0.15);
                text-align: center;
                animation: profileGlow 4s infinite alternate;
                backdrop-filter: blur(20px);
                flex-shrink: 0;
            }
            
            .royal-profile-card::before {
                content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: url('${primaryClub ? primaryClub.logo : ''}') center/cover no-repeat;
                opacity: 0.05; border-radius: 20px; pointer-events: none;
            }

            .royal-avatar-wrapper {
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                width: 75px;
                height: 75px;
                border-radius: 50%;
                background: linear-gradient(135deg, #fcb045, #fd1d1d, #833ab4);
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
                background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px); padding: 5px 10px; border-radius: 15px;
                color: #fff; font-size: 0.75rem; font-weight: bold;
                display: flex; align-items: center; gap: 5px; cursor: pointer; transition: all 0.3s; z-index: 10;
            }
            .website-glass-btn:hover {
                background: rgba(252, 176, 69, 0.2); border-color: rgba(252, 176, 69, 0.5); box-shadow: 0 0 10px rgba(252, 176, 69, 0.3);
            }

            .solana-action-banner {
                position: relative;
                border-radius: 16px;
                padding: 12px 15px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, rgba(22, 25, 34, 0.95), rgba(13, 14, 18, 0.98));
                border: 1px solid rgba(153, 69, 255, 0.2);
                border-${isAr ? 'right' : 'left'}: 4px solid #14F195;
                box-shadow: 0 5px 18px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(153, 69, 255, 0.08);
                flex-shrink: 0;
                overflow: hidden;
            }

            .solana-action-banner::after {
                content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(20, 241, 149, 0.15), transparent);
                animation: shimmerEffect 4s infinite;
            }

            .solana-badge-icon {
                width: 38px;
                height: 38px;
                border-radius: 12px;
                background: rgba(153, 69, 255, 0.12);
                border: 1px solid rgba(153, 69, 255, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 10px rgba(153, 69, 255, 0.2);
            }

            .action-banner {
                position: relative;
                border-radius: 16px;
                padding: 12px 15px;
                margin-bottom: 10px;
                display: flex; align-items: center; gap: 12px;
                cursor: pointer; overflow: hidden; transition: transform 0.3s, box-shadow 0.3s;
                border: 1px solid rgba(255,255,255,0.05);
                flex-shrink: 0;
            }
            
            .action-banner::after {
                content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
                animation: shimmerEffect 4s infinite;
            }
            .action-banner:active { transform: scale(0.97); }

            .banner-challenges { background: linear-gradient(135deg, rgba(28, 28, 34, 0.9), rgba(15, 23, 42, 0.95)); border-${isAr ? 'right' : 'left'}: 4px solid #3b82f6; box-shadow: 0 5px 20px rgba(0,0,0,0.5), inset 0 0 15px rgba(59, 130, 246, 0.1); }
            .banner-ranking { background: linear-gradient(135deg, rgba(28, 28, 34, 0.9), rgba(67, 20, 7, 0.95)); border-${isAr ? 'right' : 'left'}: 4px solid #fd1d1d; box-shadow: 0 5px 20px rgba(0,0,0,0.5), inset 0 0 15px rgba(253, 29, 29, 0.1); }

            .banner-icon-wrapper {
                width: 42px; height: 42px;
                border-radius: 12px; display: flex; align-items: center; justify-content: center;
                font-size: 1.5rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05);
                box-shadow: inset 0 2px 10px rgba(255,255,255,0.1);
            }

            .clubs-section { flex-grow: 1; overflow-y: auto; margin-top: 5px; }
            .clubs-section::-webkit-scrollbar { display: none; }
            
            .glass-club-card {
                background: rgba(26, 26, 34, 0.6); backdrop-filter: blur(12px);
                border: 1px solid rgba(255,255,255,0.03); border-radius: 14px;
                padding: 10px 12px;
                display: flex; align-items: center; justify-content: space-between;
                margin-bottom: 8px;
                transition: transform 0.3s, background 0.3s;
                border-${isAr ? 'left' : 'right'}: 3px solid rgba(252, 176, 69, 0.5);
            }
            .glass-club-card:hover { transform: translateX(${isAr ? '3px' : '-3px'}); background: rgba(36, 36, 44, 0.8); border-color: var(--accent-gold); }

            .club-points-badge {
                background: linear-gradient(90deg, rgba(252, 176, 69, 0.1), rgba(253, 29, 29, 0.1));
                color: var(--accent-gold); padding: 4px 10px; border-radius: 10px;
                font-weight: 900; font-size: 0.85rem; border: 1px solid rgba(252, 176, 69, 0.2);
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
            }
        </style>

        <div class="home-fixed-container">
            <div class="royal-profile-card">
                <div class="royal-avatar-wrapper"><div class="royal-avatar-inner"><img src="${avatarSrc}" alt="Avatar"></div></div>
                <button class="website-glass-btn" onclick="window.openOfficialWebsite()"><span style="font-size: 0.9rem;">🌍</span> ${websiteBtnText}</button>
                <h2 style="margin: 20px 0 5px 0; color: #fff; font-size: 1.3rem; font-weight: 900; letter-spacing: 0.5px; text-shadow: 0 4px 8px rgba(0,0,0,0.8);">${userState.username}</h2>
                <div style="display: inline-block; background: rgba(0,0,0,0.4); padding: 3px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: #888; font-size: 0.75rem; font-weight: bold;">ID:</span> 
                    <span style="color: #ccc; font-size: 0.8rem; font-family: monospace;">${userState.userId}</span>
                </div>
            </div>

            <div class="solana-action-banner">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="solana-badge-icon">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width: 20px; height: 20px;" alt="Solana">
                    </div>
                    <div style="text-align: ${isAr ? 'right' : 'left'};">
                        <div style="color: #fff; font-weight: 800; font-size: 0.9rem; letter-spacing: 0.3px;">${solTitle}</div>
                        <div style="color: #94a3b8; font-size: 0.72rem; font-weight: 600; margin-top: 1px;">${solSub}</div>
                    </div>
                </div>
                <div style="text-align: ${isAr ? 'left' : 'right'};">
                    <span style="color: #c084fc; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; display: block;">🔮 Pyth Oracle</span>
                    <div id="home-sol-price" style="color: #14F195; font-family: monospace; font-weight: 800; font-size: 0.95rem; margin-top: 2px;">$118.12</div>
                </div>
            </div>
          
            <div id="challenges-card" class="action-banner banner-challenges" onclick="if(typeof window.openChallengesScreen === 'function') { window.openChallengesScreen(); } else { alert('${loadingAlert}'); }">
                <div class="banner-icon-wrapper" style="text-shadow: 0 0 10px rgba(59, 130, 246, 0.6);">${primaryClub ? primaryClub.countryFlag : '⚽'}</div>
                <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                    <h3 style="color: #fff; margin: 0 0 2px 0; font-size: 1.05rem; font-weight: 900;">${titleWeeklyChallenges}</h3>
                    <p style="color: #94a3b8; font-size: 0.75rem; margin: 0; font-weight: bold;">🇪🇺 ${textEuropeCups} <span style="color:#555;">•</span> 🇪🇸 ${textSpainCups}</p>
                </div>
                <div style="color: #3b82f6; font-size: 1.2rem; opacity: 0.8;">${isAr ? '👈' : '👉'}</div>
            </div>

            <div id="ranking-card" class="action-banner banner-ranking" onclick="if(typeof window.openLegendaryRankingScreen === 'function') { window.openLegendaryRankingScreen(); } else { alert('${loadingAlert}'); }">
                <div class="banner-icon-wrapper" style="text-shadow: 0 0 10px rgba(253, 29, 29, 0.6);">🔥</div>
                <div style="flex-grow: 1; text-align: ${isAr ? 'right' : 'left'};">
                    <h3 style="color: #fff; margin: 0 0 2px 0; font-size: 1.05rem; font-weight: 900;">${titleRanking}</h3>
                    <p style="color: #fca5a5; font-size: 0.75rem; margin: 0; font-weight: bold;">⭐ ${textRankingDesc}</p>
                </div>
                <div style="color: #fd1d1d; font-size: 1.2rem; opacity: 0.8;">${isAr ? '👈' : '👉'}</div>
            </div>

            <div class="clubs-section">
                <div style="display:flex; align-items:center; gap:6px; margin-bottom: 8px;">
                    <span style="font-size: 1.1rem;">🛡️</span>
                    <h4 style="color: #fff; margin: 0; font-size: 0.95rem; font-weight: 800;">${supportedClubsTitle}</h4>
                </div>
                ${clubsCardsHtml}
            </div>
        </div>
    `;

    setTimeout(() => {
        if (typeof window.updateHomeSolPrice === 'function') {
            window.updateHomeSolPrice();
        }
    }, 100);
};
        
