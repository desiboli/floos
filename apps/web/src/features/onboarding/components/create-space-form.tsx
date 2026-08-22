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
import { m } from "@/paraglide/messages.js";

const routeApi = getRouteApi("/_auth/onboarding/");

const formSchema = z.object({
  spaceName: z
    .string()
    .min(2, m.onboarding_space_name_error_min())
    .max(32, m.onboarding_space_name_error_max()),
  country: z.enum(countryCodes, { error: m.onboarding_country_error() }),
  baseCurrency: z.enum(uniqueCurrencies, { error: m.onboarding_base_currency_error() }),
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
        <CardTitle>{m.onboarding_title()}</CardTitle>
        <CardDescription>{m.onboarding_subtitle()}</CardDescription>
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
                    <FieldLabel htmlFor={field.name}>{m.onboarding_space_name_label()}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder={m.onboarding_space_name_placeholder()}
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
                    <FieldLabel htmlFor={field.name}>{m.onboarding_country_label()}</FieldLabel>
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
                        placeholder={m.onboarding_country_placeholder()}
                        aria-invalid={isInvalid}
                        onBlur={field.handleBlur}
                        autoComplete="off"
                      />
                      <ComboboxContent>
                        <ComboboxEmpty>{m.onboarding_country_empty()}</ComboboxEmpty>
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
                    <FieldDescription>{m.onboarding_country_description()}</FieldDescription>
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
                        {m.onboarding_ledger_currency_label()} ·{" "}
                        <span className="text-sm text-foreground">
                          {currency ? `${currency.symbol} ${currency.code}` : "—"}
                        </span>
                      </p>
                      <CollapsibleTrigger
                        render={
                          <Button variant="ghost" size="xs">
                            {open ? m.onboarding_hide_button() : m.onboarding_change_button()}
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
                              <FieldLabel htmlFor={field.name}>
                                {m.onboarding_base_currency_label()}
                              </FieldLabel>
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
                                  placeholder={m.onboarding_base_currency_placeholder()}
                                  aria-invalid={isInvalid}
                                  onBlur={field.handleBlur}
                                  autoComplete="off"
                                />
                                <ComboboxContent>
                                  <ComboboxEmpty>
                                    {m.onboarding_base_currency_empty()}
                                  </ComboboxEmpty>
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
                                {m.onboarding_base_currency_description()}
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
                  {m.onboarding_create_space_button()}
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
