// ==========================================
// 👛 ملف قسم المحفظة المحدث - Zelo Sport Wallet 💎
// ==========================================

const COINS_PER_ZELO_TOKEN = 100; // نسبة التحويل: كل 100 نقطة = 1 عملة ZELOFC
const BACKEND_URL = "https://zelo-fc.onrender.com"; // رابط سيرفر Render الخاص بك
const TOKEN_NAME = "ZELOFC"; // 🪙 اسم العملة الخاص بمشروعك

// استدعاء مكتبة Solana Web3 الرسمية
if (!window.solanaWeb3) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    document.head.appendChild(script);
}

function renderWalletPage(container) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
    // 💡 القراءة المباشرة من LocalStorage لضمان عدم ضياع البيانات عند التحديث (Refresh)
    const storedCoins = localStorage.getItem('user_coins');
    const userCoins = (storedCoins !== null) ? Number(storedCoins) : ((typeof userState !== 'undefined' && userState.coins !== undefined) ? userState.coins : 5080);
    
    const storedSolanaWallet = localStorage.getItem('solana_wallet');
    const solanaWallet = storedSolanaWallet ? storedSolanaWallet : ((typeof userState !== 'undefined' && userState.solanaWallet) ? userState.solanaWallet : '');

    // مزامنة المتغير العام إذا كان معرفاً
    if (typeof userState !== 'undefined') {
        userState.coins = userCoins;
        userState.solanaWallet = solanaWallet;
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
            .btn-glass-ton {
                background: linear-gradient(135deg, #0088cc, #005580);
                color: white; border: none; border-radius: 10px;
                padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
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
            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8);
                color: #000; border: none; border-radius: 12px;
                padding: 12px 16px; font-size: 0.95rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(20, 241, 149, 0.3);
                transition: transform 0.2s;
            }
            .btn-claim-main:active {
                transform: scale(0.98);
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
                        ${isAr ? 'محفظة TON' : 'TON Wallet'}
                    </span>
                </div>
                ${(typeof userState !== 'undefined' && userState.walletConnected) ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">● Connected</span>` : ''}
            </div>

            ${(typeof userState !== 'undefined' && userState.walletConnected) ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${userState.walletAddress.slice(0, 8)}...${userState.walletAddress.slice(-8)}
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${userState.walletAddress}')">📋 ${isAr ? 'نسخ' : 'Copy'}</button>
                    <button class="btn-danger-sm" onclick="triggerDisconnect()">🔌 ${isAr ? 'فصل' : 'Disconnect'}</button>
                </div>
            ` : `
                <button class="btn-glass-ton" onclick="triggerConnect()">
                    <span>💎</span> ${isAr ? 'ربط محفظة TON' : 'Connect TON Wallet'}
                </button>
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
                        ${isAr ? 'محفظة Solana' : 'Solana Wallet'}
                    </span>
                </div>
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">${isAr ? 'رصيد SOL On-Chain:' : 'On-Chain SOL:'}</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:0.95rem;">⏳ Checking...</span>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">📋 ${isAr ? 'نسخ' : 'Copy'}</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">🔌 ${isAr ? 'فصل' : 'Disconnect'}</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:16px; height:16px;" alt="">
                    ${isAr ? 'ربط Phantom تلقائي' : 'Auto Connect Phantom'}
                </button>

                <input type="text" id="solana-address-input" class="solana-input-sm" 
                       placeholder="${isAr ? 'أو ألصق عنوان Solana يدويًا...' : 'Or paste Solana address...'}">

                <button class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.4); background: rgba(171, 159, 242, 0.15);" onclick="saveSolanaWalletAddress()">
                    💾 ${isAr ? 'حفظ العنوان' : 'Save Address'}
                </button>
            `}
        </div>

        <!-- 3. CARD مجمع رصيد العملة وزر CLAIM -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.85), rgba(18, 18, 22, 0.95));">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        ${isAr ? `رصيد عملة ${TOKEN_NAME}` : `${TOKEN_NAME} Balance`}
                    </span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">${isAr ? 'إجمالي الرصيد المكتسب:' : 'Total Earned:'}</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString()} ${TOKEN_NAME}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ⚡ ${isAr ? `مطالبة وتحويل عملة ${TOKEN_NAME} (Claim)` : `Claim ${TOKEN_NAME} Tokens`}
            </button>
        </div>
        
        <div style="height: 20px;"></div>
    `;

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// ==========================================
// 🔮 دوال التفاعل مع المحفظة والشبكة
// ==========================================
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

// ==========================================
// ⚡ دالة الخصم والتحويل عند الضغط على Claim
// ==========================================
window.claimCoinsToSolanaWallet = async function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
    // قراءة القيم من الذاكرة المحلية
    const solWallet = localStorage.getItem('solana_wallet') || (typeof userState !== 'undefined' ? userState.solanaWallet : '');
    const storedCoins = localStorage.getItem('user_coins');
    const userCoins = (storedCoins !== null) ? Number(storedCoins) : ((typeof userState !== 'undefined' && userState.coins !== undefined) ? userState.coins : 5080);

    const claimBtn = document.getElementById('btn-claim-action');

    // 1. التأكد من ربط المحفظة
    if (!solWallet) {
        alert(isAr ? '⚠️ يرجى ربط محفظة Solana في الخانة أعلاه أولاً!' : '⚠️ Please connect or save your Solana Wallet first!');
        return;
    }

    // 2. التأكد من وجود رصيد كافٍ
    if (userCoins <= 0) {
        alert(isAr ? `⚠️ لا يوجد لديك رصيد من عملة ${TOKEN_NAME} المتاحة للسحب حالياً.` : `⚠️ You have no ${TOKEN_NAME} available to claim.`);
        return;
    }

    // 3. حساب عدد عملات ZELOFC المستحقة
    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);

    const confirmClaim = confirm(
        isAr 
        ? `هل تؤكد خصم ${userCoins.toLocaleString()} من رصيدك وتحويل ${tokenAmountToReceive} من عملة ${TOKEN_NAME} إلى محفظتك؟`
        : `Confirm deducting ${userCoins.toLocaleString()} to receive ${tokenAmountToReceive} ${TOKEN_NAME} tokens?`
    );

    if (!confirmClaim) return;

    try {
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = isAr ? '⏳ جاري الاتصال بالسيرفر والتحويل On-Chain...' : '⏳ Connecting server & transferring...';
        }

        // 4. إرسال طلب تحويل إلى السيرفر
        const response = await fetch(`${BACKEND_URL}/api/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userWalletAddress: solWallet,
                userCoins: userCoins
            })
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            // 5. خصم الرصيد وتحديث الذاكرة
            localStorage.setItem('user_coins', 0);
            if (typeof userState !== 'undefined') {
                userState.coins = 0;
            }

            if (typeof showPage === 'function') {
                showPage('wallet');
            }

            alert(
                isAr 
                ? `✅ تم التحويل بنجاح إلى محفظتك!\n\nرقم المعاملة (Tx): ${result.txHash}` 
                : `✅ Success! Tokens transferred On-Chain!\n\nTx Hash: ${result.txHash}`
            );
        } else {
            // استخراج وتوضيح نص الخطأ القادم من السيرفر
            const errorMsg = (result && result.error) ? result.error : `HTTP ${response.status}: ${response.statusText || 'Server Error'}`;
            alert(isAr ? `❌ فشلت عملية التحويل:\n${errorMsg}` : `❌ Transfer failed:\n${errorMsg}`);
        }

    } catch (error) {
        console.error("Claim Error:", error);
        alert(isAr ? `❌ تعذر الاتصال بالسيرفر:\n${error.message}` : `❌ Server connection error:\n${error.message}`);
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = isAr ? `⚡ مطالبة وتحويل عملة ${TOKEN_NAME} (Claim)` : `Claim ${TOKEN_NAME} Tokens`;
        }
    }
};

window.connectPhantomWallet = function() {
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            saveSolanaAddressToStateAndDB(res.publicKey.toString());
        }).catch((err) => console.error(err));
    } else {
        alert('يرجى نسخ عنوان المحفظة من تطبيق Phantom ولصقه في الخانة.');
    }
};

async function saveSolanaAddressToStateAndDB(solAddress) {
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
        alert('Please enter a valid Solana address');
    }
};

window.disconnectSolanaWallet = function() {
    localStorage.removeItem('solana_wallet');
    if (typeof userState !== 'undefined') userState.solanaWallet = null;
    if (typeof showPage === 'function') showPage('wallet');
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => alert('تم نسخ العنوان!'));
};
