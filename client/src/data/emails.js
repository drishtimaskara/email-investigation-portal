// Real email content for the ARG. Generated from the team's .txt files; bodies are verbatim.
// Dates are IST (+05:30). Field names match the planned `emails` table.
// links: each {{TOKEN}} in a body maps to an entry here. Fill in `url` when the real link exists.
// attachments: fill in `url` (for example '/files/workstation_archive.zip') once the file is added.
// Replace this file with the API response (GET /api/emails) in the Express + PostgreSQL step.

export const currentUser = {
  name: 'Navya Mulay',
  email: 'navya.mulay@hyderabad.bits-pilani.ac.in',
}

export const emails = [
  {
    "id": 1,
    "folder": "inbox",
    "senderName": "ORION Onboarding",
    "senderEmail": "onboarding@orionresearchlabs.org",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "MIRROR Access Granted",
    "body": "Hi Navya,\n\nWelcome to the MIRROR project. Your researcher-level access to the MIRROR dashboard has been approved.\n\nDashboard: {{MIRROR_DASHBOARD_URL}}\n\nABOUT MIRROR\nMIRROR is ORION's anonymization layer for campus survey data. Survey responses (1,248 records in the current dataset) are processed so that direct identifiers such as names, emails and roll numbers are removed before the data reaches the research archive. The fields retained for analysis are year, department, hostel, club, project and survey score.\n\nSUGGESTED ROUTINE\n1. Overview: check the dataset count and last sync summary at the start of each week.\n2. Records: sample the table for formatting or quality issues.\n3. Methodology: review whenever the pipeline description changes.\n4. Diagnostics: skim sync events after each batch and log anything unusual in the project tracker.\n\nResearcher accounts are read-only for the anonymized view. Please do not share dashboard credentials. Any need for access beyond your role must be requested through the ORION data governance desk.\n\nWe look forward to your findings.\n\nResearcher Onboarding\nORION Research Systems",
    "date": "2026-09-02T10:15:00+05:30",
    "isStarred": true,
    "isRead": true,
    "links": [
      {
        "token": "{{MIRROR_DASHBOARD_URL}}",
        "label": "Dashboard",
        "url": ""
      }
    ],
    "attachments": []
  },
  {
    "id": 2,
    "folder": "inbox",
    "senderName": "GitDesk Notifications",
    "senderEmail": "notifications@gitdesk.io",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Research Repository",
    "body": "REPOSITORY ACTIVITY: mirror-research\n\n2 new commits were pushed to main by navya-mulay:\n\n  - Add supervisor review comment\n  - Add backup manifest and validation summary\n\nRepository: {{GIT_REPO_URL}}\nClone: git clone {{GIT_REPO_URL}}\n\nYou are receiving this because you own this repository. You can change notification settings from your account page.\n\n-- GitDesk",
    "date": "2026-10-13T22:41:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [
      {
        "token": "{{GIT_REPO_URL}}",
        "label": "Repository",
        "url": ""
      }
    ],
    "attachments": []
  },
  {
    "id": 3,
    "folder": "inbox",
    "senderName": "Notes",
    "senderEmail": "noreply@notes.app",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Notes Backup Available",
    "body": "Hi Navya,\n\nWe noticed a few sync problems on your account today, and some recent changes may not have reached every device.\n\nA local backup of your notes is stored in the app. You can review it any time from the notes list or the Settings screen.\n\nOpen Navya's Notes: {{NOTES_APP_URL}}\n\nIf sync problems continue, check the sync status in Settings. Your notes remain available offline in the meantime.\n\n-- The Navya's Notes team",
    "date": "2026-10-13T19:48:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [
      {
        "token": "{{NOTES_APP_URL}}",
        "label": "Open Navya's Notes",
        "url": ""
      }
    ],
    "attachments": []
  },
  {
    "id": 4,
    "folder": "sent",
    "senderName": "Navya Mulay",
    "senderEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "recipient": "MIRROR Project Team",
    "recipientEmail": "mirror.team@orionresearchlabs.org",
    "cc": [
      {
        "name": "Archisman Joshi",
        "email": "archisman.joshi@faculty.hyderabad.bits-pilani.ac.in"
      }
    ],
    "subject": "Data Validation Concern",
    "body": "Hi all,\n\nI have a question about the anonymization validation, and I'd like to raise it as a question rather than a conclusion.\n\nThe dashboard describes the data as anonymized because names, emails and roll numbers are removed. But the records still carry year, department, hostel, club and project together. In my synthetic test set, several combinations of those fields appear only once, so a record with a unique combination could be matched to a person by anyone who already knows that person's attributes. MIR-1042 is one example.\n\nCould someone from the data team explain:\n\n1. Why these quasi-identifiers remain after anonymization?\n2. Whether MIRROR checks for uniqueness across combinations of fields, not just single fields?\n3. Whether the methodology page should describe this limitation?\n\nI'm happy to share the test set and my notes so the check can be repeated independently. I won't make any claims outside this thread until it's been verified.\n\nThanks,\nNavya",
    "date": "2026-10-13T22:25:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 5,
    "folder": "inbox",
    "senderName": "Prof. Archisman Joshi",
    "senderEmail": "archisman.joshi@faculty.hyderabad.bits-pilani.ac.in",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Supervisor Review Required",
    "body": "Navya,\n\nI have read your latest MIRROR observations. Let me be direct.\n\nYou are not to make or circulate any claims about ORION, MIRROR or the identifiability of any student, in writing, in a presentation or to the project team, until your findings have been independently verified. Confidence in your own analysis is not verification.\n\nIf this continues before that happens, I will have no choice but to take you off the project. Stop pursuing this line for now. Do not put anything further in writing about it until we have spoken.\n\nReply to confirm you have understood.\n\nProf. Archisman Joshi\nDepartment of Computer Science",
    "date": "2026-10-13T15:20:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 6,
    "folder": "inbox",
    "senderName": "ORION Security Notice",
    "senderEmail": "no-reply@security.orionresearchlabs.org",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Security Notice",
    "body": "SECURITY NOTICE - REF SR-0417\n\nUnusual access to restricted MIRROR resources has been associated with your account and devices. Your activity over the last 24 hours is under review.\n\nCease further investigation of MIRROR activity now. Do not copy, move or share any project material. We are aware of what has been opened, and from where.\n\nFailure to comply may result in loss of access, removal from the project and further action.\n\nThis notice was generated by the security review process. Do not reply to this message.",
    "date": "2026-10-14T02:39:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 7,
    "folder": "inbox",
    "senderName": "ORION Communications",
    "senderEmail": "communications@orionresearchlabs.org",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Research Directory Update",
    "body": "Hello collaborators,\n\nThe ORION collaborator directory has been refreshed. It now lists each partner, their project affiliations and the shared review handle used for access requests on each project.\n\nDirectory: {{DIRECTORY_URL}}\n\nPlease check your own entry and tell us about any errors by replying to this message.\n\nORION Research Systems - Communications",
    "date": "2026-10-06T09:30:00+05:30",
    "isStarred": false,
    "isRead": false,
    "links": [
      {
        "token": "{{DIRECTORY_URL}}",
        "label": "Directory",
        "url": ""
      }
    ],
    "attachments": []
  },
  {
    "id": 8,
    "folder": "inbox",
    "senderName": "Kabir Menon",
    "senderEmail": "kabir.menon@hyderabad.bits-pilani.ac.in",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [
      {
        "name": "Ananya Rao",
        "email": "ananya.rao@hyderabad.bits-pilani.ac.in"
      }
    ],
    "subject": "Club Collaboration Update",
    "body": "Hi Navya,\n\nQuick update on the ACM-W x CRUx joint project (swap in the real project name before launch):\n\n  - Session outline is finalized; Ananya has the slides for the first half.\n  - We still need a volunteer for registration and one for the demo laptop.\n  - Venue is booked for Friday 16 Oct, 16:30-18:00.\n\nCould you review the agenda and send comments by Wednesday? Your notes from the planning call are in the shared folder.\n\nThanks!\nKabir",
    "date": "2026-10-09T17:05:00+05:30",
    "isStarred": false,
    "isRead": false,
    "links": [],
    "attachments": []
  },
  {
    "id": 9,
    "folder": "inbox",
    "senderName": "Department Seminar Series",
    "senderEmail": "cs.seminars@hyderabad.bits-pilani.ac.in",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Seminar Invitation",
    "body": "You are invited to the next seminar: Compilers and Parallel Hardware, Thursday 22 Oct, 16:00, Seminar Hall 2. Refreshments will be served. RSVP by replying to this message.",
    "date": "2026-10-08T11:00:00+05:30",
    "isStarred": false,
    "isRead": false,
    "links": [],
    "attachments": []
  },
  {
    "id": 10,
    "folder": "inbox",
    "senderName": "Central Library",
    "senderEmail": "library@hyderabad.bits-pilani.ac.in",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Library Reminder",
    "body": "Reminder: 1 item is due on Friday 16 Oct 2026. Renew online from your library account to avoid late fees.",
    "date": "2026-10-11T08:00:00+05:30",
    "isStarred": true,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 11,
    "folder": "inbox",
    "senderName": "Project Coordination",
    "senderEmail": "coordination@orionresearchlabs.org",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Minutes - Project Coordination Meeting",
    "body": "Minutes of the 12 Oct coordination meeting.\n\nAttendees: all project leads.\nItems: status updates from each workstream; documentation review scheduled for next week; reminder to log tasks in the tracker.\nAction items were assigned to owners as listed in the tracker.\nNext meeting: 19 Oct.",
    "date": "2026-10-12T18:30:00+05:30",
    "isStarred": true,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 12,
    "folder": "inbox",
    "senderName": "Campus Events",
    "senderEmail": "campus.events@hyderabad.bits-pilani.ac.in",
    "recipient": "All Students",
    "recipientEmail": "all.students@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Campus Tech Fest - Registrations Open",
    "body": "Registrations for the campus tech fest open on Monday 12 Oct. Workshops, a project showcase and a quiz are planned. Details and registration are on the events page.",
    "date": "2026-10-10T12:00:00+05:30",
    "isStarred": false,
    "isRead": false,
    "links": [],
    "attachments": []
  },
  {
    "id": 13,
    "folder": "sent",
    "senderName": "Navya Mulay",
    "senderEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "recipient": "ORION Data Audit",
    "recipientEmail": "data.audit@orionresearchlabs.org",
    "cc": [
      {
        "name": "Archisman Joshi",
        "email": "archisman.joshi@faculty.hyderabad.bits-pilani.ac.in"
      }
    ],
    "subject": "Unexplained Export",
    "body": "Hello,\n\nAt 01:45 IST the MIRROR Diagnostics tab logged an export preparation event for the survey dataset. The destination shown was ORION-RELAY. That destination does not appear in the published pipeline diagram, and I did not trigger the event.\n\nI am requesting an audit of this event. Specifically:\n\n1. Who or what initiated the preparation?\n2. What is ORION-RELAY, and who is it for?\n3. Will the export proceed, and has it been authorized?\n\nTo understand what was being prepared, I opened the Records view at 01:47 and checked whether the data matched the anonymized set described in the methodology.\n\nPlease treat this as urgent. I will keep my own notes of what I observe.\n\nThank you,\nNavya Mulay",
    "date": "2026-10-14T01:56:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 14,
    "folder": "sent",
    "senderName": "Navya Mulay",
    "senderEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "recipient": "Archisman Joshi",
    "recipientEmail": "archisman.joshi@faculty.hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Independent Verification",
    "body": "Professor,\n\nThank you. That was a relief to read after your earlier message.\n\nI will keep everything intact and dated, and I will not share anything outside this thread until it has been validated. I've kept my notes, test set and validation summary in version control, with copies kept elsewhere.\n\nFor independent validation, could you suggest someone outside ORION who could repeat the uniqueness check on my synthetic test set?\n\nNavya\n\n> On 2026-10-13 at 18:02, Archisman Joshi wrote:\n> Navya, my earlier note was blunt, and I stand by the substance: no claims\n> until this is verified. But I do not want this dropped. Preserve your\n> evidence exactly as it is, dated and unaltered, and keep it in more than\n> one place. Then have it validated by someone independent of ORION.\n>\n> Be careful about who you discuss this with. I am not comfortable with how\n> little visibility we have into who sees project material.\n>\n> -- Prof. Joshi",
    "date": "2026-10-13T18:20:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": []
  },
  {
    "id": 15,
    "folder": "drafts",
    "senderName": "Navya Mulay",
    "senderEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "recipient": "(not set)",
    "recipientEmail": "",
    "cc": [],
    "subject": "If Something Happens",
    "body": "If you are reading this, I haven't sent it, which means something went wrong or I ran out of time.\n\nThe evidence is not in one place on purpose, and no single piece is complete:\n\n  - The repository (mirror-research) holds my methodology, tests and a validation report. Check earlier versions and the commit history, not only the latest state.\n  - My notes app has a backup checklist and the version reference for the rest.\n  - An offline archive is attached. The thesis in it is protected; the password hint is in my research notes.\n\nI deleted the obvious thesis copies myself. Please don't read that as hiding something.\n\nCompare the sources against each other before you decide what happened.\n\n-- Navya",
    "date": "2026-10-14T03:02:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": [
      {
        "name": "workstation_archive.zip",
        "type": "zip",
        "url": ""
      }
    ]
  },
  {
    "id": 16,
    "folder": "trash",
    "senderName": "Navya Mulay",
    "senderEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "recipient": "Navya Mulay",
    "recipientEmail": "navya.mulay@hyderabad.bits-pilani.ac.in",
    "cc": [],
    "subject": "Repository Cleanup",
    "body": "Cleanup list:\n\n  - Delete Thesis_Final.pdf and the loose thesis copies in Documents and Downloads, so no complete set is sitting on this machine.\n  - Leave the encrypted v2 file and research_notes.txt untouched.\n  - Everything that matters is already saved elsewhere (see the backup checklist).\n  - Then close the repo and stop syncing.",
    "date": "2026-10-14T02:51:00+05:30",
    "isStarred": false,
    "isRead": true,
    "links": [],
    "attachments": []
  }
]