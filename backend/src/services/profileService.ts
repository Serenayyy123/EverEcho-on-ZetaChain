import { PrismaClient } from '@prisma/client';
import { ProfileInput, ProfileOutput } from '../models/Profile';

const prisma = new PrismaClient();

/**
 * Profile 存储服务
 * 冻结点 2.2-P0-B1：流程固定 - 前端先上传 profile → backend 返回 profileURI
 */

/**
 * 创建或更新 Profile（幂等）
 * @param input Profile 输入数据
 * @returns 创建/更新的 Profile
 */
export async function upsertProfile(input: ProfileInput) {
  const { address, nickname, city, skills, encryptionPubKey, contacts } = input;

  // 幂等性：使用 upsert，同一 address 覆盖旧数据
  const profile = await prisma.profile.upsert({
    where: { address },
    update: {
      nickname,
      city,
      skills: JSON.stringify(skills),
      encryptionPubKey,
      contacts: contacts || undefined,
    },
    create: {
      address,
      nickname,
      city,
      skills: JSON.stringify(skills),
      encryptionPubKey,
      contacts: contacts || undefined,
    },
  });

  return profile;
}

/**
 * 根据 address 获取 Profile
 * @param address 用户地址
 * @returns Profile JSON 或 null
 */
export async function getProfile(address: string): Promise<ProfileOutput | null> {
  const profile = await prisma.profile.findUnique({
    where: { address },
  });

  if (!profile) {
    return null;
  }

  // 返回符合 schema 的 JSON（冻结点 3.2：字段命名一致）
  // 处理 skills：尝试 JSON.parse，失败则按逗号分隔
  let skills: string[];
  try {
    skills = JSON.parse(profile.skills);
  } catch {
    // 如果不是有效 JSON，按逗号分隔处理
    skills = profile.skills.split(',').map(s => s.trim()).filter(s => s);
  }
  
  return {
    nickname: profile.nickname,
    city: profile.city,
    skills,
    encryptionPubKey: profile.encryptionPubKey,
    contacts: profile.contacts || undefined,
  };
}

/**
 * 生成 profileURI
 * @param address 用户地址
 * @returns profileURI
 */
export function generateProfileURI(address: string): string {
  // 冻结点 2.2-P0-B1：URI 格式固定
  return `https://api.everecho.io/profile/${address}.json`;
}
