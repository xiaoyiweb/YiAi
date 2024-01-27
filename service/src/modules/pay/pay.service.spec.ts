import { Test, TestingModule } from '@nestjs/testing';
import { PayService } from './pay.service';

describe('PayService', () => {
  let service: PayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayService],
    }).compile();

    service = module.get<PayService>(PayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be string', () => {
    const params = { val: 123456 };
    const sign = service.sign(params, 'secret');
    expect(sign).toBeDefined;
  });

  // it('should be pay result', async () => {
  //   const val = await service.pay(4);
  //   console.log(val)
  //   expect(val).toBeDefined;
  // });

  it('should be query result', async () => {
    const val = await service.query('3');
    console.log(val)
    expect(val).toBeDefined;
  });

  it('should be pay result', async () => {
    const val = await service.payEpay_('20230520001');
    console.log(val)
    expect(val).toBeDefined;
  });
});
