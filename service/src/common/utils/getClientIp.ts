import { Request } from 'express';

export function getClientIp(request: Request): string {
  let ipAddress = '';

  // 预定义的一组请求头列表，按优先级排序
  const headerList = [
    'X-Client-IP',
    'X-Real-IP',
    'X-Forwarded-For',
    'CF-Connecting-IP',
    'True-Client-IP',
    'X-Cluster-Client-IP',
    'Proxy-Client-IP',
    'WL-Proxy-Client-IP',
    'HTTP_CLIENT_IP',
    'HTTP_X_FORWARDED_FOR',
  ];

  // 尝试从预定义的请求头列表中提取客户端的真实 IP 地址
  for (const header of headerList) {
    const value = request.headers[header];
    if (value && typeof value === 'string') {
      const ips = value.split(',');
      // 取最左侧的 IP 地址作为客户端的真实 IP 地址
      ipAddress = ips[0].trim();
      break;
    }
  }

  // 如果无法从请求头中获取到客户端的真实 IP 地址，则回退到使用 connection.remoteAddress 属性
  if (!ipAddress) {
    ipAddress = request.connection.remoteAddress || '';
  }

  // 对获取到的 IP 地址进行格式化和过滤操作
  if (ipAddress && ipAddress.includes('::')) {
    const isLocal = /^(::1|fe80(:1)?::1(%.*)?)$/i.test(ipAddress);
    if (isLocal) {
      ipAddress = '';
    } else if (ipAddress.includes('::ffff:')) {
      ipAddress = ipAddress.split(':').pop() || '';
    }
  }

  // 如果获取到的 IP 地址不符合格式要求，则设置为空字符串
  if (!ipAddress || !/\d+\.\d+\.\d+\.\d+/.test(ipAddress)) {
    ipAddress = '';
  }
  return ipAddress;
}
