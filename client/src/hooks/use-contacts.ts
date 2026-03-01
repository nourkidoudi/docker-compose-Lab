import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertContact, type Contact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: [api.contacts.list.path],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE}${api.contacts.list.path}`);
      return res.json();
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertContact) => {
      const res = await apiRequest("POST", `${API_BASE}${api.contacts.create.path}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertContact> }) => {
      const url = buildUrl(api.contacts.update.path, { id });
      const res = await apiRequest("PUT", `${API_BASE}${url}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.contacts.delete.path, { id });
      await apiRequest("DELETE", `${API_BASE}${url}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
    },
  });
}
