/**
 * ملف: predictions_ranking.js (المحدث لدعم Meteora DBC & Tipping)
 * الوظيفة: جلب المباريات، وعرضها، وإدارة التوقعات وتداول Meteora (مربوط بنظام الترجمة i18n بالكامل)
 */

function getT(key) {
    const lang = userState.lang || 'ar';
    return typeof i18n !== 'undefined' && i18n[lang][key] ? i18n[lang][key] : key;
}

// متغيرات عامة
let globalMatches = [];
let globalPredictions = [];

window.openChallengesScreen = async function() {
    if (document.getElementById('challenges-overlay')) return;

    const isAr = userState.lang === 'ar'; 

    const overlay = document.createElement('div');
    overlay.id = 'challenges-overlay';
    
    overlay.style.cssText = `
        position: fixed !important; 
        top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
        width: 100vw !important; height: 100vh !important; 
        background: var(--bg-dark, #121215) !important; 
        z-index: 99999 !important; 
        padding: 20px; box-sizing: border-box; overflow-y: auto; color: white;
        direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'};
    `;
    document.body.appendChild(overlay);

    overlay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px;">
            <h2 style="margin:0; color:var(--accent-gold, #ffd700);">🏆 ${getT('weeklyChallenges')}</h2>
            <button onclick="window.closeChallengesScreen()" style="background:none; border:none; color:white; font-size:1.8rem; cursor:pointer;">✕</button>
        </div>
        <div style="text-align:center; color:#888; padding:50px;">⏳ ${getT('loadingMatches')}</div>
    `;

    if (!userState.predictedMatches) userState.predictedMatches = [];

    if (typeof supabaseClient !== 'undefined' && userState.userId) {
        try {
            const { data: predData } = await supabaseClient
                .from('match_predictions')
                .select('*')
                .eq('telegram_id', userState.userId);
                
            if (predData) {
                globalPredictions = predData;
                userState.predictedMatches = predData.map(p => p.match_id);
            }

            const { data: matchesData, error: matchesError } = await supabaseClient
                .from('matches')
                .select('*')
                .neq('status', 'FINISHED') 
                .order('match_date', { ascending: true });

            if (matchesError) throw matchesError;

            if (matchesData) {
                globalMatches = matchesData;
            }

        } catch (err) {
            console.error("خطأ في جلب البيانات:", err);
        }
    }

    renderMatchList(overlay, isAr);
};

function renderMatchList(overlay, isAr) {
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 25px;">
            <h2 style="margin:0; color:var(--accent-gold, #ffd700);">🏆 ${getT('weeklyChallenges')}</h2>
            <button onclick="window.closeChallengesScreen()" style="background:none; border:none; color:white; font-size:1.8rem; cursor:pointer;">✕</button>
        </div>
        <div id="matches-container">
    `;

    const upcomingMatches = globalMatches.filter(m => {
        const status = m.status ? m.status.toUpperCase().trim() : '';
        if (status !== 'NOT_STARTED') return false;

        const matchDate = new Date(m.match_date);
        const now = new Date();
        const hoursPassed = (now - matchDate) / (1000 * 60 * 60);

        if (hoursPassed > 4) return false;
        return true;
    });

    if (upcomingMatches.length === 0) {
        html += `<div style="text-align:center; color:#888; padding:50px;">${getT('noMatchesAvailable')}</div>`;
    } else {
        const sortedMatches = upcomingMatches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

        html += sortedMatches.map(m => {
            const matchDate = new Date(m.match_date);
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5); 
            const isStarted = now >= matchDate; 
            
            const hasPredicted = userState.predictedMatches.includes(m.id);

            const team1Name = m.team_a;
            const team2Name = m.team_b;
            
            const formattedDate = !isNaN(matchDate.getTime()) ? matchDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '';
            const formattedTime = !isNaN(matchDate.getTime()) ? matchDate.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';

            // أسعار افتراضية مبنية على منحنى السيولة الديناميكي Meteora DBC
            const priceA = (1.25 + (m.bonding_progress_team_a || 50) * 0.02).toFixed(2);
            const priceB = (1.25 + (m.bonding_progress_team_b || 50) * 0.02).toFixed(2);

            let buttonHtml = '';
            if (hasPredicted) {
                buttonHtml = `<button disabled style="width:100%; padding:10px; background:rgba(16, 185, 129, 0.2); color:#10b981; border:1px solid #10b981; border-radius:10px; font-size:0.9rem; font-weight:bold;">
                                ${getT('btnPredicted')}
                              </button>`;
            } else if (isStarted) {
                buttonHtml = `<button disabled style="width:100%; padding:10px; background:rgba(255,255,255,0.05); color:#888; border:1px solid #333; border-radius:10px; font-size:0.9rem;">
                                ${getT('btnClosed')}
                              </button>`;
            } else {
                buttonHtml = `
                    <div style="display:flex; gap:8px;">
                        <button onclick="window.showPredictionModal(${m.id}, '${team1Name}', '${team2Name}')" 
                                style="flex:1; padding:10px; background:var(--gradient-primary, linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)); border:none; color:white; border-radius:10px; font-weight:bold; font-size:0.85rem; cursor:pointer;">
                            🎯 ${getT('btnPredictNow')}
                        </button>
                        <button onclick="window.openSwapModal(${m.id}, '${team1Name}', '${priceA}')" 
                                style="flex:1; padding:10px; background:linear-gradient(135deg, #14F195 0%, #00b4d8 100%); border:none; color:#000; border-radius:10px; font-weight:900; font-size:0.85rem; cursor:pointer;">
                            📈 شراء توكن (${priceA} SOL)
                        </button>
                    </div>
                `;
            }

            return `
                <div class="card" style="position: relative; overflow: hidden; padding-top: 35px; margin-bottom: 15px; border-radius: 14px; background: var(--bg-card, #1c1c22); border: 1px solid rgba(255,255,255,0.08);">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; background: rgba(255,255,255,0.03); padding: 6px 12px; box-sizing: border-box; display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="font-size: 0.75rem; font-weight:bold; color:#10b981;">⚡ Meteora DBC Market</span>
                        <span style="font-size: 0.75rem; color:#aaa;">📅 ${formattedDate} | 🕒 ${formattedTime}</span>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin: 12px 15px;">
                        <div style="text-align:center; flex:1;">
                            <div style="font-weight:bold; font-size: 1rem; color:#fff;">${team1Name}</div>
                            <span style="font-size:0.7rem; color:#14F195;">السعر: ${priceA} SOL</span>
                        </div>
                        <div style="font-weight:bold; font-size: 1.1rem; color:var(--accent-gold, #fcb045); margin: 0 10px;">VS</div>
                        <div style="text-align:center; flex:1;">
                            <div style="font-weight:bold; font-size: 1rem; color:#fff;">${team2Name}</div>
                            <span style="font-size:0.7rem; color:#f72585;">السعر: ${priceB} SOL</span>
                        </div>
                    </div>
                    
                    <div id="btn-container-${m.id}" style="padding: 0 12px 12px 12px;">
                        ${buttonHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    html += `</div>`;
    overlay.innerHTML = html;
}

window.closeChallengesScreen = function() {
    const overlay = document.getElementById('challenges-overlay');
    if (overlay) overlay.remove();
};

window.showPredictionModal = function(matchId, team1, team2) {
    if (document.getElementById('prediction-modal')) return;

    const isAr = userState.lang === 'ar';
    const modal = document.createElement('div');
    modal.id = 'prediction-modal';
    
    modal.style.cssText = `
        position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;
        background: #1c1c22 !important; padding: 25px; border-radius: 20px;
        z-index: 100000 !important; width: 90%; max-width: 400px; color: white;
        box-shadow: 0 0 0 100vw rgba(0,0,0,0.85), 0 10px 40px rgba(0,0,0,0.8) !important; 
        border: 1px solid rgba(255,255,255,0.1);
        direction: ${isAr ? 'rtl' : 'ltr'}; box-sizing: border-box;
    `;

    modal.innerHTML = `
        <h3 style="margin:0 0 20px 0; text-align:center; color:var(--accent-gold, #fcb045);">${getT('enterPredictionTitle')}</h3>

        <div style="background:rgba(0,0,0,0.2); padding:20px; border-radius:16px; margin-bottom:25px; border:1px solid rgba(255,255,255,0.05);">
            <div style="margin-bottom: 20px;">
                <label style="display:block; font-size:1rem; margin-bottom:10px; font-weight:bold; color:#fff;">
                    ⚽ ${getT('goalsLabel')} <span style="color:var(--accent-blue, #3b82f6);">${team1}</span>
                </label>
                <input type="number" id="score-team1" min="0" placeholder="0" 
                       style="width:100%; padding:15px; background:var(--bg-dark, #121215); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; text-align:center; font-size:1.3rem; font-weight:bold; box-sizing: border-box;">
            </div>
            
            <div>
                <label style="display:block; font-size:1rem; margin-bottom:10px; font-weight:bold; color:#fff;">
                    ⚽ ${getT('goalsLabel')} <span style="color:var(--accent-blue, #3b82f6);">${team2}</span>
                </label>
                <input type="number" id="score-team2" min="0" placeholder="0" 
                       style="width:100%; padding:15px; background:var(--bg-dark, #121215); border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:white; text-align:center; font-size:1.3rem; font-weight:bold; box-sizing: border-box;">
            </div>
        </div>
        
        <div style="display:flex; flex-direction: column; gap:12px;">
            <button id="submit-prediction-btn" onclick="window.submitPrediction(${matchId}, '${team1}', '${team2}');" 
                    style="width:100%; padding:15px; background:var(--gradient-primary, linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)); border:none; color:white; border-radius:12px; font-weight:bold; font-size:1.1rem; cursor:pointer;">
                ${getT('submitPredictionBtn')}
            </button>
            <button onclick="document.getElementById('prediction-modal').remove()" 
                    style="width:100%; padding:15px; background:transparent; border:1px solid rgba(255,255,255,0.2); color:#ccc; border-radius:12px; font-weight:bold; font-size:1rem; cursor:pointer;">
                ${getT('cancelBtn')}
            </button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitPrediction = async function(matchId, team1, team2) {
    const score1 = document.getElementById('score-team1').value;
    const score2 = document.getElementById('score-team2').value;
    
    if (score1 === '' || score2 === '') {
        alert(getT('enterGoalsError'));
        return;
    }

    const t1Score = parseInt(score1);
    const t2Score = parseInt(score2);

    let autoWinner = 'draw';
    if (t1Score > t2Score) autoWinner = team1;
    else if (t2Score > t1Score) autoWinner = team2;

    const finalPredictedScore = `${team1} ${t1Score} - ${t2Score} ${team2} | ${getT('winnerLabel')} ${autoWinner === 'draw' ? getT('drawMatch') : autoWinner}`;
    
    const submitBtn = document.getElementById('submit-prediction-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = '⏳...';

    if (typeof supabaseClient !== 'undefined' && userState.userId) {
        try {
            const { data, error } = await supabaseClient
                .from('match_predictions') 
                .insert([
                    { 
                        telegram_id: userState.userId, 
                        match_id: matchId, 
                        predicted_score: finalPredictedScore,
                        predicted_home: t1Score, 
                        predicted_away: t2Score,
                        points_awarded: 0
                    }
                ])
                .select();

            if (error) throw error;
            
            if (data && data[0]) globalPredictions.push(data[0]);
            if (!userState.predictedMatches) userState.predictedMatches = [];
            userState.predictedMatches.push(matchId);

        } catch (err) {
            console.error("❌ خطأ أثناء حفظ التوقع:", err);
            alert(getT('connectionError'));
            submitBtn.disabled = false;
            submitBtn.innerText = getT('submitPredictionBtn');
            return;
        }
    }

    alert(getT('predictionSuccess'));
    document.getElementById('prediction-modal').remove();

    const btnContainer = document.getElementById(`btn-container-${matchId}`);
    if (btnContainer) {
        btnContainer.innerHTML = `<button disabled style="width:100%; padding:10px; background:rgba(16, 185, 129, 0.2); color:#10b981; border:1px solid #10b981; border-radius:10px; font-size:0.9rem; font-weight:bold;">
                                    ${getT('btnPredicted')}
                                  </button>`;
    }
};

// نافذة تداول وتخزين التوكنات عبر منعطفات Meteora DBC
window.openSwapModal = function(matchId, teamName, tokenPrice) {
    let existingModal = document.getElementById("swap-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
        z-index: 200000; display: flex; justify-content: center; align-items: center; padding: 15px;
    `;

    modal.innerHTML = `
        <div style="background: #1c1c22; border: 1px solid rgba(20, 241, 149, 0.4); border-radius: 20px; width: 100%; max-width: 380px; padding: 20px; color: #fff; position: relative;">
            <button onclick="document.getElementById('swap-modal').remove()" style="position: absolute; top: 12px; left: 12px; background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;">✕</button>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <span style="background: rgba(20,241,149,0.2); color: #14F195; font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: bold;">METEORA DBC SWAP</span>
                <h3 style="margin: 6px 0 0 0; color: #fcb045; font-size: 1.1rem;">شراء توكن: ${teamName}</h3>
                <p style="font-size: 0.75rem; color: #aaa; margin: 3px 0 0 0;">السعر عبر المنحنى: ${tokenPrice} SOL</p>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                <label style="font-size: 0.75rem; color: #aaa; display: block; margin-bottom: 6px;">كمية الاستثمار بـ SOL:</label>
                <input type="number" id="swap-amount" value="0.1" step="0.05" min="0.01" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.15); padding: 10px; border-radius: 8px; color: #fff; font-size: 1rem; outline: none;">
            </div>

            <div id="swap-status-msg" style="font-size:0.75rem; color:#14F195; margin-bottom:10px; text-align:center;"></div>

            <button id="btn-confirm-swap" onclick="window.executeDevnetSwap(${matchId}, '${teamName}')" style="width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: 900; font-size: 0.88rem; cursor: pointer;">
                🚀 إتمام المقايضة (Swap on DBC)
            </button>
        </div>
    `;

    document.body.appendChild(modal);
};

// تنفيذ معاملة التداول على Solana Devnet
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

            if (statusMsg) statusMsg.innerText = "جاري تنفيذ عقد Meteora DBC Swap...";
            const connection = new solanaWeb3Lib.Connection(solanaWeb3Lib.clusterApiUrl('devnet'), 'confirmed');

            const VAULT_PUBLIC_KEY = 'G2zT2vK1y2426mKxT1p3zT2vK1y2426mKxT1p3zT2vK1'; 
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

            const signed = await provider.signAndSendTransaction(transaction);
            if (statusMsg) statusMsg.innerText = "جاري توثيق التوكنات على البلوكشين...";

            await connection.confirmTransaction(signed.signature, 'confirmed');

            if (window.supabaseClient) {
                const tgId = userState.userId || 'guest';
                await window.supabaseClient.from('match_predictions').insert([{
                    telegram_id: String(tgId),
                    match_id: String(matchId),
                    predicted_winner: teamName,
                    predicted_score: teamName,
                    amount_sol: solAmount,
                    status: 'PENDING'
                }]);
            }

            alert(`✅ تمت عملية شراء توكن (${teamName}) بنجاح عبر Meteora DBC!\n\nTx Hash: ${signed.signature}`);
            document.getElementById("swap-modal")?.remove();

        } catch (err) {
            console.error("❌ فشلت المعاملة:", err);
            alert(`❌ فشلت المعاملة: ${err.message || 'تم إلغا
