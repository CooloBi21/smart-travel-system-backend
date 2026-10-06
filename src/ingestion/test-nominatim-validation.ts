import { NominatimGeocodingAdapter } from './adapters/nominatim-geocoding.adapter';

async function bootstrap() {
  const adapter = new NominatimGeocodingAdapter();

  const testCases = [
    {
      name: 'Nhà cổ Phùng Hưng',
      address: '4 Nguyễn Thị Minh Khai, Hội An, Thành phố Đà Nẵng',
    },
    {
      name: 'Hội Quán Phước Kiến',
      address: '46 Trần Phú, Hội An, Thành phố Đà Nẵng',
    },
    {
      name: 'Động Tiên Sơn',
      address: 'Hàm Rồng, Thanh Hóa',
    },
    {
      name: 'Khu bảo tồn thiên nhiên Pù Luông',
      address: 'Pù Luông, Bá Thước, Thanh Hóa',
    },
    {
      name: 'Thác Trắng',
      address: 'Thôn Thượng Đố, Minh Long, Quảng Ngãi',
    },
    {
      name: 'Núi Thiên Ấn',
      address: 'Sơn Tịnh, Quảng Ngãi',
    },
  ];

  for (const testCase of testCases) {
    console.log('\n----------------------------------------');
    console.log(`TEST: ${testCase.name}`);
    console.log(`SOURCE: ${testCase.address}`);

    try {
      const result = await adapter.geocode(
        testCase.name,
        testCase.address,
      );

      if (!result) {
        console.log('RESULT: REJECT / NOT FOUND');
        continue;
      }

      console.log('RESULT: ACCEPT');
      console.log(`Latitude: ${result.latitude}`);
      console.log(`Longitude: ${result.longitude}`);
      console.log(`OSM: ${result.osmType}:${result.osmId}`);
      console.log(`Matched query: ${result.matchedQuery}`);
      console.log(`Display name: ${result.displayName}`);
    } catch (error) {
      console.error('ERROR:', error);
    }
  }
}

bootstrap().catch((error) => {
  console.error(error);
});
