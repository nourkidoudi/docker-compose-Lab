import { Contact } from "@shared/schema";
import { Mail, Phone, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

const gradients = [
  "from-rose-400 to-red-500",
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-purple-400 to-fuchsia-500",
  "from-pink-400 to-rose-500",
];

const getGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const initial = contact.name.charAt(0).toUpperCase();

  return (
    <motion.div
      variants={itemVariants}
      className="group relative bg-white rounded-[1.5rem] p-6 border border-gray-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle top gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient(contact.name)} opacity-50`} />

      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display text-xl font-bold bg-gradient-to-br ${getGradient(contact.name)} shadow-inner`}>
          {initial}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(contact)}
            className="p-2.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Edit contact"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(contact)}
            className="p-2.5 text-gray-400 hover:text-destructive hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
            aria-label="Delete contact"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="font-display font-bold text-xl text-gray-900 truncate" title={contact.name}>
          {contact.name}
        </h3>
        
        <div className="space-y-2.5">
          <div className="flex items-center text-gray-500 gap-3 group/link">
            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover/link:bg-gray-100 transition-colors">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <a 
              href={`mailto:${contact.email}`} 
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors truncate"
            >
              {contact.email}
            </a>
          </div>
          
          <div className="flex items-center text-gray-500 gap-3 group/link">
            <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover/link:bg-gray-100 transition-colors">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <a 
              href={`tel:${contact.phone}`} 
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors truncate"
            >
              {contact.phone}
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
