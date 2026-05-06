import { Injectable } from '@nestjs/common';

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
