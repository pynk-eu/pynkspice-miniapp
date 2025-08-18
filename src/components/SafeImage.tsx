'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'> & {
  src: string;
  alt: string;
  fallbackSrc?: string;
};

export default function SafeImage({ src, alt, fallbackSrc = '/thePynkSpice_logo.jpg', ...rest }: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const displaySrc = useFallback ? fallbackSrc : src;
  return (
    <Image
      {...rest}
      src={displaySrc}
      alt={alt}
      onError={() => setUseFallback(true)}
    />
  );
}
