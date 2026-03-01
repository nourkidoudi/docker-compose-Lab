import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, type InsertContact, type Contact } from "@shared/schema";
import { useCreateContact, useUpdateContact } from "@/hooks/use-contacts";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactToEdit: Contact | null;
}

export function ContactFormDialog({ open, onOpenChange, contactToEdit }: ContactFormDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!contactToEdit;

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (contactToEdit) {
        form.reset({
          name: contactToEdit.name,
          email: contactToEdit.email,
          phone: contactToEdit.phone,
        });
      } else {
        form.reset({ name: "", email: "", phone: "" });
      }
    }
  }, [open, contactToEdit, form]);

  const onSubmit = (data: InsertContact) => {
    if (isEditing && contactToEdit) {
      updateMutation.mutate(
        { id: contactToEdit.id, data },
        {
          onSuccess: () => {
            toast({ title: "Contact updated successfully" });
            onOpenChange(false);
          },
          onError: (error) => {
            toast({ title: "Failed to update", description: error.message, variant: "destructive" });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: "Contact created successfully" });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({ title: "Failed to create", description: error.message, variant: "destructive" });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-3xl">
        <div className="px-8 pt-8 pb-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-display text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Contact" : "New Contact"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-base">
              {isEditing 
                ? "Update the details for this contact below." 
                : "Fill in the details to add someone to your network."}
            </DialogDescription>
          </DialogHeader>

          <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
              <Input
                id="name"
                placeholder="E.g. Jane Doe"
                className={`h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors ${form.formState.errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 font-medium">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@example.com"
                className={`h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors ${form.formState.errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 font-medium">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className={`h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors ${form.formState.errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500 font-medium">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3 sm:gap-0">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl px-6 font-semibold hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="contact-form"
            disabled={isPending}
            className="h-11 rounded-xl px-8 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
