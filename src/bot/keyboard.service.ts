import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export class KeyboardService {
  genderPicker() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👨 Oğlan', callback_data: 'gender:MALE' },
            { text: '👩 Qız', callback_data: 'gender:FEMALE' },
          ],
        ],
      },
    };
  }

  lookingForPicker() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👨 Oğlan', callback_data: 'looking:MALE' },
            { text: '👩 Qız', callback_data: 'looking:FEMALE' },
          ],
        ],
      },
    };
  }

  skipPhoto() {
    return {
      reply_markup: {
        keyboard: [[{ text: 'Şəkilsiz davam et' }]],
        resize_keyboard: true,
      },
    };
  }

  requestContact() {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '📱 Nömrəmi paylaş', request_contact: true }],
          [{ text: 'Keç' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
  }

  mainMenu() {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '🔎 Axtar' }, { text: '👤 Mənim profilim' }],
          [{ text: '✏️ Profili yenilə' }],
        ],
        resize_keyboard: true,
      },
    };
  }

  swipe(target: User) {
    const url = target.username
      ? `https://t.me/${target.username}`
      : `tg://user?id=${target.id}`;
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❤️', callback_data: `like:${target.id}` },
            { text: '💬', url },
            { text: '👎', callback_data: `pass:${target.id}` },
          ],
        ],
      },
    };
  }
}
