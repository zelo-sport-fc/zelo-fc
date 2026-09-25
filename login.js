// ==========================================
// 📱 login.js - Fixed Viewport, Dynamic Translation & Complete Initialization
// ==========================================

window.tempSelectedClubs = window.tempSelectedClubs || [];

// ====================== Injectable CSS Styles ======================
function getInjectableStyles() {
    return `
        <style>
            /* Lock body and html scroll */
            html, body {
                overflow: hidden !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                touch-action: none;
            }

            /* Lock main viewport to prevent page-level scroll */
            .login-screen-wrapper {
                height: 100vh;
                height: 100dvh;
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                overflow: hidden;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                box-sizing: border-box;
                padding: 15px 12px 20px 12px;
                background: #0d0e12;
                z-index: 9999;
            }

            .animate-screen {
                animation: slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes slideUpFade {
                0% { opacity: 0; transform: translateY(15px); }
                100% { opacity: 1; transform: translateY(0); }
            }

            /* Dedicated Inner Scroll Container ONLY */
            .inner-scroll-area {
                flex: 1;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
                overscroll-behavior: contain;
                padding-right: 4px;
                margin-top: 10px;
                margin-bottom: 10px;
            }
            .inner-scroll-area::-webkit-scrollbar { width: 4px; }
            .inner-scroll-area::-webkit-scrollbar-track { background: transparent; }
            .inner-scroll-area::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 10px;
            }

            .glass-card-elegant {
                background: rgba(20, 20, 28, 0.65);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                transition: transform 0.2s ease, border-color 0.2s ease;
            }
            .interactive-card:active {
                transform: scale(0.98);
                background: rgba(30, 30, 42, 0.8);
            }

            /* ⚡ ZELOFC Token Solana Badge Card ⚡ */
            .solana-badge-card {
                background: linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(20, 241, 149, 0.15));
                border: 1px solid rgba(20, 241, 149, 0.35);
                border-radius: 16px;
                padding: 10px 14px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                backdrop-filter: blur(12px);
                box-shadow: 0 4px 15px rgba(153, 69, 255, 0.2);
            }

            .token-pill {
                background: linear-gradient(135deg, #9945FF, #14F195);
                color: #000;
                font-size: 0.72rem;
                font-weight: 900;
                padding: 4px 10px;
                border-radius: 8px;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(20, 241, 149, 0.3);
            }

            .btn-pulse {
                animation: pulseGlowBtn 2s infinite;
                background: linear-gradient(135deg, #2AABEE, #00FF87);
                color: #000;
                font-weight: 900;
                border-radius: 35px;
                padding: 14px 20px;
                text-align: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 255, 135, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .btn-pulse:active {
                transform: scale(0.97);
            }
            @keyframes pulseGlowBtn {
                0% { box-shadow: 0 0 0 0 rgba(0, 255, 135, 0.5); }
                70% { box-shadow: 0 0 0 12px rgba(0, 255, 135, 0); }
                100% { box-shadow: 0 0 0 0 rgba(0, 255, 135, 0); }
            }

            .club-selected {
                background: linear-gradient(135deg, rgba(0, 255, 135, 0.15), rgba(0, 255, 135, 0.05)) !important;
                border: 2px solid #00FF87 !important;
            }

            .lang-btn {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 8px 20px; border-radius: 25px; cursor: pointer;
                color: white; font-weight: bold; font-size: 0.85rem;
                backdrop-filter: blur(10px);
            }
            .lang-btn-active {
                background: linear-gradient(135deg, #2AABEE, #00FF87);
                border-color: transparent;
                color: #000;
            }

            /* Professional Back Button */
            .btn-back-vip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.08);
                color: #00FF87;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 800;
                font-size: 0.82rem;
                border: 1px solid rgba(0, 255, 135, 0.25);
                backdrop-filter: blur(10px);
                transition: all 0.2s ease;
            }
            .btn-back-vip:active {
                transform: scale(0.95);
                background: rgba(0, 255, 135, 0.15);
            }
        </style>
    `;
}

// Helper to Safely Get Translation with Dynamic Language Check
function safeT(key, fallbackAr, fallbackEn) {
    const isAr = window.userState?.lang === 'ar';
    if (typeof t === 'function') {
        const translated = t(key);
        if (translated && translated !== key) return translated;
    }
    return isAr ? fallbackAr : fallbackEn;
}

// ====================== Get Default Language ======================
function getDefaultLanguage() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
        return window.Telegram.WebApp.initDataUnsafe.user.language_code.startsWith('ar') ? 'ar' : 'en';
    }
    return 'ar';
}

// ====================== Language Selector UI ======================
function getLanguageSelector() {
    const isAr = window.userState?.lang === 'ar';
    return `
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
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
    if (window.userState) window.userState.lang = lang;

    if (typeof applyLanguageSettings === 'function') {
        applyLanguageSettings();
    }

    if (typeof supabaseClient !== 'undefined' && window.userState?.userId) {
        try {
            await supabaseClient.from('users').upsert({
                telegram_id: window.userState.userId,
                lang: lang
            }, { onConflict: 'telegram_id' });
        } catch (e) {}
    }

    renderLoginScreen();
};

// ====================== Confirm Floating Button ======================
function getFloatingButton() {
    if (window.tempSelectedClubs.length === 0) return '';
    const btnLabel = safeT('confirmAndContinue', 'تأكيد والمتابعة', 'Confirm & Continue');

    return `
        <div style="padding-top: 5px; width: 100%;">
            <div id="confirm-btn" class="btn-pulse" onclick="confirmLogin()">
                ✅ ${btnLabel} (${window.tempSelectedClubs.length}/2)
            </div>
        </div>
    `;
}

// ====================== Main Login Screen (Countries List) ======================
window.renderLoginScreen = function() {
    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    if (topBar) topBar.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';

    if (window.userState && !window.userState.lang) {
        window.userState.lang = getDefaultLanguage();
    }

    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    const isAr = window.userState?.lang === 'ar';
    let countriesHtml = "";

    if (typeof allWorldCupCountriesClubs !== 'undefined') {
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
                     style="padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.6rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${flag}</span>
                        <h4 style="margin: 0; color: #fff; font-size: 0.95rem; font-weight: 800;">${countryName}</h4>
                        ${selectionBadge}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 12px; font-size: 0.78rem; font-weight: bold; color: #00FF87; border: 1px solid rgba(255,255,255,0.1);">
                            ${clubsInCountry.length} ⚽
                        </span>
                        <span style="color: #666; font-size: 0.9rem;">${isAr ? '👈' : '👉'}</span>
                    </div>
                </div>
            `;
        }
    }

    const titleText = safeT('chooseYourClubs', 'اختر أنديتك', 'Choose Your Clubs');
    const subTitleText = safeT('clubSelectionLimit', 'نادي محلي + نادي عالمي (الحد الأقصى 2)', '1 Local + 1 Global Club (Max 2)');
    
    const zelofcTitle = safeT('zelofcRewardsTitle', 'اربح عملة ZELOFC$ و SOL', 'Earn $ZELOFC & SOL');
    const zelofcSub = safeT('zelofcRewardsSub', 'تنافس ودعم ناديك لتكسب جوائز بـ ZELOFC$', 'Compete & win official$ZELOFC token rewards');

    mainContent.innerHTML = `
        ${getInjectableStyles()}
        <div class="login-screen-wrapper animate-screen">
            
            <!-- Fixed Header Section -->
            <div>
                ${getLanguageSelector()}

                <!-- ⚡ ZELOFC Token & Solana Banner ⚡ -->
                <div class="solana-badge-card">
                    <div style="display: flex; align-items: center; gap: 10px; text-align: ${isAr ? 'right' : 'left'};">
                        <span style="font-size: 1.5rem; filter: drop-shadow(0 0 5px rgba(20, 241, 149, 0.6));">🪙</span>
                        <div>
                            <div style="color: #14F195; font-size: 0.82rem; font-weight: 900;">${zelofcTitle}</div>
                            <div style="color: #94a3b8; font-size: 0.7rem; font-weight: bold;">${zelofcSub}</div>
                        </div>
                    </div>
                    <span class="token-pill">$ZELOFC</span>
                </div>

                <div style="text-align: center; margin-bottom: 6px;">
                    <h2 style="background: linear-gradient(135deg, #2AABEE, #00FF87); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 4px 0; font-size: 1.3rem; font-weight: 900;">
                        ${titleText}
                    </h2>
                    <p style="color: #94a3b8; font-size: 0.8rem; margin: 0; font-weight: bold;">
                        ${subTitleText}
                    </p>
                </div>
            </div>

            <!-- Only Inner Area Scrolls -->
            <div class="inner-scroll-area" style="text-align: ${isAr ? 'right' : 'left'};">
                ${countriesHtml}
            </div>

            <!-- Fixed Footer Section -->
            ${getFloatingButton()}
        </div>
    `;
};

// ====================== Show Clubs For Selected Country ======================
window.showClubsForCountry = function(countryKey) {
    if (typeof allWorldCupCountriesClubs === 'undefined' || !allWorldCupCountriesClubs[countryKey]) return;
    const clubs = allWorldCupCountriesClubs[countryKey];

    const mainContent = document.getElementById("main-content");
    const isAr = window.userState?.lang === 'ar';

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
                 style="padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <img src="${club.logo}" onerror="this.style.display='none'" style="width: 32px; height: 32px; object-fit: contain;">
                    </div>
                    <span style="color: #fff; font-size: 0.9rem; font-weight: 800;">${clubName}</span>
                </div>
                <div style="font-size: 1.1rem;">
                    ${isSelected ? '✅' : '<span style="opacity: 0.2;">⭕</span>'}
                </div>
            </div>
        `;
    }).join('');

    const flag = clubs[0].countryFlag;
    let countryName = countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
    if (typeof getCountryName === 'function') {
        countryName = getCountryName(flag) || countryName;
    }

    const backText = safeT('btnBack', 'العودة للدول', 'Back to countries');
    const tapHint = safeT('tapClubHint', 'اضغط على النادي للاختيار', 'Tap a club to select it');

    mainContent.innerHTML = `
        ${getInjectableStyles()}
        <div class="login-screen-wrapper animate-screen">
            
            <!-- Fixed Header Section -->
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div class="btn-back-vip" onclick="renderLoginScreen()">
                        <span>🔙</span> <span>${backText}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 10px; background: rgba(20, 20, 28, 0.65); padding: 10px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.05);">
                    <span style="font-size: 2.2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">${flag}</span>
                    <h3 style="color: #fff; margin: 4px 0 0 0; font-weight: 900; font-size: 1.1rem;">${countryName}</h3>
                    <p style="color: #00FF87; font-size: 0.75rem; margin: 2px 0 0 0; font-weight: bold;">${tapHint}</p>
                </div>
            </div>

            <!-- Only Inner Area Scrolls -->
            <div class="inner-scroll-area" style="text-align: ${isAr ? 'right' : 'left'};">
                ${clubsHtml}
            </div>

            <!-- Fixed Footer Section -->
            ${getFloatingButton()}
        </div>
    `;
};

// ====================== Toggle Club Selection ======================
window.toggleClubSelection = function(clubId, countryKey) {
    const stringClubId = String(clubId);
    const index = window.tempSelectedClubs.findIndex(id => String(id) === stringClubId);
    
    if (index > -1) {
        window.tempSelectedClubs.splice(index, 1);
    } else {
        if (window.tempSelectedClubs.length < 2) {
            window.tempSelectedClubs.push(stringClubId);
        } else {
            const limitMsg = safeT('maxClubsAlert', 'يمكنك اختيار ناديين فقط كحد أقصى (محلي وعالمي) ⚠️', 'You can select a maximum of 2 clubs (Local & Global) ⚠️');
            alert(limitMsg);
            return; 
        }
    }
    
    showClubsForCountry(countryKey);
};

// ====================== Confirm Login Function ======================
window.confirmLogin = async function() {
    if (window.tempSelectedClubs.length === 0) {
        const selectAlert = safeT('selectAtLeastOne', 'الرجاء اختيار نادي واحد على الأقل للمتابعة.', 'Please select at least one club to continue.');
        alert(selectAlert);
        return;
    }

    if (window.userState) {
        window.userState.selectedClubs = [...window.tempSelectedClubs];
    }
    
    const btn = document.getElementById('confirm-btn');
    if (btn) btn.innerHTML = '⏳...';

    if (typeof supabaseClient !== 'undefined' && window.userState?.userId) {
        try {
            const { error: userErr } = await supabaseClient.from('users').upsert({
                telegram_id: window.userState.userId,
                username: window.userState.username || '',
                selected_clubs: window.userState.selectedClubs,
                lang: window.userState.lang || 'ar'
            }, { onConflict: 'telegram_id' });

            if (userErr) {
                alert("❌ Database Error (users):\n" + userErr.message);
                throw userErr;
            }

            let startingPoints = 0; 
            const { data: userData } = await supabaseClient
                .from('users')
                .select('points')
                .eq('telegram_id', window.userState.userId)
                .maybeSingle();
            
            if (userData && userData.points) {
                startingPoints = userData.points;
            }

            const rankingsData = window.userState.selectedClubs.map(clubId => ({
                telegram_id: window.userState.userId,
                club_id: String(clubId),
                total_fan_points: startingPoints,
                points_activity: 0,
     
