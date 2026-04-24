import type { PropsWithChildren } from 'react';
import { Modal as NativeModal, View, type ModalProps as NativeModalProps } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function Modal({ children, transparent = true, ...rest }: PropsWithChildren<NativeModalProps>) {
  return (
    <NativeModal {...rest} transparent={transparent}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(11, 11, 20, 0.72)',
          flex: 1,
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <Card style={{ backgroundColor: colors.surfaceElevated, width: '100%' }}>{children}</Card>
      </View>
    </NativeModal>
  );
}
