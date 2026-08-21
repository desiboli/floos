import type { BankingProvider } from "../../interface";
import type {
  ConnectionStatus,
  CreateLinkRequest,
  CreateLinkResponse,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  Institution,
} from "../../types";

import { EnableBankingApi } from "./enablebanking-api";
import { transformInstitution } from "./transform";

export class EnableBankingProvider implements BankingProvider {
  #api = new EnableBankingApi();

  getInstitutions = async ({ countryCode }: GetInstitutionsRequest): Promise<Institution[]> => {
    const { aspsps } = await this.#api.getAspsps(countryCode);
    const results: Institution[] = [];

    for (const aspsp of aspsps) {
      if (aspsp.beta) continue;

      const fromField = aspsp.psu_types ?? [];
      const fromAuth =
        aspsp.auth_methods
          ?.map((method) => method.psu_type)
          .filter((value): value is string => Boolean(value)) ?? [];

      const psuTypes = [...new Set(fromField.length > 0 ? fromField : fromAuth)];

      if (psuTypes.length === 0) {
        results.push(transformInstitution(aspsp));
        continue;
      }

      for (const psuType of psuTypes) {
        results.push(transformInstitution(aspsp, psuType));
      }
    }

    return results;
  };

  createLink = async ({
    redirect,
    reference,
    institutionName,
    psuType,
    countryCode,
  }: CreateLinkRequest): Promise<CreateLinkResponse> => {
    if (!institutionName) {
      throw new Error("Enable Banking createLink requires institutionName");
    }
    if (!countryCode) {
      throw new Error("Enable Banking createLink requires countryCode");
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 90);
    const expiresAt = validUntil.toISOString();

    const authResponse = await this.#api.startAuth({
      aspspName: institutionName,
      aspspCountry: countryCode.toUpperCase(),
      redirectUrl: redirect,
      validUntil: expiresAt,
      state: reference,
      psuType: psuType ?? undefined,
    });

    return {
      url: authResponse.url,
      ref: authResponse.authorization_id,
      expiresAt,
    };
  };

  exchangeCode = async ({ code }: { code: string }): Promise<string> => {
    const session = await this.#api.createSession(code);
    return session.session_id;
  };

  getConnectionStatus = async ({ id }: GetConnectionStatusRequest): Promise<ConnectionStatus> => {
    if (!id) return { status: "disconnected" };
    return { status: "connected" };
  };
}
