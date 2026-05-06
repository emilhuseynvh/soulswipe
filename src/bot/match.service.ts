import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Markup, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { ReactionType, Step } from '../types';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Reaction) private readonly reactions: Repository<Reaction>,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  async findCandidate(viewer: User): Promise<User | null> {
    if (!viewer.gender || !viewer.lookingFor) return null;

    return this.users
      .createQueryBuilder('u')
      .where('u.id != :viewerId', { viewerId: viewer.id })
      .andWhere('u.step = :done', { done: Step.DONE })
      .andWhere('u.active = true')
      .andWhere('u.gender = :wanted', { wanted: viewer.lookingFor })
      .andWhere('u.lookingFor = :viewerGender', { viewerGender: viewer.gender })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM reactions r
          WHERE r.fromId = :viewerId AND r.toId = u.id
        )`,
        { viewerId: viewer.id },
      )
      .orderBy('RAND()')
      .limit(1)
      .getOne();
  }

  async react(from: User, toId: string, type: ReactionType): Promise<boolean> {
    const existing = await this.reactions.findOne({
      where: { fromId: from.id, toId },
    });
    if (existing) return false;

    await this.reactions.save(
      this.reactions.create({ fromId: from.id, toId, type }),
    );

    if (type !== ReactionType.LIKE) return false;

    const target = await this.users.findOne({ where: { id: toId } });
    if (!target) return false;

    const mutual = await this.reactions.findOne({
      where: { fromId: toId, toId: from.id, type: ReactionType.LIKE },
    });

    if (mutual) {
      await this.notifyMatch(from, target);
      await this.notifyMatch(target, from);
      return true;
    }

    await this.notifyLike(target, from);
    return false;
  }

  private async notifyLike(receiver: User, liker: User) {
    const text = `💌 ${liker.name}, ${liker.age} səni bəyəndi!\nİstəsən mesaj yaz.`;
    await this.sendChatPrompt(receiver, liker, text);
  }

  private async notifyMatch(receiver: User, partner: User) {
    const text = `🎉 Match! ${partner.name}, ${partner.age} ilə bir-birinizi bəyəndiniz.`;
    await this.sendChatPrompt(receiver, partner, text);
  }

  private async sendChatPrompt(receiver: User, partner: User, caption: string) {
    const url = partner.username
      ? `https://t.me/${partner.username}`
      : `tg://user?id=${partner.id}`;

    const extra = Markup.inlineKeyboard([
      Markup.button.url('💬 Mesaj yaz', url),
    ]);

    try {
      if (partner.photoFileId) {
        await this.bot.telegram.sendPhoto(receiver.id, partner.photoFileId, {
          caption,
          ...extra,
        });
      } else {
        await this.bot.telegram.sendMessage(receiver.id, caption, extra);
      }
    } catch {}

    if (!partner.username && partner.phone) {
      try {
        await this.bot.telegram.sendContact(
          receiver.id,
          partner.phone,
          partner.name ?? 'İstifadəçi',
        );
      } catch {}
    }
  }
}
