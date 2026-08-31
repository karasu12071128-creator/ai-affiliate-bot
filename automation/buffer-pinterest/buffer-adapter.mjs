import { createHash } from "node:crypto";

const CREATE_POST_MUTATION = `mutation CreatePinterestDraft($input: CreatePostInput!) {
  createPost(input: $input) {
    ... on PostActionSuccess { post { id status dueAt } }
    ... on MutationError { message }
  }
}`;

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function payloadHash(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function buildBufferDraftRequest({ pin, channelId, boardServiceId, publicImageUrl, dueAt }) {
  if (!pin) throw new Error("pin is required");
  if (!channelId) throw new Error("BUFFER_PINTEREST_CHANNEL_ID is required");
  if (!boardServiceId) throw new Error("BUFFER_PINTEREST_BOARD_SERVICE_ID is required");
  if (!publicImageUrl || !/^https:\/\//.test(publicImageUrl)) throw new Error("a stable public HTTPS image URL is required");
  if (!dueAt || Number.isNaN(Date.parse(dueAt))) throw new Error("an OWNER-approved ISO 8601 dueAt is required");

  const variables = {
    input: {
      channelId,
      text: pin.description,
      schedulingType: "automatic",
      mode: "customScheduled",
      dueAt,
      saveToDraft: true,
      needsApproval: false,
      assets: [{ image: { url: publicImageUrl } }],
      metadata: {
        pinterest: {
          boardServiceId,
          title: pin.title,
          url: pin.utm_url
        }
      }
    }
  };
  const body = { query: CREATE_POST_MUTATION, variables };
  const hash = payloadHash(body);
  return {
    pin_id: pin.pin_id,
    endpoint: "https://api.buffer.com",
    method: "POST",
    secret_name: "BUFFER_API_KEY",
    body,
    payload_sha256: hash,
    idempotency_key: `${pin.pin_id}:${hash}:${channelId}`,
    creates_buffer_draft_only: true
  };
}

export async function executeBufferPlan({
  pin,
  request,
  externalWriteAuthorized = false,
  registryExternalWriteAuthorized = false,
  liveConfirmation = "NOT_AUTHORIZED",
  priorReceipts = new Set(),
  provider
}) {
  // Approval is scope-bound: a manual Pinterest publish approval never authorizes a Buffer draft.
  if (pin.approval?.status !== "approved" || pin.approval?.scope !== "buffer_draft") {
    return { status: "BLOCKED_NOT_AUTHORIZED", provider_calls: 0, automatic_retry: false };
  }
  if (
    request?.pin_id !== pin.pin_id ||
    request?.body?.variables?.input?.metadata?.pinterest?.url !== pin.utm_url ||
    request?.body?.variables?.input?.metadata?.pinterest?.title !== pin.title
  ) {
    return { status: "BLOCKED_REQUEST_MISMATCH", provider_calls: 0, automatic_retry: false };
  }
  if (priorReceipts.has(request.idempotency_key)) {
    return { status: "BLOCKED_DUPLICATE", provider_calls: 0, automatic_retry: false };
  }
  if (
    !externalWriteAuthorized ||
    !registryExternalWriteAuthorized ||
    pin.delivery?.mode !== "buffer_draft_authorized" ||
    liveConfirmation !== "OWNER_APPROVED_BUFFER_DRAFT"
  ) {
    return {
      status: "DRY_RUN_OK",
      provider_calls: 0,
      automatic_retry: false,
      idempotency_key: request.idempotency_key,
      payload_sha256: request.payload_sha256,
      business_success_assumed: false
    };
  }

  try {
    const response = await provider.createDraft(request);
    if (!response?.post_id) {
      return { status: "AMBIGUOUS_EXTERNAL_RESULT", provider_calls: 1, automatic_retry: false, business_success_assumed: false };
    }
    return {
      status: "BUFFER_DRAFT_CREATED",
      provider_calls: 1,
      automatic_retry: false,
      buffer_post_id: response.post_id,
      pinterest_publish_verified: false,
      business_success_assumed: false
    };
  } catch {
    return { status: "AMBIGUOUS_EXTERNAL_RESULT", provider_calls: 1, automatic_retry: false, business_success_assumed: false };
  }
}
