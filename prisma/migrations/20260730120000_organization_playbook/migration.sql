-- Organization playbook (offer, ideal customer, method, criteria, limits).
-- Read by every analysis prompt; edited from /company/settings/playbook.
ALTER TABLE "OrganizationSettings" ADD COLUMN "playbook" JSONB;
