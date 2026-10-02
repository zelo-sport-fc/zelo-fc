// ==========================================
// ⚽ ZELO FC - Core Application (app.js)
// ==========================================

// 🌐 ضبط إعدادات شبكة Solana Devnet للمسابقة
window.IS_DEVNET = true;
window.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

const supabaseUrl = 'https://ttyfcwtlasvphkariqhw.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eWZjd3RsYXN2cGhrYXJpcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODk1MjYsImV4cCI6MjA5ODc2NTUyNn0.m3wFMEASM3K63nm3bsIlrEOXhRvMQhUZqvpXyFq7NEg'; 

// إنشاء عميل Supabase وتصديره عالمياً لجميع الملفات (مثل matchesTrade.js)
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' }
}) : null;

window.supabaseClient = supabaseClient; // 🔗 تعريض الكلاينت عالمياً

let userState = {
    username: "Player", 
    userParam: "", 
    userId: "",
    photoUrl: null,
    points: 0, 
    coins: 0,
    selectedClubs: [], 
    walletConnected: false,
    walletAddress: null,
    solanaWallet: "",
    walletBalance: "0.00",
    solanaNetwork: "devnet", // 🛠️ تفعيل شبكة Devnet
    hasLoggedIn: false,
    lang: "ar",
    referrals: [], 
    dailyCheckInClaimed: false,
    pendingReferrer: null, 
    tasks: typeof window.defaultTasksData !== "undefined" ? window.defaultTasksData.map(task => ({...task})) : [] 
};

let tonConnectUI = null;
const tg = window.Telegram?.WebApp;

// Safe Translation Helper
function safeT(key, fallback) {
    try {
        if (typeof window.t === 'function') {
            const res = window.t(key);
            if (res && res !== key) return res;
        }
    } catch (e) {
        console.warn("Translation function error:", e);
    }
    return fallback;
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.Telegram !== "undefined" && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const tgUser = tg.initDataUnsafe.user;
            userState.username = tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name} ${tgUser.last_name || ''}`.trim();
            userState.userId = String(tgUser.id);
            userState.userParam = tgUser.username || String(tgUser.id);
            
            if (tgUser.photo_url) {
                userState.photoUrl = tgUser.photo_url;
            }
            
            if (tgUser.language_code && tgUser.language_code.startsWith('en')) {
                userState.lang = 'en';
            }

            if (tg.initDataUnsafe.start_param && tg.initDataUnsafe.start_param.startsWith('ref_')) {
                const referrerId = tg.initDataUnsafe.start_param.replace('ref_', '');
                if (String(referrerId) !== String(userState.userId)) {
                    userState.pendingReferrer = referrerId;
                    console.log("🔗 Referral link used from referrer ID:", referrerId);
                }
            }

        } else {
            console.warn("⚠️ No real Telegram data found. Using dummy test data...");
            userState.username = "Local Tester";
            userState.userId = "123456789"; 
            userState.userParam = "123456789";
        }
    }

    if(typeof applyLanguageSettings === 'function') applyLanguageSettings();
    initTonConnect();
    fetchDataAndRoute();
});

function initTonConnect() {
    try {
        if (typeof TON_CONNECT_UI !== 'undefined' && !tonConnectUI) {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://zelo-fc.onrender.com/tonconnect-manifest.json',
                buttonRootId: null
            });

            tonConnectUI.onStatusChange(async (walletInfo) => {
                if (walletInfo) {
                    const rawAddress = walletInfo.account.address;
                    const userFriendlyAddress = TON_CONNECT_UI.toUserFriendlyAddress ? TON_CONNECT_UI.toUserFriendlyAddress(rawAddress) : rawAddress;

                    userState.walletConnected = true;
                    userState.walletAddress = userFriendlyAddress;
                    localStorage.setItem('ton_wallet', userFriendlyAddress);
                    
                    if (typeof window.saveWalletAddressToDB === "function") {
                        await window.saveWalletAddressToDB(userFriendlyAddress);
                    } else if (supabaseClient && userState.userId) {
                        const { error } = await supabaseClient.from('users')
                            .update({ wallet_address: userFriendlyAddress })
                            .eq('telegram_id', userState.userId);
                        if (error) console.error("❌ Wallet save error:", error);
                        else console.log("✅ Wallet saved successfully!");
                    }
                } else {
                    userState.walletConnected = false;
                    userState.walletAddress = null;
                    localStorage.removeItem('ton_wallet');

                    if (typeof window.removeWalletAddressFromDB === "function") {
                        await window.removeWalletAddressFromDB();
                    } else if (supabaseClient && userState.userId) {
                        await supabaseClient.from('users')
                            .update({ wallet_address: null })
                            .eq('telegram_id', userState.userId);
                    }
                }
                
                if (userState.hasLoggedIn && document.querySelector(".nav-item[onclick*='wallet']")?.classList.contains("active")) {
                    if(typeof renderWalletPage === "function") renderWalletPage(document.getElementById("main-content"));
                }
            });
        }
    } catch (error) {
        console.error("TON Connect Error: ", error);
    }
}

async function fetchDataAndRoute() {
    console.log("🔄 [1] Fetching data...");

    if (!supabaseClient) {
        console.warn("⚠️ [2] Supabase client is not initialized.");
        userState.hasLoggedIn = true;
        await updateTopBar();
        showPage('home');
        return;
    }

    try {
        console.log(`🔍 [3] Fetching user data (${userState.userId})...`);
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('telegram_id', userState.userId)
            .maybeSingle();

        if (error) {
            console.warn("⚠ Supabase read warning (using default state):", error);
        }

        if (data) {
            console.log("✅ [4] Existing user found.");
            userState.points = data.points || 0;
            userState.coins = data.points || 0;
            userState.selectedClubs = data.selected_clubs || [];
            
            userState.lang = data.lang || userState.lang;
            if(typeof applyLanguageSettings === 'function') applyLanguageSettings();

            userState.hasLoggedIn = true;
            
            if (data.wallet_address) {
                userState.walletAddress = data.wallet_address;
                userState.walletConnected = true;
            }

            if (userState.pendingReferrer && typeof window.apiProcessReferral === "function") {
                console.log("⚙️ Processing pending referral for:", userState.pendingReferrer);
                window.apiProcessReferral(userState.pendingReferrer, userState.userId);
                userState.pendingReferrer = null; 
            }

        } else {
            console.log("🆕 [4] New or offline user.");
            userState.hasLoggedIn = true;
            if (!userState.selectedClubs || userState.selectedClubs.length === 0) {
                userState.selectedClubs = ['m1'];
            }
        }
    } catch (error) {
        console.warn("⚠️ [Network Issues] Continuing with local fallback:", error);
        userState.hasLoggedIn = true;
    }

    console.log("🏠 [6] Routing to Home Screen...");
    await updateTopBar();
    showPage('home'); 
}

function triggerLoginScreen() {
    console.log("🚪 [Routing] Opening login screen...");
    
    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    if(topBar) topBar.style.display = 'none';
    if(bottomNav) bottomNav.style.display = 'none';

    if (typeof renderLoginScreen === 'function') {
        renderLoginScreen();
    } else {
        console.error("⛔ [Error] renderLoginScreen function missing!");
        const contentDiv = document.getElementById("main-content");
        if (contentDiv) {
            contentDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
                <h3>System Error</h3>
                <p>Login screen is missing. Please check login.js</p>
            </div>`;
        }
    }
}

async function updateTopBar() {
    const topBar = document.getElementById("top-bar");
    const bottomNav = document.getElementById("bottom-nav");
    if (topBar) topBar.style.display = "flex";
    if (bottomNav) bottomNav.style.display = "flex";

    const pointsEl = document.getElementById("points");
    const clubEl = document.getElementById("club");
    
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null && userState.userId) {
        try {
            const { data } = await supabaseClient
                .from('club_fans_rankings')
                .select('total_fan_points')
                .eq('telegram_id', userState.userId)
                .maybeSingle();
                
            if (data && data.total_fan_points !== undefined && data.total_fan_points !== null) {
                if (!userState.points) {
                    userState.points = data.total_fan_points;
                    userState.coins = data.total_fan_points;
                }
            }
        } catch(error) {
            console.error("❌ Error fetching points from ranking table:", error);
        }
    }
    
    if (pointsEl) {
        const displayPoints = Number(userState.points || 0);
        const localeLang = (userState.lang === 'ar') ? 'ar-EG' : 'en-US';
        pointsEl.innerText = `🪙 ${displayPoints.toLocaleString(localeLang)} ZELOFC`;
    }
    
    if (clubEl && userState.selectedClubs && userState.selectedClubs.length > 0) {
        let logos = userState.selectedClubs.map(id => {
            let foundClub = null;
            if (typeof allWorldCupCountriesClubs !== 'undefined') {
                for (const country in allWorldCupCountriesClubs) {
                    const club = allWorldCupCountriesClubs[country].find(c => String(c.id) === String(id));
                    if (club) {
                        foundClub = club;
                        break;
                    }
                }
            }
            return foundClub ? `<img src="${foundClub.logo}" style="height: 20px; vertical-align: middle; margin: 0 4px; object-fit: contain;">` : '';
        }).join('');
        
        const labelText = (userState.lang === 'ar') ? 'أنديتك:' : 'Clubs:';
        clubEl.innerHTML = `<span style="color:#aaa;">${labelText}</span> ${logos}`;
    }
}

function showPage(pageId) {
    if(!userState.hasLoggedIn) return; 
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const activeNav = Array.from(document.querySelectorAll(".nav-item")).find(el => el.getAttribute("onclick")?.includes(pageId));
    if (activeNav) activeNav.classList.add("active");

    const contentDiv = document.getElementById("main-content");
    if (!contentDiv) return;
    contentDiv.innerHTML = ""; 

    switch(pageId) {
        case 'home': 
            if(typeof renderHomePage === "function") renderHomePage(contentDiv); 
            break;
        case 'tasks': 
            if(typeof renderTasksPage === "function") renderTasksPage(contentDiv); 
            break;
        case 'friends':
            if(typeof renderFriendsPage === "function") renderFriendsPage(contentDiv);
            break;
        case 'leaderboard': 
            if(typeof renderLeaderboardPage === "function") renderLeaderboardPage(contentDiv); 
            break;
        case 'wallet': 
            if (typeof renderWalletPage === "function") {
                renderWalletPage(contentDiv);
            } else {
                console.warn("⚠️ renderWalletPage not found yet, retrying in 200ms...");
                contentDiv.innerHTML = `<div style="color:white; text-align:center; padding:30px;">Loading Wallet...</div>`;
                setTimeout(() => {
                    if (typeof renderWalletPage === "function") {
                        renderWalletPage(contentDiv);
                    } else {
                        contentDiv.innerHTML = `<div style="color:#ff4d4d; text-align:center; padding:30px;">Error: Wallet module failed to load. Please refresh.</div>`;
                    }
                }, 200);
            }
            break;
        case 'meteora':
            // 🚀 عرض سوق Meteora فوراً دون تعليق
            if (typeof window.renderMeteoraPage === "function") {
                window.renderMeteoraPage(contentDiv);
            } else {
                let attempts = 0;
                contentDiv.innerHTML = `
                    <div style="text-align: center; padding: 40px 15px;">
                        <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(252,176,69,0.2); border-radius: 50%; border-top-color: #fcb045; animation: spin 0.8s linear infinite;"></div>
                        <p style="color: #aaa; font-size: 0.85rem; margin-top: 15px;">جاري فتح سوق Meteora...</p>
                    </div>
                    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                `;

                const interval = setInterval(() => {
                    attempts++;
                    if (typeof window.renderMeteoraPage === "function") {
                        clearInterval(interval);
                        window.renderMeteoraPage(contentDiv);
                    } else if (attempts >= 10) { // توقف بعد 2 ثانية في حال غياب الملف
                        clearInterval(interval);
                        contentDiv.innerHTML = `
                            <div style="text-align: center; padding: 30px; color: #ff4d4d; direction: rtl;">
                                ⚠️ تعذر تحميل ملف Meteora (matchesTrade.js). يرجى التأكد من إضافة السكربت في ملف index.html.
                            </div>
                        `;
                    }
                }, 200);
            }
            break;
    }
}

if (typeof window.openChallengesScreen !== 'function') {
    window.openChallengesScreen = function() {
        console.log("⚽ [Fallback] Weekly challenges screen requested");
        const contentDiv = document.getElementById("main-content");
        if (contentDiv) {
            if (typeof renderChallengesScreen === "function") {
                renderChallengesScreen(contentDiv);
            } else {
                contentDiv.innerHTML = `
                    <div style="padding: 30px 20px; text-align: center; color: white;">
                        <h2 style="font-size: 2rem; margin-bottom: 15px;">⚽ ${userState.lang === 'ar' ? 'تحديات الأسبوع' : 'Weekly Challenges'}</h2>
                        <p style="color: #ccc; margin-bottom: 25px;">${userState.lang === 'ar' ? 'قريباً سيتم عرض التحديات هنا...' : 'Challenges coming soon...'}</p>
                        <button onclick="showPage('home')" class="btn-action" style="margin-top: 20px;">
                            ${userState.lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                        </button>
                    </div>
                `;
            }
        }
    };
                            }
        
