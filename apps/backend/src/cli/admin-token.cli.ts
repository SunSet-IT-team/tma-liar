import { connectToDatabase } from '../database/database';
import { AdminTokenRepository } from '../admin-tokens/admin-token.repository';
import { generateAdminToken, hashAdminToken } from '../admin-tokens/admin-token.utils';
import { env } from '../config/env';
import mongoose from 'mongoose';

function buildLocalMongoUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    parsed.hostname = 'localhost';
    return parsed.toString();
  } catch {
    return uri
      .replace('@mongodb:', '@localhost:')
      .replace('//mongodb:', '//localhost:');
  }
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const repo = new AdminTokenRepository();

  try {
    await connectToDatabase();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isDockerHostnameResolutionError = errorMessage.includes('getaddrinfo ENOTFOUND mongodb');

    if (!isDockerHostnameResolutionError) {
      throw error;
    }

    const localUri = buildLocalMongoUri(env.DB_CONN_STRING);
    console.warn('Mongo host "mongodb" недоступен локально, пробую подключиться к localhost...');
    try {
      await mongoose.disconnect();
    } catch {
      // ignore cleanup errors before retry
    }
    await connectToDatabase(localUri);
  }

  if (command === 'create') {
    const name = rest.join(' ').trim() || `token-${Date.now()}`;
    const generated = generateAdminToken();
    const tokenHash = hashAdminToken(generated.token);
    const saved = await repo.create({
      name,
      prefix: generated.prefix,
      tokenHash,
    });

    console.log('Admin token created');
    console.log(`id: ${saved.id}`);
    console.log(`name: ${saved.name}`);
    console.log(`prefix: ${saved.prefix}`);
    console.log(`token: ${generated.token}`);
    return;
  }

  if (command === 'list') {
    const tokens = await repo.listAll();
    if (tokens.length === 0) {
      console.log('No admin tokens');
      return;
    }

    for (const token of tokens) {
      console.log(
        `${token.id} | ${token.name} | ${token.prefix} | revoked=${Boolean(token.revokedAt)} | lastUsedAt=${token.lastUsedAt ?? 'never'}`,
      );
    }
    return;
  }

  if (command === 'revoke') {
    const id = (rest[0] ?? '').trim();
    if (!id) {
      console.error('Usage: bun run cli:admin-token revoke <id>');
      process.exitCode = 1;
      return;
    }

    const revoked = await repo.revokeById(id);
    if (!revoked) {
      console.error('Token not found or already revoked');
      process.exitCode = 1;
      return;
    }

    console.log(`Token revoked: ${id}`);
    return;
  }

  console.log('Usage:');
  console.log('  bun run cli:admin-token create <name>');
  console.log('  bun run cli:admin-token list');
  console.log('  bun run cli:admin-token revoke <id>');
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
