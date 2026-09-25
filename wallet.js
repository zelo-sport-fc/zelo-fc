// ==========================================
// 👛 Zelo Sport Wallet - Complete Frontend Script (i18n Support)
// ==========================================

const COINS_PER_ZELO_TOKEN = 100;
const BACKEND_URL = "https://zelo-fc.onrender.com";
const TOKEN_NAME = "ZELOFC";

// 1. نظام الترجمة المدمج (i18n Translations Dictionary)
const translations = {
    en: {
        tonWallet: "Telegram / TON Wallet",
        solanaWallet: "Solana Wallet",
        connected: "● Connected",
        copy: "📋 Copy",
        disconnect: "🔌 Disconnect",
        onChainSol: "On-Chain SOL:",
        checking: "⏳ Checking...",
        autoConnectSolana: "⚡ Auto Connect Solana (Phantom / Solflare)",
        placeholderSolana: "Or paste Solana address...",
        saveAddress: "💾 Save Address",
        totalEarned: "Total Earned:",
        claimTokens: "⚡ Claim {TOKEN} Tokens",
        copied: "Address copied to clipboard!",
        errNoSolanaWallet: "⚠️ Please connect or save your Solana Wallet first!",
        errNoCoins: "⚠️ You have no {TOKEN} available to claim.",
        confirmClaim: "Confirm deducting {COINS} points to receive {AMOUNT} {TOKEN} tokens?",
        claiming: "⏳ Connecting server & transferring...",
        claimSuccess: "✅ Transfer successful!\n\nTx Hash:\n{HASH}",
        claimFailed: "❌ Transfer failed:\n{ERROR}",
        serverError: "❌ Server connection error:\n{ERROR}",
        solanaConnectErr: "Wallet connection failed: ",
        solanaNotDetected: "Wallet provider not detected automatically. Please copy and paste your Solana address.",
        invalidSolAddress: "Please enter a valid Solana address"
    },
    ar: {
        tonWallet: "محفظة تلجرام / TON",
        solanaWallet: "محفظة سولانا",
        connected: "● متصل",
        copy: "📋 نسخ",
        disconnect: "🔌 قطع الاتصال",
        onChainSol: "رصيد SOL الشبكي:",
        checking: "⏳ جاري التحقق...",
        autoConnectSolana: "⚡ ربط تلقائي بمحفظة سولانا (Phantom / Solflare)",
        placeholderSolana: "أو ألصق عنوان سولانا...",
        saveAddress: "💾 حفظ العنوان",
        totalEarned: "إجمالي المكتسب:",
        claimTokens: "⚡ المطالبة بتوكنات {TOKEN}",
        copied: "تم نسخ العنوان إلى الحافظة!",
        errNoSolanaWallet: "⚠️ الرجاء ربط أو حفظ محفظة Solana أولاً!",
        errNoCoins: "⚠️ ليس لديك رصيد متاح من {TOKEN} للمطالبة.",
        confirmClaim: "هل تؤكد خصم {COINS} نقطة للحصول على {AMOUNT} توكن {TOKEN}؟",
        claiming: "⏳ جاري الاتصال بالسيرفر وإرسال المعاملة...",
        claimSuccess: "✅ تمت المعاملة بنجاح!\n\nرقم المعاملة:\n{HASH}",
        claimFailed: "❌ فشلت المعاملة:\n{ERROR}",
        serverError: "❌ خطأ في الاتصال بالسيرفر:\n{ERROR}",
        solanaConnectErr: "فشل الاتصال بالمحفظة: ",
        solanaNotDetected: "لم يتم العثور على إضافة المحفظة تلقائيًا. الرجاء نسخ عنوان محفظة Solana وإلصاقه يدوياً.",
        invalidSolAddress: "الرجاء إدخال عنوان محفظة Solana صحيح"
    }
};

// دالة جلب النص المترجم بحسب لغة التطبيق الحالية
function t(key, params = {}) {
    const currentLang = (typeof userState !== 'undefined' && userState.lang) 
        ? userState.lang 
        : (localStorage.getItem('app_lang') || 'ar'); // اللغة الافتراضية
    
    let text = (translations[currentLang] && translations[currentLang][key]) 
        ? translations[currentLang][key] 
        : (translations['en'][key] || key);

    Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
    });

    return text;
}

// 2. Load External Dependencies
(function loadDependencies() {
    if (!window.solanaWeb3) {
        const s1 = document.createElement('script');
        s1.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
        document.head.appendChild(s1);
    }
    if (!window.TonConnectUI) {
        const s2 = document.createElement('script');
        s2.src = 'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js';
        s2.onload = initTonConnect;
        document.head.appendChild(s2);
    } else {
        initTonConnect();
    }
})();

let tonConnectUI = null;
function initTonConnect() {
    if (window.TON_CONNECT_UI && !tonConnectUI) {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: `${BACKEND_URL}/tonconnect-manifest.json`,
            buttonRootId: 'ton-connect-btn-container'
        });

        tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                const address = wallet.account.address;
                localStorage.setItem('ton_wallet', address);
                if (typeof userState !== 'undefined') {
                    userState.walletConnected = true;
                    userState.walletAddress = address;
                }
            } else {
                localStorage.removeItem('ton_wallet');
                if (typeof userState !== 'undefined') {
                    userState.walletConnected = false;
                    userState.walletAddress = '';
                }
            }
            if (typeof showPage === 'function') showPage('wallet');
        });
    }
}

function renderWalletPage(container) {
    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : ((typeof userState !== 'undefined' && userState.coins !== undefined)
            ? Number(userState.coins)
            : Number(localStorage.getItem('user_coins') || 0));
    
    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const tonWallet = (typeof userState !== 'undefined' && userState.walletAddress)
        ? userState.walletAddress
        : (localStorage.getItem('ton_wallet') || '');

    if (typeof userState !== 'undefined') {
        userState.points = userCoins;
        userState.coins = userCoins;
        userState.solanaWallet = solanaWallet;
        userState.walletAddress = tonWallet;
    }

    const walletStyles = `
        <style>
            .wallet-glass-card {
                background: linear-gradient(135deg, rgba(28, 28, 34, 0.8), rgba(18, 18, 22, 0.9));
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 18px;
                padding: 16px;
                text-align: center;
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                margin-bottom: 14px;
            }
            .wallet-header-flex {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .wallet-logo-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .wallet-logo-sm {
                width: 30px; height: 30px;
                border-radius: 50%;
                background: rgba(255,255,255,0.05);
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .address-box-sm {
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 8px 12px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 0.82rem;
                margin-bottom: 10px;
                word-break: break-all;
            }
            .btn-action-sm {
                background: rgba(255, 255, 255, 0.05); color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;
                padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
            }
            .btn-danger-sm {
                background: rgba(253, 29, 29, 0.12); color: #ff4d4d;
                border: 1px solid rgba(253, 29, 29, 0.3); border-radius: 8px;
                padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
            }
            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8);
                color: white; border: none; border-radius: 10px;
                padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
                margin-bottom: 8px;
            }
            .solana-input-sm {
                width: 100%; padding: 8px 10px; background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(171, 159, 242, 0.3); border-radius: 8px;
                color: #fff; font-family: monospace; font-size: 0.8rem;
                box-sizing: border-box; margin-bottom: 8px; text-align: center;
            }
            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8);
                color: #000; border: none; border-radius: 12px;
                padding: 12px 16px; font-size: 0.95rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(20, 241, 149, 0.3);
            }
        </style>
    `;

    container.innerHTML = `
        ${walletStyles}
        
        <!-- 1. TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #0088cc;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:18px;height:18px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        ${t('tonWallet')}
                    </span>
                </div>
                ${tonWallet ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">${t('connected')}</span>` : ''}
            </div>

            ${tonWallet ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${tonWallet.slice(0, 8)}...${tonWallet.slice(-8)}
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${tonWallet}')">${t('copy')}</button>
                    <button class="btn-danger-sm" onclick="disconnectTonWallet()">${t('disconnect')}</button>
                </div>
            ` : `
                <div id="ton-connect-btn-container" style="display: flex; justify-content: center; margin-top: 8px;"></div>
            `}
        </div>

        <!-- 2. SOLANA WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #AB9FF2;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(171, 159, 242, 0.4);">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width:18px;height:18px;" alt="Solana">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        ${t('solanaWallet')}
                    </span>
                </div>
                ${solanaWallet ? `<span style="color:#14F195; font-size:0.75rem; font-weight:bold;">${t('connected')}</span>` : ''}
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">${t('onChainSol')}</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:0.95rem;">${t('checking')}</span>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">${t('copy')}</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">${t('disconnect')}</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectSolanaProvider()">
                    ${t('autoConnectSolana')}
                </button>

                <input type="text" id="solana-address-input" class="solana-input-sm" placeholder="${t('placeholderSolana')}">
                <button class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.4); background: rgba(171, 159, 242, 0.15);" onclick="saveSolanaWalletAddress()">
                    ${t('saveAddress')}
                </button>
            `}
        </div>

        <!-- 3. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        ${TOKEN_NAME}
                    </span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">${t('totalEarned')}</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString()} ${TOKEN_NAME}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ${t('claimTokens', { TOKEN: TOKEN_NAME })}
            </button>
        </div>
    `;

    setTimeout(() => { if (tonConnectUI && !tonWallet) initTonConnect(); }, 100);

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// ==========================================
// 🔗 TON Wallet Functions
// ==========================================
async function disconnectTonWallet() {
    if (tonConnectUI && tonConnectUI.connected) {
        await tonConnectUI.disconnect();
    }
    localStorage.removeItem('ton_wallet');
    if (typeof userState !== 'undefined') {
        userState.walletAddress = '';
        userState.walletConnected = false;
    }
    if (typeof showPage === 'function') showPage('wallet');
}

// ==========================================
// 🔗 Solana Wallet Functions
// ==========================================
async function connectSolanaProvider() {
    try {
        const provider = window.phantom?.solana || window.solana;
        if (provider) {
            const resp = await provider.connect();
            const pubKey = resp.publicKey.toString();
            saveSolanaAddressToStateAndDB(pubKey);
        } else {
            alert(t('solanaNotDetected'));
        }
    } catch (err) {
        console.error("Solana Connect Error:", err);
        alert(t('solanaConnectErr') + err.message);
    }
}

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

function saveSolanaAddressToStateAndDB(solAddress) {
    localStorage.setItem('solana_wallet', solAddress);
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
    }
    if (typeof showPage === 'function') showPage('wallet');
}

window.saveSolanaWalletAddress = function() {
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    if (solAddress.length >= 32) {
        saveSolanaAddressToStateAndDB(solAddress);
    } else {
        alert(t('invalidSolAddress'));
    }
};

window.disconnectSolanaWallet = function() {
    localStorage.removeItem('solana_wallet');
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = '';
    }
    if (typeof showPage === 'function') showPage('wallet');
};

// ==========================================
// ⚡ Claim Action Handler
// ==========================================
window.claimCoinsToSolanaWallet = async function() {
    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined) 
        ? Number(userState.points) 
        : Number(localStorage.getItem('user_coins') || 0);

    const claimBtn = document.getElementById('btn-claim-action');

    if (!solWallet) {
        alert(t('errNoSolanaWallet'));
        return;
    }

    if (userCoins <= 0) {
        alert(t('errNoCoins', { TOKEN: TOKEN_NAME }));
        return;
    }

    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);
    if (!confirm(t('confirmClaim', { COINS: userCoins.toLocaleString(), AMOUNT: tokenAmountToReceive, TOKEN: TOKEN_NAME }))) return;

    try {
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = t('claiming');
        }

        const response = await fetch(`${BACKEND_URL}/api/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userWalletAddress: solWallet,
                userCoins: userCoins
            })
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            localStorage.setItem('user_coins', 0);
            if (typeof userState !== 'undefined') {
                userState.points = 0;
                userState.coins = 0;
            }
            if (typeof showPage === 'function') showPage('wallet');
            alert(t('claimSuccess', { HASH: result.txHash }));
        } else {
            const errorDetails = result?.error || result?.message || `HTTP ${response.status}`;
            alert(t('claimFailed', { ERROR: errorDetails }));
        }
    } catch (error) {
        console.error("Claim Error:", error);
        alert(t('serverError', { ERROR: error.message }));
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = t('claimTokens', { TOKEN: TOKEN_NAME });
        }
    }
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => alert(t('copied')));
};
        
