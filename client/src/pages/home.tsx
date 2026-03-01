import { useState, useMemo } from "react";
import { useContacts } from "@/hooks/use-contacts";
import { Contact } from "@shared/schema";
import { ContactCard } from "@/components/contact-card";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { DeleteContactDialog } from "@/components/delete-contact-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, BookUser, Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function Home() {
  const { data: contacts, isLoading } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(searchQuery)
    );
  }, [contacts, searchQuery]);

  const handleOpenCreate = () => {
    setContactToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (contact: Contact) => {
    setContactToEdit(contact);
    setIsFormOpen(true);
  };

  const handleFormChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setTimeout(() => setContactToEdit(null), 300); // Wait for exit animation
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24">
      <header className="sticky top-0 z-30 glass-panel border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-[10px] flex items-center justify-center shadow-lg shadow-primary/20">
              <BookUser className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight hidden sm:block">
              Contacts
            </h1>
          </div>
          <Button 
            onClick={handleOpenCreate} 
            className="rounded-full px-5 sm:px-7 h-11 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all font-semibold"
          >
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Add Contact</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Search Header Area */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
          <div className="relative w-full max-w-lg group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-12 pr-4 h-14 rounded-2xl bg-white border-gray-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-visible:ring-primary focus-visible:border-primary text-base transition-all"
            />
          </div>
          
          <div className="text-sm font-medium text-gray-500 self-start md:self-center">
            {filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <Loader2 className="w-10 h-10 text-primary/40 animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading your contacts...</p>
          </div>
        ) : !contacts?.length ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6"
          >
            <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-[2rem] flex items-center justify-center rotate-3">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="font-display font-bold text-2xl text-gray-900">Your address book is empty</h2>
              <p className="text-gray-500 leading-relaxed">
                Add your first contact to start building your network and keeping track of your connections.
              </p>
            </div>
            <Button size="lg" onClick={handleOpenCreate} className="rounded-full px-8 h-12 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-2" /> Add First Contact
            </Button>
          </motion.div>
        ) : filteredContacts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-display font-bold text-xl text-gray-900">No results found</h3>
            <p className="text-gray-500 max-w-sm">
              We couldn't find any contacts matching "{searchQuery}". Try checking for typos or searching with different terms.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4 rounded-full">
              Clear Search
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={handleOpenEdit}
                  onDelete={setContactToDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <ContactFormDialog 
        open={isFormOpen} 
        onOpenChange={handleFormChange}
        contactToEdit={contactToEdit}
      />
      
      <DeleteContactDialog
        contact={contactToDelete}
        onClose={() => setContactToDelete(null)}
      />
    </div>
  );
}
