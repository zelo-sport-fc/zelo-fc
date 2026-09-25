// ==========================================
// 👛 ZELO FC Wallet - Full Stack Script (TON + Solana) 💎
// ==========================================

// 1. إعدادات التحويل والشبكة
const COINS_PER_ZELO_TOKEN = 100; // سعر الصرف: 100 عملة = 1 ZELOFC Token
const BACKEND_CLAIM_URL = "https://zelo-fc.onrender.com/api/claim"; // رابط معالجة الاستبدال في السيرفر
const TOKEN_NAME = "ZELOFC"; // رمز التوكن

// 2. تهيئة مكتبة TON Connect
let tonConnectUI = null;
try {
    if (typeof TON_CONNECT_UI !== 'undefined') {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://zelo-sport-fc.github.io/zelo-fc/tonconnect-manifest.json', // رابط ملف البيان الخاص بك
            buttonRootId: 'ton-connect-button-anchor' // مكان وضع الزر في الـ HTML
        });

        // مراقبة تغيير حالة محفظة TON
        tonConnectUI.onStatusChange(async (walletInfo) => {
            if (walletInfo) {
                console.log("✅ TON Wallet Connected:", walletInfo.account.address);
                // حفظ العنوان في الحالة العامة
                if (typeof userState !== 'undefined') {
                    userState.tonWalletAddress = walletInfo.account.address;
                    userState.tonWalletConnected = true;
                }
            } else {
                console.log("🔌 TON Wallet Disconnected");
                // مسح العنوان من الحالة العامة
                if (typeof userState !== 'undefined') {
                    userState.tonWalletAddress = null;
                    userState.tonWalletConnected = false;
                }
            }
            // إعادة عرض الصفحة لتحديث الأزرار
            if (typeof showPage === 'function' && typeof userState !== 'undefined' && userState.hasLoggedIn) {
                showPage('wallet');
            }
        });
    }
} catch (error) {
    console.error("❌ TON Connect Initialization Error:", error);
}

// 3. تحميل مكتبة Solana Web3 الرسمية
if (!window.solanaWeb3) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    document.head.appendChild(script);
}

// 4. الدالة الرئيسية لعرض الواجهة
function renderWalletPage(container) {
    // Sync strictly with userState.points (or fallback to localStorage)
    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : Number(localStorage.getItem('user_coins') || 0);

    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet)
        ? userState.solanaWallet
        : (localStorage.getItem('solana_wallet') || '');
    
    // التأكد من تحميل عنوان TON من الحالة الحية
    const tonWalletConnected = (typeof userState !== 'undefined' && userState.tonWalletConnected);
    const tonWalletAddress = (typeof userState !== 'undefined' && userState.tonWalletAddress) ? userState.tonWalletAddress : localStorage.getItem('ton_wallet_address_fallback');

    // Sync global state (safety)
    if (typeof userState !== 'undefined') {
        userState.points = userCoins;
        userState.solanaWallet = solanaWallet;
        // إذا كان العنوان غير مخزن في الحالة ولكن تم الاتصال به، احتفظ به
        if(!userState.tonWalletAddress && tonWalletAddress) {
             userState.tonWalletAddress = tonWalletAddress;
        }
    }
    
    // تخزين احتياطي لعنوان تون محلياً لجلسة المستخدم
    if(userState.tonWalletAddress) localStorage.setItem('ton_wallet_address_fallback', userState.tonWalletAddress);

    const walletStyles = `
        <style>
            .wallet-glass-card {
                background: linear-gradient(135deg, rgba(28, 28, 34, 0.85), rgba(18, 18, 22, 0.95));
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 18px;
                padding: 16px;
                text-align: center;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
                margin-bottom: 16px;
                overflow: hidden;
                position: relative;
            }
            .card-border-ton { border-top: 3px solid #0088cc; }
            .card-border-solana { border-top: 3px solid #AB9FF2; }
            .card-border-balance { border-top: 3px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.9), rgba(18, 18, 22, 1)); }

            .wallet-header-flex {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            .wallet-logo-title {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .wallet-logo-sm {
                width: 34px; height: 34px;
                border-radius: 10px;
                background: rgba(255,255,255,0.05);
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: inset 0 2px 5px rgba(0,0,0,0.3);
            }
            .address-box-sm {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 10px 14px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 0.82rem;
                margin-bottom: 12px;
                word-break: break-all;
            }
            
            /* TON Connect Button Override */
            #tc-ui-button { width: 100%; }

            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8);
                color: white; border: none; border-radius: 12px;
                padding: 12px 16px; font-weight: bold; font-size: 0.95rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                margin-bottom: 10px;
                box-shadow: 0 4px 15px rgba(171, 159, 242, 0.3);
            }
            .solana-input-sm {
                width: 100%; padding: 10px 12px; background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(171, 159, 242, 0.4); border-radius: 10px;
                color: #fff; font-family: monospace; font-size: 0.85rem;
                box-sizing: border-box; margin-bottom: 10px; text-align: center;
            }
            .btn-action-sm {
                background: rgba(255, 255, 255, 0.08); color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px;
                padding: 8px 14px; font-size: 0.85rem; font-weight: bold; cursor: pointer;
                transition: all 0.2s;
            }
            .btn-action-sm:hover { background: rgba(255,255,255,0.15); }
            
            .btn-danger-sm {
                background: rgba(253, 29, 29, 0.12); color: #ff4d4d;
                border: 1px solid rgba(253, 29, 29, 0.4); border-radius: 10px;
                padding: 8px 14px; font-size: 0.85rem; font-weight: bold; cursor: pointer;
            }
            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8);
                color: #000; border: none; border-radius: 14px;
                padding: 14px 18px; font-size: 1.1rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
                box-shadow: 0 4px 20px rgba(20, 241, 149, 0.4);
                transition: transform 0.2s;
                margin-top: 10px;
            }
            .btn-claim-main:active { transform: scale(0.97); }
        </style>
    `;

    container.innerHTML = `
        ${walletStyles}
        
        <!-- 1. TON WALLET CARD (REAL) -->
        <div class="wallet-glass-card card-border-ton">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:20px;height:20px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:1rem;">
                        TON Wallet (Real)
                    </span>
                </div>
                ${tonWalletConnected ? `<span style="color:#0088cc; font-size:0.8rem; font-weight:bold; text-transform: uppercase;">● Connected</span>` : ''}
            </div>

            ${tonWalletConnected ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${userState.tonWalletAddress.slice(0, 8)}...${userState.tonWalletAddress.slice(-8)}
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${userState.tonWalletAddress}')">📋 Copy</button>
                    <button class="btn-danger-sm" onclick="triggerTonDisconnect()">🔌 Disconnect</button>
                </div>
            ` : `
                <!-- مكان وضع زر TonConnect الحقيقي -->
                <div id="ton-connect-button-anchor" style="display: flex; justify-content: center;"></div>
                <p style="color:#aaa; font-size:0.8rem; margin-top:8px;">Connect using Telegram TonHub, Tonkeeper, or @Wallet.</p>
            `}
        </div>

        <!-- 2. SOLANA WALLET CARD (REAL) -->
        <div class="wallet-glass-card card-border-solana">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(171, 159, 242, 0.4);">
                        <img src="https://phantom.app/img/phantom-logo.svg" style="width:20px; height:20px;" alt="Phantom">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:1rem;">
                        Solana Wallet (Phantom)
                    </span>
                </div>
                 ${solanaWallet ? `<span style="color:#AB9FF2; font-size:0.8rem; font-weight:bold; text-transform: uppercase;">● Active</span>` : ''}
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); padding:10px 14px; border-radius:10px; margin-bottom:12px; border: 1px solid rgba(255,255,255,0.05);">
                    <span style="color:#aaa; font-size:0.85rem;">On-Chain SOL:</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:1rem;">⏳ Checking...</span>
                </div>

                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">📋 Copy</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">🔌 Disconnect</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:18px; height:18px;" alt="">
                    Auto Connect Phantom
                </button>

                <input type="text" id="solana-address-input" class="solana-input-sm" 
                       placeholder="Or paste Solana address... (min 32 chars)">

                <button class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.3); background: rgba(171, 159, 242, 0.12);" onclick="saveManualSolanaWalletAddress()">
                    💾 Save Address
                </button>
            `}
        </div>

        <!-- 3. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card card-border-balance">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.15);">
                        <span style="font-size: 1.3rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:1rem;">
                        ${TOKEN_NAME} Claim Portal
                    </span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.5); padding: 14px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.9rem;">ZELOFC to Claim:</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.3rem; font-family: monospace;">
                    ${userCoins.toLocaleString()}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ⚡ Claim ${TOKEN_NAME} Tokens
            </button>
             <p style="color:#888; font-size:0.75rem; margin-top:10px;">*Ensure your Solana wallet is connected first. Claims sent to Phantom only.</p>
        </div>
        
        <div style="height: 30px;"></div>
    `;

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// ==========================================
// 🔮 Wallet & Network Functions
// ==========================================

// 1. جلب الرصيد الحقيقي من شبكة سولانا
async function fetchRealSolanaBalance(address) {
    const el = document.getElementById('real-solana-balance');
    try {
        if (window.solanaWeb3) {
            const connection = new window.solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
            const pubKey = new window.solanaWeb3.PublicKey(address);
            const balance = await connection.getBalance(pubKey);
            const solVal = (balance / window.solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
            if (el) el.innerText = `${solVal} SOL`;
            return;
        }
    } catch (err) {
        console.warn("Solana Balance Error:", err);
    }
    if (el) el.innerText = `0.0000 SOL`;
}

// 2. فصل محفظة TON الحقيقية
async function triggerTonDisconnect() {
    if(tonConnectUI) {
        await tonConnectUI.disconnect();
    }
}

// 3. ربط محفظة Phantom (سولانا)
window.connectPhantomWallet = function() {
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            console.log("✅ Phantom Wallet Connected:", res.publicKey.toString());
            saveSolanaAddressToStateAndDB(res.publicKey.toString());
        }).catch((err) => {
            console.error("❌ Phantom Connection Error:", err);
            if (err.code === 4001) {
                alert('Connection request rejected by user.');
            } else {
                alert('Phantom connection failed. Please try manual entry.');
            }
        });
    } else {
        alert('Phantom wallet not detected. Please install Phantom or paste your address manually.');
        // التوجيه لصفحة تحميل فانتوم يمكن إضافته هنا
    }
};

// 4. حفظ عنوان سولانا وتحديث الواجهة
async function saveSolanaAddressToStateAndDB(solAddress) {
    // حفظ في LocalStorage لجلسة التطبيق
    localStorage.setItem('solana_wallet', solAddress);
    
    // تحديث الحالة العامة (Sync Live State)
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
        
        // اختياري: حفظ في قاعدة بيانات Supabase إذا كان المستخدم مسجلاً
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null && userState.userId) {
             supabaseClient.from('users')
                .update({ solana_wallet_address: solAddress })
                .eq('telegram_id', userState.userId)
                .then(({ error }) => {
                    if (error) console.error("Error saving Solana to Supabase:", error);
                });
        }
    }
    
    // إعادة تحميل الصفحة فورياً
    if (typeof showPage === 'function') showPage('wallet');
}

// 5. حفظ العنوان المدخل يدوياً
window.saveManualSolanaWalletAddress = function() {
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    // التحقق الأساسي من صحة العنوان (Base58 string length)
    if (solAddress.length >= 32 && solAddress.length <= 44) {
        saveSolanaAddressToStateAndDB(solAddress);
    } else {
        alert('Please enter a valid Solana address (typically 32-44 characters)');
    }
};

// 6. فصل محفظة سولانا
window.disconnectSolanaWallet = function() {
    localStorage.removeItem('solana_wallet');
    
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = null;
        // اختياري: مسح العنوان من قاعدة البيانات أيضاً
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null && userState.userId) {
             supabaseClient.from('users')
                .update({ solana_wallet_address: null })
                .eq('telegram_id', userState.userId);
        }
    }
    if (typeof showPage === 'function') showPage('wallet');
};

// 7. تنفيذ عملية الاستبدال (Claim)
window.claimCoinsToSolanaWallet = async function() {
    // جلب البيانات الحية من الحالة
    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet)
        ? userState.solanaWallet
        : localStorage.getItem('solana_wallet');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : Number(localStorage.getItem('user_coins') || 0);

    const claimBtn = document.getElementById('btn-claim-action');

    // 1. التحقق من وجود محفظة سولانا
    if (!solWallet) {
        alert('⚠️ Please connect or save your Solana Wallet (Phantom) first!');
        return;
    }

    // 2. التحقق من الرصيد
    if (userCoins <= 0) {
        alert(`⚠️ You have no ${TOKEN_NAME} available to claim.`);
        return;
    }

    // 3. حساب الكمية
    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);

    const confirmClaim = confirm(
        `Confirm claiming ${userCoins.toLocaleString()} Zelo Coins to receive ${tokenAmountToReceive} ${TOKEN_NAME} tokens to address:\n${solWallet.slice(0,8)}...${solWallet.slice(-8)}?`
    );

    if (!confirmClaim) return;

    try {
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = '⏳ Connecting server & processing claim...';
        }

        // 4. إرسال طلب الاستبدال للسيرفر
        const response = await fetch(BACKEND_CLAIM_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userWalletAddress: solWallet,
                userCoins: userCoins,
                userId: typeof userState !== 'undefined' ? userState.userId : localStorage.getItem('user_id'), // لإثبات الهوية
                lang: typeof userState !== 'undefined' ? userState.lang : 'ar'
            })
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            // 5. نجاح العملية: تصفية الرصيد المحلي في الحالة و LocalStorage
            localStorage.setItem('user_coins', 0);
            if (typeof userState !== 'undefined') {
                userState.points = 0;
                // إذا كان يستخدم coins بدل points في الـ state
                if(userState.coins !== undefined) userState.coins = 0;
            }

            // تحديث الواجهة
            if (typeof showPage === 'function') {
          
