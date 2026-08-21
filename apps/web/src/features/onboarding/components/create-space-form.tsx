import { Button } from "@floos/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@floos/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@floos/ui/components/collapsible";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxInput,
} from "@floos/ui/components/combobox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@floos/ui/components/field";
import { Input } from "@floos/ui/components/input";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@floos/ui/components/item";
import { toast } from "@floos/ui/components/toast";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import z from "zod";

import { createSpace } from "@/features/spaces";
import { countries, countriesByCode, countryCodes } from "@/lib/countries";
import {
  currenciesByCode,
  currencyOptions,
  getCurrencyForCountry,
  uniqueCurrencies,
} from "@/lib/currencies";

const routeApi = getRouteApi("/_auth/onboarding/");

const formSchema = z.object({
  spaceName: z
    .string()
    .min(2, "Space name must be at least 2 characters.")
    .max(32, "Space name must be at most 32 characters."),
  country: z.enum(countryCodes, { error: "Select a country" }),
  baseCurrency: z.enum(uniqueCurrencies, { error: "Select a currency" }),
});

export function CreateSpaceForm() {
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      spaceName: "",
      country: "",
      baseCurrency: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { id } = await createSpace({
          name: value.spaceName,
          country: value.country,
          currency: value.baseCurrency,
        });

        toast.add({
          type: "success",
          title: "Space created",
        });

        await queryClient.invalidateQueries({ queryKey: ["spaces"] });

        await navigate({
          search: (prev) => ({ ...prev, s: "connect-bank", spaceId: id }),
        });
      } catch (error) {
        toast.add({
          type: "error",
          title: error instanceof Error ? error.message : "Failed to create space",
        });
      }
    },
  });

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Create your financial space</CardTitle>
        <CardDescription>
          One place for everything you share, save and plan together — while personal money stays
          personal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="create-space-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="spaceName"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Space Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="My Space"
                      autoComplete="off"
                    />
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Field
              name="country"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const selected = countriesByCode.get(field.state.value) ?? null;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                    <Combobox
                      items={countries}
                      value={selected}
                      onValueChange={(country) => {
                        const previousCountry = field.state.value;
                        const previousDefault = getCurrencyForCountry(previousCountry);
                        const currentBase = form.getFieldValue("baseCurrency");

                        field.handleChange(country?.code ?? "");

                        if (!country) {
                          form.setFieldValue("baseCurrency", "");
                          return;
                        }

                        const nextDefault = getCurrencyForCountry(country.code);
                        const userCustomized =
                          currentBase !== "" && currentBase !== previousDefault;

                        if (!userCustomized && nextDefault) {
                          form.setFieldValue("baseCurrency", nextDefault);
                        }
                      }}
                      itemToStringLabel={(country) =>
                        `${country.flag} ${country.name} · ${country.code}`
                      }
                      isItemEqualToValue={(a, b) => a.code === b.code}
                    >
                      <ComboboxInput
                        id={field.name}
                        placeholder="Search country…"
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        autoComplete="off"
                      />
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
                    <FieldDescription>
                      Used to find banks you can connect. You can search another country later.
                    </FieldDescription>
                    {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                  </Field>
                );
              }}
            />

            <form.Subscribe
              selector={(state) => ({
                baseCurrency: state.values.baseCurrency,
                isCurrencyInvalid:
                  state.fieldMeta.baseCurrency?.isTouched === true &&
                  state.fieldMeta.baseCurrency?.isValid === false,
              })}
            >
              {({ baseCurrency, isCurrencyInvalid }) => {
                const currency = currenciesByCode.get(baseCurrency);
                const open = isCurrencyOpen || isCurrencyInvalid;

                return (
                  <Collapsible
                    open={open}
                    onOpenChange={setIsCurrencyOpen}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex flex-row items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Ledger currency ·{" "}
                        <span className="text-sm text-foreground">
                          {currency ? `${currency.symbol} ${currency.code}` : "—"}
                        </span>
                      </p>
                      <CollapsibleTrigger
                        render={
                          <Button variant="ghost" size="xs">
                            {open ? "Hide" : "Change"}
                          </Button>
                        }
                      />
                    </div>
                    <CollapsibleContent className="flex flex-col gap-2">
                      <form.Field
                        name="baseCurrency"
                        children={(field) => {
                          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                          const selected = currenciesByCode.get(field.state.value) ?? null;

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
                              <Combobox
                                items={currencyOptions}
                                value={selected}
                                onValueChange={(next) => {
                                  field.handleChange(next?.code ?? "");
                                }}
                                itemToStringLabel={(item) => `${item.symbol} · ${item.code}`}
                                isItemEqualToValue={(a, b) => a.code === b.code}
                              >
                                <ComboboxInput
                                  id={field.name}
                                  placeholder="Search currency…"
                                  aria-invalid={isInvalid}
                                  onBlur={field.handleBlur}
                                  autoComplete="off"
                                />
                                <ComboboxContent>
                                  <ComboboxEmpty>No currency found.</ComboboxEmpty>
                                  <ComboboxList>
                                    {(item) => (
                                      <ComboboxItem key={item.code} value={item}>
                                        <Item size="xs" className="p-0">
                                          <ItemContent>
                                            <ItemTitle className="whitespace-nowrap">
                                              {item.symbol} · {item.code}
                                            </ItemTitle>
                                            <ItemDescription className="line-clamp-1">
                                              {item.name}
                                            </ItemDescription>
                                          </ItemContent>
                                        </Item>
                                      </ComboboxItem>
                                    )}
                                  </ComboboxList>
                                </ComboboxContent>
                              </Combobox>
                              <FieldDescription>
                                Shared totals are kept in this currency. Connected accounts can
                                still be in another.
                              </FieldDescription>
                              {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
                            </Field>
                          );
                        }}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                );
              }}
            </form.Subscribe>

            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  Create space
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
