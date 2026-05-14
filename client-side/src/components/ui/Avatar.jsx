import { cn } from '@/utils/helpers';
import { getInitials } from '@/utils/formatters';

/**
 * Avatar — User avatar with fallback initials.
 *
 * @param {string} src - Image URL
 * @param {string} name - Full name for initials fallback
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} online - Show online status dot
 */
const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-caption',
  md: 'w-10 h-10 text-body-sm',
  lg: 'w-12 h-12 text-body',
  xl: 'w-16 h-16 text-h4',
};

const DOT_SIZE = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-3.5 h-3.5 border-2',
};

const COLORS = [
  'bg-primary text-white',
  'bg-secondary text-white',
  'bg-accent text-white',
  'bg-success text-white',
  'bg-info text-white',
  'bg-danger text-white',
];

function getColorFromName(name) {
  if (!name) return COLORS[0];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

export default function Avatar({
  src,
  name,
  size = 'md',
  online,
  className,
}) {
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'User avatar'}
          className={cn(
            'rounded-full object-cover',
            SIZE_CLASSES[size]
          )}
          loading="lazy"
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold',
            SIZE_CLASSES[size],
            colorClass
          )}
          aria-label={name || 'User avatar'}
        >
          {initials}
        </div>
      )}

      {typeof online === 'boolean' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-bg',
            online ? 'bg-success' : 'bg-text-muted',
            DOT_SIZE[size]
          )}
          aria-label={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

/**
 * AvatarGroup — Stacked avatar row.
 */
export function AvatarGroup({ users = [], max = 4, size = 'sm' }) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, i) => (
        <Avatar
          key={user.id || i}
          src={user.avatar}
          name={user.name}
          size={size}
          className="ring-2 ring-bg"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-bold bg-surface-alt text-text-muted ring-2 ring-bg',
            SIZE_CLASSES[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
