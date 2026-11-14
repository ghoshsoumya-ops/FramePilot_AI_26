import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '../.env')
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

dotenv.config();
