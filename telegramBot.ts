import { randomBytes, randomInt, createHmac } from 'crypto';
import { getDBStatus, UserModel, TelegramSessionModel } from './db.js';
import { generateToken } from './src/server/auth.js';

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'sayrhub_bot';

export interface PendingTelegramSession {
  sessionToken: string;
  code?: string;
  authenticated: boolean;
  createdAt: number;
  user?: any;
  token?: string;
  attempts: number;
}

// Resilient memory cache (synchronized with MongoDB TTL collection)
export const pendingSessions = new Map<string, PendingTelegramSession>();
export const userChatSessions = new Map<number | string, string>(); // chatId -> sessionToken

/**
 * Creates a unique registration/login session linked to Telegram deep linking
 * Persisted in MongoDB with a 15-minute TTL index
 */
export async function createTelegramAuthSession() {
  const sessionToken = 'reg_' + randomBytes(16).toString('hex');
  const now = Date.now();

  try {
    if (getDBStatus().connected) {
      await TelegramSessionModel.create({
        sessionToken,
        authenticated: false,
        attempts: 0,
        createdAt: new Date(),
      });
    }
  } catch (err: any) {
    console.warn('MongoDB session create failed, using memory fallback:', err?.message || err);
  }

  // Dual-write to in-memory map for instantaneous latency & fallback
  pendingSessions.set(sessionToken, {
    sessionToken,
    authenticated: false,
    createdAt: now,
    attempts: 0,
  });

  // Clean old in-memory sessions (> 15 mins)
  for (const [key, s] of pendingSessions.entries()) {
    if (now - s.createdAt > 15 * 60 * 1000) {
      pendingSessions.delete(key);
    }
  }

  return {
    sessionToken,
    botUsername: TELEGRAM_BOT_USERNAME,
    deepLink: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${sessionToken}`,
  };
}

/**
 * Checks if a session was authenticated by the Telegram bot
 */
export async function checkTelegramAuthSession(sessionToken: string) {
  if (!sessionToken) {
    return { success: false, authenticated: false, error: 'Sessiya belgilanmadi' };
  }

  try {
    if (getDBStatus().connected) {
      const dbSession = await TelegramSessionModel.findOne({ sessionToken }).lean();
      if (dbSession) {
        return {
          success: true,
          authenticated: (dbSession as any).authenticated,
          user: (dbSession as any).user || null,
          token: (dbSession as any).token || null,
        };
      }
    }
  } catch (err: any) {
    console.warn('MongoDB check session failed, checking memory fallback:', err?.message || err);
  }

  const session = pendingSessions.get(sessionToken);
  if (!session) {
    return { success: false, authenticated: false, error: 'Sessiya topilmadi yoki muddati tugagan' };
  }
  return {
    success: true,
    authenticated: session.authenticated,
    user: session.user || null,
    token: session.token || null,
  };
}

/**
 * Verifies 6-digit code entered manually by the user
 */
export async function verifyTelegramCode(code: string, sessionToken?: string) {
  const cleanCode = (code || '').trim();
  if (!cleanCode || cleanCode.length < 6) {
    return { success: false, error: "Tasdiqlash kodi 6 xonali bo'lishi kerak" };
  }

  if (!sessionToken) {
    return { success: false, error: "Sessiya identifikatori (sessionToken) ko'rsatilmadi" };
  }

  try {
    if (getDBStatus().connected) {
      const dbSession = await TelegramSessionModel.findOne({ sessionToken });
      if (dbSession) {
        if (dbSession.attempts >= 5) {
          await TelegramSessionModel.deleteOne({ sessionToken });
          pendingSessions.delete(sessionToken);
          return { success: false, error: "Ko'p marotaba noto'g'ri kod kiritildi. Iltimos, yangi sessiya oching." };
        }

        if (dbSession.code && dbSession.code === cleanCode) {
          dbSession.authenticated = true;
          const user = dbSession.user;
          const token = dbSession.token;
          dbSession.code = undefined; // Prevent replay attacks
          await dbSession.save();
          pendingSessions.delete(sessionToken);
          return { success: true, user, token };
        }

        dbSession.attempts = (dbSession.attempts || 0) + 1;
        await dbSession.save();
        const remaining = Math.max(0, 5 - dbSession.attempts);
        return {
          success: false,
          error: `Tasdiqlash kodi noto'g'ri! Qolgan urinishlar: ${remaining}`,
        };
      }
    }
  } catch (err: any) {
    console.warn('MongoDB verifyTelegramCode failed, checking memory fallback:', err?.message || err);
  }

  const session = pendingSessions.get(sessionToken);
  if (!session) {
    return { success: false, error: "Sessiya topilmadi yoki muddati tugagan" };
  }

  if (session.attempts >= 5) {
    pendingSessions.delete(sessionToken);
    return { success: false, error: "Ko'p marotaba noto'g'ri kod kiritildi. Iltimos, yangi sessiya oching." };
  }

  if (session.code && session.code === cleanCode && (Date.now() - session.createdAt < 15 * 60 * 1000)) {
    session.authenticated = true;
    const user = session.user;
    const token = session.token;
    delete session.code; // Prevent replay attacks
    return { success: true, user, token };
  }

  session.attempts = (session.attempts || 0) + 1;
  const remaining = Math.max(0, 5 - session.attempts);
  return {
    success: false,
    error: `Tasdiqlash kodi noto'g'ri! Qolgan urinishlar: ${remaining}`,
  };
}

/**
 * Helper to get the canonical Telegram Mini App URL
 */
export function getMiniAppUrl(): string {
  return process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || 'https://sayrhub.uz';
}

/**
 * Validates Telegram Mini App initData cryptographic hash (HMAC-SHA256)
 */
export function validateTelegramWebAppData(
  initData: string,
  botToken: string = TELEGRAM_BOT_TOKEN || ''
): { isValid: boolean; user?: any; error?: string } {
  if (!initData || typeof initData !== 'string') {
    return { isValid: false, error: 'initData belgilanmagan' };
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) {
    return { isValid: false, error: 'Xavfsizlik kaliti (hash) topilmadi' };
  }

  // Remove hash and sort remaining keys alphabetically
  urlParams.delete('hash');
  const params: string[] = [];
  Array.from(urlParams.keys())
    .sort()
    .forEach((key) => {
      params.push(`${key}=${urlParams.get(key)}`);
    });
  const dataCheckString = params.join('\n');

  if (botToken) {
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false, error: 'Telegram ma’lumotlari tekshiruvdan o‘tmadi (noto‘g‘ri imzo)' };
    }
  }

  let user: any = null;
  const rawUser = urlParams.get('user');
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      return { isValid: false, error: 'Foydalanuvchi ma’lumotlarini o‘qib bo‘lmadi' };
    }
  }

  return { isValid: true, user };
}

/**
 * Seamlessly authenticates or registers a user opening the Telegram Mini App
 */
export async function authenticateTelegramWebApp(initData: string, botToken?: string) {
  const tokenToUse = botToken || TELEGRAM_BOT_TOKEN || '';
  const validation = validateTelegramWebAppData(initData, tokenToUse);
  if (!validation.isValid || !validation.user) {
    return { success: false, error: validation.error || 'Telegram autentifikatsiyasi muvaffaqiyatsiz bo‘ldi' };
  }

  const tgUser = validation.user;
  const telegramId = String(tgUser.id);
  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || tgUser.username || 'SayrHub Mijoz';
  const tgUsername = tgUser.username ? `@${tgUser.username}` : '';
  const photoUrl = tgUser.photo_url || '';

  let dbUser: any = null;

  if (getDBStatus().connected) {
    try {
      const existingUser = await UserModel.findOne({ telegramId }).select('status').lean();
      if (existingUser?.status === 'blocked') {
        return { success: false, error: 'Akkauntingiz bloklangan. Yordam uchun qo‘llab-quvvatlash xizmatiga murojaat qiling.' };
      }

      dbUser = await UserModel.findOneAndUpdate(
        { telegramId },
        {
          $set: {
            tcId: 'tw-' + tgUser.id,
            name: fullName,
            telegramId,
            telegramUsername: tgUsername,
            ...(photoUrl ? { avatar: photoUrl } : {})
          },
          $setOnInsert: {
            phone: '',
            citizenship: "O'zbekiston",
            cashbackBalance: 30
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (e: any) {
      console.warn('MongoDB webapp user upsert fallback to memory:', e?.message || e);
    }
  }

  if (!dbUser) {
    dbUser = {
      tcId: 'tw-' + tgUser.id,
      name: fullName,
      phone: '',
      telegramId,
      telegramUsername: tgUsername,
      avatar: photoUrl,
      citizenship: "O'zbekiston",
      cashbackBalance: 30,
      isVerified: true
    };
  }

  const userToken = generateToken({
    id: dbUser.tcId,
    username: dbUser.phone || dbUser.tcId,
    role: 'user',
    name: dbUser.name
  }, '30d');

  return {
    success: true,
    user: dbUser,
    token: userToken
  };
}

/**
 * Configure persistent chat menu button to launch the Telegram Mini App
 */
export async function setupTelegramMenuButton(customUrl?: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const url = customUrl || getMiniAppUrl();
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'SayrHub Mini App',
          web_app: { url }
        }
      })
    });
    const data = await res.json();
    if (data.ok) {
      console.log('✅ Telegram Bot chat menu button configured:', url);
    }
  } catch (err: any) {
    console.warn('Telegram setChatMenuButton warning:', err?.message || err);
  }
}

/**
 * Sends a message via the Telegram Bot API
 */
export async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN belgilanmagan — xabar yuborilmadi.');
    return null;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return await res.json();
  } catch (err: any) {
    console.error('Failed to send Telegram message:', err.message);
    return null;
  }
}

/**
 * Notifies customer and admin on Telegram when a booking is placed
 */
export async function notifyBookingCreated(booking: any) {
  if (!TELEGRAM_BOT_TOKEN || !booking) return;
  try {
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const travelerId = booking.travelerId;
    let userChatId: string | null = null;
    if (travelerId && travelerId !== 'guest') {
      const u = await UserModel.findOne({ tcId: travelerId }).select('telegramId').lean() as any;
      if (u?.telegramId) {
        userChatId = String(u.telegramId);
      }
    }

    const bookingText =
      `🎉 <b>Yangi sayohat buyurtmasi qabul qilindi!</b>\n\n` +
      `🎫 <b>Tur:</b> ${booking.tourTitle || 'Noma\'lum tur'}\n` +
      `📍 <b>Manzil:</b> ${booking.dest || '-'}\n` +
      `📅 <b>Sana:</b> ${booking.dates || '-'}\n` +
      `👤 <b>Mijoz:</b> ${booking.travelerName || 'Hurmatli mijoz'}\n` +
      `📞 <b>Telefon:</b> ${booking.travelerPhone || '-'}\n` +
      `💰 <b>Narxi:</b> ${booking.price || '-'}\n` +
      `🧾 <b>Vaucher ID:</b> <code>${booking.voucherId || booking.id}</code>\n` +
      `⚡ <b>Holati:</b> ${booking.status || 'Jarayonda'}\n\n` +
      `<i>SayrHub jamoasi tez orada siz bilan bog'lanadi!</i>`;

    if (userChatId) {
      const miniAppUrl = getMiniAppUrl();
      await sendTelegramMessage(userChatId, bookingText, {
        inline_keyboard: [
          [{ text: "🎫 Vaucher & Chiptani ko'rish", web_app: { url: `${miniAppUrl}?tab=trips&bookingId=${booking.id || booking.voucherId}` } }],
          [{ text: "🚀 SayrHub Mini App", web_app: { url: miniAppUrl } }]
        ]
      });
    }

    if (adminChatId) {
      const adminText =
        `🔔 <b>[ADMIN XABARNOMA] Yangi buyurtma kelib tushdi!</b>\n\n` +
        `🎫 <b>Tur:</b> ${booking.tourTitle || '-'}\n` +
        `👤 <b>Mijoz:</b> ${booking.travelerName || '-'} (${booking.travelerPhone || '-'})\n` +
        `💰 <b>Summa:</b> ${booking.price || '-'}\n` +
        `🧾 <b>Vaucher:</b> <code>${booking.voucherId || booking.id}</code>\n` +
        `📅 <b>Sanalar:</b> ${booking.dates || '-'}\n\n` +
        `<i>Admin panel orqali tasdiqlashingiz mumkin.</i>`;
      await sendTelegramMessage(adminChatId, adminText);
    }
  } catch (err: any) {
    console.warn('Booking Telegram notification warning:', err?.message || err);
  }
}

/**
 * Processes incoming webhook or polling updates from Telegram
 */
export async function processTelegramUpdate(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const user = message.from;
  const text = (message.text || '').trim();
  const miniAppUrl = getMiniAppUrl();

  // Quick Mini App Direct Commands
  if (text === '/app' || text === '/webapp' || text === '/tours' || text === '/qidiruv') {
    await sendTelegramMessage(chatId, `🛫 <b>SayrHub Mini App</b>\n\nKompas Tour bilan 1:1 jonli integratsiya qilingan arzon turpaketlar va charter reyslar qidiruvi:`, {
      inline_keyboard: [
        [{ text: "🚀 SayrHub Mini Appni ochish", web_app: { url: `${miniAppUrl}?tab=search` } }]
      ]
    });
    return;
  }

  if (text === '/qaynoq' || text === '/hot') {
    await sendTelegramMessage(chatId, `🔥 <b>Qaynoq takliflar (Hot Deals)</b>\n\nEng so'nggi chegirmalar va qaynoq o'rinlar:`, {
      inline_keyboard: [
        [{ text: "🔥 Qaynoq takliflarni ko'rish", web_app: { url: `${miniAppUrl}?tab=hot` } }]
      ]
    });
    return;
  }

  if (text === '/trips' || text === '/turlarim') {
    await sendTelegramMessage(chatId, `🧳 <b>Mening turlarim</b>\n\nBuyurtmalar tarixi, vaucherlar va elektron chiptalarni ko'rish:`, {
      inline_keyboard: [
        [{ text: "🧳 Turlarim & Vaucherlar", web_app: { url: `${miniAppUrl}?tab=trips` } }]
      ]
    });
    return;
  }

  if (text === '/profil' || text === '/profile') {
    await sendTelegramMessage(chatId, `👤 <b>Foydalanuvchi profili</b>\n\nShaxsiy ma'lumotlar, pasport va to'lov kartalari:`, {
      inline_keyboard: [
        [{ text: "👤 Profilni ochish", web_app: { url: `${miniAppUrl}?tab=profile` } }]
      ]
    });
    return;
  }

  // 1. Command /start or /start reg_xxxx
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const sessionParam = parts[1];
    if (sessionParam) {
      userChatSessions.set(chatId, sessionParam);
      if (getDBStatus().connected) {
        TelegramSessionModel.updateOne(
          { sessionToken: sessionParam },
          { $set: { chatId: String(chatId) } }
        ).catch(() => {});
      }
    }

    const firstName = user.first_name || 'Hurmatli foydalanuvchi';
    const welcomeText = `👋 Assalomu alaykum, <b>${firstName}</b>!\n\n` +
      `🛫 <b>SayrHub</b> rasmiy sayohat platformasiga xush kelibsiz!\n\n` +
      `✨ Endi siz Telegram ichidan chiqmasdan butun dunyo bo'ylab eng arzon turpaketlarni qidirishingiz, qaynoq chegirmalarni topishingiz va xavfsiz bron qilishingiz mumkin.\n\n` +
      `🚀 SayrHub Mini Appni darhol ochish uchun quyidagi tugmani bosing:`;

    await sendTelegramMessage(chatId, welcomeText, {
      inline_keyboard: [
        [{ text: "🚀 SayrHub Mini Appni ochish", web_app: { url: miniAppUrl } }],
        [
          { text: "🔥 Qaynoq turlar", web_app: { url: `${miniAppUrl}?tab=hot` } },
          { text: "🔍 Qidiruv", web_app: { url: `${miniAppUrl}?tab=search` } }
        ],
        [
          { text: "🧳 Mening buyurtmalarim", web_app: { url: `${miniAppUrl}?tab=trips` } },
          { text: "👤 Profil", web_app: { url: `${miniAppUrl}?tab=profile` } }
        ]
      ]
    });

    if (sessionParam) {
      await sendTelegramMessage(chatId, `Ilovada telefon raqamingizni tasdiqlash uchun quyidagi <b>"📱 Telefon raqamni ulashish"</b> tugmasini bosing:`, {
        keyboard: [
          [{ text: "📱 Telefon raqamni ulashish", request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      });
    }
    return;
  }

  // 2. User shared contact (phone number)
  if (message.contact) {
    if (message.contact.user_id && message.contact.user_id !== user.id) {
      await sendTelegramMessage(chatId, `⚠️ Iltimos, faqat o'zingizning telefon raqamingizni <b>"📱 Telefon raqamni ulashish"</b> tugmasi orqali yuboring.`);
      return;
    }

    let rawPhone = message.contact.phone_number.trim();
    if (!rawPhone.startsWith('+')) {
      rawPhone = '+' + rawPhone;
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'SayrHub Mijoz';
    const tgUsername = user.username ? `@${user.username}` : '';
    // SEC-06 FIX: Upgrade OTP from 4 to 6 digits (100000 - 999999)
    const otpCode = String(randomInt(100000, 1000000));

    if (!getDBStatus().connected) {
      await sendTelegramMessage(chatId, 'Hozircha baza bilan aloqa yo‘q. Iltimos, keyinroq qayta urinib ko‘ring.');
      return;
    }

    let dbUser: any = null;
    try {
      const existingUser = await UserModel.findOne({
        $or: [{ telegramId: String(user.id) }, { phone: rawPhone }],
      }).select('status').lean();
      if (existingUser?.status === 'blocked') {
        await sendTelegramMessage(chatId, 'Akkauntingiz bloklangan. Yordam uchun qo‘llab-quvvatlash xizmatiga murojaat qiling.');
        return;
      }
      dbUser = await UserModel.findOneAndUpdate(
        { $or: [{ telegramId: String(user.id) }, { phone: rawPhone }] },
        {
          $set: {
            tcId: 'tw-' + user.id,
            name: fullName,
            phone: rawPhone,
            telegramId: String(user.id),
            telegramUsername: tgUsername
          },
          $setOnInsert: {
            citizenship: "O'zbekiston"
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (error) {
      console.error('MongoDB save telegram user failed:', error);
      await sendTelegramMessage(chatId, 'Ro‘yxatdan o‘tishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.');
      return;
    }

    const userToken = generateToken({
      id: dbUser.tcId,
      username: dbUser.phone || dbUser.tcId,
      role: 'user',
      name: dbUser.name
    }, '30d');

    // Attach to pending session in MongoDB and memory
    const sessionToken = userChatSessions.get(chatId);
    if (sessionToken) {
      if (getDBStatus().connected) {
        try {
          await TelegramSessionModel.updateOne(
            { sessionToken },
            {
              $set: {
                chatId: String(chatId),
                authenticated: true,
                user: dbUser,
                token: userToken,
                code: otpCode,
              }
            }
          );
        } catch (e) {
          console.error('Failed to sync session with MongoDB:', e);
        }
      }
      if (pendingSessions.has(sessionToken)) {
        const sess = pendingSessions.get(sessionToken)!;
        sess.authenticated = true;
        sess.user = dbUser;
        sess.token = userToken;
        sess.code = otpCode;
      }
    }

    const successText = `✅ <b>Ro'yxatdan o'tish muvaffaqiyatli yakunlandi!</b>\n\n` +
      `👤 <b>Ism:</b> ${fullName}\n` +
      `📱 <b>Telefon:</b> ${rawPhone}\n\n` +
      `🔑 <b>Sizning 6 xonali tasdiqlash kodingiz:</b> <code>${otpCode}</code>\n\n` +
      `<i>SayrHub mobil ilovasida ushbu kodni kiriting:</i>`;

    await sendTelegramMessage(chatId, successText, {
      inline_keyboard: [
        [{ text: "🚀 SayrHub Mini Appga kirish", web_app: { url: miniAppUrl } }]
      ]
    });
    return;
  }

  // 3. User typed phone number manually as text
  if (text) {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length >= 9) {
      const formattedPhone = '+' + (digitsOnly.startsWith('998') ? digitsOnly : '998' + digitsOnly);
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'SayrHub Mijoz';
      const tgUsername = user.username ? `@${user.username}` : '';
      // SEC-06 FIX: Upgrade OTP from 4 to 6 digits (100000 - 999999)
      const otpCode = String(randomInt(100000, 1000000));

      if (!getDBStatus().connected) {
        await sendTelegramMessage(chatId, 'Hozircha baza bilan aloqa yo‘q. Iltimos, keyinroq qayta urinib ko‘ring.');
        return;
      }

      let dbUser: any = null;
      try {
        const existingUser = await UserModel.findOne({
          $or: [{ telegramId: String(user.id) }, { phone: formattedPhone }],
        }).select('status').lean();
        if (existingUser?.status === 'blocked') {
          await sendTelegramMessage(chatId, 'Akkauntingiz bloklangan. Yordam uchun qo‘llab-quvvatlash xizmatiga murojaat qiling.');
          return;
        }
        dbUser = await UserModel.findOneAndUpdate(
          { $or: [{ telegramId: String(user.id) }, { phone: formattedPhone }] },
          {
            $set: {
              tcId: 'tw-' + user.id,
              name: fullName,
              phone: formattedPhone,
              telegramId: String(user.id),
              telegramUsername: tgUsername
            },
            $setOnInsert: {
              citizenship: "O'zbekiston"
            }
          },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (error) {
        console.error('MongoDB save Telegram user failed:', error);
        await sendTelegramMessage(chatId, 'Ro‘yxatdan o‘tishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.');
        return;
      }

      const userToken = generateToken({
        id: dbUser.tcId,
        username: dbUser.phone || dbUser.tcId,
        role: 'user',
        name: dbUser.name
      }, '30d');

      const sessionToken = userChatSessions.get(chatId);
      if (sessionToken) {
        if (getDBStatus().connected) {
          try {
            await TelegramSessionModel.updateOne(
              { sessionToken },
              {
                $set: {
                  chatId: String(chatId),
                  authenticated: true,
                  user: dbUser,
                  token: userToken,
                  code: otpCode,
                }
              }
            );
          } catch (e) {
            console.error('Failed to sync session with MongoDB:', e);
          }
        }
        if (pendingSessions.has(sessionToken)) {
          const sess = pendingSessions.get(sessionToken)!;
          sess.authenticated = true;
          sess.user = dbUser;
          sess.token = userToken;
          sess.code = otpCode;
        }
      }

      const reply = `✅ <b>Telefon raqamingiz qabul qilindi!</b>\n\n` +
        `🔑 <b>Sizning 6 xonali tasdiqlash kodingiz:</b> <code>${otpCode}</code>\n\n` +
        `<i>Ilovada ushbu kodni kiriting.</i>`;

      await sendTelegramMessage(chatId, reply, {
        inline_keyboard: [
          [{ text: "🚀 SayrHub Mini Appga kirish", web_app: { url: miniAppUrl } }]
        ]
      });
      return;
    }

    // Default guidance message
    await sendTelegramMessage(chatId, `Ilovada ro'yxatdan o'tish yoki kirish uchun quyidagi <b>"📱 Telefon raqamni ulashish"</b> tugmasini bosing:`, {
      keyboard: [
        [{ text: "📱 Telefon raqamni ulashish", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    });
  }
}

/**
 * Initializes continuous background long-polling for the bot
 */
let isPolling = false;
let updateOffset = 0;

export function startTelegramPolling() {
  if (isPolling) return;
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('ℹ️ TELEGRAM_BOT_TOKEN belgilanmagan — Telegram bot polling xizmati faollashtirilmadi.');
    return;
  }
  isPolling = true;
  console.log(`🤖 Telegram Bot @${TELEGRAM_BOT_USERNAME} polling service started...`);
  void setupTelegramMenuButton();

  const poll = async () => {
    while (isPolling) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${updateOffset}&timeout=20`, {
          signal: AbortSignal.timeout(30000)
        });
        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            updateOffset = update.update_id + 1;
            try {
              await processTelegramUpdate(update);
            } catch (err: any) {
              console.error('Error processing telegram update:', err.message);
            }
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (err: any) {
        // Sleep 2 seconds before retry on network timeouts
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  };

  poll().catch((e) => console.error('Fatal telegram bot error:', e));
}
