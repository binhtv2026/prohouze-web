import {
  canRoleAccessAppPath,
  getRoleAppHomePath,
  getRoleAppRuntime,
  getRoleAppSection,
  isRoleInAppRuntime,
} from '@/config/appRuntimeShell';

describe('app runtime shell', () => {
  it('cho phep dung app voi cac role app-first va hybrid', () => {
    expect(isRoleInAppRuntime('sales')).toBe(true);
    expect(isRoleInAppRuntime('agency')).toBe(true);
    expect(isRoleInAppRuntime('manager')).toBe(true);
    expect(isRoleInAppRuntime('marketing')).toBe(true);
    expect(isRoleInAppRuntime('bod')).toBe(true);
  });

  it('khong mo app voi role back-office web-only', () => {
    expect(isRoleInAppRuntime('finance')).toBe(false);
    expect(isRoleInAppRuntime('hr')).toBe(false);
    expect(isRoleInAppRuntime('legal')).toBe(false);
    expect(isRoleInAppRuntime('content')).toBe(false);
    expect(isRoleInAppRuntime('admin')).toBe(false);
  });

  it('tra ve home app dung cho role app-first', () => {
    expect(getRoleAppHomePath('sales')).toBe('/app');
    expect(getRoleAppHomePath('agency')).toBe('/app');
    expect(getRoleAppHomePath('manager')).toBe('/app');
  });

  it('chi mo duoc path nam trong shell cua role', () => {
    expect(canRoleAccessAppPath('sales', '/app')).toBe(true);
    expect(canRoleAccessAppPath('sales', '/app/khach-hang')).toBe(true);
    expect(canRoleAccessAppPath('sales', '/app/duyet')).toBe(false);
    expect(canRoleAccessAppPath('manager', '/app/duyet')).toBe(true);
    expect(canRoleAccessAppPath('finance', '/app')).toBe(false);
  });

  it('tim dung section theo role va key', () => {
    expect(getRoleAppSection('sales', 'khach-hang')?.label).toBe('Khách hàng');
    expect(getRoleAppSection('manager', 'doi-nhom')?.label).toBe('Đội nhóm');
    expect(getRoleAppSection('bod', 'doanh-thu')?.label).toBe('Doanh thu');
  });

  it('runtime cua sales co bottom nav va quick action day du', () => {
    const runtime = getRoleAppRuntime('sales');

    expect(runtime.title).toBe('Ứng dụng kinh doanh');
    expect(runtime.tabs.map((item) => item.key)).toEqual(['khach-hang', 'ban-hang', 'san-pham', 'tai-chinh']);
    expect(runtime.quickActions.length).toBeGreaterThanOrEqual(4);
  });
});
