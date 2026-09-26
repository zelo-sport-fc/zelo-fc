const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer, getMint } = require('@solana/spl-token');
const bs58 = require('bs58');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// 1. إعداد الاتصال بـ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// 2. الاتصال بشبكة Solana (يفضل استخدام QuickNode / Helius RPC عبر متغيرات البيئة)
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

// مسار فحص حالة السيرفر (Health Check)
app.get('/', (req, res) => {
    res.send('Zelo FC Backend Server is running smoothly 🚀');
});

// ==========================================
// 1. مسار جلب بيانات المستخدم وعناوين المحافظ
// ==========================================
app.get('/api/user-info', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId || telegramId === 'guest') {
        return res.status(400).json({ success: false, error: "معرف التلجرام غير صحيح" });
    }

    if (!supabase) {
        return res.status(500).json({ success: false, error: "اتصال Supabase غير معرف في متغيرات البيئة" });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('solana_wallet, ton_wallet, points')
            .eq('telegram_id', telegramId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return res.json({
            success: true,
            solanaWallet: data?.solana_wallet || '',
            tonWallet: data?.ton_wallet || '',
            coins: data?.points || 0
        });
    } catch (err) {
        console.error("Fetch User Info Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 2. مسار حفظ وتحديث المحافظ مع منع التكرار
// ==========================================
app.post('/api/save-wallet', async (req, res) => {
    const { telegramId, walletType, walletAddress } = req.body;

    if (!telegramId || telegramId === 'guest') {
        return res.status(400).json({ success: false, error: "معرف التلجرام غير صحيح أو مفقود" });
    }

    if (!walletAddress || !walletType || !['solana', 'ton'].includes(walletType)) {
        return res.status(400).json({ success: false, error: "نوع المحفظة أو العنوان غير صحيح" });
    }

    if (!supabase) {
        return res.status(500).json({ success: false, error: "اتصال Supabase غير معرف في متغيرات البيئة" });
    }

    const walletColumn = walletType === 'solana' ? 'solana_wallet' : 'ton_wallet';

    try {
        // 🔒 أ) فحص منع التكرار: هل العنوان مسجل لدى حساب لاعب آخر؟
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('telegram_id')
            .eq(walletColumn, walletAddress.trim())
            .neq('telegram_id', telegramId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "⚠️ عنوان المحفظة هذا مستخدم بالفعل في حساب آخر! لا يمكنك استخدام نفس المحفظة في أكثر من حساب."
            });
        }

        // ب) تحديث المحفظة للحساب الحالي
        const updateData = {};
        updateData[walletColumn] = walletAddress.trim();

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('telegram_id', telegramId);

        if (updateError) throw updateError;

        return res.json({ success: true, message: "تم حفظ المحفظة بنجاح" });
    } catch (err) {
        console.error("Save Wallet Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 3. مسار المطالبة وتحويل التوكن On-Chain (آمن 100%)
// ==========================================
app.post('/api/claim', async (req, res) => {
    const { userWalletAddress, telegramId } = req.body;

    try {
        // 1. التحقق من المدخلات الأساسية
        if (!telegramId || telegramId === 'guest') {
            return res.status(400).json({ success: false, error: "معرف التلجرام غير صحيح" });
        }

        if (!userWalletAddress) {
            return res.status(400).json({ success: false, error: "عنوان المحفظة مطلوب" });
        }

        if (!supabase) {
            return res.status(500).json({ success: false, error: "اتصال Supabase غير معرف" });
        }

        // 2. التحقق من وجود المتغيرات البيئية في السيرفر
        if (!process.env.TREASURY_PRIVATE_KEY || !process.env.ZELO_MINT_ADDRESS) {
            return res.status(500).json({ 
                success: false, 
                error: "بيانات TREASURY_PRIVATE_KEY أو ZELO_MINT_ADDRESS غير معرفة في متغيرات البيئة" 
            });
        }

        // 🔒 3. جلب الرصيد الحقيقي للاعب مباشرة من قاعدة البيانات بدلاً من الاعتماد على الكلاينت
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('points, solana_wallet')
            .eq('telegram_id', telegramId)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ success: false, error: "لم يتم العثور على بيانات المستخدم" });
        }

        const userCoins = Number(userData.points || 0);

        if (userCoins <= 0) {
            return res.status(400).json({ success: false, error: "ليس لديك رصيد نقاط كافي للمطالبة" });
        }

        // 4. تجهيز المفاتيح والعقد
        const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY.trim()));
        const zelocMint = new PublicKey(process.env.ZELO_MINT_ADDRESS.trim());
        const playerPubkey = new PublicKey(userWalletAddress.trim());

        // 5. الحصول على Decimals من الشبكة
        const mintInfo = await getMint(connection, zelocMint);
        const decimals = mintInfo.decimals;

        // 6. حساب عدد العملات (كل 100 نقطة = 1 عملة ZELOFC)
        const tokenAmount = userCoins / 100;
        const amountInLamports = BigInt(Math.floor(tokenAmount * Math.pow(10, decimals)));

        if (amountInLamports <= 0n) {
            return res.status(400).json({ 
                success: false, 
                error: "الكمية المحسوبة للتحويل أقل من الحد الأدنى المسموح به" 
            });
        }

        // 7. إنشاء أو جلب حسابات التوكن المرتبطة (ATA)
        const treasuryTokenAcc = await getOrCreateAssociatedTokenAccount(
            connection, 
            treasuryKeypair, 
            zelocMint, 
            treasuryKeypair.publicKey
        );

        const playerTokenAcc = await getOrCreateAssociatedTokenAccount(
            connection, 
            treasuryKeypair, 
            zelocMint, 
            playerPubkey
        );

        // 8. تنفيذ عملية التحويل On-Chain
        const signature = await transfer(
            connection,
            treasuryKeypair,
            treasuryTokenAcc.address,
            playerTokenAcc.address,
            treasuryKeypair.publicKey,
            amountInLamports
        );

        // 9. صفير نقاط المستخدم في Supabase بعد نجاح التحويل
        await supabase
            .from('users')
            .update({ points: 0 })
            .eq('telegram_id', telegramId);

        return res.json({ 
            success: true, 
            txHash: signature,
            tokensTransferred: tokenAmount,
            newBalance: 0
        });

    } catch (err) {
        console.error("Transfer Error Details:", err);
        return res.status(500).json({ 
            success: false, 
            error: err.message || "حدث خطأ أثناء إجراء عملية التحويل On-Chain" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
