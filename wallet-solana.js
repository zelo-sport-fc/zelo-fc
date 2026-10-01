// ==========================================
// 🟣 Zelo Sport - Solana Module & Wallet Renderer (wallet-solana.js)
// ==========================================

const COINS_PER_ZELO_TOKEN = 100;
const MIN_CLAIM_LIMIT = 1000; // 🎯 الحد الأدنى للسحب/المطالبة
const BACKEND_URL = "https://zelo-fc.onrender.com";
const TOKEN_NAME = "ZELOFC";

// 1. تحميل مكتبة Solana Web3 بصورة آمنة
if (!window.solanaWeb3 && !document.getElementById('solana-web3-script')) {
    const script = document.createElement('script');
    script.id = 'solana-web3-script';
    script.src = 'https://unpkg.com/@solana/web3.js@1.98.0/lib/index.iife.min.js';
    document.head.appendChild(script);
}

// دالة مساعدة للحصول على معرف التلجرام
function getTelegramId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        if (tgUser.id) {
            const tgIdStr = String(tgUser.id);
            localStorage.setItem('telegram_id', tgIdStr);
            if (typeof userState !== 'undefined') userState.telegramId = tgIdStr;
            return tgIdStr;
        }
    }

    if (typeof userState !== 'undefined' && userState.telegramId && userState.telegramId !== 'guest') {
        return String(userState.telegramId);
    }

    const localId = localStorage.getItem('telegram_id');
    if (localId && localId !== 'guest') {
        return localId;
    }

    return 'guest';
}

// 2. دالة بناء الواجهة الرئيسيّة للمحفظة
async function renderWalletPage(container) {
    if (!container) return;

    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : Number(localStorage.getItem('user_coins') || 0);

    const canClaim = userCoins >= MIN_CLAIM_LIMIT;
    const neededCoins = MIN_CLAIM_LIMIT - userCoins;

    const txtTonWallet = isAr ? 'محفظة TON' : 'TON Wallet';
    const txtSolanaWallet = isAr ? 'محفظة Solana (Devnet)' : 'Solana Wallet (Devnet)';
    const txtConnected = isAr ? '● متصل' : '● Connected';
    const txtConnectTon = isAr ? 'ربط محفظة تلغرام 💎' : 'Connect Telegram Wallet 💎';
    const txtCopy = isAr ? '📋 نسخ' : '📋 Copy';
    const txtDisconnect = isAr ? '🔌 فصل' : '🔌 Disconnect';
    const txtOnChainSol = isAr ? 'رصيد SOL (Devnet):' : 'On-Chain SOL (Devnet):';
    const txtChecking = isAr ? '⏳ جاري الفحص...' : '⏳ Checking...';
    const txtAutoConnectPhantom = isAr ? 'ربط تلقائي لمحفظة Phantom' : 'Auto Connect Phantom';
    const txtPlaceholderSol = isAr ? 'أو ألصق عنوان محفظة Solana...' : 'Or paste Solana address...';
    const txtSaveAddress = isAr ? '💾 حفظ العنوان' : '💾 Save Address';
    const txtBalanceTitle = isAr ? `رصيد ${TOKEN_NAME}` : `${TOKEN_NAME} Balance`;
    const txtTotalEarned = isAr ? 'إجمالي المكتسب:' : 'Total Earned:';
    const txtTradeSectionTitle = isAr ? '📊 توكنات المباريات والتخمينات الحالية' : '📊 Match Tokens & Active Predictions';

    let txtClaimBtn = '';
    if (canClaim) {
        txtClaimBtn = isAr ? `مطالبة برصيد رمزي ${TOKEN_NAME} ⚡` : `Claim ${TOKEN_NAME} Tokens ⚡`;
    } else {
        txtClaimBtn = isAr 
            ? `الحد الأدنى ${MIN_CLAIM_LIMIT.toLocaleString('en-US')} (تحتاج ${neededCoins.toLocaleString('en-US')} إضافية) 🔒`
            : `Min Claim: ${MIN_CLAIM_LIMIT.toLocaleString('en-US')} (Need ${neededCoins.toLocaleString('en-US')} more) 🔒`;
    }

    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const tonWallet = (typeof userState !== 'undefined' && userState.tonWallet)
        ? userState.tonWallet
        : (localStorage.getItem('ton_wallet_address') || '');

    const isTonConnected = !!(tonWallet || (window.tonConnectUI && window.tonConnectUI.connected));

    if (typeof userState !== 'undefined') {
        userState.points = userCoins;
        userState.solanaWallet = solanaWallet;
        userState.tonWallet = tonWallet;
        userState.walletConnected = isTonConnected;
    }

    const solanaSpecificStyles = `
        <style>
            .wallet-glass-card {
                background: rgba(28, 28, 34, 0.7);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 14px;
                margin-bottom: 14px;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .wallet-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .wallet-logo-title { display: flex; align-items: center; gap: 8px; }
            .wallet-logo-sm { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.2); }
            .address-box-sm { background: rgba(0,0,0,0.4); padding: 8px; border-radius: 8px; font-family: monospace; font-size: 0.82rem; text-align: center; margin-bottom: 10px; word-break: break-all; }
            .btn-action-sm { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; }
            .btn-danger-sm { background: rgba(253,29,29,0.15); border: 1px solid rgba(253,29,29,0.3); color: #fd1d1d; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; }
            .btn-glass-ton { background: linear-gradient(135deg, #0088cc, #005588); color: white; border: none; border-radius: 10px; padding: 10px; width: 100%; font-weight: bold; cursor: pointer; }
            .btn-glass-solana { background: linear-gradient(135deg, #AB9FF2, #512DA8); color: white; border: none; border-radius: 10px; padding: 10px 14px; font-weight: bold; font-size: 0.88rem; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px; }
            .solana-input-sm { width: 100%; padding: 10px; background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(171, 159, 242, 0.3); border-radius: 8px; color: #fff; font-family: monospace; font-size: 0.82rem; box-sizing: border-box; margin-bottom: 8px; text-align: center; outline: none; }
            .btn-claim-main { background: linear-gradient(135deg, #14F195, #00B4D8); color: #000; border: none; border-radius: 12px; padding: 12px 16px; font-size: 0.95rem; font-weight: 900; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 15px rgba(20, 241, 149, 0.3); }
            .btn-claim-main:disabled { background: #33333e; color: #888; cursor: not-allowed; box-shadow: none; border: 1px solid rgba(255,255,255,0.1); }
        </style>
    `;

    container.innerHTML = `
        ${solanaSpecificStyles}
        
        <!-- 1. TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #0088cc;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:18px;height:18px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${txtTonWallet}</span>
                </div>
                ${isTonConnected ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">${txtConnected}</span>` : ''}
            </div>

            ${isTonConnected ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${tonWallet ? tonWallet.slice(0, 8) + '...' + tonWallet.slice(-8) : 'Connected'}
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${tonWallet}')">${txtCopy}</button>
                    <button class="btn-danger-sm" onclick="triggerDisconnect()">${txtDisconnect}</button>
                </div>
            ` : `
                <button class="btn-glass-ton" onclick="triggerConnect()">
                    <span>💎</span> ${txtConnectTon}
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
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${txtSolanaWallet}</span>
                </div>
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">${txtOnChainSol}</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:0.95rem;">${txtChecking}</span>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">${txtCopy}</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">${txtDisconnect}</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:16px; height:16px;" alt="Phantom">
                    ${txtAutoConnectPhantom}
                </button>

                <input type="text" id="solana-address-input" class="solana-input-sm" placeholder="${txtPlaceholderSol}">

                <button id="btn-save-sol-addr" class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.4); background: rgba(171, 159, 242, 0.15);" onclick="saveSolanaWalletAddress()">
                    ${txtSaveAddress}
                </button>
            `}
        </div>

        <!-- 3. MATCH TOKENS & PREDICTIONS PORTFOLIO (جديد ⚡) -->
        <div class="wallet-glass-card" style="border-top: 2px solid #14F195;">
            <div class="wallet-header-flex">
                <span style="color:#fff; font-weight:bold; font-size:0.9rem;">${txtTradeSectionTitle}</span>
                <button onclick="showPage('meteora')" style="background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); color: #14F195; border-radius: 6px; padding: 3px 8px; font-size: 0.7rem; cursor: pointer; font-weight: bold;">
                    🚀 تداول الآن
                </button>
            </div>
            <div id="user-tokens-list" style="font-size: 0.8rem; color: #aaa; text-align: center; padding: 10px 0;">
                ⏳ جاري تحميل صفقات التوكنز...
            </div>
        </div>

        <!-- 4. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.85), rgba(18, 18, 22, 0.95));">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${txtBalanceTitle}</span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">${txtTotalEarned}</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString('en-US')} ${TOKEN_NAME}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()" ${!canClaim ? 'disabled' : ''}>
                ${txtClaimBtn}
            </button>
        </div>
        
        <div style="height: 20px;"></div>
    `;

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
        fetchUserMatchTokens(solanaWallet);
    } else {
        const tokenListEl = document.getElementById('user-tokens-list');
        if (tokenListEl) tokenListEl.innerText = "💡 قم بربط محفظة Solana لرؤية توكنات المباريات التي تملكها.";
    }
}

window.renderWalletPage = renderWalletPage;

// 3. جلب رصيد Solana التجريبي On-Chain
async function fetchRealSolanaBalance(address) {
    const el = document.getElementById('real-solana-balance');
    try {
        if (window.solanaWeb3) {
            const connection = new window.solanaWeb3.Connection('https://api.devnet.solana.com', 'confirmed');
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

// 4. جلب وعرض توكنات المباريات الخاصة بالمستخدم من Supabase (جديد ⚡)
async function fetchUserMatchTokens(walletAddress) {
    const listEl = document.getElementById('user-tokens-list');
    if (!listEl) return;

    if (!window.supabaseClient) {
        listEl.innerHTML = `<span style="color: #888;">لا تتوفر صفقات حالية.</span>`;
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('match_predictions')
            .select('*')
            .eq('wallet_address', walletAddress)
            .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            listEl.innerHTML = `<span style="color: #888;">لم تقم بتخمين/شراء توكنات مباريات بعد.</span>`;
            return;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        data.forEach(item => {
            const txShort = item.tx_hash ? `${item.tx_hash.slice(0, 6)}...${item.tx_hash.slice(-6)}` : 'On-Chain';
            html += `
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; text-align: right;">
                    <div>
                        <div style="color: #fcb045; font-weight: bold; font-size: 0.82rem;">⚽ فريق: ${item.selected_team}</div>
                        <div style="color: #666; font-size: 0.68rem; font-family: monospace;">Tx: ${txShort}</div>
                    </div>
                    <div style="text-align: left;">
                        <span style="color: #14F195; font-weight: bold; font-size: 0.85rem;">+${item.amount_sol} SOL</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        listEl.innerHTML = html;

    } catch (err) {
        console.error("Error fetching match tokens:", err);
        listEl.innerHTML = `<span style="color: #888;">خطأ في قراءة بيانات التوكنات.</span>`;
    }
}

// 5. حفظ المحفظة والسيرفر
async function saveSolanaAddressToStateAndDB(solAddress, walletType = 'solana') {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const saveBtn = document.getElementById('btn-save-sol-addr');

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = isAr ? '⏳ جاري الحفظ...' : '⏳ Saving...';
        }

        const telegramId = getTelegramId();

        const response = await fetch(`${BACKEND_URL}/api/save-wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: telegramId,
                walletType: walletType,
                walletAddress: solAddress
            })
        });

        const resData = await response.json().catch(() => ({}));

        if (response.ok && resData.success) {
            if (walletType === 'solana') {
                localStorage.setItem('solana_wallet', solAddress);
                if (typeof userState !== 'undefined') {
                    userState.solanaWallet = solAddress;
                }
            } else {
                localStorage.setItem('ton_wallet_address', solAddress);
                if (typeof userState !== 'undefined') {
                    userState.tonWallet = solAddress;
                }
            }

            if (typeof showPage === 'function') showPage('wallet');
            alert(isAr ? '✅ تم حفظ المحفظة بنجاح!' : '✅ Wallet saved successfully!');
        } else {
            throw new Error(resData.error || resData.message || (isAr ? 'فشل حفظ العنوان في السيرفر' : 'Failed to save address to server'));
        }
    } catch (err) {
        console.error("Save Wallet Error:", err);
        alert(`❌ ${err.message}`);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = isAr ? '💾 حفظ العنوان' : '💾 Save Address';
        }
    }
}

// 6. ربط Phantom تلقائياً
window.connectPhantomWallet = function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            saveSolanaAddressToStateAndDB(res.publicKey.toString(), 'solana');
        }).catch((err) => console.error(err));
    } else {
        alert(isAr ? 'يرجى فتح التطبيق داخل متصفح Phantom أو إدخال العنوان يدوياً.' : 'Please open the app in Phantom Browser or enter address manually.');
    }
};

// 7. التحقق وحفظ العنوان يدوياً
window.saveSolanaWalletAddress = function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    if (solanaRegex.test(solAddress)) {
        saveSolanaAddressToStateAndDB(solAddress, 'solana');
    } else {
        alert(isAr ? '⚠️ يرجى إدخال عنوان محفظة Solana صحيح (Base58).' : '⚠️ Please enter a valid Solana wallet address.');
    }
};

// 8. المطالبة بالنقاط والتحويل
window.claimCoinsToSolanaWallet = async function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');

    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined) 
        ? Number(userState.points) 
        : Number(localStorage.getItem('user_coins') || 0);

    if (userCoins < MIN_CLAIM_LIMIT) {
        alert(isAr 
            ? `⚠️ الحد الأدنى للسحب هو ${MIN_CLAIM_LIMIT.toLocaleString('en-US')} نقطة.` 
            : `⚠️ Minimum claim limit is ${MIN_CLAIM_LIMIT.toLocaleString('en-US')} points.`);
        return;
    }

    const telegramId = getTelegramId();
    const claimBtn = document.getElementById('btn-claim-action');

    if (!solWallet) {
        alert(isAr ? '⚠️ يرجى ربط محفظة Solana أولاً!' : '⚠️ Please connect Solana Wallet first!');
        return;
    }

    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);

    const confirmClaim = confirm(
        isAr 
        ? `تأكيد خصم ${userCoins.toLocaleString('en-US')} نقطة لاستلام ${tokenAmountToReceive} من رمز ${TOKEN_NAME}؟`
        : `Confirm deducting ${userCoins.toLocaleString('en-US')} to receive ${tokenAmountToReceive} ${TOKEN_NAME} tokens?`
    );

    if (!confirmClaim) return;

    try {
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = isAr ? '⏳ جاري المعالجة والتحويل...' : '⏳ Processing transfer...';
        }

        const response = await fetch(`${BACKEND_URL}/api/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                telegramId: telegramId,
                userWalletAddress: solWallet
            })
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            const remainingCoins = result.newBalance !== undefined ? result.newBalance : 0;
            
            localStorage.setItem('user_coins', remainingCoins);
            if (typeof userState !== 'undefined') {
                userState.points = remainingCoins;
            }

            if (typeof showPage === 'function') showPage('wallet');

            alert(isAr 
                ? `✅ تم بنجاح! تم تحويل الرموز على الشبكة!\n\nمعرف المعاملة (Tx Hash):\n${result.txHash}` 
                : `✅ Success! Tokens transferred On-Chain!\n\nTx Hash:\n${result.txHash}`);
        } else {
            let errorDetails = result?.error || result?.message || `HTTP ${response.status}`;
            alert(isAr ? `❌ فشلت عملية التحويل:\n${errorDetails}` : `❌ Transfer failed:\n${errorDetails}`);
        }

    } catch (error) {
        console.error("Claim Error:", error);
        alert(isAr ? `❌ خطأ في الاتصال بالسيرفر:\n${error.message}` : `❌ Server connection error:\n${error.message}`);
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = isAr ? `مطالبة برصيد رمزي ${TOKEN_NAME} ⚡` : `Claim ${TOKEN_NAME} Tokens ⚡`;
        }
    }
};

// 9. الفصل والنسخ
window.disconnectSolanaWallet = function() {
    localStorage.removeItem('solana_wallet');
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = '';
    }
    if (typeof showPage === 'function') showPage('wallet');
};

window.copyToClipboard = function(text) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    const msg = isAr ? 'تم نسخ العنوان بنجاح!' : 'Address copied to clipboard!';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert(msg));
    } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert(msg);
    }
};
