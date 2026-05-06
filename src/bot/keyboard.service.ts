import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

@Injectable()
export class KeyboardService {
  genderPicker() {
    return Markup.keyboard([['👨 Oğlan', '👩 Qız']])
      .oneTime()
      .resize();
  }

  lookingForPicker() {
    return Markup.keyboard([['👨 Oğlan', '👩 Qız']])
      .oneTime()
      .resize();
  }

  skipPhoto() {
    return Markup.keyboard([['Şəkilsiz davam et']])
      .oneTime()
      .resize();
  }

  requestContact() {
    return Markup.keyboard([
      [Markup.button.contactRequest('📱 Nömrəmi paylaş')],
      ['Keç'],
    ])
      .oneTime()
      .resize();
  }

  mainMenu() {
    return Markup.keyboard([
      ['🔎 Axtar', '👤 Mənim profilim'],
      ['✏️ Profili yenilə'],
    ]).resize();
  }

  swipe(targetId: string) {
    return Markup.inlineKeyboard([
      Markup.button.callback('❤️', `like:${targetId}`),
      Markup.button.callback('👎', `pass:${targetId}`),
    ]);
  }
}
