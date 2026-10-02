// ==========================================
// ⚽ Meteora Devnet Launchpad & Trading Engine
// ==========================================

// 1. جلب المباريات والعناوين الحقيقية للتوكنات من Supabase
window.fetchMatchesForMeteora = async function() {
    const fallbackMatches = [
        { id: 101, teamA: 'São Paulo FC', teamB: 'Santos FC', mintA: null, mintB: null, matchTime: new Date().toISOString(), priceA: '2.25', priceB: '2.25', bondingProgressA: 50, bondingProgressB: 50 },
        { id: 102, teamA: 'CA Mineiro', teamB: 'RB Bragantino', mintA: null, mintB: null, matchTime: new Date().toISOString(), priceA: '2.25', priceB: '2.25', bondingProgressA: 50, bondingProgressB: 50 }
    ];

    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient !== null) {
        try {
            const { data, error } = await window.supabaseClient
                .from('matches')
                .select('*')
                .neq('status', 'FINISHED')
                .order('match_date', { ascending: true })
                .limit(20);

            if (!error && data && data.length > 0) {
                return data.map(m => {
                    const priceA = (1.25 + (m.bonding_progress_team_a || 50) * 0.02).toFixed(2);
                    const priceB = (1.25 + (m.bonding_progress_team_b || 50) * 0.02).toFixed(2);
                    return {
                        id: m.id,
                        teamA: m.team_a || 'Team A',
                        teamB: m.team_b || 'Team B',
                        // قراءة عناوين التوكنات المولدة تلقائياً
                        mintA: m.token_a_mint || null,
                        mintB: m.token_b_mint || null,
                        symbolA: m.token_a_symbol || 'TKN',
                        symbolB: m.token_b_symbol || 'TKN',
                        matchTime: m.match_date || new Date().toISOString(),
                        priceA: priceA,
                        priceB: priceB,
                        bondingProgressA: m.bonding_progress_team_a || 50,
                        bondingProgressB: m.bonding_progress_team_b || 50
                    };
                });
            }
        } catch (err) {
            console.error("❌ خطأ جلب بيانات Supabase:", err);
        }
    }
    return fallbackMatches;
};

// 2. عرض الواجهة وربط الأزرار بالتوكنات
window.renderMeteoraPage = async function(container) {
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 30px 15px;">
            <div style="display: inline-block; width: 26px; height: 26px; border: 3px solid rgba(252,176,69,0.2); border-radius: 50%; border-top-color: #fcb045; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #aaa; font-size: 0.8rem; margin-top: 10px;">جاري تحميل سوق Meteora SOL...</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;

    try {
        const matches = await window.fetchMatchesForMeteora();

        let html = `
            <div style="text-align: center; margin-bottom: 18px;">
                <div style="display: inline-block; background: rgba(20,241,149,0.15); border: 1px solid rgba(20,241,149,0.4); padding: 4px 12px; border-radius: 15px; font-size: 0.7rem; color: #14F195; font-weight: bold; margin-bottom: 6px;">
                    ⚡ METEORA DBC LAUNCHPAD
                </div>
                <h3 style="margin: 0; color: #fcb045; font-size: 1.1rem;">سوق تداول توكنات المباريات</h3>
            </div>
        `;

        if (matches && matches.length > 0) {
            matches.forEach(m => {
                const matchDate = new Date(m.matchTime);
                const formattedDate = !isNaN(matchDate.getTime()) ? matchDate.toLocaleDateString('ar-EG') : '';
                const formattedTime = !isNaN(matchDate.getTime()) ? matchDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

                const safeTeamA = String(m.teamA).replace(/'/g, "\\'");
                const safeTeamB = String(m.teamB).replace(/'/g, "\\'");

                html += `
                    <div class="card" style="padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.9); border: 1px solid rgba(252, 176, 69, 0.25); border-radius: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">
                            <span style="font-size: 0.75rem; color: #14F195; font-weight: bold;">⚽ ${m.teamA} VS ${m.teamB}</span>
                            <span style="font-size: 0.68rem; color: #aaa;">📅 ${formattedDate} ${formattedTime}</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 8px;">
                            <div style="text-align: center; flex: 1;">
                                <span style="font-size: 0.68rem; color: #aaa; display: block; margin-bottom: 2px;">${m.teamA}</span>
                                <strong style="font-size: 0.85rem; color: #14F195;">${m.priceA} SOL</strong>
                            </div>
                            <div style="border-left: 1px solid rgba(255,255,255,0.1);"></div>
                            <div style="text-align: center; flex: 1;">
                                <span style="font-size: 0.68rem; color: #aaa; display: block; margin-bottom: 2px;">${m.teamB}</span>
                                <strong style="font-size: 0.85rem; color: #f72585;">${m.priceB} SOL</strong>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.openSwapModal('${m.id}', '${safeTeamA}', '${m.priceA}', '${m.mintA}')" style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px 4px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                شراء ${m.teamA}
                            </button>
                            <button onclick="window.openSwapModal('${m.id}', '${safeTeamB}', '${m.priceB}', '${m.mintB}')" style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px 4px; border-radius: 8px; font-weight: bold; font-size: 0.75rem; cursor: pointer;">
                                شراء ${m.teamB}
                            </button>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<div style="text-align:center; color:#aaa; padding:20px;">لا توجد مباريات متاحة للتداول حالياً.</div>`;
        }

        container.innerHTML = html;
    } catch (e) {
        console.error("❌ خطأ في عرض الواجهة:", e);
        container.innerHTML = `<div style="text-align:center; color:#ff4d4d; padding:20px;">حدث خطأ أثناء تحميل البيانات.</div>`;
    }
};

// 3. عرض النافذة المنبثقة
window.openSwapModal = function(matchId, teamName, priceSol, tokenMint) {
    const oldModal = document.getElementById("swap-modal");
    if (oldModal) oldModal.remove();

    const safeTeamName = String(teamName).replace(/'/g, "\\'");
    const displayMint = tokenMint && tokenMint !== 'null' ? `${tokenMint.slice(0, 6)}...${tokenMint.slice(-4)}` : 'جاري توليد التوكن...';

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
        direction: rtl; font-family: sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #181824; border: 1px solid rgba(252, 176, 69, 0.4); border-radius: 16px; padding: 20px; width: 90%; max-width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="margin:0; color: #14F195; font-size: 1rem;">🚀 شراء توكن ${teamName}</h3>
                <button onclick="document.getElementById('swap-modal').remove()" style="background:none; border:none; color:#aaa; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>

            <div style="margin-bottom: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-size: 0.7rem; color: #bbb;">
                📌 Mint Address: <strong style="color: #fcb045;">${displayMint}</strong>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="color:#aaa; font-size:0.75rem; display:block; margin-bottom:5px;">المبلغ بـ SOL:</label>
                <input type="number" id="swap-amount" value="${priceSol}" step="0.001" style="width: 100%; padding: 10px; background: #0d0d12; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 0.9rem; box-sizing: border-box;">
            </div>

            <div id="swap-status-msg" style="color: #fcb045; font-size: 0.75rem; margin-bottom: 12px; text-align: center; min-height: 18px;"></div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btn-confirm-swap" onclick="window.executeDevnetSwap('${matchId}', '${safeTeamName}', '${tokenMint}')" style="background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer;">
                    🚀 إتمام المقايضة (Swap on DBC)
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// 4. تنفيذ المقايضة الفعلية وتفادي أخطاء المحفظة والـ Edge Function
window.executeDevnetSwap = async function(matchId, teamName, tokenMint) {
    const statusMsg = document.getElementById("swap-status-msg");
    const btnConfirm = document.getElementById("btn-confirm-swap");
    const amountInput = document.getElementById("swap-amount");

    if (!amountInput || !statusMsg || !btnConfirm) return;

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        statusMsg.style.color = "#ff4d4d";
        statusMsg.innerText = "❌ يُرجى إدخال مبلغ صحيح بالـ SOL";
        return;
    }

    try {
        btnConfirm.disabled = true;
        btnConfirm.style.opacity = "0.6";
        statusMsg.style.color = "#fcb045";
        statusMsg.innerText = "⏳ جاري تجهيز الطلب ومعالجة المحفظة...";

        let userWalletAddress = null;

        // الاتصال بمحفظة Phantom إن وُجدت
        const provider = window.solana || window.phantom?.solana;
        if (provider && provider.isPhantom) {
            try {
                const resp = await provider.connect();
                userWalletAddress = resp.publicKey.toString();
            } catch (err) {
                console.warn("تعذر الحصول على حساب Phantom:", err);
            }
        }

        // استخدام عنوان افتراضي للتجربة على Devnet إذا كنا داخل بيئة Telegram Bot
        if (!userWalletAddress) {
            userWalletAddress = "4zMMC9srt5Ri5X14GAgXhaUii3GnPAEERYPJgZJDncDU";
        }

        statusMsg.innerText = "⚡ جاري إرسال الطلب لـ Edge Function لسك التوكن...";

        if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
            throw new Error("Supabase Client غير معرف بالصفحة.");
        }

        // استدعاء Edge Function
        const { data, error } = await window.supabaseClient.functions.invoke('auto-mint-tokens', {
            body: {
                recipientAddress: userWalletAddress,
                mintAddress: (tokenMint && tokenMint !== 'null') ? tokenMint : undefined,
                amount: Math.floor(amount * 1000000000)
            }
        });

        if (error) {
            throw new Error(error.message || "فشل الاتصال بـ Supabase Edge Function.");
        }

        if (data && data.success) {
            statusMsg.style.color = "#14F195";
            const txSig = data.transactionSignature;
            const shortTx = txSig ? `${txSig.slice(0, 8)}...${txSig.slice(-8)}` : '';

            statusMsg.innerHTML = `
                ✅ تم إتمام السك والمقايضة على Devnet!<br>
                ${txSig ? `<a href="https://explorer.solana.com/tx/${txSig}?cluster=devnet" target="_blank" style="color: #14F195; text-decoration: underline; margin-top: 5px; display: inline-block;">🔍 عرض المعاملة على Solana Explorer (${shortTx})</a>` : ''}
            `;
            btnConfirm.innerText = "🎉 تم الإتمام بنجاح";
        } else {
            throw new Error(data?.error || "حدثت مشكلة أثناء معالجة التوكن.");
        }

    } catch (err) {
        console.error("❌ خطأ المقايضة:", err);
        statusMsg.style.color = "#ff4d4d";
        statusMsg.innerText = `❌ ${err.message || 'فشلت العملية'}`;
        btnConfirm.disabled = false;
        btnConfirm.style.opacity = "1";
    }
};
            
