import { VietnamTourismDestinationAdapter } from './adapters/vietnam-tourism-destination.adapter';

async function main() {
  const adapter = new VietnamTourismDestinationAdapter();

  const items = await adapter.fetchPage(1);

  console.log(`Items found: ${items.length}`);

  for (const item of items.slice(0, 5)) {
    console.log('---');
    console.log('externalKey:', item.externalKey);
    console.log('name:', item.name);
    console.log('address:', item.address);
    console.log('sourceUrl:', item.sourceUrl);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
