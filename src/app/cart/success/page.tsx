import { Suspense } from 'react';
import OrderSuccess from '@/components/OrderSuccess';

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccess />
    </Suspense>
  );
}
