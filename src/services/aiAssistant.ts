import { calculateDocumentTotals, compareMoney, formatMoney } from '../lib/money';
import { db } from './database';
import { LanguageCode } from '../types/domain';

export interface AiAssistantSuggestion {
  id: string;
  taskType:
    | 'draft_quotation'
    | 'suggest_line_items'
    | 'draft_reminder'
    | 'summarize_overdue'
    | 'explain_trends'
    | 'followup_priorities';
  title: string;
  explanation: string;
  requiresUserConfirmation: true; // Always mandatory before mutating financial state or sending messages
  providerMode: 'server_edge_function' | 'deterministic_fallback';
  promptSanitized: boolean;
  draftQuotationPayload?: {
    suggestedItems: Array<{
      description: string;
      unit: string;
      quantity: string;
      unitPrice: string;
      taxRate: string;
      lineTotal: string;
    }>;
    calculatedSubtotal: string;
    calculatedTaxTotal: string;
    calculatedGrandTotal: string;
  };
  draftReminderText?: {
    subject: string;
    bodyEn: string;
    bodySw: string;
    invoiceNumber: string;
    balanceDue: string;
  };
  followUpPriorities?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    balanceDue: string;
    currency: string;
    daysOverdue: number;
    priorityRule: string;
  }>;
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /system\s+override/gi,
  /bypass\s+(rls|authorization|security|tenant)/gi,
  /reveal\s+(api\s+key|secret|service_role)/gi,
  /show\s+other\s+business/gi,
  /drop\s+table/gi,
];

const rateLimitWindowMap = new Map<string, { count: number; windowStart: number }>();
const MAX_REQUESTS_PER_MINUTE = 15;

export function sanitizeUntrustedPromptInput(rawInput: string): {
  sanitized: string;
  injectionDetected: boolean;
} {
  let sanitized = rawInput.trim().slice(0, 1200);
  let injectionDetected = false;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      injectionDetected = true;
      sanitized = sanitized.replace(pattern, '[REDACTED_UNSAFE_DIRECTIVE]');
    }
  }
  return { sanitized, injectionDetected };
}

export function enforceAiRateLimit(userId: string, businessId: string): void {
  const key = `${businessId}:${userId}`;
  const now = Date.now();
  const entry = rateLimitWindowMap.get(key);
  if (!entry || now - entry.windowStart > 60_000) {
    rateLimitWindowMap.set(key, { count: 1, windowStart: now });
    return;
  }
  if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error(
      `AI Assistant rate limit exceeded (${MAX_REQUESTS_PER_MINUTE} requests/minute). Please wait briefly before making another request.`
    );
  }
  entry.count += 1;
}

export function runAiBillingAssistant(params: {
  actorUserId: string;
  businessId: string;
  taskType: AiAssistantSuggestion['taskType'];
  userPrompt: string;
  targetInvoiceId?: string;
  language?: LanguageCode;
  simulateProviderUnavailable?: boolean;
}): AiAssistantSuggestion {
  // 1. Verify tenant membership and subscription entitlement on the server/service layer
  db.assertBusinessRole(params.actorUserId, params.businessId, [
    'owner',
    'admin',
    'accountant',
    'sales',
  ]);
  db.assertSubscriptionEntitlement(params.businessId, 'ai_assistant');
  enforceAiRateLimit(params.actorUserId, params.businessId);

  // 2. Sanitize untrusted prompt input against prompt injection
  const { sanitized, injectionDetected } = sanitizeUntrustedPromptInput(params.userPrompt);
  if (injectionDetected) {
    throw new Error(
      'Security Policy Violation: Prompt injection or authorization override directive detected and blocked.'
    );
  }

  const invoices = db.listInvoices(params.actorUserId, params.businessId);
  const payments = db.listPayments(params.actorUserId, params.businessId);
  const clients = db.listClients(params.actorUserId, params.businessId);
  const products = db.listProductsServices(params.actorUserId, params.businessId);

  if (params.taskType === 'draft_quotation' || params.taskType === 'suggest_line_items') {
    const matchedCatalog = products.slice(0, 2);
    const rawItems =
      matchedCatalog.length > 0
        ? matchedCatalog.map((p) => ({
            description: `${p.name} — ${sanitized || p.description}`,
            unit: p.unit,
            quantity: '1',
            unitPrice: p.unitPrice,
            taxRate: p.taxRate,
          }))
        : [
            {
              description: sanitized || 'Professional Consultancy & Implementation Services',
              unit: 'project',
              quantity: '1',
              unitPrice: '1500000.00',
              taxRate: '18.00',
            },
          ];

    // Always use deterministic application math for totals — never let AI guess numbers
    const calc = calculateDocumentTotals(
      rawItems.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: '0.00',
        taxRatePercent: i.taxRate,
      }))
    );

    return {
      id: `ai-${Date.now()}`,
      taskType: params.taskType,
      title: 'Draft Quotation Proposal (Requires Your Confirmation)',
      explanation: `Prepared ${rawItems.length} line item(s) using authorized catalog prices and deterministic decimal calculations. Review and confirm before creating a draft quotation.`,
      requiresUserConfirmation: true,
      providerMode: 'deterministic_fallback',
      promptSanitized: true,
      draftQuotationPayload: {
        suggestedItems: rawItems.map((item, idx) => ({
          ...item,
          lineTotal: calc.lines[idx].lineTotal,
        })),
        calculatedSubtotal: calc.subtotal,
        calculatedTaxTotal: calc.taxTotal,
        calculatedGrandTotal: calc.grandTotal,
      },
    };
  }

  if (params.taskType === 'draft_reminder') {
    const target =
      invoices.find((i) => i.id === params.targetInvoiceId) ??
      invoices.find((i) => i.status === 'overdue' || i.status === 'issued' || i.status === 'partially_paid');

    if (!target) {
      return {
        id: `ai-${Date.now()}`,
        taskType: 'draft_reminder',
        title: 'No Unpaid Invoices Found',
        explanation: 'All issued invoices in this business workspace are currently settled or voided.',
        requiresUserConfirmation: true,
        providerMode: 'deterministic_fallback',
        promptSanitized: true,
      };
    }

    const client = clients.find((c) => c.id === target.clientId);
    const clientName = client?.name ?? 'Valued Client';
    const formattedBalance = formatMoney(target.balanceDue, target.currency);

    return {
      id: `ai-${Date.now()}`,
      taskType: 'draft_reminder',
      title: `Polite Payment Reminder Draft — ${target.invoiceNumber}`,
      explanation: `Generated bilingual payment follow-up for ${clientName} based on exact verified balance due (${formattedBalance}). Nothing is sent until you explicitly approve.`,
      requiresUserConfirmation: true,
      providerMode: 'deterministic_fallback',
      promptSanitized: true,
      draftReminderText: {
        subject: `Polite Follow-Up: Invoice ${target.invoiceNumber} (${formattedBalance})`,
        bodyEn: `Dear ${clientName},\n\nWe hope your week is going well. This is a friendly reminder regarding Invoice ${target.invoiceNumber} issued on ${target.issueDate} (Due: ${target.dueDate}), which currently has an outstanding balance of ${formattedBalance}.\n\nPayment Instructions: ${target.paymentInstructions}\n\nIf you have already initiated this transfer, please share the transaction reference via your secure Client Portal link. Thank you for your partnership.`,
        bodySw: `Habari ${clientName},\n\nTunatumai unaendelea vyema. Huu ni ukumbusho wa kiungwana kuhusu Ankara ${target.invoiceNumber} iliyotolewa tarehe ${target.issueDate} (Mwisho wa malipo: ${target.dueDate}), yenye salio linalodaiwa la ${formattedBalance}.\n\nMaelekezo ya Malipo: ${target.paymentInstructions}\n\nIkiwa tayari umefanya malipo haya, tafadhali tuma namba ya muamala. Asante kwa ushirikiano wako.`,
        invoiceNumber: target.invoiceNumber,
        balanceDue: target.balanceDue,
      },
    };
  }

  if (params.taskType === 'followup_priorities' || params.taskType === 'summarize_overdue') {
    const todayMs = Date.now();
    const unpaid = invoices.filter(
      (i) =>
        (i.status === 'overdue' || i.status === 'issued' || i.status === 'partially_paid') &&
        compareMoney(i.balanceDue, '0.00') > 0
    );

    const priorities = unpaid
      .map((inv) => {
        const dueMs = new Date(inv.dueDate).getTime();
        const daysOverdue = Math.max(0, Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24)));
        const client = clients.find((c) => c.id === inv.clientId);
        let rule = 'Upcoming / Current due date';
        if (daysOverdue > 14) rule = 'High Priority: Over 14 days past due date';
        else if (daysOverdue > 0) rule = `Overdue by ${daysOverdue} day(s) — send polite reminder`;
        else if (inv.status === 'partially_paid') rule = 'Partial deposit received — follow up on remaining balance';

        return {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: client?.name ?? 'Client',
          balanceDue: inv.balanceDue,
          currency: inv.currency,
          daysOverdue,
          priorityRule: rule,
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return {
      id: `ai-${Date.now()}`,
      taskType: params.taskType,
      title: 'Receivables Follow-Up Priority Queue (Rule-Based)',
      explanation: `Evaluated ${unpaid.length} open invoice(s) against transparent aging and balance rules without fabricating any figures.`,
      requiresUserConfirmation: true,
      providerMode: 'deterministic_fallback',
      promptSanitized: true,
      followUpPriorities: priorities,
    };
  }

  // explain_trends
  const activeInvoices = invoices.filter((i) => i.status !== 'draft' && i.status !== 'voided');
  const activePayments = payments.filter((p) => p.verificationStatus !== 'reversed');
  return {
    id: `ai-${Date.now()}`,
    taskType: 'explain_trends',
    title: 'Authorized Financial Activity Summary',
    explanation: `Across your authorized workspace, ${activeInvoices.length} issued invoice(s) and ${activePayments.length} recorded payment transaction(s) were analyzed. Note: Issued invoice value represents billed commercial receivables, while recorded payments represent actual cash collected.`,
    requiresUserConfirmation: true,
    providerMode: 'deterministic_fallback',
    promptSanitized: true,
  };
}

