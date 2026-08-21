import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@floos/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@floos/ui/components/field";
import { Icons } from "@floos/ui/components/icons";
import { Input } from "@floos/ui/components/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@floos/ui/components/item";
import { ItemActions } from "@floos/ui/components/item"; // keep the other Item* imports
import { Skeleton } from "@floos/ui/components/skeleton";
import { toast } from "@floos/ui/components/toast";
import { useMutation } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";

import type { Institution } from "@/features/institutions/services/types";

import { createBankLink, providerLabel } from "@/features/banking/services/api";
import { useInstitutions } from "@/features/institutions/hooks/use-institutions";
import { countries, countriesByCode } from "@/lib/countries";

const routeApi = getRouteApi("/_auth/onboarding/");

function BankListSkeleton() {
  return Array.from({ length: 8 }, (_, i) => (
    <Item key={i} variant="muted">
      <ItemMedia variant="image">
        <Skeleton className="size-full rounded-lg" />
      </ItemMedia>
      <ItemContent>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </ItemContent>
    </Item>
  ));
}

function BankRow({
  institution,
  disabled,
  isConnecting,
  onConnect,
}: {
  institution: Institution;
  disabled: boolean;
  isConnecting: boolean;
  onConnect: (institutionId: string) => void;
}) {
  const initial = institution.name.charAt(0).toUpperCase();
  const description = institution.psuType
    ? `Via ${providerLabel(institution.provider)} · ${institution.psuType}`
    : `Via ${providerLabel(institution.provider)}`;

  return (
    <Item variant="muted">
      <ItemMedia variant="image" className="bg-background [&_img]:object-contain">
        {institution.logo ? (
          <img src={institution.logo} alt="" className="size-full" />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-xs font-semibold text-muted-foreground">
            {initial}
          </div>
        )}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{institution.name}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          aria-label={isConnecting ? "Connecting" : "Connect"}
          onClick={() => onConnect(institution.id)}
        >
          {isConnecting ? <Icons.loader className="size-4 animate-spin" /> : "Connect"}
        </Button>
      </ItemActions>
    </Item>
  );
}

export function ConnectBankForm() {
  const navigate = routeApi.useNavigate();
  const [countryCode, setCountryCode] = useState("SE");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isPending, isError } = useInstitutions(countryCode);
  const createLink = useMutation({
    mutationFn: createBankLink,
  });

  const handleConnect = async (institutionId: string) => {
    try {
      const result = await createLink.mutateAsync({
        institutionId,
        origin: window.location.pathname + window.location.search,
      });
      window.location.assign(result.redirectUrl);
    } catch (error) {
      toast.add({
        type: "error",
        title: error instanceof Error ? error.message : "Failed to start bank connection",
      });
    }
  };

  const selectedCountry = countriesByCode.get(countryCode) ?? null;

  const q = searchQuery.trim().toLowerCase();
  const institutions = data?.institutions ?? [];
  const filtered = q
    ? institutions.filter((inst) => inst.name.toLowerCase().includes(q))
    : institutions;

  return (
    <Card className="w-full sm:max-w-lg">
      <CardHeader>
        <CardTitle>Connect your bank</CardTitle>
        <CardDescription>
          Choose your bank to share read-only balances and transactions. You can disconnect anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bank-country">Country</FieldLabel>
            <Combobox
              items={countries}
              value={selectedCountry}
              onValueChange={(country) => {
                setCountryCode(country?.code ?? "SE");
                setSearchQuery("");
              }}
              itemToStringLabel={(country) => `${country.flag} ${country.name} · ${country.code}`}
              isItemEqualToValue={(a, b) => a.code === b.code}
            >
              <ComboboxInput id="bank-country" placeholder="Search country…" autoComplete="off" />
              <ComboboxContent>
                <ComboboxEmpty>No country found.</ComboboxEmpty>
                <ComboboxList>
                  {(country) => (
                    <ComboboxItem key={country.code} value={country}>
                      <Item size="xs" className="p-0">
                        <ItemContent>
                          <ItemTitle className="whitespace-nowrap">
                            <span aria-hidden="true">{country.flag}</span> {country.name}
                          </ItemTitle>
                          <ItemDescription>{country.code}</ItemDescription>
                        </ItemContent>
                      </Item>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel htmlFor="bank-search">Search</FieldLabel>
            <Input
              id="bank-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banks…"
              autoComplete="off"
            />
          </Field>

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {isPending ? (
              <BankListSkeleton />
            ) : isError ? (
              <p className="py-8 text-center text-sm text-destructive">
                Failed to load banks. Try again.
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No banks found for this country.
              </p>
            ) : (
              filtered.map((institution) => (
                <BankRow
                  key={institution.id}
                  institution={institution}
                  disabled={createLink.isPending}
                  isConnecting={
                    createLink.isPending && createLink.variables?.institutionId === institution.id
                  }
                  onConnect={handleConnect}
                />
              ))
            )}
          </div>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            navigate({
              search: (prev) => ({ ...prev, s: "reconciliation" }),
            });
          }}
        >
          Skip for now
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Read-only access · Encrypted · Disconnect anytime
        </p>
      </CardFooter>
    </Card>
  );
}
