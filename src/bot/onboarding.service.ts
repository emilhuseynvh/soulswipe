import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from 'telegraf';
import { User } from '../entities/user.entity';
import { Gender, Step } from '../types';
import { KeyboardService } from './keyboard.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly keyboards: KeyboardService,
  ) {}

  async start(ctx: Context, user: User) {
    user.step = Step.NAME;
    user.name = null;
    user.age = null;
    user.gender = null;
    user.lookingFor = null;
    user.bio = null;
    user.photoFileId = null;
    await this.users.save(user);
    await ctx.reply('Salam! Adın nədir?');
  }

  async handleText(ctx: Context, user: User, text: string) {
    switch (user.step) {
      case Step.NAME:
        return this.setName(ctx, user, text);
      case Step.AGE:
        return this.setAge(ctx, user, text);
      case Step.GENDER:
        return this.setGender(ctx, user, text);
      case Step.LOOKING_FOR:
        return this.setLookingFor(ctx, user, text);
      case Step.BIO:
        return this.setBio(ctx, user, text);
      case Step.PHOTO:
        if (text.toLowerCase().includes('şəkilsiz')) {
          return this.afterPhoto(ctx, user);
        }
        await ctx.reply('Zəhmət olmasa şəkil göndər və ya "Şəkilsiz davam et" düyməsini bas.');
        return;
      case Step.CONTACT:
        if (text.toLowerCase().includes('keç')) {
          return this.finish(ctx, user);
        }
        await ctx.reply(
          'Nömrəni paylaş və ya "Keç" düyməsinə bas.',
          this.keyboards.requestContact(),
        );
        return;
      default:
        await ctx.reply('Profilini quraşdırmaq üçün /start yaz.');
    }
  }

  async handlePhoto(ctx: Context, user: User, fileId: string) {
    if (user.step !== Step.PHOTO) {
      await ctx.reply('İndi şəkil göndərmək lazım deyil.');
      return;
    }
    user.photoFileId = fileId;
    await this.afterPhoto(ctx, user);
  }

  async handleContact(ctx: Context, user: User, phone: string) {
    if (user.step !== Step.CONTACT) {
      await ctx.reply('İndi nömrə göndərmək lazım deyil.');
      return;
    }
    user.phone = phone;
    await this.finish(ctx, user);
  }

  private async setName(ctx: Context, user: User, text: string) {
    const name = text.trim();
    if (name.length < 2 || name.length > 32) {
      await ctx.reply('Ad 2-32 simvol arasında olmalıdır.');
      return;
    }
    user.name = name;
    user.step = Step.AGE;
    await this.users.save(user);
    await ctx.reply('Neçə yaşın var?');
  }

  private async setAge(ctx: Context, user: User, text: string) {
    const age = parseInt(text.trim(), 10);
    if (isNaN(age) || age < 18 || age > 99) {
      await ctx.reply('Yaş 18-99 arasında olmalıdır.');
      return;
    }
    user.age = age;
    user.step = Step.GENDER;
    await this.users.save(user);
    await ctx.reply('Cinsini seç:', this.keyboards.genderPicker());
  }

  private async setGender(ctx: Context, user: User, text: string) {
    const gender = this.parseGender(text);
    if (!gender) {
      await ctx.reply('Düymələrdən birini seç.', this.keyboards.genderPicker());
      return;
    }
    await this.applyGender(ctx, user, gender);
  }

  async applyGender(ctx: Context, user: User, gender: Gender) {
    if (user.step !== Step.GENDER) return;
    user.gender = gender;
    user.step = Step.LOOKING_FOR;
    await this.users.save(user);
    await ctx.reply('Kim axtarırsan?', this.keyboards.lookingForPicker());
  }

  private async setLookingFor(ctx: Context, user: User, text: string) {
    const target = this.parseGender(text);
    if (!target) {
      await ctx.reply('Düymələrdən birini seç.', this.keyboards.lookingForPicker());
      return;
    }
    await this.applyLookingFor(ctx, user, target);
  }

  async applyLookingFor(ctx: Context, user: User, gender: Gender) {
    if (user.step !== Step.LOOKING_FOR) return;
    user.lookingFor = gender;
    user.step = Step.BIO;
    await this.users.save(user);
    await ctx.reply('Özün haqqında bir-iki cümlə yaz:');
  }

  private async setBio(ctx: Context, user: User, text: string) {
    const bio = text.trim();
    if (bio.length > 500) {
      await ctx.reply('Bio 500 simvoldan az olmalıdır.');
      return;
    }
    user.bio = bio;
    user.step = Step.PHOTO;
    await this.users.save(user);
    await ctx.reply('İndi profil şəkli göndər.', this.keyboards.skipPhoto());
  }

  private async afterPhoto(ctx: Context, user: User) {
    if (!user.username) {
      user.step = Step.CONTACT;
      await this.users.save(user);
      await ctx.reply(
        'Telegram username-in yoxdur. İstəsən nömrəni paylaş — beləliklə səni bəyənənlər birbaşa səninlə əlaqə saxlaya biləcək.',
        this.keyboards.requestContact(),
      );
      return;
    }
    await this.finish(ctx, user);
  }

  private async finish(ctx: Context, user: User) {
    user.step = Step.DONE;
    await this.users.save(user);
    await ctx.reply(
      'Profilin hazırdır! 🔎 Axtar düyməsi ilə insanlara baxa bilərsən.',
      this.keyboards.mainMenu(),
    );
  }

  private parseGender(text: string): Gender | null {
    const lower = text.toLowerCase();
    if (lower.includes('oğlan') || lower.includes('kişi') || lower.includes('male')) {
      return Gender.MALE;
    }
    if (lower.includes('qız') || lower.includes('qadın') || lower.includes('female')) {
      return Gender.FEMALE;
    }
    return null;
  }
}
