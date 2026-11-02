import crypto from 'node:crypto';
import { newInterview, validContact } from './board-interest.mjs';

// Reuse the signed-state envelope, but never authorize an interview action.
export function newBoardContact(language) {
  return {...newInterview(language), purpose:'board-contact', stage:'contact'};
}
export function validBoardContact(contact) {
  return validContact(contact)
    && typeof contact.country === 'string' && contact.country.trim().length > 0 && contact.country.length <= 120 && !/[\r\n]/.test(contact.country)
    && ['en','es'].includes(contact.preferredLanguage)
    && typeof contact.interest === 'string' && contact.interest.trim().length > 0 && contact.interest.length <= 2400;
}
// Explicit selection is a privacy boundary: history, edits and arbitrary extras
// are not part of this form's consent and must never reach the email.
export function normalizeBoardContact(contact) {
  return {name:contact.name.trim(),email:contact.email.trim(),country:contact.country.trim(),preferredLanguage:contact.preferredLanguage,interest:contact.interest.trim()};
}
export function boardContactDigest(contact) {
  return crypto.createHash('sha256').update(JSON.stringify(contact)).digest('hex');
}
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildBoardContactEmail(contact,id) {
  const fields=[['Name',contact.name],['Email',contact.email],['Country',contact.country],['Preferred language',contact.preferredLanguage],['Interest',contact.interest]];
  const notice='The visitor explicitly agreed to share these form details with Amie for board-interest follow-up. No chat transcript is included. This is an expression of interest, not a board appointment or a commitment to join.';
  return {
    subject:`Casa de SAM board interest — ${contact.name}`,
    text:`Casa de SAM board interest\n\n${fields.map(([label,value])=>`${label}: ${value}`).join('\n\n')}\n\n${notice}\n\nReference: ${id}`,
    html:`<div style="font-family:Arial,sans-serif;max-width:760px;color:#244844;line-height:1.6"><h1>Casa de SAM board interest</h1>${fields.map(([label,value])=>`<p><strong>${label}:</strong><br><span style="white-space:pre-wrap">${escape(value)}</span></p>`).join('')}<p>${notice}</p><p>Reference: ${escape(id)}</p></div>`,
  };
}
