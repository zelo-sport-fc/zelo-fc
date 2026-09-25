// ==========================================
// 📱 login.js - Glassmorphism VIP Edition (Solana Rewards Integrated) 🚀
// ==========================================

window.tempSelectedClubs = window.tempSelectedClubs || [];

// ====================== Injectable CSS Styles ======================
function getInjectableStyles() {
    return `
        <style>
            .animate-screen {
                animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes slideUpFade {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }

            .smooth-scroll {
                overflow-y: auto;
                scroll-behavior: smooth;
                padding-right: 5px;
            }
            .smooth-scroll::-webkit-scrollbar { width: 4px; }
            .smooth-scroll::-webkit-scrollbar-track { background: transparent; }
            .smooth-scroll::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 10px;
            }

            .glass-card-elegant {
                background: rgba(20, 20, 28, 0.65);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 18px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
            }
            .interactive-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6);
                border-color: rgba(0, 255, 135, 0.3);
            }
            .interactive-card:active {
                transform: scale(0.97);
                background: rgba(30, 30, 42, 0.8);
            }

            .solana-badge-card {
                background: linear-gradient(135deg, rgba(153, 69, 255, 0.15), rgba(20, 241, 149, 0.12));
                border: 1px solid rgba(20, 241, 149, 0.3);
                border-radius: 16px;
                padding: 10px 14px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(153, 69, 255, 0.15);
            }

            .btn-pulse {
                animation: pulseGlowBtn 2s infinite;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s;
                background: linear-gradient(135deg, #2AABEE, #00FF87);
            }
            .btn-pulse:active {
                transform: translateX(-50%) scale(0.95) !important;
                background: linear-gradient(135deg, #00FF87, #059669);
            }
            @keyframes pulseGlowBtn {
                0% { box-shadow: 0 0 0 0 rgba(0, 255, 135, 0.6); }
                70% { box-shadow: 0 0 0 15px rgba(0, 255, 135, 0); }
                100% { box-shadow: 0 0 0 0 rgba(0, 255, 135, 0); }
            }

            .club-selected {
                background: linear-gradient(135deg, rgba(0, 255, 135, 0.15), rgba(0, 255, 135, 0.05)) !important;
                border: 2px solid #00FF87 !important;
                box-shadow: inset 0 0 15px rgba(0, 255, 135, 0.1);
            }
            
            .lang-btn {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 10px 24px; border-radius: 30px; cursor: pointer;
                color: white; font-weight: bold; font-size: 0.88rem;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            .lang-btn-active {
                background: linear-gradient(135deg, #2AABEE, #00FF87);
                border-color: transparent;
                box-shadow: 0 4px 15px rgba(0, 255, 135, 0.3);
                color: #000;
            }
        </style>
    `;
}

// ====================== Get Default Language ======================
function getDefaultLanguage() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        return window.Telegram.WebApp.initDataUnsafe.user.language_code.startsWith('ar') ? 'ar' : 'en';
    }
    return 'en';
}

// ====================== Language Selector UI ======================
function getLanguageSelector() {
    const isAr = userState.lang === 'ar';
    return `
        <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
            <div class="lang-btn ${isAr ? 'lang-btn-active' : ''}" onclick="setLanguage('ar')">
                🇸🇦 العربية
            </div>
            <div class="lang-btn ${!isAr ? 'lang-btn-active' : ''}" onclick="setLanguage('en')">
                🇬🇧 English
            </div>
        </div>
    `;
}

// ====================== Set Language ======================
window.setLanguage = async function(lang) {
    userState.lang = lang;

    if (typeof applyLanguageSettings === 'function') {
        applyLanguageSettings();
    }

    if (typeof supabaseClient !== 'undefined' && userState.userId) {
        try {
            await supabaseClient.from('users').upsert({
                telegram_id: userState.userId,
                lang: lang
            }, { onConflict: 'telegram_id' });
        } catch (e) {}
    }

    renderLoginScreen();
};

// ====================== Confirm Floating Button ======================
function getFloatingButton() {
    if (window.tempSelectedClubs.length === 0) return '';
    const tFunc = typeof t === 'function' ? t : (k) => k;
    const btnLabel = tFunc('confirmAndContinue') || 'Confirm & Continue';

    return `
        <div id="confirm-btn" class="btn-pulse" onclick="confirmLogin()" 
             style="position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); 
                    color: #000; padding: 15px 30px; border-radius: 40px; font-weight: 900; font-size: 1.05rem; 
                    cursor: pointer; z-index: 9999; width: 85%; max-width: 380px; text-align: center; border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px);">
            ${btnLabel} (${window.tempSelectedClubs.length}/2) ✅
        </div>
    `;
}

// ====================== Main Login Screen ======================
window.renderLoginScreen = function() {
    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    if (topBar) topBar.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';

    if (!userState.lang) userState.lang = getDefaultLanguage();

    const mainContent = document.getElementById("main-content");
    const isAr = userState.lang === 'ar';
    const tFunc = typeof t === 'function' ? t : (k) => k;

    let countriesHtml = "";

    for (const countryKey in allWorldCupCountriesClubs) {
        const clubsInCountry = allWorldCupCountriesClubs[countryKey];
        if (!clubsInCountry || clubsInCountry.length === 0) continue;

        const flag = clubsInCountry[0].countryFlag;
        let countryName = countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
        if (typeof getCountryName === 'function') {
            countryName = getCountryName(flag) || countryName;
        }

        const selectedInThisCountry = clubsInCountry.filter(c => window.tempSelectedClubs.includes(String(c.id))).length;
        const selectionBadge = selectedInThisCountry > 0 
            ? `<span style="background: rgba(0, 255, 135, 0.2); padding: 3px 8px; border-radius: 10px; font-size: 0.75rem; color: #00FF87; border: 1px solid rgba(0, 255, 135, 0.4); font-weight: bold;">✓ ${selectedInThisCountry}</span>`
            : '';

        countriesHtml += `
            <div class="glass-card-elegant interactive-card" onclick="showClubsForCountry('${countryKey}')" 
                 style="padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${flag}</span>
                    <h4 style="margin: 0; color: #fff; font-size: 1rem; font-weight: 800;">${countryName}</h4>
                    ${selectionBadge}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; color: #00FF87; border: 1px solid rgba(255,255,255,0.1);">
                        ${clubsInCountry.length} ⚽
                    </span>
                    <span style="color: #666; font-size: 1rem;">${isAr ? '👈' : '👉'}</span>
                </div>
            </div>
        `;
    }

    const titleText = tFunc('chooseYourClubs') || 'Choose Your Clubs';
    const subTitleText = tFunc('clubSelectionLimit') || '1 Local + 1 Global Club (Max 2)';
    const solanaTitle = tFunc('solanaRewardsTitle') || 'SOL & Crypto Rewards';
    const solanaDesc = tFunc('solanaRewardsSub') || 'Compete & support to earn $SOL';

    mainContent.innerHTML = `
        ${getInjectableStyles()}
        <div class="animate-screen" style="padding: 20px 12px; text-align: center; max-width: 500px; margin: 0 auto; padding-bottom: 110px; position: relative;">
            
            ${getLanguageSelector()}

            <!-- ⚡ Solana Rewards Badge Card ⚡ -->
            <div class="solana-badge-card">
                <div style="display: flex; align-items: center; gap: 10px; text-align: ${isAr ? 'right' : 'left'};">
                    <span style="font-size: 1.5rem;">⚡</span>
                    <div>
                        <div style="color: #14F195; font-size: 0.8rem; font-weight: 900; letter-spacing: 0.5px;">${solanaTitle}</div>
                        <div style="color: #94a3b8; font-size: 0.72rem; font-weight: bold;">${solanaDesc}</div>
                    </div>
                </div>
                <span style="background: rgba(153, 69, 255, 0.2); color: #c084fc; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(153, 69, 255, 0.4);">
                    SOLANA
                </span>
            </div>

            <div style="margin-top: 10px; margin-bottom: 20px;">
                <h2 style="background: linear-gradient(135deg, #2AABEE, #00FF87); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 6px 0; font-size: 1.4rem; font-weight: 900;">
                    ${titleText}
                </h2>
                <p style="color: #94a3b8; font-size: 0.85rem; margin: 0; font-weight: bold;">
                    ${subTitleText}
                </p>
            </div>

            <div class="smooth-scroll" style="display: flex; flex-direction: column; height: 52vh; text-align: ${isAr ? 'right' : 'left'};">
                ${countriesHtml}
            </div>
        </div>
        ${getFloatingButton()}
    `;
};

// ====================== Show Clubs For Selected Country ======================
window.showClubsForCountry = function(countryKey) {
    const clubs = allWorldCupCountriesClubs[countryKey];
    if (!clubs) return;

    const mainContent = document.getElementById("main-content");
    const isAr = userState.lang === 'ar';
    const tFunc = typeof t === 'function' ? t : (k) => k;

    let clubsHtml = clubs.map(club => {
        const stringClubId = String(club.id);
        const isSelected = window.tempSelectedClubs.some(id => String(id) === stringClubId);
        const selectedClass = isSelected ? 'club-selected' : '';

        let clubName = club.name;
        if (typeof getClubName === 'function') {
            clubName = getClubName(club);
        }

        return `
            <div class="glass-card-elegant interactive-card ${selectedClass}" onclick="toggleClubSelection('${stringClubId}', '${countryKey}')" 
                 style="padding: 12px 16px; border-radius: 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="background: rgba(0,0,0,0.3); padding: 6px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                        <img src="${club.logo}" onerror="this.style.display='none'" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                    </div>
                    <span style="color: #fff; font-size: 0.95rem; font-weight: 800;">${clubName}</span>
                </div>
                <div style="font-size: 1.2rem;">
                    ${isSelected ? '<span style="filter: drop-shadow(0 0 6px rgba(0, 255, 135, 0.8));">✅</span>' : '<span style="opacity: 0.2;">⭕</span>'}
                </div>
            </div>
        `;
    }).join('');

    const flag = clubs[0].countryFlag;
    let countryName = countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
    if (typeof getCountryName === 'function') {
        countryName = getCountryName(flag) || countryName;
    }

    const backText = tFunc('btnBack') || 'Back to list';
    const tapHint = tFunc('tapClubHint') || 'Tap a club to select it';

    mainContent.innerHTML = `
        ${getInjectableStyles()}
        <div class="animate-screen" style="padding: 20px 12px; max-width: 500px; margin: 0 auto; padding-bottom: 110px;">
            <div onclick="renderLoginScreen()" 
                 style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); color: #fff; padding: 8px 16px; border-radius: 20px; cursor: pointer; margin-bottom: 18px; font-weight: bold; font-size: 0.82rem; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
                <span>🔙</span> ${backText}
            </div>
            
            <div style="text-align: center; margin-bottom: 18px; background: rgba(20, 20, 28, 0.65); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);">
                <span style="font-size: 2.5rem; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));">${flag}</span>
                <h3 style="color: #fff; margin: 6px 0 0 0; font-weight: 900; font-size: 1.3rem;">${countryName}</h3>
                <p style="color: #00FF87; font-size: 0.78rem; margin: 4px 0 0 0; font-weight: bold;">${tapHint}</p>
            </div>
            
            <div class="smooth-scroll" style="display: flex; flex-direction: column; height: 50vh; text-align: ${isAr ? 'right' : 'left'};">
                ${clubsHtml}
            </div>
        </div>
        ${getFloatingButton()}
    `;
};

// ====================== Toggle Club Selection ======================
window.toggleClubSelection = function(clubId, countryKey) {
    const stringClubId = String(clubId);
    const index = window.tempSelectedClubs.findIndex(id => String(id) === stringClubId);
    const tFunc = typeof t === 'function' ? t : (k) => k;
    
    if (index > -1) {
        window.tempSelectedClubs.splice(index, 1);
    } else {
        if (window.tempSelectedClubs.length < 2) {
            window.tempSelectedClubs.push(stringClubId);
        } else {
            const limitMsg = tFunc('maxClubsAlert') || 'You can select a maximum of 2 clubs (Local & Global) ⚠️';
            alert(limitMsg);
            return; 
        }
    }
    
    showClubsForCountry(countryKey);
};

// ====================== Confirm Login Function ======================
window.confirmLogin = async function() {
    const tFunc = typeof t === 'function' ? t : (k) => k;

    if (window.tempSelectedClubs.length === 0) {
        const selectAlert = tFunc('selectAtLeastOne') || 'Please select at least one club to continue.';
        alert(selectAlert);
        return;
    }

    userState.selectedClubs = [...window.tempSelectedClubs];
    
    const btn = document.getElementById('confirm-btn');
    if (btn) btn.innerHTML = '⏳...';

    if (typeof supabaseClient !== 'undefined' && userState.userId) {
        try {
            const { error: userErr } = await supabaseClient.from('users').upsert({
                telegram_id: userState.userId,
                username: userState.username,
                selected_clubs: userState.selectedClubs,
                lang: userState.lang
            }, { onConflict: 'telegram_id' });

            if (userErr) {
                alert("❌ Database Error (users):\n" + userErr.message);
                throw userErr;
            }

            let startingPoints = 0; 
            const { data: userData } = await supabaseClient
                .from('users')
                .select('points')
                .eq('telegram_id', userState.userId)
                .maybeSingle();
            
            if (userData && userData.points) {
                startingPoints = userData.points;
            }

            const rankingsData = userState.selectedClubs.map(clubId => ({
                telegram_id: userState.userId,
                club_id: String(clubId),
                total_fan_points: startingPoints,
                points_activity: 0,
                referrals_count: 0
            }));

            const { error: rankErr } = await supabaseClient
                .from('club_fans_rankings')
                .upsert(rankingsData, { onConflict: 'telegram_id,club_id' });
            
            if (rankErr) {
                alert("❌ Database Error (rankings):\n" + rankErr.message);
                throw rankErr;
            }

            // Referral processing
            if (userState.pendingReferrer && typeof window.apiProcessReferral === "function") {
                window.apiProcessReferral(userState.pendingReferrer, userState.userId);
                userState.pendingReferrer = null; 
            }

        } catch (error) {
            console.error("⚠️ Login process stopped due to error:", error);
            if (btn) btn.innerHTML = tFunc('retry') || 'Retry 🔄';
            return; 
        }
    }

    userState.hasLoggedIn = true;

    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    if (topBar) topBar.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = 'flex';

    if (typeof updateTopBar === 'function') {
        updateTopBar();
    }

    if (typeof showPage === 'function') {
        showPage('home');
    }
};
            
