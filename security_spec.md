# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Strict Identity Binding**: Every user profile (`/users/{userId}`) and private PII record (`/users/{userId}/private/{docId}`) is readable and writable exclusively by the authenticated owner (`request.auth.uid == userId`) or verified admin.
2. **PII Isolation**: User email and banking/QR account numbers live only in `/users/{userId}/private/{docId}` and are never exposed in public workspace documents.
3. **Workspace Membership Gate**: Any transaction, inventory item, debt record, or family member document under `/workspaces/{workspaceId}` requires the parent `/workspaces/{workspaceId}` document to exist and the acting user to hold an active editor/owner role in `/workspaces/{workspaceId}/members/{uid}`.
4. **Immutable Ownership & Timestamps**: `id`, `workspaceId`, `createdBy`, and `createdAt` cannot be modified after creation. `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Terminal Debt Locking**: A debt record whose `status` has reached `'paid'` cannot be modified by non-admin users.
6. **Zero Privilege Escalation**: Users cannot set or elevate their own `role` field on update; workspace members with `'viewer'` role cannot write transactions, inventory, debts, or family data.
7. **Zero-Cost List Isolation**: `allow list` rules evaluate strictly against `resource.data` (`workspaceId == request.auth.uid || createdBy == request.auth.uid`) with zero `get()` or `exists()` lookups.

## 2. The "Dirty Dozen" Malicious Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Write**: Unauthenticated client attempts `create` on `/workspaces/u1/transactions/tx1`.
2. **Unverified Email Write**: Signed-in user with `email_verified: false` attempts `create` on `/users/u1`.
3. **Cross-Tenant Transaction Creation**: User `u2` attempts `create` on `/workspaces/u1/transactions/tx1` with `createdBy: "u1"`.
4. **Ghost Field Shadow Update**: User `u1` updates `/users/u1` including an undeclared field `isSuperAdmin: true`.
5. **Role Self-Escalation**: User `u1` updates `/workspaces/w1/members/u1` changing `role` from `'member'` to `'owner'`.
6. **Path ID Poisoning**: User `u1` attempts `create` on `/workspaces/u1/inventory/bad$id!@#` violating `^[a-zA-Z0-9_\-]+$`.
7. **Oversized String DoS**: User `u1` attempts `create` on `/workspaces/u1/transactions/tx1` with a 5,000-character `note` (limit 300).
8. **Negative Financial Amount**: User `u1` creates a transaction with `amount: -50000`.
9. **Client Timestamp Forgery**: User `u1` creates a transaction with a backdated client timestamp `createdAt != request.time`.
10. **Terminal State Tampering**: User `u1` updates a debt record whose existing `status` is `'paid'` back to `'pending'`.
11. **PII Snooping**: Authenticated user `u2` attempts `get` on `/users/u1/private/info`.
12. **Blanket List Scraping**: User `u2` attempts `list` on `/workspaces/u1/transactions` without ownership matching `resource.data`.
