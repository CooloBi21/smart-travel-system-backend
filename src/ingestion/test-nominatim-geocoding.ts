import { NominatimGeocodingAdapter } from './adapters/nominatim-geocoding.adapter';

async function main() {
  const adapter = new NominatimGeocodingAdapter();

  const samples = [
    {
      name: 'Bảo tàng văn hóa Sa Huỳnh',
      address:
        '149 Trần Phú, Hội An, Thành phố Đà Nẵng',
    },
    {
      name: 'Nhà cổ Phùng Hưng',
      address:
        '4 Nguyễn Thị Minh Khai, Hội An, Thành phố Đà Nẵng',
    },
    {
      name: 'Hội Quán Phước Kiến',
      address:
        '46 Trần Phú, Hội An, Thành phố Đà Nẵng',
    },
  ];

  for (const item of samples) {
    console.log('========================================');
    console.log('NAME:', item.name);
    console.log('ADDRESS:', item.address);

    try {
      const result = await adapter.geocode(
        item.name,
        item.address,
      );

      if (!result) {
        console.log('RESULT: NOT FOUND');
        continue;
      }

      console.log('LATITUDE:', result.latitude);
      console.log('LONGITUDE:', result.longitude);
      console.log('DISPLAY NAME:', result.displayName);
      console.log('OSM TYPE:', result.osmType);
      console.log('OSM ID:', result.osmId);
    } catch (error) {
      console.error(
        'ERROR:',
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
});
