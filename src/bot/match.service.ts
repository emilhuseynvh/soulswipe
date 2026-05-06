import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { ReactionType } from '../types';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Reaction) private readonly reactions: Repository<Reaction>,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  async findCandidate(viewer: User): Promise<User | null> {
    if (!viewer.gender || !viewer.lookingFor) return null;

    const reactions = await this.reactions.find({
      where: { fromId: viewer.id },
      select: ['toId', 'type'],
    });

    const likedIds = reactions
      .filter((r) => r.type === ReactionType.LIKE)
      .map((r) => r.toId);
    const passedIds = new Set(
      reactions.filter((r) => r.type === ReactionType.PASS).map((r) => r.toId),
    );

    const excluded = [viewer.id, ...likedIds];

    const candidates = await this.users.find({
      where: {
        id: Not(In(excluded)),
        complete: true,
        active: true,
        gender: viewer.lookingFor,
        lookingFor: viewer.gender,
      },
    });

    if (candidates.length === 0) return null;

    const fresh = candidates.filter((u) => !passedIds.has(u.id));
    const pool = fresh.length > 0 ? fresh : candidates;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  async react(from: User, toId: string, type: ReactionType): Promise<boolean> {
    const existing = await this.reactions.findOne({
      where: { fromId: from.id, toId },
    });

    if (existing && existing.type === ReactionType.LIKE) return false;

    if (existing) {
      existing.type = type;
      await this.reactions.save(existing);
    } else {
      await this.reactions.save(
        this.reactions.create({ fromId: from.id, toId, type }),
      );
    }

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

    const extra = {
      reply_markup: {
        inline_keyboard: [[{ text: '💬 Mesaj yaz', url }]],
      },
    };

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
