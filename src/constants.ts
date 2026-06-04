import { NeedleSlot } from './types';

const SEWING_MACHINE_IMAGE = `${import.meta.env.BASE_URL}assets/sewing-machine-wide.png`;

export const MOCK_SLOTS: NeedleSlot[] = Array.from({ length: 30 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const screenshotCounts = [28, 16, 3, 0, 23, 24, 2, 0, 18, 17, 7, 0];
  let count = screenshotCounts[i] ?? 14;
  const maxCount = 20;

  let status: NeedleSlot['status'] = 'available';
  if (count === 0) {
    status = 'empty';
  } else if (count <= 9) {
    status = 'low';
  }

  return {
    id: `slot-${num}`,
    number: num,
    count,
    maxCount,
    status,
    needleType: 'DBx1HS',
    model: 'A8100平车',
    image: SEWING_MACHINE_IMAGE,
    needleNo: '90/14#',
    needleTip: 'R/SET',
    needleName: 'A8100平车',
    usage: 'A8100平缝',
    brand: '格罗茨'
  };
});

export const EXCHANGE_REASONS = ['断针', '弯曲', '钝尖', '生锈', '尺寸不符', '其他'];
export const RETURN_REASONS = ['订单结束', '领用冗余', '换款返还', '设备故障停机', '其他'];

export const MOCK_LOGS = [
  { id: '1', time: '2026-04-24 10:15:22', user: '张三', action: '领针', needleInfo: 'DB×1HS 90/14#', result: '成功' },
  { id: '2', time: '2026-04-24 10:30:45', user: '李四', action: '换针', needleInfo: 'DP×5 18#', result: '成功', reason: '断针' },
  { id: '3', time: '2026-04-24 10:45:10', user: '王五', action: '还针', needleInfo: 'DB×1HS 90/14#', result: '成功', reason: '订单结束' },
];
