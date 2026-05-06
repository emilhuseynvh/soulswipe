import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from 'telegraf';
import { User } from '../entities/user.entity';
import { Gender, Step } from '../types';
import { OnboardingService } from './onboarding.service';
import { MatchService } from './match.service';
import { KeyboardService } from './keyboard.service';
import { ReactionType } from '../types';

@Update()
export class BotUpdate {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly onboarding: OnboardingService,
    private readonly matches: MatchService,
    private readonly keyboards: KeyboardService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const user = await this.getOrCreate(ctx);
    if (user.step === Step.DONE) {
      await ctx.reply('Geri xoş gəldin!', this.keyboards.mainMenu());
      return;
    }
    await this.onboarding.start(ctx, user);
  }

  @Command('reset')
  async onReset(@Ctx() ctx: Context) {
    const user = await this.getOrCreate(ctx);
    await this.onboarding.start(ctx, user);
  }

  @Hears('✏️ Profili yenilə')
  async onEdit(@Ctx() ctx: Context) {
    const user = await this.getOrCreate(ctx);
    await this.onboarding.start(ctx, user);
  }

  @Hears('👤 Mənim profilim')
  async onMyProfile(@Ctx() ctx: Context) {
    const user = await this.getOrCreate(ctx);
    if (user.step !== Step.DONE) {
      await ctx.reply('Əvvəlcə profilini tamamla. /start yaz.');
      return;
    }
    await this.sendProfile(ctx, user);
  }

  @Hears('🔎 Axtar')
  async onBrowse(@Ctx() ctx: Context) {
    const user = await this.getOrCreate(ctx);
    if (user.step !== Step.DONE) {
      await ctx.reply('Əvvəlcə profilini tamamla. /start yaz.');
      return;
    }
    await this.sendNextCandidate(ctx, user);
  }

  @Action(/^like:(\d+)$/)
  async onLike(@Ctx() ctx: any) {
    await this.handleReaction(ctx, ReactionType.LIKE);
  }

  @Action(/^pass:(\d+)$/)
  async onPass(@Ctx() ctx: any) {
    await this.handleReaction(ctx, ReactionType.PASS);
  }

  @Action(/^gender:(MALE|FEMALE)$/)
  async onGender(@Ctx() ctx: any) {
    const value = ctx.match?.[1] as Gender;
    const user = await this.getOrCreate(ctx);
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {}
    await this.onboarding.applyGender(ctx, user, value);
  }

  @Action(/^looking:(MALE|FEMALE)$/)
  async onLookingFor(@Ctx() ctx: any) {
    const value = ctx.match?.[1] as Gender;
    const user = await this.getOrCreate(ctx);
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {}
    await this.onboarding.applyLookingFor(ctx, user, value);
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: any) {
    const user = await this.getOrCreate(ctx);
    const photos = ctx.message?.photo;
    if (!photos || photos.length === 0) return;
    const fileId = photos[photos.length - 1].file_id;
    await this.onboarding.handlePhoto(ctx, user, fileId);
  }

  @On('contact')
  async onContact(@Ctx() ctx: any) {
    const contact = ctx.message?.contact;
    if (!contact) return;
    const user = await this.getOrCreate(ctx);
    if (contact.user_id && contact.user_id.toString() !== user.id) {
      await ctx.reply('Yalnız öz nömrəni paylaş.');
      return;
    }
    await this.onboarding.handleContact(ctx, user, contact.phone_number);
  }

  @On('text')
  async onText(@Ctx() ctx: any) {
    const text: string = ctx.message?.text ?? '';
    if (text.startsWith('/')) return;

    const menuItems = ['🔎 Axtar', '👤 Mənim profilim', '✏️ Profili yenilə'];
    if (menuItems.includes(text)) return;

    const user = await this.getOrCreate(ctx);
    if (user.step === Step.DONE) {
      await ctx.reply('Menyudan istifadə et.', this.keyboards.mainMenu());
      return;
    }
    await this.onboarding.handleText(ctx, user, text);
  }

  private async handleReaction(ctx: any, type: ReactionType) {
    const targetId: string = ctx.match?.[1];
    if (!targetId) return;

    const user = await this.getOrCreate(ctx);
    if (user.step !== Step.DONE) {
      await ctx.answerCbQuery('Əvvəlcə profilini tamamla.');
      return;
    }

    const matched = await this.matches.react(user, targetId, type);
    await ctx.answerCbQuery(matched ? 'Match! 🎉' : type === ReactionType.LIKE ? '❤️' : '👎');
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch {}

    await this.sendNextCandidate(ctx, user);
  }

  private async sendNextCandidate(ctx: Context, user: User) {
    const candidate = await this.matches.findCandidate(user);
    if (!candidate) {
      await ctx.reply('Hələlik kimsə tapmadım. Bir az sonra yenidən yoxla.', this.keyboards.mainMenu());
      return;
    }
    await this.sendProfileCard(ctx, candidate, true);
  }

  private async sendProfile(ctx: Context, user: User) {
    await this.sendProfileCard(ctx, user, false);
  }

  private async sendProfileCard(ctx: Context, user: User, withSwipe: boolean) {
    const caption = `${user.name}, ${user.age}\n\n${user.bio ?? ''}`;
    const extra = withSwipe ? this.keyboards.swipe(user) : undefined;

    if (user.photoFileId) {
      await ctx.replyWithPhoto(user.photoFileId, {
        caption,
        ...(extra ?? {}),
      });
    } else {
      await ctx.reply(caption, extra);
    }
  }

  private async getOrCreate(ctx: Context): Promise<User> {
    const from = ctx.from!;
    const id = from.id.toString();
    let user = await this.users.findOne({ where: { id } });
    if (!user) {
      user = this.users.create({
        id,
        username: from.username ?? null,
        step: Step.NONE,
      });
      await this.users.save(user);
    } else if (user.username !== (from.username ?? null)) {
      user.username = from.username ?? null;
      await this.users.save(user);
    }
    return user;
  }
}
