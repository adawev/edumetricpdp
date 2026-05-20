import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  widthCls?: string;
};

export function Sheet({ open, onOpenChange, title, description, children, widthCls = 'w-[480px]' }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content
          className={`fixed top-0 right-0 z-50 h-full ${widthCls} max-w-full bg-white border-l shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200`}
        >
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b">
            <div className="min-w-0 flex-1">
              {title && <Dialog.Title className="font-semibold text-lg truncate">{title}</Dialog.Title>}
              {description && (
                <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <X className="w-4 h-4" />
              <span className="sr-only">Yopish</span>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
