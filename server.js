const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount, transfer, getMint } = require('@solana/spl-token');
const bs58 = require('bs58');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// إعداد الاتصال بـ Supabase عبر متغيرات البيئة (Environment Variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// الاتصال بشبكة Solana Mainnet
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

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
// 2. مسار حفظ وتحديث المحافظ (Solana & TON)
// ==========================================
app.post('/api/save-wallet', async (req, res) => {
    const { telegramId, walletType, walletAddress } = req.body;

    if (!telegramId || telegramId === 'guest') {
        return res.status(400).json({ success: false, error: "Missing or invalid telegramId" });
    }

    if (!supabase) {
        return res.status(500).json({ success: false, error: "اتصال Supabase غير معرف في متغيرات البيئة" });
    }

    const updateData = {};
    if (walletType === 'solana') updateData.solana_wallet = walletAddress;
    if (walletType === 'ton') updateData.ton_wallet = walletAddress;

    try {
        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('telegram_id', telegramId);

        if (error) throw error;

        return res.json({ success: true, message: "تم حفظ المحفظة بنجاح" });
    } catch (err) {
        console.error("Save Wallet Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 3. مسار المطالبة وتحويل التوكن On-Chain
// ==========================================
app.post('/api/claim', async (req, res) => {
    const { userWalletAddress, userCoins, telegramId } = req.body;

    try {
        // 1. التحقق من المدخلات الأساسية
        if (!userWalletAddress || !userCoins || Number(userCoins) <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: "عنوان المحفظة غير صحيح أو قيمة النقاط غير كافية" 
            });
        }

        // 2. التحقق من وجود المتغيرات البيئية في السيرفر
        if (!process.env.TREASURY_PRIVATE_KEY || !process.env.ZELO_MINT_ADDRESS) {
            return res.status(500).json({ 
                success: false, 
                error: "بيانات المحفظة (TREASURY_PRIVATE_KEY) أو العقد (ZELO_MINT_ADDRESS) غير معرفة في متغيرات البيئة" 
            });
        }

        const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY.trim()));
        const zelocMint = new PublicKey(process.env.ZELO_MINT_ADDRESS.trim());
        const playerPubkey = new PublicKey(userWalletAddress.trim());

        // 3. الحصول على خيارات العقد (Decimals) ديناميكيًا من الشبكة
        const mintInfo = await getMint(connection, zelocMint);
        const decimals = mintInfo.decimals;

        // 4. حساب عدد العملات (نسبة التحويل: كل 100 نقطة = 1 عملة ZELOFC)
        const tokenAmount = Number(userCoins) / 100;
        const amountInLamports = BigInt(Math.floor(tokenAmount * Math.pow(10, decimals)));

        if (amountInLamports <= 0n) {
            return res.status(400).json({ 
                success: false, 
                error: "الكمية المحسوبة للتحويل أقل من الحد الأدنى المسموح به" 
            });
        }

        // 5. إنشاء أو جلب حسابات التوكن المرتبطة (Associated Token Accounts)
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

        // 6. تنفيذ عملية التحويل On-Chain
        const signature = await transfer(
            connection,
            treasuryKeypair,
            treasuryTokenAcc.address,
            playerTokenAcc.address,
            treasuryKeypair.publicKey,
            amountInLamports
        );

        // 7. صفير نقاط المستخدم في Supabase بعد نجاح التحويل On-Chain
        if (supabase && telegramId && telegramId !== 'guest') {
            await supabase
                .from('users')
                .update({ points: 0 })
                .eq('telegram_id', telegramId);
        }

        return res.json({ 
            success: true, 
            txHash: signature,
            tokensTransferred: tokenAmount
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
            
