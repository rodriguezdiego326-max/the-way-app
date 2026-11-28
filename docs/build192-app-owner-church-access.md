# Build 192 — App Owner church access

An active APP_OWNER from the protected app-admin registry has full access to church studies, prayer, small groups, leadership request review, and member invitations without requiring a member invitation or a Pastor title. The My Church screen identifies this authority as App Owner · Full church access. The exception does not modify stored membership status or grant a church role.

Server permission helpers and UI gates both recognize App Owner. Owner-sent invitations can be accepted while the sender remains an active App Owner. Ordinary visitors, APP_ADMIN accounts, inactive owners, and self-selected personal titles receive no exception. Existing private personal-data boundaries are unchanged.

Validation: nine PostgreSQL permission tests pass, including owner read/write/publish/group management, owner invitation acceptance, visitor isolation, and inactive-owner rejection. Typecheck, production build, language contract, and lint pass (six pre-existing warnings). Hosted migration applied and actual App Owner permission predicates verified in a rolled-back transaction. Physical-device verification remains pending.

Device check: install build 192, open My Church using the App Owner account, and confirm the Full church access label, Church Prayer, From My Church, Manage Church Studies, Small Groups, and Invite church members are available. A separate visitor should still need a membership invitation.
