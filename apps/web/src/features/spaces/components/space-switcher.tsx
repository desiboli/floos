import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@floos/ui/components/dropdown-menu";
import { Icons } from "@floos/ui/components/icons";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@floos/ui/components/sidebar";
import { toast } from "@floos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useUserSpaces } from "../hooks/use-user-spaces";
import { setActiveSpace } from "../services/api";

export function SpaceSwitcher() {
  const { isMobile } = useSidebar();
  const { spaces, activeSpaceId, isPending } = useUserSpaces();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const switchSpace = useMutation({ mutationFn: setActiveSpace });

  if (isPending || spaces.length === 0) return null;

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];
  if (!activeSpace) return null;

  async function onSelectSpace(spaceId: string) {
    try {
      if (spaceId === activeSpaceId) {
        await navigate({ to: "/" });
        return;
      }
      await switchSpace.mutateAsync({ spaceId });
      await queryClient.invalidateQueries({ queryKey: ["spaces"] });
    } catch (error) {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to switch space",
      });
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
              {activeSpace.name.charAt(0).toUpperCase()}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeSpace.name}</span>
              <span className="truncate text-xs">{activeSpace.currency}</span>
            </div>
            <Icons.selector className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Spaces
              </DropdownMenuLabel>
              {spaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  disabled={switchSpace.isPending}
                  className="gap-2 p-2"
                  onClick={() => onSelectSpace(space.id)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border text-xs font-medium">
                    {space.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate">{space.name}</span>
                  {space.id === activeSpace.id ? <Icons.check className="ml-auto" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => navigate({ to: "/onboarding", search: { s: "create-space" } })}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Icons.plus />
                </div>
                <span className="font-medium text-muted-foreground">Add space</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
