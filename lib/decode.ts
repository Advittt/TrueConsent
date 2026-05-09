/**
 * EOB decode entrypoints. Implementation lives under `lib/decode/`.
 */
export { extractCodes, type ExtractedCodes } from "@/lib/decode/extract-codes";
export {
  decodeClaimWithExtraction,
  type DecodeClaimOutcome,
} from "@/lib/decode/decode-claim";
import { decodeClaimWithExtraction } from "@/lib/decode/decode-claim";
import type { DecodedClaim } from "@/lib/types/claim";

/** Returns the decoded claim only (rules + extraction applied internally then discarded). */
export async function decodeClaim(text: string): Promise<DecodedClaim> {
  const { claim } = await decodeClaimWithExtraction(text);
  return claim;
}
