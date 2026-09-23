// ==========================================
// 🚀 تطبيق زيلو إف سي (ZELO FC) - الكود الأساسي (app.js)
// ==========================================

// 1. إعداد الاتصال بقاعدة بيانات Supabase الصحيحة (tty1cwtlaxyphkariqhw)
const supabaseUrl = 'https://tty1cwtlaxyphkariqhw.supabase.co'; 

// ⚠️ تأكد من وضع مفتاح (anon public key) الخاص بـ مشروع tty1cwtlaxyphkariqhw من صفحة (Project Settings -> API)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0eTFjd3RsYXh5cGhrYXJpcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODk1MjYsImV4cCI6MjA5ODc2NTUyNn0.m3wFMEASM3K63nm3bsIlrEOXhRvMQhUZqvpXyFq7NEg'; 

const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' }
}) : null;

// 2. إدارة بيانات المستخدم
let userState = {
    username: "Zelo Sport",
    userParam: "", 
    userId: "",
    photoUrl: null,
    points: 0, 
    selectedClubs: [], 
    walletConnected: false,
    walletAddress: null,
    walletBalance: "0.00",
    hasLoggedIn: false,
    lang: "ar", // اللغة الافتراضية
    referrals: [], 
    dailyCheckInClaimed: false,
    pendingReferrer: null, 
    tasks: typeof window.defaultTasksData !== "undefined" ? window.defaultTasksData.map(task => ({...task})) : [] 
};

let tonConnectUI = null;
const tg = window.Telegram?.WebApp;


// ==========================================
// 🚀 3. تهيئة التطبيق
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    if (typeof window.Telegram !== "undefined" && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const tgUser = tg.initDataUnsafe.user;
            userState.username = tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name} ${tgUser.last_name || ''}`.trim();
            userState.userId = tgUser.id;
            userState.userParam = tgUser.username || tgUser.id;
            
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
                    console.log("🔗 تم الدخول عبر رابط إحالة من الصديق:", referrerId);
                }
            }

        } else {
            console.warn("⚠️ لم يتم العثور على بيانات تليجرام حقيقية. استخدام بيانات وهمية للاختبار...");
            userState.username = "Local Tester";
            userState.userId = "123456789"; 
            userState.userParam = "123456789";
        }
    }

    if(typeof applyLanguageSettings === 'function') applyLanguageSettings();
    initTonConnect();
    fetchDataAndRoute();
});

// ==========================================
// 🔄 دالة تهيئة المحفظة
// ==========================================
function initTonConnect() {
    try {
        if (typeof TON_CONNECT_UI !== 'undefined') {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://zelo-sport-fc.github.io/zelo-fc/tonconnect-manifest.json',
                buttonRootId: null
            });

            tonConnectUI.onStatusChange(async (walletInfo) => {
                if (walletInfo) {
                    userState.walletConnected = true;
                    userState.walletAddress = walletInfo.account.address;
                    userState.walletBalance = "0.00"; 
                    
                    if (typeof window.saveWalletAddressToDB === "function") {
                        await window.saveWalletAddressToDB(walletInfo.account.address);
                    } else if (supabaseClient && userState.userId) {
                        const { error } = await supabaseClient.from('users')
                            .update({ wallet_address: walletInfo.account.address })
                            .eq('telegram_id', userState.userId);
                        if (error) console.error("❌ خطأ في حفظ المحفظة:", error);
                        else console.log("✅ تم حفظ المحفظة بنجاح!");
                    }
                } else {
                    userState.walletConnected = false;
                    userState.walletAddress = null;
                    userState.walletBalance = "0.00";

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

// 🔄 دالة جلب البيانات والتوجيه
async function fetchDataAndRoute() {
    console.log("🔄 [1] بدء جلب البيانات...");

    if (!supabaseClient) {
        console.warn("⚠️ [2] قاعدة بيانات Supabase غير مهيأة.");
        triggerLoginScreen();
        return;
    }

    try {
        console.log(`🔍 [3] جلب بيانات المستخدم (${userState.userId})...`);
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('telegram_id', userState.userId)
            .maybeSingle();

        if (error) {
            console.error("❌ خطأ من Supabase:", error);
            throw error;
        }

        if (data) {
            console.log("✅ [4] المستخدم موجود في النظام.");
            userState.points = data.points || 0;
            userState.selectedClubs = data.selected_clubs || [];
            
            userState.lang = data.lang || userState.lang;
            if(typeof applyLanguageSettings === 'function') applyLanguageSettings();

            userState.hasLoggedIn = true;
            
            if (data.wallet_address) {
                userState.walletAddress = data.wallet_address;
                userState.walletConnected = true;
            }

            if (userState.pendingReferrer && typeof window.apiProcessReferral === "function") {
                console.log("⚙️ جاري معالجة الإحالة المعلقة لصالح:", userState.pendingReferrer);
                window.apiProcessReferral(userState.pendingReferrer, userState.userId);
                userState.pendingReferrer = null; 
            }

        } else {
            console.log("🆕 [4] مستخدم جديد (غير مسجل).");
            userState.hasLoggedIn = false;
        }
    } catch (error) {
        console.error("❌ [خطأ] فشل في الاتصال وجلب البيانات:", error);
        userState.hasLoggedIn = false; 
    }

    if (!userState.hasLoggedIn || !userState.selectedClubs || userState.selectedClubs.length === 0) {
        triggerLoginScreen();
    } else {
        console.log("🏠 [6] توجيه للشاشة الرئيسية...");
        userState.hasLoggedIn = true;
        updateTopBar();
        showPage('home'); 
    }
}

// 🛠️ دالة تشغيل شاشة الدخول بأمان
function triggerLoginScreen() {
    console.log("🚪 [توجيه] محاولة فتح شاشة تسجيل الدخول...");
    
    const topBar = document.getElementById('top-bar');
    const bottomNav = document.getElementById('bottom-nav');
    if(topBar) topBar.style.display = 'none';
    if(bottomNav) bottomNav.style.display = 'none';

    if (typeof renderLoginScreen === 'function') {
        renderLoginScreen();
    } else {
        console.error("⛔ [خطأ] دالة renderLoginScreen غير موجودة!");
        const contentDiv = document.getElementById("main-content");
        if (contentDiv) {
            contentDiv.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
                <h3>خطأ في النظام</h3>
                <p>شاشة تسجيل الدخول مفقودة. تأكد من ملف login.js</p>
            </div>`;
        }
    }
}

// ==========================================
// 🔄 4. التوجيه وتحديث الواجهة الأساسية
// ==========================================

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
                
            if (data && data.total_fan_points !== undefined) {
                userState.points = data.total_fan_points;
            }
        } catch(error) {
            console.error("❌ خطأ أثناء جلب النقاط من جدول الترتيب:", error);
        }
    }
    
    if(pointsEl && typeof t === 'function') pointsEl.innerText = `${t('coins')} ${userState.points.toLocaleString()}`;
    
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
        
        clubEl.innerHTML = `<span style="color:#aaa;">${userState.lang === 'ar' ? 'أنديتك:' : 'Clubs:'}</span> ${logos}`;
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
            if(typeof renderWalletPage === "function") renderWalletPage(contentDiv); 
            break;
    }
}


// ==========================================
// ⚽ تهيئة دالة التحديات بأمان
// ==========================================
if (typeof window.openChallengesScreen !== 'function') {
    window.openChallengesScreen = function() {
        console.log("⚽ [احتياطي] تم طلب فتح شاشة تحديات الأسبوع");
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
