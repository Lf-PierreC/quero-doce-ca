import { NextResponse } from "next/server";

/**
 * Integração Asaas API v3 para:
 * 1) Criar ou buscar cliente (CPF/CNPJ - ideal para Clínicas e Residencial)
 * 2) Criar Assinatura Recorrente (/v3/subscriptions) para Planos Office e Home
 * 3) Criar Cobrança Avulsa (/v3/payments) para Bolos Avulsos (Tamanho Família / Individual)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      mode, // 'SUBSCRIPTION' | 'AVULSO'
      customerName,
      companyOrClinicName,
      document,
      email,
      whatsapp,
      billingType, // 'PIX' | 'CREDIT_CARD' | 'BOLETO'
      value,
      description,
    } = body;

    const asaasApiKey = process.env.ASAAS_API_KEY;
    const asaasApiUrl =
      process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";

    // Se a chave do Asaas ainda não estiver configurada no .env, retorna simulação realista
    if (!asaasApiKey) {
      return NextResponse.json({
        simulated: true,
        asaasId:
          mode === "SUBSCRIPTION"
            ? `sub_asaas_${Math.random().toString(36).substring(2, 9)}`
            : `pay_asaas_${Math.random().toString(36).substring(2, 9)}`,
        invoiceUrl: "https://sandbox.asaas.com/i/simulacao-quero-doce-ca",
        pixCopyPaste:
          "00020126580014BR.GOV.BCB.PIX0136querodoceca@assinaturas.com.br5204000053039865802BR5913QUERO DOCE CA6009MOGI CRUZ62070503***6304ABCD",
        message:
          "Modo demonstração ativo (adicione ASAAS_API_KEY no .env.local para cobranças reais no Asaas).",
      });
    }

    // 1. Cria Cliente no Asaas
    const customerRes = await fetch(`${asaasApiUrl}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      body: JSON.stringify({
        name: companyOrClinicName
          ? `${companyOrClinicName} (${customerName})`
          : customerName,
        cpfCnpj: document.replace(/\D/g, ""),
        email,
        mobilePhone: whatsapp.replace(/\D/g, ""),
        notificationDisabled: false,
      }),
    });

    const customerData = await customerRes.json();
    if (!customerRes.ok) {
      return NextResponse.json(
        { error: "Erro ao criar cliente no Asaas", details: customerData },
        { status: 400 }
      );
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split("T")[0];

    // 2. Cria Assinatura Recorrente ou Cobrança Avulsa
    if (mode === "SUBSCRIPTION") {
      const subRes = await fetch(`${asaasApiUrl}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: asaasApiKey,
        },
        body: JSON.stringify({
          customer: customerData.id,
          billingType,
          value: Number(value),
          nextDueDate: dueDateStr,
          cycle: "MONTHLY",
          description,
        }),
      });
      const subData = await subRes.json();
      return NextResponse.json({
        simulated: false,
        asaasId: subData.id,
        data: subData,
      });
    } else {
      const payRes = await fetch(`${asaasApiUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: asaasApiKey,
        },
        body: JSON.stringify({
          customer: customerData.id,
          billingType,
          value: Number(value),
          dueDate: dueDateStr,
          description,
        }),
      });
      const payData = await payRes.json();
      return NextResponse.json({
        simulated: false,
        asaasId: payData.id,
        invoiceUrl: payData.invoiceUrl,
        data: payData,
      });
    }
  } catch (error) {
    console.error("Asaas checkout error:", error);
    return NextResponse.json(
      { error: "Falha ao processar checkout Asaas" },
      { status: 500 }
    );
  }
}
