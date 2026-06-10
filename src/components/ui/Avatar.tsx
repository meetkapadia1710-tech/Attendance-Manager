import { avatarPalette, initials } from '../../lib/utils';

interface AvatarProps {
  name: string;
  idx: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: { px: 24, fs: 9 },
  sm: { px: 32, fs: 11 },
  md: { px: 40, fs: 14 },
  lg: { px: 56, fs: 20 },
};

export function Avatar({ name, idx, size = 'md', className = '' }: AvatarProps) {
  const { bg, text } = avatarPalette(idx);
  const { px, fs } = SIZE_MAP[size];
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-display font-bold select-none ${className}`}
      style={{
        width: px, height: px, minWidth: px,
        background: bg, color: text, fontSize: fs,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
