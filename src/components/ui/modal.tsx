
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
}

interface ModalFooterProps {
  children: React.ReactNode;
}

interface ModalCloseButtonProps {
  onClick?: () => void;
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, children }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};

export const ModalContent: React.FC<ModalContentProps> = ({ children, className }) => {
  return (
    <DialogContent className={className}>
      {children}
    </DialogContent>
  );
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children }) => {
  return (
    <DialogHeader>
      {children}
    </DialogHeader>
  );
};

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
  return (
    <DialogFooter>
      {children}
    </DialogFooter>
  );
};

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-4 top-4"
      onClick={onClick}
    >
      <X className="h-4 w-4" />
    </Button>
  );
};
