import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGreetings() {
  return useQuery({
    queryKey: [api.greetings.get.path],
    queryFn: async () => {
      const res = await fetch(api.greetings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch greetings');
      return api.greetings.get.responses[200].parse(await res.json());
    },
  });
}
