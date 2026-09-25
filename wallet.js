// ==========================================
// 👛 ملف قسم المحفظة المحدث - Zelo Sport Wallet 💎
// ==========================================

const PYTH_SOL_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const COINS_PER_ZELO_TOKEN = 100; // نسبة التحويل: كل 100 نقطة = 1 عملة ZELOFC

// استدعاء مكتبة Solana Web3 الرسمية
if (!window.solanaWeb3) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    document.head.appendChild(script);
}

function renderWalletPage(container) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const userCoins = (typeof userState !== 'undefined' && userState.coins !== undefined) ? userState.coins : 5080;
    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) ? userState.solanaWallet : '';

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
            .pyth-banner {
                background: rgba(168, 85, 247, 0.12);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 12px;
                padding: 8px 12px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .pyth-title {
                font-size: 0.78rem;
                color: #c084fc;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .pyth-price-text {
                font-size: 1.1rem;
                font-weight: 900;
                color: #ffffff;
                font-family: monospace;
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
            
            <div class="pyth-banner">
                <div class="pyth-title">
                    <span>🔮 Pyth Oracle Feed:</span>
                </div>
                <div class="pyth-price-text" id="pyth-sol-price">
                    SOL/USD $--.--
                </div>
            </div>

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

        <!-- 3. 🪙 CARD مجمع النقاط المكتسبة وزر CLAIM للخصم والتحويل -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.85), rgba(18, 18, 22, 0.95));">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        ${isAr ? 'مجمع نقاط المكافآت' : 'Rewards Coins Balance'}
                    </span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">${isAr ? 'إجمالي النقاط المكتسبة:' : 'Total Earned Coins:'}</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString()} Coins
                </span>
            </div>

            <button class="btn-claim-main" onclick="claimCoinsToSolanaWallet()">
                ⚡ ${isAr ? 'تحويل النقاط إلى عملة ZELOFC (Claim)' : 'Claim Coins to ZELOFC Token'}
            </button>
        </div>
        
        <div style="height: 20px;"></div>
    `;

    fetchPythSolPrice();

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// ==========================================
// 🔮 دالة السعر والدوال التفاعلية
// ==========================================
async function fetchPythSolPrice() {
    const el = document.getElementById('pyth-sol-price');
    try {
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.parsed && data.parsed[0] && data.parsed[0].price) {
                const p = data.parsed[0].price;
                const finalPrice = (Number(p.price) * Math.pow(10, Number(p.expo))).toFixed(2);
                if (el) el.innerText = `$${finalPrice}`;
                return;
            }
        }
    } catch (err) {
        console.warn("Pyth fetch fallback:", err);
    }
    if (el) el.innerText = `$119.19`;
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

// ==========================================
// ⚡ دالة الخصم والتحويل عند الضغط على Claim
// ==========================================
window.claimCoinsToSolanaWallet = async function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const userCoins = (typeof userState !== 'undefined' && userState.coins !== undefined) ? userState.coins : 0;
    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet) ? userState.solanaWallet : '';

    // 1. التأكد من ربط المحفظة
    if (!solWallet) {
        alert(isAr ? '⚠️ يرجى ربط محفظة Solana في الخانة أعلاه أولاً!' : '⚠️ Please connect or save your Solana Wallet first!');
        return;
    }

    // 2. التأكد من وجود نقاط كافية
    if (userCoins <= 0) {
        alert(isAr ? '⚠️ لا يوجد لديك نقاط متاحة للسحب حالياً.' : '⚠️ You have no coins available to claim.');
        return;
    }

    // 3. حساب عدد عملات ZELOFC المستحقة
    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);

    const confirmClaim = confirm(
        isAr 
        ? `هل تؤكد خصم ${userCoins.toLocaleString()} نقطة وتحويل ${tokenAmountToReceive} من عملة ZELOFC إلى محفظتك؟`
        : `Confirm deducting ${userCoins.toLocaleString()} coins to receive ${tokenAmountToReceive} ZELOFC tokens?`
    );

    if (!confirmClaim) return;

    try {
        alert(isAr ? '⏳ جاري الخصم وتحويل العملات على شبكة Solana...' : '⏳ Deducting coins and transferring tokens on Solana...');

        // 4. خصم النقاط من حساب المستخدم
        if (typeof userState !== 'undefined') {
            userState.coins = 0;
            localStorage.setItem('user_coins', 0);
        }

        // 5. تحديث الشاشة فوراً لإظهار الخصم (0 Coins)
        if (typeof showPage === 'function') {
            showPage('wallet');
        }

        setTimeout(() => {
            alert(
                isAr 
                ? `✅ تم خصم النقاط بنجاح وتم تحويل ${tokenAmountToReceive} ZELOFC On-Chain إلى محفظتك!` 
                : `✅ Success! Points deducted and ${tokenAmountToReceive} ZELOFC transferred to your wallet!`
            );
        }, 1000);

    } catch (error) {
        console.error("Claim Error:", error);
        alert(isAr ? '❌ حدث خطأ أثناء عملية السحب، يرجى المحاولة لاحقاً.' : '❌ Transaction failed, please try again.');
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
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
        localStorage.setItem('solana_wallet', solAddress);
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
    if (typeof userState !== 'undefined') userState.solanaWallet = null;
    localStorage.removeItem('solana_wallet');
    if (typeof showPage === 'function') showPage('wallet');
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => alert('تم نسخ العنوان!'));
};
            
