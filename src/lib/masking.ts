/**
 * 数据脱敏工具函数
 * 支持多种敏感信息类型的脱敏处理
 */

export type MaskingType = 'phone' | 'email' | 'idCard' | 'bankCard' | 'name' | 'address' | 'custom';

/**
 * 手机号脱敏 - 保留前3后4
 * 13812345678 -> 138****5678
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(-4)}`;
  }
  // 其他格式手机号
  const visibleStart = 3;
  const visibleEnd = 4;
  const maskLength = Math.max(0, cleaned.length - visibleStart - visibleEnd);
  return `${cleaned.slice(0, visibleStart)}${'*'.repeat(maskLength)}${cleaned.slice(-visibleEnd)}`;
};

/**
 * 邮箱脱敏 - 保留首字符和域名
 * john.doe@example.com -> j****@example.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`;
  }
  return `${localPart[0]}${'*'.repeat(Math.min(4, localPart.length - 1))}@${domain}`;
};

/**
 * 身份证号脱敏 - 保留前6后4
 * 110101199001011234 -> 110101********1234
 */
export const maskIdCard = (idCard: string): string => {
  if (!idCard || idCard.length < 10) return idCard;
  const cleaned = idCard.replace(/\s/g, '');
  return `${cleaned.slice(0, 6)}${'*'.repeat(cleaned.length - 10)}${cleaned.slice(-4)}`;
};

/**
 * 银行卡号脱敏 - 保留前4后4
 * 6222021234567890123 -> 6222***********0123
 */
export const maskBankCard = (cardNumber: string): string => {
  if (!cardNumber || cardNumber.length < 8) return cardNumber;
  const cleaned = cardNumber.replace(/\s/g, '');
  return `${cleaned.slice(0, 4)}${'*'.repeat(cleaned.length - 8)}${cleaned.slice(-4)}`;
};

/**
 * 姓名脱敏 - 只显示姓氏
 * 张三 -> 张*
 * 张三丰 -> 张**
 */
export const maskName = (name: string): string => {
  if (!name || name.length < 2) return name;
  return `${name[0]}${'*'.repeat(name.length - 1)}`;
};

/**
 * 地址脱敏 - 隐藏详细地址
 * 北京市朝阳区某某路123号 -> 北京市朝阳区****
 */
export const maskAddress = (address: string): string => {
  if (!address || address.length < 6) return address;
  // 保留前6个字符
  return `${address.slice(0, 6)}${'*'.repeat(Math.min(4, address.length - 6))}`;
};

/**
 * 自定义脱敏
 * @param value 原始值
 * @param startVisible 开头可见字符数
 * @param endVisible 结尾可见字符数
 * @param maskChar 脱敏字符
 */
export const maskCustom = (
  value: string,
  startVisible: number = 1,
  endVisible: number = 1,
  maskChar: string = '*'
): string => {
  if (!value || value.length <= startVisible + endVisible) return value;
  const maskLength = value.length - startVisible - endVisible;
  return `${value.slice(0, startVisible)}${maskChar.repeat(maskLength)}${value.slice(-endVisible)}`;
};

/**
 * 根据类型自动脱敏
 */
export const mask = (value: string | undefined | null, type: MaskingType): string => {
  if (!value) return '';
  
  switch (type) {
    case 'phone':
      return maskPhone(value);
    case 'email':
      return maskEmail(value);
    case 'idCard':
      return maskIdCard(value);
    case 'bankCard':
      return maskBankCard(value);
    case 'name':
      return maskName(value);
    case 'address':
      return maskAddress(value);
    case 'custom':
    default:
      return maskCustom(value);
  }
};
