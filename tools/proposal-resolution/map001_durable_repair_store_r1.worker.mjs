import fs from 'node:fs';

import {
  Map001DurableStoreCrash,
  commitMap001RepairSnapshot,
  recoverMap001RepairStore,
} from './map001_durable_repair_store_r1.mjs';

const [operation, payloadPath] = process.argv.slice(2);
if (!operation || !payloadPath) {
  process.stderr.write('usage: map001_durable_repair_store_r1.worker.mjs <commit|recover> <payload.json>\n');
  process.exit(64);
}

const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

if (operation === 'commit') {
  try {
    const result = commitMap001RepairSnapshot(payload);
    process.stdout.write(JSON.stringify(result) + '\n');
    process.exit(0);
  } catch (error) {
    if (error instanceof Map001DurableStoreCrash) {
      process.stderr.write('SIMULATED_CRASH:' + error.point + '\n');
      process.exit(90);
    }
    process.stderr.write(JSON.stringify({
      name: error?.name,
      code: error?.code,
      message: error?.message,
      details: error?.details,
    }) + '\n');
    process.exit(1);
  }
}

if (operation === 'recover') {
  try {
    const result = recoverMap001RepairStore(payload);
    process.stdout.write(JSON.stringify(result) + '\n');
    process.exit(0);
  } catch (error) {
    process.stderr.write(JSON.stringify({
      name: error?.name,
      code: error?.code,
      message: error?.message,
      details: error?.details,
    }) + '\n');
    process.exit(1);
  }
}

process.stderr.write('unknown operation: ' + operation + '\n');
process.exit(64);
