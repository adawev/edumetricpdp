import { T } from '@/lib/theme';
import { Button } from './Primitives';
import { Icons } from './Icons';

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{
      padding: '60px 24px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 12, textAlign: 'center',
    }}>
      {Icons.alert({ size: 40, stroke: T.red })}
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
        Xatolik yuz berdi
      </div>
      <div style={{ fontSize: 13.5, color: T.textMuted, maxWidth: 300, lineHeight: 1.6 }}>
        Ma'lumotlarni yuklashda muammo chiqdi. Internet aloqangizni tekshiring.
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} icon={Icons.refresh({ size: 14, stroke: T.text })} style={{ marginTop: 4 }}>
          Qayta urinish
        </Button>
      )}
    </div>
  );
}
