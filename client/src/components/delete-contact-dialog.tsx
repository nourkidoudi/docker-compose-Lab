import { Contact } from "@shared/schema";
import { useDeleteContact } from "@/hooks/use-contacts";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteContactDialogProps {
  contact: Contact | null;
  onClose: () => void;
}

export function DeleteContactDialog({ contact, onClose }: DeleteContactDialogProps) {
  const { toast } = useToast();
  const deleteMutation = useDeleteContact();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent closing immediately to show loading state if desired
    if (!contact) return;
    
    deleteMutation.mutate(contact.id, {
      onSuccess: () => {
        toast({ title: "Contact deleted successfully" });
        onClose();
      },
      onError: (error) => {
        toast({ 
          title: "Failed to delete", 
          description: error.message, 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <AlertDialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-8 sm:max-w-[400px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl font-bold text-gray-900">
            Delete Contact?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-gray-500 mt-3">
            This action cannot be undone. You are about to permanently delete{" "}
            <strong className="text-gray-900 font-semibold">{contact?.name}</strong> from your contacts list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
          <AlertDialogCancel 
            disabled={deleteMutation.isPending}
            className="h-11 rounded-xl px-6 font-semibold border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-11 rounded-xl px-6 font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-md shadow-destructive/20"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Yes, delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
