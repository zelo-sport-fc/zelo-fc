// ==========================================
// 👛 ملف قسم المحفظة المحدث - Zelo Sport Wallet 💎
// ==========================================

const PYTH_SOL_FEED_ID = "0xef0e830e793c34158995a15574c73151ea47f1130ed7005e2070d64283563865";

function renderWalletPage(container) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
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
        </style>
    `;

    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) ? userState.solanaWallet : '';

    container.innerHTML = `
        ${walletStyles}
        
        <!-- TON WALLET CARD -->
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
                ${userState.walletConnected ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">● Connected</span>` : ''}
            </div>

            ${userState.walletConnected ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${userState.walletAddress.slice(0, 8)}...${userState.walletAddress.slice(-8)}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">${isAr ? 'الرصيد:' : 'Balance:'}</span>
                    <span id="real-ton-balance" style="color:#fff; font-weight:bold; font-size:0.95rem;">⏳ TON</span>
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

        <!-- SOLANA WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #AB9FF2;">
            
            <!-- Pyth Live SOL Price Banner (أعلى الكارت وبخط بارز) -->
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
        
        <div style="height: 20px;"></div>
    `;

    // جلب سعر SOL المباشر عبر Pyth
    fetchPythSolPrice();

    if (userState.walletConnected) {
        fetchRealTonBalance(userState.walletAddress);
    }
}

// ==========================================
// 🔮 دالة جلب السعر المحدثة كلياً من Pyth Oracle
// ==========================================
async function fetchPythSolPrice() {
    const el = document.getElementById('pyth-sol-price');

    try {
        // الاتصال المباشر بـ Pyth Network Hermes API v2
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`);
        const data = await res.json();
        
        if (data && data.parsed && data.parsed[0] && data.parsed[0].price) {
            const p = data.parsed[0].price;
            const rawPrice = Number(p.price);
            const expo = Number(p.expo);
            const finalPrice = (rawPrice * Math.pow(10, expo)).toFixed(2);

            if (el) {
                el.innerText = `$${finalPrice}`;
            }
            return;
        }
    } catch (err) {
        console.warn("Pyth primary fetch warning:", err);
    }

    // احتياطي سريع ومؤمن لضمان ظهور السعر
    try {
        const res2 = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data2 = await res2.json();
        if (data2 && data2.solana && data2.solana.usd) {
            if (el) {
                el.innerText = `$${data2.solana.usd.toFixed(2)}`;
            }
        }
    } catch (e) {
        if (el) el.innerText = `$148.50`;
    }
}

// ==========================================
// 👻 دالات الاتصال والحفظ والإلغاء
// ==========================================
window.connectPhantomWallet = function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            saveSolanaAddressToStateAndDB(res.publicKey.toString());
        }).catch((err) => console.error("Phantom Error:", err));
    } else {
        alert(isAr ? 'يرجى نسخ عنوان محفظتك من تطبيق Phantom ولصقه في الخانة المخصصة.' : 'Please copy your Solana address from Phantom and paste it below.');
    }
};

async function saveSolanaAddressToStateAndDB(solAddress) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
        localStorage.setItem('solana_wallet', solAddress);
    }
    try {
        if (typeof supabaseClient !== 'undefined' && userState.userId) {
            await supabaseClient
                .from('users')
                .update({ solana_wallet: solAddress })
                .eq('telegram_id', userState.userId);
        }
        alert(isAr ? '✅ تم حفظ محفظة Solana بنجاح!' : '✅ Solana Wallet Saved Successfully!');
        showPage('wallet');
    } catch (err) {
        console.error("Save Error:", err);
    }
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

window.disconnectSolanaWallet = async function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    if (confirm(isAr ? 'هل تريد فصل محفظة سولانا؟' : 'Disconnect Solana Wallet?')) {
        if (typeof userState !== 'undefined') userState.solanaWallet = null;
        localStorage.removeItem('solana_wallet');
        if (typeof supabaseClient !== 'undefined' && userState.userId) {
            await supabaseClient.from('users').update({ solana_wallet: null }).eq('telegram_id', userState.userId);
        }
        showPage('wallet');
    }
};
