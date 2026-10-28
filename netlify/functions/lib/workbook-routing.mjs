export function selectWorkbook(session, env) {
  if (!session.id || !['paid', 'no_payment_required'].includes(session.payment_status)) return null;
  if (env.STRIPE_ROI_PAYMENT_LINK_ID && session.payment_link === env.STRIPE_ROI_PAYMENT_LINK_ID) return 'roi';
  if (env.STRIPE_TONIGHT_PAYMENT_LINK_ID && session.payment_link === env.STRIPE_TONIGHT_PAYMENT_LINK_ID) return 'tonight';
  return null;
}
