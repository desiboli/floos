import type { BankingProvider } from "../../interface";
import type {
  ConnectionStatus,
  CreateLinkRequest,
  CreateLinkResponse,
  GetConnectionStatusRequest,
  GetInstitutionsRequest,
  Institution,
} from "../../types";

import { GoCardlessApi } from "./gocardless-api";
import { transformInstitution } from "./transform";

export class GoCardlessProvider implements BankingProvider {
  #api = new GoCardlessApi();

  getInstitutions = async ({ countryCode }: GetInstitutionsRequest): Promise<Institution[]> => {
    const institutions = await this.#api.getInstitutions(countryCode);

    // Some banks have *_DECOUPLED_* siblings (same bank, alternate auth).
    // Keep the canonical id for the picker.
    return institutions
      .filter((inst) => !inst.id.includes("_DECOUPLED_"))
      .map(transformInstitution);
  };

  createLink = async ({
    institutionId,
    redirect,
    reference,
    transactionTotalDays,
  }: CreateLinkRequest): Promise<CreateLinkResponse> => {
    const agreement = await this.#api.createEndUserAgreement(institutionId, transactionTotalDays);

    const requisition = await this.#api.buildLink({
      institutionId,
      redirect,
      agreement: agreement.id,
      reference,
    });

    const expiresAt = new Date(
      Date.now() + agreement.access_valid_for_days * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
      url: requisition.link,
      ref: requisition.id,
      expiresAt,
    };
  };

  getConnectionStatus = async ({ id }: GetConnectionStatusRequest): Promise<ConnectionStatus> => {
    try {
      const requisition = await this.#api.getRequisition(id);

      if (requisition.status === "LN") {
        return { status: "connected" };
      }
      if (requisition.status === "EX" || requisition.status === "RJ") {
        return { status: "disconnected" };
      }
      return { status: "pending" };
    } catch {
      return { status: "disconnected" };
    }
  };
}
