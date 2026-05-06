import { Injectable } from '@nestjs/common';

@Injectable()
export class KeyboardService {
  genderPicker() {
    return {
      reply_markup: {
        keyboard: [[{ text: '👨 Oğlan' }, { text: '👩 Qız' }]],
        resize_keyboard: true,
      },
    };
  }

  lookingForPicker() {
    return {
      reply_markup: {
        keyboard: [[{ text: '👨 Oğlan' }, { text: '👩 Qız' }]],
        resize_keyboard: true,
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

  swipe(targetId: string) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❤️', callback_data: `like:${targetId}` },
            { text: '👎', callback_data: `pass:${targetId}` },
          ],
        ],
      },
    };
  }
}
