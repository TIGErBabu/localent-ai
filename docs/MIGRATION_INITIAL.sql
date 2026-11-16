-- Enable extensions required by this schema
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'PRO', 'ADMIN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('UNFUNDED', 'HELD', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "VerificationTier" AS ENUM ('NONE', 'BASIC_ID', 'VERIFIED_PRO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'RESCHEDULED', 'DONE', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ChangeOrderStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('BEFORE_PHOTO', 'AFTER_PHOTO', 'CHECKIN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED_RELEASE', 'RESOLVED_REFUND');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "skills_array" TEXT[],
    "bio" TEXT,
    "portfolio_urls" TEXT[],
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_tier" "VerificationTier" NOT NULL DEFAULT 'NONE',
    "background_check_status" TEXT,
    "licence_number" TEXT,
    "licence_trade" TEXT,
    "licence_state" TEXT,
    "service_radius_miles" INTEGER NOT NULL DEFAULT 25,
    "location_lat" DECIMAL(10,7) NOT NULL,
    "location_lng" DECIMAL(10,7) NOT NULL,
    "location_label" TEXT NOT NULL,
    "response_time_hours" INTEGER NOT NULL DEFAULT 4,
    "years_in_business" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posts" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget_min_cents" INTEGER NOT NULL,
    "budget_max_cents" INTEGER NOT NULL,
    "location_lat" DECIMAL(10,7) NOT NULL,
    "location_lng" DECIMAL(10,7) NOT NULL,
    "location_label" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "preferred_date" DATE,
    "matched_pro_limit" INTEGER NOT NULL DEFAULT 5,
    "completion_code_hash" TEXT,
    "completion_requested_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_private_details" (
    "job_id" UUID NOT NULL,
    "street_address" TEXT NOT NULL,
    "unit" TEXT,
    "zip" TEXT NOT NULL,
    "access_notes" TEXT,

    CONSTRAINT "job_private_details_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "pro_id" UUID NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "window_start" TEXT NOT NULL,
    "window_end" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pro_availability" (
    "id" UUID NOT NULL,
    "pro_id" UUID NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,

    CONSTRAINT "pro_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "pro_id" UUID NOT NULL,
    "total_amount_cents" INTEGER NOT NULL,
    "pro_commission_rate_bps" INTEGER NOT NULL,
    "pro_commission_cents" INTEGER NOT NULL,
    "customer_fee_rate_bps" INTEGER NOT NULL,
    "customer_fee_cents" INTEGER NOT NULL,
    "net_payout_cents" INTEGER NOT NULL,
    "proposal_text" TEXT NOT NULL,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "pro_id" UUID NOT NULL,
    "rating_value" SMALLINT NOT NULL,
    "review_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_milestones" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "bid_id" UUID NOT NULL,
    "seq" SMALLINT NOT NULL,
    "label" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'UNFUNDED',
    "payment_intent_id" TEXT,
    "transfer_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_orders" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "pro_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "delta_amount_cents" INTEGER NOT NULL,
    "status" "ChangeOrderStatus" NOT NULL DEFAULT 'PROPOSED',
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_evidence" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "milestone_id" UUID,
    "payment_intent_id" TEXT NOT NULL,
    "transfer_id" TEXT,
    "gross_cents" INTEGER NOT NULL,
    "customer_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "commission_cents" INTEGER NOT NULL DEFAULT 0,
    "net_cents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pro_payout_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_account_id" TEXT NOT NULL,
    "onboarding_status" TEXT NOT NULL,
    "kyc_status" TEXT NOT NULL,
    "payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pro_payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "opened_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "job_id" UUID,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_user_id_key" ON "company_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_slug_key" ON "company_profiles"("slug");

-- CreateIndex
CREATE INDEX "company_profiles_skills_array_idx" ON "company_profiles" USING GIN ("skills_array");

-- CreateIndex
CREATE INDEX "job_posts_status_category_idx" ON "job_posts"("status", "category");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_job_id_key" ON "appointments"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "pro_availability_pro_id_weekday_key" ON "pro_availability"("pro_id", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "bids_job_id_pro_id_key" ON "bids"("job_id", "pro_id");

-- CreateIndex
CREATE INDEX "chat_messages_job_id_timestamp_idx" ON "chat_messages"("job_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_job_id_key" ON "reviews"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_milestones_job_id_seq_key" ON "payment_milestones"("job_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_intent_id_key" ON "payments"("payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "pro_payout_accounts_user_id_key" ON "pro_payout_accounts"("user_id");

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_private_details" ADD CONSTRAINT "job_private_details_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pro_id_fkey" FOREIGN KEY ("pro_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_availability" ADD CONSTRAINT "pro_availability_pro_id_fkey" FOREIGN KEY ("pro_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_pro_id_fkey" FOREIGN KEY ("pro_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_pro_id_fkey" FOREIGN KEY ("pro_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_milestones" ADD CONSTRAINT "payment_milestones_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_milestones" ADD CONSTRAINT "payment_milestones_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_evidence" ADD CONSTRAINT "job_evidence_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_evidence" ADD CONSTRAINT "job_evidence_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pro_payout_accounts" ADD CONSTRAINT "pro_payout_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

