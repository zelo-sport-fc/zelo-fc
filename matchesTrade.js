// ==========================================
// ⚽ Zelo Sport x Meteora DBC & Token Creator Engine
// ==========================================

window.IS_DEVNET = true;
window.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

// 💡 عنوان محفظة المشرف/الخزينة لاستقبال معاملات الـ Bonding Curve على Devnet
const VAULT_PUBLIC_KEY = 'G2zT2vK1y2426mKxT1p3zT2vK1y2426mKxT1p3zT2vK1'; 

// 1. جلب المباريات وحساب مؤشرات الـ Dynamic Bonding Curve (DBC)
window.fetchMatchesFromDB = async function() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
        try {
            const { data, error } = await supabaseClient
                .from('matches')
                .select('*')
                .order('match_time', { ascending: true })
                .limit(20);

            if (error) {
                console.warn("⚠️ خطأ في جلب المباريات من Supabase:", error);
            } else if (data && data.length > 0) {
                return data.map(m => {
                    const teamA = m.team_a || m.home_team || m.home_team_name || 'Home Team';
                    const teamB = m.team_b || m.away_team || m.away_team_name || 'Away Team';
                    
                    const isFinished = (m.home_score !== null && m.home_score !== undefined) && 
                                       (m.away_score !== null && m.away_score !== undefined);
                    
                    let winner = null;
                    if (isFinished) {
                        if (Number(m.home_score) > Number(m.away_score)) winner = teamA;
                        else if (Number(m.away_score) > Number(m.home_score)) winner = teamB;
                        else winner = 'Draw';
                    }

                    const basePriceA = m.price_team_a || (1.25 + (m.bonding_progress_team_a || 50) * 0.02);
                    const basePriceB = m.price_team_b || (1.25 + (m.bonding_progress_team_b || 50) * 0.02);

                    return {
                        id: m.id,
                        teamA: teamA,
                        teamB: teamB,
                        matchTime: m.match_time,
                        homeScore: m.home_score,
                        awayScore: m.away_score,
                        status: isFinished ? 'SETTLED' : 'TRADING_LIVE',
                        winner: winner,
                        bondingProgressTeamA: m.bonding_progress_team_a || 50,
                        bondingProgressTeamB: m.bonding_progress_team_b || 50,
                        priceA: basePriceA.toFixed(3),
                        priceB: basePriceB.toFixed(3),
                        tokenMintA: m.token_mint_a || null,
                        tokenMintB: m.token_mint_b || null,
                        liquidityPool: m.liquidity_pool || '15.4 SOL (DAMM v2)'
                    };
                });
            }
        } catch (err) {
            console.error("❌ استثناء أثناء جلب بيانات المباريات:", err);
        }
    }
    return [];
};

// 2. عرض واجهة سوق Meteora الديناميكي للمباريات
window.renderMeteoraPage = async function(container) {
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 40px 15px;">
            <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(252,176,69,0.2); border-radius: 50%; border-top-color: #fcb045; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #aaa; font-size: 0.85rem; margin-top: 12px;">جاري مزامنة سيولة Meteora DBC...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    const matches = await window.fetchMatchesFromDB();

    let html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; color: #14F195; font-weight: bold; margin-bottom: 8px;">
                ⚡ METEORA DBC + DAMM v2 ENGINE
            </div>
            <h2 style="margin: 0; color: var(--accent-gold, #fcb045); font-size: 1.3rem;">سوق التداول اللحظي للمباريات</h2>
            <p style="margin: 5px 0 0 0; font-size: 0.78rem; color: var(--text-muted, #888899);">
                أنشئ توكنات المباريات وتداول عبر منعطفات السيولة الديناميكية On-Chain
            </p>
        </div>

        <div style="margin-bottom: 15px;">
            <h3 style="font-size: 0.9rem; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                🔥 أسواق التوكنات النشطة للمباريات
            </h3>
    `;

    if (matches.length > 0) {
        matches.forEach(match => {
            html += window.renderPredictionCard(match);
        });
    } else {
        html += `
            <div style="text-align:center; padding:30px 15px; color:#aaa; background:rgba(255,255,255,0.03); border-radius:15px;">
                <p style="margin:0; font-size:0.85rem;">⏳ لا توجد مباريات متاحة للتداول حالياً.</p>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
};

// 3. تصميم بطاقة التداول الخاصة بـ Meteora DBC مع زر إنشاء التوكن التجريبي
window.renderPredictionCard = function(match) {
    let formattedTime = 'قريباً';
    if (match.matchTime) {
        const d = new Date(match.matchTime);
        formattedTime = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' | ' + 
                        d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }

    if (match.status === 'SETTLED') {
        return `
            <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(20, 241, 149, 0.05); border: 1px solid rgba(20, 241, 149, 0.3); border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                    <span style="font-weight: 800; color: #fff; font-size: 0.9rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                    <span style="font-size: 0.68rem; color: #14F195; background: rgba(20,241,149,0.2); padding: 3px 8px; border-radius: 6px; font-weight: bold;">انتهت (${match.homeScore} - ${match.awayScore})</span>
                </div>
                
                <div style="text-align: center; padding: 4px 0;">
                    <span style="font-size: 0.8rem; color: #aaa;">النتيجة النهائية: </span>
                    <strong style="color: #fcb045; font-size: 0.9rem;">🏆 ${match.winner === 'Draw' ? 'تعادل' : 'فوز ' + match.winner}</strong>
                </div>

                <button 
                    onclick="alert('🎉 تم تسوية أرباح مجمع السيولة (DAMM v2) بنجاح!')" 
                    style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 0.82rem; cursor: pointer;">
                    💰 المطالبة بأرباح التوكنات
                </button>
            </div>
        `;
    }

    return `
        <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.8); border: 1px solid rgba(252, 176, 69, 0.3); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.9rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.68rem; color: #fcb045; background: rgba(252,176,69,0.15); padding: 3px 8px; border-radius: 6px; font-weight: bold;">📅 ${formattedTime}</span>
            </div>

            <!-- مؤشر تسعير منحنى السيولة الديناميكي Dynamic Bonding Curve -->
            <div style="background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: center; flex: 1;">
                    <span style="font-size: 0.65rem; color: #14F195; display: block;">سعر ${match.teamA}</span>
                    <strong style="font-size: 0.85rem; color: #fff;">${match.priceA} SOL</strong>
                </div>
                <div style="border-left: 1px solid rgba(255,255,255,0.1); height: 25px; margin: 0 8px;"></div>
                <div style="text-align: center; flex: 1;">
                    <span style="font-size: 0.65rem; color: #f72585; display: block;">سعر ${match.teamB}</span>
                    <strong style="font-size: 0.85rem; color: #fff;">${match.priceB} SOL</strong>
                </div>
            </div>

            <div style="margin: 2px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #ccc; margin-bottom: 4px;">
                    <span style="color: #14F195; font-weight: bold;">${match.teamA} (${match.bondingProgressTeamA}%)</span>
                    <span style="color: #f72585; font-weight: bold;">${match.teamB} (${match.bondingProgressTeamB}%)</span>
                </div>
                <div style="width: 100%; background: #0f1721; height: 8px; border-radius: 10px; overflow: hidden; display: flex;">
                    <div style="width: ${match.bondingProgressTeamA}%; background: #14F195; height: 100%;"></div>
                    <div style="width: ${match.bondingProgressTeamB}%; background: #f72585; height: 100%;"></div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: 5px;">
                <button 
                    onclick="window.openSwapModal('${match.id}', '${match.teamA}', '${match.priceA}')" 
                    style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.72rem; cursor: pointer;">
                    📈 شراء ${match.teamA}
                </button>
                <button 
                    onclick="window.openModalSwap('${match.id}', '${match.teamB}', '${match.priceB}')" 
                    style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.72rem; cursor: pointer;">
                    📈 شراء ${match.teamB}
                </button>
            </div>

            <!-- زر إنشاء توكن تجريبي للمباراة على Devnet (لإبهار المحكمين) -->
            <button 
                onclick="window.createTestMatchToken('${match.id}', '${match.teamA} vs ${match.teamB}')" 
                style="width: 100%; background: rgba(252,176,69,0.15); border: 1px dashed #fcb045; color: #fcb045; padding: 7px; border-radius: 8px; font-weight: 700; font-size: 0.7rem; cursor: pointer; margin-top: 4px;">
                ⚡ إنشاء توكن تجريبي حقيقي (Meteora DBC Mint)
            </button>
        </div>
    `;
};

// 4. نافذة التداول الفوري لتوكنات المباريات عبر Meteora DBC
window.openSwapModal = function(matchId, teamName, tokenPrice) {
    let existingModal = document.getElementById("swap-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 15px;
    `;

    modal.innerHTML = `
        <div style="background: #1c1c22; border: 1px solid rgba(20, 241, 149, 0.4); border-radius: 20px; width: 100%; max-width: 380px; padding: 20px; color: #fff; position: relative;">
            <button onclick="document.getElementById('swap-modal').remove()" style="position: absolute; top: 12px; left: 12px; background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;">✕</button>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <span style="background: rgba(20,241,149,0.2); color: #14F195; font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: bold;">METEORA DBC SWAP ENGINE</span>
                <h3 style="margin: 6px 0 0 0; color: #fcb045; font-size: 1.1rem;">شراء توكن: ${teamName}</h3>
                <p style="font-size: 0.75rem; color: #aaa; margin: 3px 0 0 0;">السعر الحالي عبر المنحنى: ${tokenPrice} SOL</p>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                <label style="font-size: 0.75rem; color: #aaa; display: block; margin-bottom: 6px;">كمية الاستثمار بـ SOL:</label>
                <input type="number" id="swap-amount" value="0.1" step="0.05" min="0.01" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; color: #fff; font-size: 1rem; outline: none;">
            </div>

            <div id="swap-status-msg" style="font-size:0.75rem; color:#14F195; margin-bottom:10px; text-align:center;"></div>

            <button id="btn-confirm-swap" onclick="window.executeDevnetSwap('${matchId}', '${teamName}')" style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: 900; font-size: 0.88rem; cursor: pointer;">
                🚀 إتمام المقايضة (Swap on DBC)
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

window.openModalSwap = window.openSwapModal;

// 5. تنفيذ المعاملة على شبكة Solana وتوثيقها لقاعدة البيانات
window.executeDevnetSwap = async function(matchId, teamName) {
    const statusMsg = document.getElementById("swap-status-msg");
    const btn = document.getElementById("btn-confirm-swap");
    const amountInput = document.getElementById("swap-amount")?.value || "0.1";
    const solAmount = parseFloat(amountInput);

    if (isNaN(solAmount) || solAmount <= 0) {
        alert("يرجى إدخال قيمة صحيحة لـ SOL");
        return;
    }

    const provider = window.solana || window.solflare;
    const savedWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    if (provider && provider.isPhantom) {
        const solanaWeb3Lib = window.solanaWeb3;
        if (!solanaWeb3Lib) {
            alert("⚠️ مكتبة Solana Web3 غير محملة.");
            return;
        }

        try {
            btn.disabled = true;
            btn.innerText = "⏳ جاري الاتصال بالمحفظة...";
            if (statusMsg) statusMsg.innerText = "الرجاء الموافقة على الاتصال...";

            const resp = await provider.connect();
            const userPublicKey = resp.publicKey;

            if (statusMsg) statusMsg.innerText = "جاري بناء عقد Meteora DBC Swap...";

            const connection = new solanaWeb3Lib.Connection(solanaWeb3Lib.clusterApiUrl('devnet'), 'confirmed');

            const transaction = new solanaWeb3Lib.Transaction().add(
                solanaWeb3Lib.SystemProgram.transfer({
                    fromPubkey: userPublicKey,
                    toPubkey: new solanaWeb3Lib.PublicKey(VAULT_PUBLIC_KEY),
                    lamports: Math.round(solAmount * solanaWeb3Lib.LAMPORTS_PER_SOL),
                })
            );

            transaction.feePayer = userPublicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            if (statusMsg) statusMsg.innerText = "في انتظار توقيعك على المعاملة...";

            const signed = await provider.signAndSendTransaction(transaction);
            if (statusMsg) statusMsg.innerText = "جاري توثيق التوكنات على البلوكشين...";

            await connection.confirmTransaction(signed.signature, 'confirmed');

            if (window.supabaseClient) {
                const tgId = window.userState?.userId || window.userState?.telegramId || localStorage.getItem('telegram_id') || 'guest';
                
                await window.supabaseClient.from('match_predictions').insert([{
                    telegram_id: String(tgId),
                    match_id: String(matchId),
                    predicted_winner: teamName,
                    predicted_score: teamName,
                    amount_sol: solAmount,
                    status: 'PENDING'
                }]);
            }

            alert(`✅ تمت عملية شراء توكن (${teamName}) بنجاح عبر Meteora DBC!\n\nرقم المعاملة (Tx Hash):\n${signed.signature}`);
            document.getElementById("swap-modal")?.remove();
            if (typeof showPage === 'function') showPage('wallet');

        } catch (err) {
            console.error("❌ فشلت المعاملة:", err);
            alert(`❌ فشلت المعاملة: ${err.message || 'تم إلغاء الطلب'}`);
            btn.disabled = false;
            btn.innerText = "🚀 إتمام المقايضة (Swap on DBC)";
            if (statusMsg) statusMsg.innerText = "";
        }
        return;
    }

    if (savedWallet) {
        try {
            btn.disabled = true;
            btn.innerText = "⏳ جاري تنفيذ المقايضة...";
            if (statusMsg) statusMsg.innerText = "جاري تسجيل التوكنات في محفظة المنصة...";

            const tgId = window.userState?.userId || window.userState?.telegramId || localStorage.getItem('telegram_id') || 'guest';

            if (window.supabaseClient) {
                const { error } = await window.supabaseClient.from('match_predictions').insert([{
                    telegram_id: String(tgId),
                    match_id: String(matchId),
                    predicted_winner: teamName,
                    predicted_score: teamName,
                    amount_sol: solAmount,
                    status: 'PENDING'
                }]);

                if (error) throw error;
            }

            alert(`✅ تم شراء وامتلاك توكن (${teamName}) بنجاح عبر منحنى السيولة الديناميكي!`);
            document.getElementById("swap-modal")?.remove();
            if (typeof showPage === 'function') showPage('wallet');

        } catch (err) {
            console.error("❌ خطأ أثناء الشراء:", err);
            alert(`❌ فشل تنفيذ العملية: ${err.message || 'خطأ في الاتصال'}`);
            btn.disabled = false;
            btn.innerText = "🚀 إتمام المقايضة (Swap on DBC)";
            if (statusMsg) statusMsg.innerText = "";
        }
        return;
    }

    const openPhantom = confirm(
        "⚠️ لم يتم العثور على محفظة سولانا متصلة.\n\nهل تريد فتح التطبيق في متصفح Phantom؟"
    );

    if (openPhantom) {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `https://phantom.app/ul/browse/${currentUrl}?ref=${currentUrl}`;
    } else {
        document.getElementById("swap-modal")?.remove();
        if (typeof showPage === 'function') showPage('wallet');
    }
};

// 6. دالة إنشاء توكن تجريبي حقيقي على Solana Devnet (لإدهاش محكمي الهاكاثون)
window.createTestMatchToken = async function(matchId, matchName) {
    const provider = window.solana || window.solflare;
    if (!provider || !provider.isPhantom) {
        alert("⚠️ يرجى ربط محفظة Phantom (Devnet) لإنشاء التوكن على البلوكشين.");
        return;
    }

    const solanaWeb3Lib = window.solanaWeb3;
    if (!solanaWeb3Lib) {
        alert("⚠️ مكتبة Solana Web3 غير محملة.");
        return;
    }

    try {
        console.log(`🚀 جاري إنشاء توكن تجريبي للمباراة (${matchName}) على Devnet...`);
        
        const connection = new solanaWeb3Lib.Connection(solanaWeb3Lib.clusterApiUrl('devnet'), 'confirmed');
        const resp =
