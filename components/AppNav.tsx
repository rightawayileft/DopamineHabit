import { router, usePathname } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Spin', href: '/spin' },
  { label: 'Check-in', href: '/checkin' },
  { label: 'Stats', href: '/stats' },
  { label: 'Manage', href: '/manage' },
] as const;

const isCurrentRoute = (pathname: string, href: (typeof navItems)[number]['href']): boolean => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export function AppNav() {
  const pathname = usePathname();

  return (
    <View
      accessibilityLabel="Primary navigation"
      style={{
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderRadius: radius.sm,
        borderWidth: 1,
        gap: spacing.sm,
        padding: spacing.sm,
      }}
    >
      <Text muted>Navigation</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {navItems.map((item) => {
          const current = isCurrentRoute(pathname, item.href);

          return (
            <Button
              key={item.href}
              accessibilityLabel={`Open ${item.label}`}
              accessibilityState={{ selected: current }}
              label={item.label}
              onPress={() => {
                if (!current) {
                  router.push(item.href);
                }
              }}
              tone={current ? 'primary' : 'secondary'}
            />
          );
        })}
      </View>
    </View>
  );
}
