"use client";

import { useCallback } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function useInviteNavigation() {
  const router = useRouter();
  const { setActive, isLoaded: orgListLoaded } = useOrganizationList();

  const navigateAfterAccept = useCallback(
    async (organizationId: string, redirectTo: string) => {
      if (orgListLoaded) {
        await setActive({ organization: organizationId });
      }
      router.push(redirectTo);
      router.refresh();
    },
    [orgListLoaded, router, setActive]
  );

  return { navigateAfterAccept };
}
