// Placeholder data. Replace with the API response (GET /api/emails) once the
// Express + PostgreSQL step is done. Field names match the planned `emails` table.

export const currentUser = {
  name: 'Navya Mulay',
  email: 'navya.mulay@mailbox.internal',
}

const ME = currentUser.email
let nextId = 0

const mail = (folder, senderName, senderEmail, recipient, subject, body, date, tags, status, isStarred = false) => ({
  id: ++nextId,
  folder, // 'inbox' | 'sent' | 'drafts' | 'trash'
  senderName,
  senderEmail,
  recipient,
  subject,
  body,
  date, // ISO string
  tags,
  status, // 'Opened' | 'Delivered' | 'Read receipt' | null
  isStarred,
  links: [],
  attachments: [], // later: [{ name, type, url }]
})

export const emails = [
  // Inbox
  mail('inbox', 'Priya Nair', 'priya.nair@placeholder.test', ME, 'Updated roadmap slides attached', 'Hi Navya, here are the finalized slides. Placeholder text for the email body.', '2026-10-19T09:05:00', ['Work'], 'Opened'),
  mail('inbox', 'Billing Desk', 'billing@placeholder.test', ME, 'Confirmation of payment receipt', 'Received with thanks. We have recorded your payment. Placeholder text.', '2026-10-19T07:42:00', ['Billing'], 'Delivered'),
  mail('inbox', 'Design Guild', 'guild@placeholder.test', ME, 'Feedback on design system tokens', 'Looks great, approved for release. Placeholder text for the email body.', '2026-10-18T16:20:00', ['Work', 'Important'], 'Read receipt', true),
  mail('inbox', 'Michael Scott', 'michael.scott@placeholder.test', ME, 'Meeting notes from quarterly sync', 'Summarized deliverables are listed below. Placeholder text for the email body.', '2026-10-17T11:10:00', ['Urgent'], 'Opened'),
  mail('inbox', 'Cloud Support', 'support@placeholder.test', ME, 'Case #849102: Provisioning IOPS upgrade', 'Thank you for confirming the threshold adjustment. Placeholder text.', '2026-10-15T14:00:00', ['Work'], 'Delivered'),
  mail('inbox', 'Elena Vance', 'elena.vance@placeholder.test', ME, 'Contract amendment & scope document', 'Attached is the countersigned agreement. Placeholder text for the email body.', '2026-10-12T10:30:00', ['Client'], 'Opened', true),
  mail('inbox', 'Ops Announcements', 'ops@placeholder.test', ME, 'Maintenance window schedule: Sunday 02:00', 'Zero downtime expected on primary clusters. Placeholder text.', '2026-10-10T18:45:00', ['Important'], 'Delivered'),
  mail('inbox', 'Marcus Vance', 'marcus.vance@placeholder.test', ME, 'Re: Catch-up over coffee next week?', 'Thursday 10:30 at the usual place works for me. Placeholder text.', '2026-10-08T09:15:00', ['Personal'], 'Read receipt'),
  mail('inbox', 'Prize Centre', 'winner@placeholder.test', ME, 'You have been selected for a reward', 'Claim your reward today. Placeholder text for a spam-style email.', '2026-10-06T13:00:00', ['Spam'], null),
  mail('inbox', 'Weekly Deals', 'deals@placeholder.test', ME, 'This week only: 40% off everything', 'Do not miss our biggest sale. Placeholder text for a promotional email.', '2026-10-04T08:00:00', ['Promotional'], null),

  // Sent
  mail('sent', 'Navya Mulay', ME, 'priya.nair@placeholder.test', 'Re: Updated roadmap slides', 'Thanks Priya, I will review them tonight. Placeholder text.', '2026-10-19T09:40:00', ['Work'], 'Read receipt'),
  mail('sent', 'Navya Mulay', ME, 'billing@placeholder.test', 'Invoice question', 'Could you confirm the billing cycle for this month? Placeholder text.', '2026-10-16T12:25:00', ['Billing'], 'Delivered', true),
  mail('sent', 'Navya Mulay', ME, 'elena.vance@placeholder.test', 'Signed contract', 'Please find the signed copy attached. Placeholder text.', '2026-10-12T15:05:00', ['Client'], 'Opened'),
  mail('sent', 'Navya Mulay', ME, 'marcus.vance@placeholder.test', 'Coffee next week?', 'Are you free on Thursday morning? Placeholder text.', '2026-10-07T19:30:00', ['Personal'], 'Opened'),
  mail('sent', 'Navya Mulay', ME, 'michael.scott@placeholder.test', 'Action items', 'Listing the action items from today. Placeholder text.', '2026-10-05T17:50:00', ['Urgent'], 'Delivered'),

  // Drafts
  mail('drafts', 'Navya Mulay', ME, 'ops@placeholder.test', 'Question about the maintenance window', 'Draft body, not finished yet. Placeholder text.', '2026-10-18T21:10:00', ['Important'], null),
  mail('drafts', 'Navya Mulay', ME, 'guild@placeholder.test', 'Follow-up on design tokens', 'Draft body, not finished yet. Placeholder text.', '2026-10-14T10:00:00', ['Work'], null),
  mail('drafts', 'Navya Mulay', ME, 'marcus.vance@placeholder.test', 'Weekend plans', 'Draft body, not finished yet. Placeholder text.', '2026-10-09T22:35:00', ['Personal'], null),

  // Trash
  mail('trash', 'Weekly Deals', 'deals@placeholder.test', ME, 'Last chance: free shipping ends today', 'Placeholder text for a promotional email in the trash.', '2026-10-13T08:00:00', ['Promotional'], null),
  mail('trash', 'Prize Centre', 'winner@placeholder.test', ME, 'Final notice about your reward', 'Placeholder text for a spam email in the trash.', '2026-10-11T08:30:00', ['Spam'], null),
  mail('trash', 'Cloud Support', 'support@placeholder.test', ME, 'Case #848877 closed', 'Placeholder text for a closed support case.', '2026-10-02T11:00:00', ['Work'], 'Opened'),
]
