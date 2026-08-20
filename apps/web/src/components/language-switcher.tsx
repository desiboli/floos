import { Button } from "@floos/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@floos/ui/components/dropdown-menu";
import { IconCheck, IconLanguage } from "@tabler/icons-react";

import { countries } from "@/lib/countries";
import { getLocale, locales, setLocale, type Locale } from "@/paraglide/runtime.js";

const localeLabels: Record<Locale, string> = {
  en: "English",
  sv: "Svenska",
};

const localeCountryCodes: Record<Locale, string> = {
  en: "GB",
  sv: "SE",
};

function getLocaleFlag(locale: Locale) {
  const countryCode = localeCountryCodes[locale];
  return countries.find((country) => country.code === countryCode)?.flag ?? "";
}

export function LanguageSwitcher() {
  const currentLocale = getLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <IconLanguage data-icon="inline-start" />
        {localeLabels[currentLocale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} onClick={() => setLocale(locale)}>
            <span aria-hidden="true">{getLocaleFlag(locale)}</span>
            {localeLabels[locale]}
            {locale === currentLocale ? <IconCheck className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
