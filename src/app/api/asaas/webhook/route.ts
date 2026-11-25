import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Webhook receptor do Asaas (/api/asaas/webhook)
 * Eventos tratados:
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED -> Ativa assinatura e marca cobrança como paga
 * - PAYMENT_OVERDUE -> Marca assinatura como ATRASADA
 */
export async function POST(request: Request) {
  try {
    const token = request.headers.get("asaas-access-token");
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const { id: eventId, event, payment } = payload;

    console.log("[Asaas Webhook]", event, payment?.id, payment?.subscription);

    if (supabaseAdmin) {
      // 1. Grava log bruto para auditoria e idempotência
      if (eventId) {
        await supabaseAdmin.from("asaas_webhook_events").upsert({
          id: String(eventId),
          event: String(event || "UNKNOWN"),
          payload,
          processed: false,
        });
      }

      // 2. Registra/atualiza o pagamento em public.payments
      if (payment?.id) {
        let localSubId: string | null = null;
        let localCustomerId: string | null = null;

        if (payment.subscription) {
          const { data: subRow } = await supabaseAdmin
            .from("subscriptions")
            .select("id, customer_id")
            .eq("asaas_subscription_id", payment.subscription)
            .maybeSingle();
          localSubId = subRow?.id || null;
          localCustomerId = subRow?.customer_id || null;
        }

        await supabaseAdmin.from("payments").upsert(
          {
            asaas_payment_id: String(payment.id),
            customer_id: localCustomerId,
            subscription_id: localSubId,
            billing_type: payment.billingType || "UNDEFINED",
            value: Number(payment.value || 0),
            net_value:
              payment.netValue !== undefined ? Number(payment.netValue) : null,
            status: String(payment.status || "PENDING"),
            due_date: payment.dueDate || null,
            payment_date: payment.paymentDate || null,
            description: payment.description || null,
            invoice_url: payment.invoiceUrl || null,
            bank_slip_url: payment.bankSlipUrl || null,
            raw: payment,
          },
          { onConflict: "asaas_payment_id" }
        );

        // 3. Atualiza status da assinatura conforme o evento
        if (localSubId) {
          if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "ATIVA" })
              .eq("id", localSubId);
          } else if (event === "PAYMENT_OVERDUE") {
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "ATRASADA" })
              .eq("id", localSubId);
          }
        }
      }

      if (eventId) {
        await supabaseAdmin
          .from("asaas_webhook_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", String(eventId));
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
