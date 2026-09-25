// ==========================================
// 👛 ملف قسم المحفظة (Wallet) - نسخة الدعم المزدوج (TON + Solana) 💎
// ==========================================

function renderWalletPage(container) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
    // ستايلات التصميم الزجاجي
    const walletStyles = `
        <style>
            .wallet-glass-card {
                background: linear-gradient(135deg, rgba(28, 28, 34, 0.7), rgba(18, 18, 22, 0.8));
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 24px;
                padding: 30px 20px;
                text-align: center;
                box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 2px 20px rgba(255,255,255,0.02);
                position: relative;
                overflow: hidden;
                margin-bottom: 20px;
            }
            .wallet-glass-card::before {
                content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                background: radial-gradient(circle, rgba(0, 136, 204, 0.1) 0%, transparent 60%);
                pointer-events: none;
                animation: slowRotate 10s linear infinite;
            }
            @keyframes slowRotate {
                100% { transform: rotate(360deg); }
            }

            .wallet-logo-container {
                position: relative;
                width: 65px; height: 65px;
                margin: 0 auto 15px auto;
                background: rgba(255,255,255,0.05);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 20px rgba(0, 136, 204, 0.2);
                border: 2px solid rgba(0, 136, 204, 0.3);
                z-index: 1;
            }

            .address-box-glass {
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(0, 136, 204, 0.2);
                padding: 10px 16px;
                border-radius: 12px;
                margin-bottom: 15px;
                display: inline-block;
                box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
                position: relative; z-index: 1;
            }

            .balance-box-glass {
                background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                border: 1px solid rgba(255,255,255,0.05);
                padding: 15px;
                border-radius: 16px;
                margin-bottom: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                position: relative; z-index: 1;
            }

            .btn-glass-ton {
                background: linear-gradient(135deg, #0088cc, #005580);
                color: white; border: none; border-radius: 14px;
                padding: 14px 20px; font-weight: 900; font-size: 1rem;
                cursor: pointer; box-shadow: 0 8px 20px rgba(0, 136, 204, 0.4);
                transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
                position: relative; z-index: 1; width: 100%;
            }

            .btn-glass-solana {
                background: linear-gradient(135deg, #9945FF, #14F195);
                color: white; border: none; border-radius: 14px;
                padding: 14px 20px; font-weight: 900; font-size: 1rem;
                cursor: pointer; box-shadow: 0 8px 20px rgba(153, 69, 255, 0.3);
                transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
                position: relative; z-index: 1; width: 100%; margin-top: 10px;
            }

            .solana-input {
                width: 100%;
                padding: 12px 15px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(153, 69, 255, 0.4);
                border-radius: 12px;
                color: #fff;
                font-family: monospace;
                font-size: 0.9rem;
                box-sizing: border-box;
                margin-bottom: 10px;
                text-align: center;
            }

            .btn-glass-danger {
                background: rgba(253, 29, 29, 0.1);
                color: #fd1d1d; border: 1px solid rgba(253, 29, 29, 0.3);
                border-radius: 12px; padding: 10px 15px; font-weight: bold;
                cursor: pointer; transition: all 0.3s; position: relative; z-index: 1;
            }
            
            .btn-glass-copy {
                background: rgba(255, 255, 255, 0.05);
                color: #fff; border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px; padding: 10px 15px; font-weight: bold;
                cursor: pointer; transition: all 0.3s; position: relative; z-index: 1;
            }
        </style>
    `;

    // جلب بيانات محفظة سولانا المخزنة محلياً أو في حالة المستخدم
    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) ? userState.solanaWallet : '';

    container.innerHTML = `
        ${walletStyles}
        
        <!-- SECTION 1: TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid rgba(0, 136, 204, 0.5);">
            <div class="wallet-logo-container">
                <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" alt="TON" style="width: 35px; height: 35px; object-fit: contain;">
            </div>
            <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem; font-weight: 900;">
                ${isAr ? 'محفظة تليجرام (TON Network)' : 'Telegram Wallet (TON)'}
            </h3>
            
            ${userState.walletConnected ? `
                <div class="address-box-glass">
                    <span style="font-family: monospace; font-size: 0.9rem; color: #0088cc; font-weight: 900;">
                        ${userState.walletAddress.slice(0, 6)}...${userState.walletAddress.slice(-6)}
                    </span>
                </div>
                <div class="balance-box-glass">
                    <span style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 5px; font-weight: bold;">
                        ${isAr ? 'رصيد TON' : 'TON Balance'}
                    </span>
                    <h2 id="real-ton-balance" style="margin: 0; font-size: 1.8rem; color: #fff; font-weight: 900; font-family: monospace;">⏳</h2>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-glass-copy" onclick="copyToClipboard('${userState.walletAddress}')">📋 ${isAr ? 'نسخ' : 'Copy'}</button>
                    <button class="btn-glass-danger" onclick="triggerDisconnect()">🔌 ${isAr ? 'فصل' : 'Disconnect'}</button>
                </div>
            ` : `
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 20px;">
                    ${isAr ? 'ربط محفظة تليجرام السريعة المعالجة' : 'Connect secure Telegram Wallet for fast transactions'}
                </p>
                <button class="btn-glass-ton" onclick="triggerConnect()">
                    <span>💎</span> ${isAr ? 'ربط TON Wallet' : 'Connect TON Wallet'}
                </button>
            `}
        </div>

        <!-- SECTION 2: SOLANA WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid rgba(153, 69, 255, 0.5);">
            <div class="wallet-logo-container" style="border-color: rgba(153, 69, 255, 0.4); box-shadow: 0 0 20px rgba(153, 69, 255, 0.2);">
                <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="Solana" style="width: 35px; height: 35px; object-fit: contain;">
            </div>
            <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem; font-weight: 900;">
                ${isAr ? 'محفظة سولانا (Rewards Wallet)' : 'Solana Rewards Wallet'}
            </h3>
            
            <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">
                ${isAr ? 'أدخل عنوان Solana لتلقي جوائز التوقعات وتوكن $LAJI' : 'Enter Solana address to receive prediction rewards & $LAJI tokens'}
            </p>

            <input type="text" id="solana-address-input" class="solana-input" 
                   placeholder="${isAr ? 'أدخل عنوان Solana SPL...' : 'Enter Solana SPL address...'}" 
                   value="${solanaWallet}">

            <button class="btn-glass-solana" onclick="saveSolanaWalletAddress()">
                <span>⚡</span> ${isAr ? 'حفظ محفظة Solana' : 'Save Solana Wallet'}
            </button>
        </div>
        
        <div style="height: 30px;"></div>
    `;

    if (userState.walletConnected) {
        fetchRealTonBalance(userState.walletAddress);
    }
}

// ==========================================
// ⚡ دالة حفظ محفظة Solana في قاعدة البيانات
// ==========================================
window.saveSolanaWalletAddress = async function() {
    const input = document.getElementById('solana-address-input');
    if (!input) return;

    const solAddress = input.value.trim();
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');

    if (!solAddress || solAddress.length < 32) {
        alert(isAr ? 'يرجى إدخال عنوان محفظة سولانا صحيح!' : 'Please enter a valid Solana wallet address!');
        return;
    }

    try {
        if (typeof userState !== 'undefined') userState.solanaWallet = solAddress;

        if (typeof supabaseClient !== 'undefined' && userState.userId) {
            const { error } = await supabaseClient
                .from('users')
                .update({ solana_wallet: solAddress })
                .eq('telegram_id', userState.userId);

            if (error) throw error;
        }

        alert(isAr ? '✅ تم حفظ محفظة Solana بنجاح!' : '✅ Solana wallet saved successfully!');
    } catch (err) {
        console.error("خطأ في حفظ محفظة سولانا:", err);
        alert(isAr ? 'حدث خطأ أثناء الحفظ.' : 'Error saving address.');
    }
};

// ==========================================
// 🔄 دالة جلب الرصيد الحقيقي من بلوك تشين TON
// ==========================================
async function fetchRealTonBalance(walletAddress) {
    try {
        const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${walletAddress}`);
        const data = await response.json();
        
        if (data.ok) {
            const balanceInTon = (parseInt(data.result) / 1000000000).toFixed(3);
            const balanceElement = document.getElementById('real-ton-balance');
            if(balanceElement) {
                balanceElement.innerHTML = `${balanceInTon} <span style="color:#0088cc; font-size:1.1rem;">TON</span>`;
            }
        } else {
            const balanceElement = document.getElementById('real-ton-balance');
            if(balanceElement) balanceElement.innerHTML = '0.000 <span style="color:#0088cc; font-size:1.1rem;">TON</span>';
        }
    } catch (error) {
        console.error("خطأ في جلب رصيد المحفظة:", error);
    }
}

// ==========================================
// 💾 دوال حفظ وحذف المحفظة من قاعدة البيانات (TON)
// ==========================================
window.saveWalletAddressToDB = async function(walletAddress) {
    if (typeof supabaseClient === 'undefined' || !walletAddress || !userState.userId) return;
    try {
        await supabaseClient.from('users').update({ wallet_address: walletAddress }).eq('telegram_id', userState.userId);
    } catch (err) { console.error(err); }
};

window.removeWalletAddressFromDB = async function() {
    if (typeof supabaseClient === 'undefined' || !userState.userId) return;
    try {
        await supabaseClient.from('users').update({ wallet_address: null }).eq('telegram_id', userState.userId);
    } catch (err) { console.error(err); }
};

function triggerConnect() {
    if (typeof tonConnectUI !== "undefined" && tonConnectUI) {
        tonConnectUI.openModal().catch(err => console.error("Error", err));
    }
}

function triggerDisconnect() {
    if (typeof tonConnectUI !== "undefined" && tonConnectUI && tonConnectUI.connected) {
        if(confirm(t('alertDisconnect'))) {
            tonConnectUI.disconnect().then(async () => {
                await window.removeWalletAddressFromDB();
                alert(t('alertDisconnected'));
                showPage('wallet');
            });
        }
    }
}
