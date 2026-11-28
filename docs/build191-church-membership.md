# Build 191 — Church visitors and invitations

Adding or creating a church now connects the account as a visitor. Church Prayer, Church Studies (From My Church), and Small Groups require approved membership. Membership is stored separately from self-described titles and cannot be changed directly by a client. Existing verified church leaders retain member access; existing unverified connections remain intact as visitors and need an invitation. Church details ownership does not grant access to private church content.

A verified Pastor or Church Admin uses My Church → Invite church members to send an in-app invitation to someone who has already added the same church. The visitor accepts or declines in My Church. Invitations expire after 14 days, can be canceled, are tied to a specific membership record and recipient, and cannot be reused. Leaving and adding the church again creates visitor access and requires a new invitation. A sender who no longer has authority cannot confer membership through an old invitation. No email is sent by this flow.

Deacon is an available leadership request. Approval follows the existing verified-leadership process. Approved Deacons can manage church prayers and small groups. Only Pastors publish church studies; only Pastors and Church Admins send membership invitations. Leadership approval also establishes member status.

Server restrictions apply to direct API requests and old builds, including study assignments, existing group connections, discussions, and group invite codes. Translation, personal sermon notes, and Sunday Mode remain available to visitors. Free-access grants are unchanged; church free access passed the user's device check before this change.

Validation: seven PostgreSQL permission/invitation tests pass; TypeScript, ESLint (six existing warnings), language contract and production web build pass. Hosted migration 20261128052211 applied; protected membership and invitation privileges verified. Device checks are pending.

Device checks:
1. A non-leader adds the church: Visitor is shown; church prayers, studies and groups are unavailable.
2. The church Pastor/Admin opens My Church and invites that visitor.
3. The visitor refreshes membership and accepts; member areas unlock and remain available after relaunch.
4. With a separate visitor, decline/cancel an invitation: member areas stay unavailable.
5. Deacon appears in Church Administration → Requested Role; approval remains required.
